---
title: 业务服务与 HTTP 接口
description: 划分 HTTP 路由、业务服务和 Provider 的职责，处理输入、权限、错误以及 API 文档。
---

HTTP 接口负责把外部请求转换为可执行的业务操作。一个接口需要同时说明输入、权限、结果与失败方式；业务规则则可以提取为服务，供不同入口复用。

本篇使用“查看项目、新建项目、修改任务所属项目”说明这些约定。阅读不要求先完成整套教程；运行代码时，需要[数据模型与迁移](data-models-and-migrations.md)中的项目表和任务关联，以及已有任务接口。本例基于默认模板 `1.0.0-beta.78`，不新增迁移或插件。本文的 `tutorialTasks`／`tutorialProjects` 属于独立的历史项目示例，不是当前入门示例的 `tasks`；运行前按[数据模型与迁移](data-models-and-migrations.md)确认基线。

## 怎样选择接口与服务的边界

| 情况 | 处理方式 |
| --- | --- |
| 单个集合的简单操作 | 评估框架的 Repository 路由能力，仍需配置认证、授权、输入和文档 |
| 一次操作涉及多类记录或明确业务规则 | 编写业务服务，路由只处理 HTTP 边界 |
| 多个入口需要相同业务规则 | 复用服务，明确每个入口提供的身份、策略与已校验输入 |
| 服务需要数据库等依赖 | 在 Provider 中注册，通过 token 从容器取得 |

本例修改任务归属时，需要同时检查任务和目标项目，因此使用自定义路由与业务服务。服务并非绕过权限的内部通道：调用它的入口仍须提供适用于本次操作的权限策略。

## 示例的接口合同

以下路径都相对于应用 API 根路径，例如应用入口为 `/main/` 时，完整 API 根路径为 `/main/api`：

- `GET /tutorialProjects`：分页查询当前操作允许查看的项目。
- `POST /tutorialProjects`：新建项目，返回 `201` 和 `{ data }`。
- `PATCH /tutorialTasks/{id}/project`：修改任务的项目归属，传入 `projectId: null` 表示解除关联。

项目归属使用独立的子资源接口和权限。已有的 `PATCH /tutorialTasks/{id}` 仍然只负责完成或恢复任务，不接受 `projectId`。任务列表响应会增加 `projectId`，但不会自动返回项目名称或开放项目详情。

## 先分清三种职责

**路由处理 HTTP。** 它负责身份认证、操作授权、参数校验、状态码、错误格式和 API 文档声明，只把校验过的输入交给服务。

**服务处理业务。** 它负责项目查询、创建和任务归属规则，接收本次操作的权限策略，通过 Repository 读写数据库。服务不读取 Hono Context，也不返回 HTTP Response。

**Provider 组织依赖。** 它注册服务及其 token，声明项目相关的权限能力，让路由从应用容器取得同一个服务。

## 输入、响应与错误约定

输入先经过 `apiValidator()`，业务代码只读取验证后的值。客户端不应自由指定服务端生成的 ID、创建时间或不属于该操作的字段。输出显式选择字段，分页列表与总数使用相同的权限策略和筛选条件。

| 情况 | 本例的处理 |
| --- | --- |
| 查询成功 | `200`，返回 `{ data, meta }`，其中 `meta` 包含分页信息 |
| 新建成功 | `201`，返回 `{ data }` |
| 修改成功 | `200`，返回 `{ data }`，只包含该操作的结果字段 |
| 输入不合法 | `400`，标准 API 错误；可定位的错误附带字段信息 |
| 未登录或操作被拒绝 | 分别返回 `401` 或 `403`，不执行业务写入 |
| 任务不存在或不在本次可操作范围 | `404`，不透露范围外记录的详情 |
| 目标项目不存在或不可选 | `400`，统一的项目字段错误，保留原关联 |

错误使用 `ApiError` 和统一处理器表达，不手写一套错误 JSON，也不要把失败包装成 `200`。已知业务错误可转换为明确的 API 错误；未知异常交给标准错误处理，不能一律伪装成“输入有误”。

## 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见手动步骤，由 Agent 结合项目指引处理。

```text
请在现有项目数据模型的基础上，提供查询项目、新建项目和修改任务所属项目的接口，供后续页面使用。

项目列表需要分页，列表和总数都只能包含当前用户有权查看的项目。
修改任务归属时，可以选择允许分配的项目，也可以解除关联。
用户能查看一个项目，不代表一定能把任务分配给它；这次操作必须同时符合任务和项目两边的权限要求。
如果项目已经不存在或不允许选择，提示“无法选择该项目”，不要改变任务原来的归属，也不要透露无权查看的项目信息。

新建、查看和修改归属分别控制权限，不自动给普通用户授权。
原有任务的完成和恢复功能保持不变，不能借此修改项目归属。
请按项目已有的开发指引实现，让这些业务规则可以复用，并在应用的接口文档中说明用法。

用真实测试账号和数据检查允许及拒绝的情况，告诉我结果。
这一轮不增加项目页面、审批、通知或后台任务。
```

## 不使用 Agent

### 编写与 HTTP 解耦的业务服务

新建 `server/providers/tutorial-project-service.ts`。完整代码如下，展开后可直接复制：

<details>
<summary>项目业务服务</summary>

```ts
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export interface ProjectView {
  id: string;
  name: string;
  createdAt: string;
}
export interface TaskProjectView {
  id: string;
  projectId: string | null;
  updatedAt: string;
}
export class ProjectUnavailableError extends Error {
  constructor() {
    super('The selected project is unavailable.');
  }
}
export class TaskUnavailableError extends Error {
  constructor() {
    super('The task is unavailable.');
  }
}
const projectView = (row: Record<string, unknown>): ProjectView => ({
  id: String(row.id),
  name: String(row.name),
  createdAt: new Date(row.createdAt as string | Date).toISOString(),
});

export class TutorialProjectService {
  constructor(private readonly database: DatabaseManager) {}

  async list(
    policy: RepositoryPolicy,
    input: { page: number; pageSize: number },
  ) {
    const projects = this.database
      .repository('tutorialProjects')
      .withPolicy(policy);
    const rows = await projects.findMany({
      select: (s) => s.fields('id', 'name', 'createdAt'),
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
      sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    });
    return {
      data: rows.map(projectView),
      meta: { ...input, total: await projects.count() },
    };
  }

  async create(
    policy: RepositoryPolicy,
    input: { name: string },
  ): Promise<ProjectView> {
    const result = await this.database
      .repository('tutorialProjects')
      .withPolicy(policy)
      .createOne({
        select: (s) => s.fields('id', 'name', 'createdAt'),
        values: { id: randomUUID(), name: input.name, createdAt: new Date() },
      });
    return projectView(result.record);
  }

  async assignTask(
    policies: { tasks: RepositoryPolicy; projects: RepositoryPolicy },
    taskId: string,
    projectId: string | null,
  ): Promise<TaskProjectView> {
    return this.database.transaction(async (connection) => {
      const tasks = connection
        .repository('tutorialTasks')
        .withPolicy(policies.tasks);
      const task = await tasks.findOne({
        filter: { id: taskId },
        select: (s) => s.fields('id'),
      });
      if (!task) throw new TaskUnavailableError();
      if (projectId !== null) {
        const project = await connection
          .repository('tutorialProjects')
          .withPolicy(policies.projects)
          .findOne({
            filter: { id: projectId },
            select: (s) => s.fields('id'),
          });
        if (!project) throw new ProjectUnavailableError();
      }
      const result = await tasks.updateOne({
        select: (s) => s.fields('id', 'projectId', 'updatedAt'),
        filter: { id: taskId },
        values: { projectId, updatedAt: new Date() },
      });
      return {
        id: taskId,
        projectId: result.record.projectId as string | null,
        updatedAt: new Date(
          result.record.updatedAt as string | Date,
        ).toISOString(),
      };
    });
  }
}
```

</details>

`list()` 先通过 `withPolicy()` 限定可读记录，再分页、排序和统计总数。排序包含唯一的 `id`，避免多个项目创建时间相同时，翻页顺序不稳定。它只返回明确选择的字段，并把时间转换为 ISO 字符串。

`create()` 由服务器生成 ID 和创建时间，调用者只提供名称。项目创建不会赋予创建者新的权限；是否能再次查询它，仍取决于角色中配置的查看权限和数据范围。

`assignTask()` 在同一个事务中读取任务、检查目标项目，再更新任务。两类记录分别使用各自的策略：能修改某条任务，不代表能选择任何项目；能在项目列表里查看某个项目，也不代表能在这个操作中选择它。解除关联时不需要查找目标项目，但仍需要修改项目归属的操作权限和任务范围。

服务抛出的 `ProjectUnavailableError`、`TaskUnavailableError` 是业务错误，稍后由路由转换为 API 错误。Repository 自带的权限、记录不存在等错误交给框架处理，不用把所有异常统一捕获成“请求成功”或“参数错误”。

### 注册服务和权限能力

新建 `server/providers/tutorial-projects.ts`：

<details>
<summary>Provider 与权限声明</summary>

```ts
import metadata from '../../package.json' with { type: 'json' };
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { TutorialProjectService } from './tutorial-project-service.js';

export const tutorialProjectServiceToken =
  createServiceToken<TutorialProjectService>('app/tutorial-projects');
const projects = defineDatabasePermission((p) =>
  p.collection('tutorialProjects').read(['id', 'name', 'createdAt']),
);
const tasks = defineDatabasePermission((p) =>
  p
    .collection('tutorialTasks')
    .read(['id', 'projectId', 'updatedAt'])
    .update(['projectId', 'updatedAt']),
);
export const projectPermissions = defineCompositeResource(
  'tutorial.projects',
  (r) =>
    r
      .title({ key: 'projects.title', ns: metadata.name })
      .action('read', (a) =>
        a
          .title({ key: 'projects.read', ns: metadata.name })
          .grant('projects', projects),
      )
      .action('create', (a) =>
        a
          .title({ key: 'projects.create', ns: metadata.name })
          .grant('projects', projects.create(['id', 'name', 'createdAt'])),
      )
      .action('assignTask', (a) =>
        a
          .title({ key: 'projects.assignTask', ns: metadata.name })
          .grant('tasks', tasks)
          .grant('projects', projects),
      ),
);

export default class TutorialProjectsProvider extends ServiceProvider<Application> {
  public readonly name = 'app/tutorial-projects';
  public override register(): void {
    this.app.container.singleton(
      tutorialProjectServiceToken,
      () =>
        new TutorialProjectService(
          this.app.container.resolve(databaseManagerToken),
        ),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'tutorialProjects',
      title: { key: 'projects.title', ns: metadata.name },
    });
    const resource = authz.compositeResources.define(projectPermissions);
    authz.ui.place(resource, { section: 'tutorial' });
  }
}
```

</details>

`register()` 注册服务的创建方式，真正使用时再从容器解析数据库并创建实例。`boot()` 注册项目集合和三项业务操作：查看项目、新建项目、修改任务项目。最后一项包含 `tasks` 和 `projects` 两个数据范围，分别限制能修改的任务和能选择的项目。

这里的注册只是让权限管理知道应用提供哪些能力，不会自动创建角色或分配给用户。任务集合已经由 `TutorialTasksProvider` 注册，新的 Provider 排在它后面，复用已有的教程权限分组。

更新 `server/providers/index.ts`，保留已有 Provider：

```ts
import TutorialProjectsProvider from './tutorial-projects.js';
import TutorialTasksProvider from './tutorial-tasks.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  TutorialTasksProvider,
  TutorialProjectsProvider,
];

export default serviceProviders;
```

在 `client/locales/en-US.ts` 的应用文案对象中添加：

```ts
projects: {
  title: 'Projects',
  read: 'View projects',
  create: 'Create projects',
  assignTask: 'Change task project',
},
```

在 `client/locales/zh-CN.ts` 中添加对应文案：

```ts
projects: {
  title: '项目',
  read: '查看项目',
  create: '新建项目',
  assignTask: '修改任务项目',
},
```

这些是对象属性片段，加入已有语言对象即可，不要覆盖其他文案或编辑 `client/locales/system/`。

### 声明并注册路由

新建 `server/routes/tutorial-projects.ts`：

<details>
<summary>项目 API 路由</summary>

```ts
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
} from '@nocobase/app-server/router';
import { describeRoute } from '@nocobase/app-server/router';
import type { RepositoryPolicy } from '@nocobase/db';
import { tutorialProjectServiceToken } from '../providers/tutorial-projects.js';
import {
  ProjectUnavailableError,
  TaskUnavailableError,
  type ProjectView,
  type TaskProjectView,
} from '../providers/tutorial-project-service.js';

const projectSchema: z.ZodType<ProjectView> = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
const taskProjectSchema: z.ZodType<TaskProjectView> = z.object({
  id: z.uuid(),
  projectId: z.uuid().nullable(),
  updatedAt: z.iso.datetime(),
});
const listInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const createInput = z.strictObject({ name: z.string().trim().min(1).max(120) });
const assignInput = z.strictObject({ projectId: z.uuid().nullable() });
type ProjectEnv = {
  Variables: AuthorizationEnv['Variables'] & {
    projectPolicy: RepositoryPolicy;
    taskPolicy: RepositoryPolicy;
  };
};

export default defineApiRoutes<Application>((app) => {
  const router = new Hono<ProjectEnv>();
  const auth = app.container.resolve(authenticationToken);
  const authz = app.container.resolve(authorizationToken);
  const service = app.container.resolve(tutorialProjectServiceToken);
  // Scope authentication to these endpoints; do not depend on another contribution.
  router.use('/tutorialProjects', auth.required(), authz.middleware());
  router.use('/tutorialTasks/:id/project', auth.required(), authz.middleware());
  router.onError((error, c) =>
    apiErrorHandler(
      error instanceof ProjectUnavailableError
        ? new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'PROJECT_UNAVAILABLE',
            domain: 'tutorialProjects',
            message: error.message,
            fieldViolations: [
              {
                field: 'projectId',
                description: 'Choose an available project.',
              },
            ],
          })
        : error instanceof TaskUnavailableError
          ? new ApiError({
              status: 'NOT_FOUND',
              reason: 'TASK_NOT_FOUND',
              domain: 'tutorialProjects',
              message: error.message,
            })
          : error,
      c,
    ),
  );
  const permit =
    (action: 'read' | 'create' | 'assignTask'): MiddlewareHandler<ProjectEnv> =>
    async (c, next) => {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'tutorial.projects' },
        action,
      });
      const projects = decision.conditions?.database?.tutorialProjects;
      const tasks = decision.conditions?.database?.tutorialTasks;
      if (
        decision.effect === 'deny' ||
        !projects ||
        (action === 'assignTask' && !tasks)
      ) {
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'PROJECT_ACTION_DENIED',
          domain: 'tutorialProjects',
          message: 'This project action is not allowed.',
        });
      }
      c.set('projectPolicy', projects);
      if (tasks) c.set('taskPolicy', tasks);
      await next();
    };
  router.get(
    '/tutorialProjects',
    permit('read'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'List projects',
      operationId: 'listTutorialProjects',
      responses: { 200: listResponse(projectSchema), ...apiErrorResponses },
    }),
    apiValidator('query', listInput),
    async (c) =>
      c.json(await service.list(c.get('projectPolicy'), c.req.valid('query'))),
  );
  router.post(
    '/tutorialProjects',
    permit('create'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'Create a project',
      operationId: 'createTutorialProject',
      responses: { 201: dataResponse(projectSchema), ...apiErrorResponses },
    }),
    apiValidator('json', createInput),
    async (c) =>
      c.json(
        {
          data: await service.create(
            c.get('projectPolicy'),
            c.req.valid('json'),
          ),
        },
        201,
      ),
  );
  router.patch(
    '/tutorialTasks/:id/project',
    permit('assignTask'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'Change a task project',
      operationId: 'assignTutorialTaskProject',
      responses: {
        200: dataResponse(taskProjectSchema),
        400: apiErrorResponse(400),
        404: apiErrorResponse(404),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', z.object({ id: z.uuid() })),
    apiValidator('json', assignInput),
    async (c) =>
      c.json({
        data: await service.assignTask(
          { tasks: c.get('taskPolicy'), projects: c.get('projectPolicy') },
          c.req.valid('param').id,
          c.req.valid('json').projectId,
        ),
      }),
  );
  return new Hono().route('/', router);
});
```

</details>

路径不写 `/api` 或部署基础路径，由 `defineApiRoutes()` 和应用运行时添加。认证中间件只作用于本文件拥有的路径；接口不能依赖另一个路由文件碰巧先注册了认证。

每条接口先认证、再授权，之后才执行 `apiValidator()`。`describeRoute()` 声明操作、响应和错误，输入 schema 同时进入 API 文档。分页参数限制范围，名称去除首尾空格并限制长度，`strictObject()` 拒绝额外字段。归属接口不能被用来顺便修改任务标题或完成状态。

这里所有项目 ID 都由本例的 `randomUUID()` 生成，所以使用 `z.uuid()` 校验。应用里的用户 ID 不一定是 UUID，不能把这个规则直接套到已有的负责人字段。

更新 `server/routes/index.ts`：

```ts
import projectRoutes from './tutorial-projects.js';
import taskRoutes from './tutorial-tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [
  taskRoutes,
  projectRoutes,
];

export default routes;
```

为了在原任务列表接口里读取新的归属，再做两处小改动：

- 在 `server/providers/tutorial-tasks.ts` 中，将 `projectId` 加入 `taskData` 的 `.read([...])` 字段列表。不要把它加进原来的创建或完成操作的可写字段。
- 在 `server/routes/tutorial-tasks.ts` 的 `taskSchema` 中添加 `projectId: z.uuid().nullable()`，保持文档响应与实际数据一致。原有 `createInput` 和 `updateInput` 保持不变。

在 `client/pages/settings/permission-workspace.ts` 的 `permissionWorkspaceSelection.business` 数组中追加下面的条目，保留已有任务条目：

```ts
{
  type: 'composite',
  id: 'tutorial.projects',
  actions: ['read', 'create', 'assignTask'],
  scopeTitles: {
    tutorialTasks: { key: 'tasks.title' },
    tutorialProjects: { key: 'projects.title' },
  },
},
```

服务端声明权限能力，前端的这份配置决定权限编辑器展示哪些业务操作。缺少这一步，API 虽然会检查权限，管理员却无法从当前编辑器配置它。

### 配置角色与数据范围

管理员可以在“系统设置 → 权限管理”创建或编辑角色，在现有的任务业务分组中找到“项目”，选择“查看项目”“新建项目”或“修改任务项目”。修改归属时，分别配置任务和项目的数据范围。再通过“用户”管理把角色分配给明确的测试用户。

![项目业务权限：勾选查看项目、新建项目和修改任务项目，并分别设置任务与项目的数据范围](/assets/core/developing-apps/apis-and-services/project-permissions.png)

截图使用英文界面。**Business operations → Projects** 对应“业务操作 → 项目”，**Change task project** 对应“修改任务项目”。图中是尚未保存的 **Project coordinator** 角色配置，使用 **All Records** 演示；实际授权时应按职责选择范围，保存后再分配给指定用户。

需要访问原任务页面的用户，还要具有该页面的访问权限和相应的任务操作权限。页面权限不会自动授权 API，项目操作也不会授予用户管理权限。

本篇测试使用真实授权服务，为隔离测试账号创建并分配角色。实际应用的角色由管理员配置，不把业务权限写到所有已登录用户默认继承的 `member` 角色中。

## 让接口进入 API 文档

每个 `/api` 路由都应声明 `describeRoute()`：提供稳定的 `operationId`、分组、用途、成功响应与错误响应。输入定义由 `apiValidator()` 的 schema 提供；修改接口时一起更新响应 schema，避免文档和实际返回值不一致。

运行中的应用在 `<APP_BASE_PATH>/api/swagger` 提供 API 描述，在 `<APP_BASE_PATH>/api/swagger/docs` 提供交互页面。路由还必须加入 `server/routes/index.ts`；只有文件里的声明而未注册，不会成为可调用接口。

## 验证接口行为

在本地示例中运行 `pnpm dev`，使用终端输出的完整应用入口登录。然后访问同一应用的 `<APP_BASE_PATH>/api/swagger/docs`，例如 `/main/api/swagger/docs`。API 文档复用登录会话，不需要在文章或代码里保存管理员密码。

在文档中找到 `Tutorial projects`，可以看到本篇新增的三个接口。展开接口后，点击 **Try it out** 填写参数，再点击 **Execute** 发送请求。

![API 文档中的 Tutorial projects 分组：项目查询、创建项目和修改任务项目三个接口](/assets/core/developing-apps/apis-and-services/api-overview.png)

依次验证：

1. 调用 `POST /tutorialProjects`，提交 `{ "name": "Product launch" }`，应返回 `201`；记下 `data.id`。
2. 调用 `GET /tutorialProjects?page=1&pageSize=20`，检查项目和 `meta.page`、`meta.pageSize`、`meta.total`。
3. 从已有任务列表取得任务 ID，调用归属接口，把刚创建的项目 ID 填入 `projectId`。
4. 再查询任务列表，确认该任务的 `projectId` 已保存；传入 `null` 后应解除关联。
5. 使用不存在的有效 UUID 作为项目 ID，应得到 `400`，`error.reason` 为 `PROJECT_UNAVAILABLE`，`fieldViolations` 指向 `projectId`，原关联保持不变。
6. 换用只具备完成任务权限的普通用户，确认其可以完成任务，但归属接口返回 `403`。

![修改任务项目成功：实际请求返回 200，响应 data 中包含任务 id、projectId 和 updatedAt](/assets/core/developing-apps/apis-and-services/assign-project-success.png)

修改成功后，检查 **Server response** 中的 `200` 和响应里的 `projectId`，再通过任务列表接口确认结果已保存。截图中的 ID 来自本地示例，跟做时使用自己创建的记录 ID。

![指定不存在的项目：实际请求返回 400，reason 为 PROJECT_UNAVAILABLE，fieldViolations 指向 projectId](/assets/core/developing-apps/apis-and-services/project-unavailable.png)

指定不存在的项目时，响应返回 `PROJECT_UNAVAILABLE`，并通过 `fieldViolations` 标记 `projectId`；再次读取任务，其原有项目归属应保持不变。

接口错误有明确区别：未登录为 `401`；没有操作授权为 `403`；已有操作授权但任务不存在或不在该操作范围内为 `404`；请求体引用的项目不存在或不允许选择为同一个 `400` 字段错误。相同的范围外与不存在响应，避免通过接口探测隐藏记录。

## 添加真实接口测试

新建 `tests/server/tutorial-tasks-project-api.test.ts`。它使用应用现有的测试配置、真实登录、真实权限和隔离数据库，不替换认证或数据库服务。

<details>
<summary>完整 API 测试</summary>

```ts
import { permissionWorkspaceCatalog } from '../../client/pages/settings/permission-workspace.js';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { selection } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import { projectPermissions } from '../../server/providers/tutorial-projects.js';
import { taskPermissions } from '../../server/providers/tutorial-tasks.js';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'project-api-test-secret-at-least-32-characters',
      advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    logging: { enabled: false },
  },
});
const json = (method: string, value: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});

// Every case uses the real application, authentication and authorization services.
test('rejects anonymous and ungranted callers before validating their input', async ({
  testApp,
  request,
}) => {
  for (const [path, init] of [
    ['/tutorialProjects', undefined],
    ['/tutorialProjects', json('POST', { name: '' })],
    ['/tutorialTasks/not-an-id/project', json('PATCH', {})],
  ] as const)
    expect((await request(path, init)).status).toBe(401);
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'ungranted-project@example.test',
    password: 'project-test-password',
  };
  await users.create({ name: 'No project grants', ...credentials });
  const member = await signIn(testApp, credentials);
  expect((await member.fetch('/tutorialProjects')).status).toBe(403);
  expect(
    (await member.fetch('/tutorialProjects', json('POST', { name: '' })))
      .status,
  ).toBe(403);
  expect(
    (await member.fetch('/tutorialTasks/not-an-id/project', json('PATCH', {})))
      .status,
  ).toBe(403);
});

test('creates validated projects and returns stable paged DTOs', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const before = await db.repository('tutorialProjects').count();
  for (const input of [
    { name: '' },
    { name: '   ' },
    { name: 'x'.repeat(121) },
    { name: 'Injected', id: randomUUID() },
  ]) {
    const response = await admin.fetch(
      '/tutorialProjects',
      json('POST', input),
    );
    expect(response.status).toBe(400);
  }
  expect(await db.repository('tutorialProjects').count()).toBe(before);
  const response = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: '  Product launch  ' }),
  );
  expect(response.status).toBe(201);
  const { data } = (await response.json()) as {
    data: { id: string; name: string; createdAt: string };
  };
  expect(data.name).toBe('Product launch');
  expect(Object.keys(data).sort()).toEqual(['createdAt', 'id', 'name']);
  expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
  expect(
    await db
      .repository('tutorialProjects')
      .findOne({ filter: { id: data.id } }),
  ).toMatchObject({ name: data.name });
  const page = await admin.fetch('/tutorialProjects?page=1&pageSize=1');
  expect(await page.json()).toMatchObject({
    data: [data],
    meta: { page: 1, pageSize: 1, total: before + 1 },
  });
  for (const query of ['page=0', 'pageSize=101', 'pageSize=abc'])
    expect((await admin.fetch(`/tutorialProjects?${query}`)).status).toBe(400);
});

test('changes and clears a task project without changing other task fields', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const created = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: 'Assignment project' }),
  );
  const projectId = ((await created.json()) as { data: { id: string } }).data
    .id;
  const task = await admin.fetch(
    '/tutorialTasks',
    json('POST', { title: 'Prepare materials', dueDate: '2026-11-01' }),
  );
  const taskId = ((await task.json()) as { data: { id: string } }).data.id;
  const db = testApp.application.container.resolve(databaseManagerToken);
  const path = `/tutorialTasks/${taskId}/project`;
  for (const id of [projectId, null]) {
    const response = await admin.fetch(path, json('PATCH', { projectId: id }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { id: taskId, projectId: id },
    });
    const listing = await admin.fetch('/tutorialTasks?q=Prepare%20materials');
    expect(await listing.json()).toMatchObject({
      data: [expect.objectContaining({ id: taskId, projectId: id })],
    });
    expect(
      await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
    ).toMatchObject({
      title: 'Prepare materials',
      completed: false,
      dueDate: '2026-11-01',
      projectId: id,
    });
  }
  const missing = await admin.fetch(
    path,
    json('PATCH', { projectId: randomUUID() }),
  );
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect(
    (
      await admin.fetch(
        `/tutorialTasks/${randomUUID()}/project`,
        json('PATCH', { projectId }),
      )
    ).status,
  ).toBe(404);
  for (const input of [
    {},
    { projectId: 'invalid' },
    { projectId, completed: true },
  ])
    expect((await admin.fetch(path, json('PATCH', input))).status).toBe(400);
  expect(
    await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
  ).toMatchObject({ projectId: null, completed: false });
});

test('applies separate task and project scopes without borrowing broader read grants', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'scoped-project@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Project operator', ...credentials });
  const member = await signIn(testApp, credentials);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const projectIds = [randomUUID(), randomUUID()];
  const taskIds = [randomUUID(), randomUUID()];
  for (const id of projectIds)
    await db
      .repository('tutorialProjects')
      .createOne({ values: { id, name: id, createdAt: new Date() } });
  for (const id of taskIds)
    await db.repository('tutorialTasks').createOne({
      values: {
        id,
        title: 'Scoped task',
        completed: false,
        updatedAt: new Date(),
      },
    });
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'project-operator',
    grants: [
      projectPermissions.reference().grant({
        read: { projects: selection.records(projectIds) },
        assignTask: {
          projects: selection.records([projectIds[0]]),
          tasks: selection.records([taskIds[0]]),
        },
      }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'project-operator-user',
    permissionSet: 'project-operator',
    subject: { type: 'user', id: user.id },
  });
  const list = await member.fetch('/tutorialProjects?pageSize=1');
  const body = (await list.json()) as {
    data: unknown[];
    meta: { total: number };
  };
  expect(list.status).toBe(200);
  expect(body.data).toHaveLength(1);
  expect(body.meta.total).toBe(2);
  expect(
    (
      await member.fetch(
        '/tutorialProjects',
        json('POST', { name: 'Forbidden' }),
      )
    ).status,
  ).toBe(403);
  const assign = (taskId: string, projectId: string) =>
    member.fetch(
      `/tutorialTasks/${taskId}/project`,
      json('PATCH', { projectId }),
    );
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(200);
  const hidden = await assign(taskIds[0], projectIds[1]);
  expect(hidden.status).toBe(400);
  expect(await hidden.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect((await assign(taskIds[1], projectIds[0])).status).toBe(404);
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[0] } }),
  ).toMatchObject({ projectId: projectIds[0] });
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[1] } }),
  ).toMatchObject({ projectId: null });
  await authz.permissionSets.delete('project-operator');
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(403);
});

test('does not let task completion grants change a project assignment', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'task-completer@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Task completer', ...credentials });
  const member = await signIn(testApp, credentials);
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'task-completer',
    grants: [
      taskPermissions.reference().grant({ update: { tasks: 'allRecords' } }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'task-completer-user',
    permissionSet: 'task-completer',
    subject: { type: 'user', id: user.id },
  });
  const id = randomUUID();
  const db = testApp.application.container.resolve(databaseManagerToken);
  await db.repository('tutorialTasks').createOne({
    values: {
      id,
      title: 'Complete only',
      completed: false,
      updatedAt: new Date(),
    },
  });
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { completed: true }),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}/project`,
        json('PATCH', { projectId: null }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { projectId: randomUUID() }),
      )
    ).status,
  ).toBe(400);
});

test('publishes all endpoints and input schemas in the authenticated API document', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/swagger');
  expect(response.status).toBe(200);
  const document = (await response.json()) as {
    paths: Record<
      string,
      Record<string, { operationId: string; requestBody?: unknown }>
    >;
  };
  const projectPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialProjects'),
  )!;
  const taskPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialTasks/{id}/project'),
  )!;
  expect(document.paths[projectPath].get.operationId).toBe(
    'listTutorialProjects',
  );
  expect(document.paths[projectPath].post.operationId).toBe(
    'createTutorialProject',
  );
  expect(document.paths[projectPath].post.requestBody).toBeDefined();
  expect(document.paths[taskPath].patch.operationId).toBe(
    'assignTutorialTaskProject',
  );
  expect(document.paths[taskPath].patch.requestBody).toBeDefined();
});

test('exposes project actions in the actual permission editor catalog', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/authorization/permissionSets/options');
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: AuthorizationOptionsResponse;
  };
  const catalog = permissionWorkspaceCatalog(data, [], []);
  const project = catalog.sections
    .flatMap((section) => section.subsections)
    .flatMap((section) => section.resources ?? [])
    .find((resource) => resource.id === 'tutorial.projects');
  expect(project?.actions.map((action) => action.name)).toEqual([
    'read',
    'create',
    'assignTask',
  ]);
});
```

</details>

运行新增测试和原任务功能的回归测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

测试不仅检查 `200`，还检查非法输入不写入数据、项目不存在时原关联保留、任务与项目范围分别生效、权限撤销后请求被拒绝，以及 API 文档包含新增路由与输入定义。本例用 SQLite 验证。

## 本篇的边界

这里的事务确保一次业务操作中的数据库工作一起成功或失败，但没有实现版本检查，也不承诺多条分页查询来自同一个快照。两人先后修改同一任务的项目时，后一次成功写入会覆盖前一次；如果业务需要阻止覆盖，应在后续增加并验证版本条件。

接下来阅读[UI 组件与交互](pages-and-interactions.md)，把接口接入项目列表、新建弹窗和任务归属表单，补齐加载状态、字段错误和提交反馈。
