---
title: 路由与 HTTP 接口
description: 编写与注册应用接口，选择 Repository 数据接口或业务路由，并维护 API 文档和接口验证。
---

在 `server/routes/` 编写接口，通过 `server/routes/index.ts` 注册。应用运行时把这些声明挂到 API 根路径；目录里存在一个文件，并不代表接口已经生效。

本篇先说明路由接入和 Repository 数据接口，再保留项目示例的完整 HTTP 实现。业务逻辑、参数校验和权限配置分别见[服务端业务服务](server-business-services.md)、[请求校验与错误处理](request-validation-and-errors.md)和[认证、权限与数据范围](authentication-and-permissions.md)。

## 接口放在哪里

| 位置 | 用途 |
| --- | --- |
| `server/routes/<feature>.ts` | 用 `defineApiRoutes()` 声明自定义 Hono 路由，或用 `defineRepositoryApiRoutes()` 声明 Repository 操作 |
| `server/routes/index.ts` | 聚合应用接口，保留已有声明后追加新接口 |
| `server/runtime.ts` | 模板已把路由入口接入运行时，新增接口通常无需修改 |
| `server/app.ts` | 应用级中间件与运行装配，机制见[服务端运行时](../framework/runtime/server.md) |

业务 API 的声明路径不写 `/api` 或部署基础路径，例如 `/projects` 会挂在 `<APP_BASE_PATH>/api/projects`。Webhook 等确实需要根路径协议的入口另见[路由与请求上下文](../framework/http/routes.md)，不要为了省略路径而改变全局 API 挂载方式。

## 怎样选择接口与服务的边界

| 情况 | 处理方式 |
| --- | --- |
| 单个集合的简单操作 | 使用 [Repository 数据接口](../framework/http/repository-routes.md)，配置开放操作、策略、认证与业务输入校验 |
| 一次操作涉及多类记录或明确业务规则 | 编写业务服务，路由只处理 HTTP 边界 |
| 多个入口需要相同业务规则 | 复用服务，明确每个入口提供的身份、策略与已校验输入 |
| 服务需要数据库等依赖 | 在 Provider 中注册，通过 token 从容器取得 |

本例修改任务归属时，需要同时检查任务和目标项目，因此使用自定义路由与业务服务。服务并非绕过权限的内部通道：调用它的入口仍须提供适用于本次操作的权限策略。

## 使用 Repository 数据接口

`defineRepositoryApiRoutes()` 适合查询或修改一个 Collection 的标准操作。下面的独立示例假设迁移已经建立包含 `id`、`title` 的 `categories`，并且这两个字段可以公开读取；它不依赖后面的历史项目示例。保存为 `server/routes/public-categories.ts`：

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [{
    name: 'publicCategories',
    collection: 'categories',
    actions: { findMany: { maxLimit: 50 }, findOne: {}, count: {} },
    policy: {
      read: { scope: true, fields: ['id', 'title'] },
      create: false,
      update: false,
      delete: false,
    },
  }],
});
```

把声明加入 `server/routes/index.ts`：

```ts
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import categoryRoutes from './public-categories.js';

const routes: readonly AppRouteContribution<Application>[] = [
  // Keep the application's existing route contributions here.
  categoryRoutes,
];
export default routes;
```

客户端可以调用 `api.repository('publicCategories')`；原始 HTTP 操作使用 `POST <APP_BASE_PATH>/api/publicCategories/findMany` 等路径，查询也用 POST。声明不会创建数据库表，也不会生成管理页面。

这个例子明确允许匿名读取，禁止所有写入。实际业务需要认证时，必须接入身份与授权产生的策略；`actions` 决定开放哪些操作，`policy` 决定允许的记录、字段和写入，不能只配置其中一项。动态策略、Repository 写入幂等与完整输入格式见[Repository 数据接口](../framework/http/repository-routes.md)。

## 项目示例的准备

项目与任务示例沿用默认模板 `1.0.0-beta.78`，使用 `tutorialTasks` 和 `tutorialProjects`。运行需要先按[建表与数据初始化](data-models-and-migrations.md#准备示例应用)准备独立应用，使用该页保留的历史示例。`nocobase/app-tutorials` 已停止用于新增文档示例；本篇不能直接接在当前入门教程的 `tasks` 示例之后。只阅读代码与职责说明时，无需运行旧项目。

先完成[业务服务](server-business-services.md)中的 `TutorialProjectService`，再按[认证、权限与数据范围](authentication-and-permissions.md)注册完整 Provider、权限能力及角色。下面的路由会使用这些文件。

## 示例的接口合同

以下路径都相对于应用 API 根路径，例如应用入口为 `/main/` 时，完整 API 根路径为 `/main/api`：

- `GET /tutorialProjects`：分页查询当前操作允许查看的项目。
- `POST /tutorialProjects`：新建项目，返回 `201` 和 `{ data }`。
- `PATCH /tutorialTasks/{id}/project`：修改任务的项目归属，传入 `projectId: null` 表示解除关联。

项目归属使用独立的子资源接口和权限。已有的 `PATCH /tutorialTasks/{id}` 仍然只负责完成或恢复任务，不接受 `projectId`。任务列表响应会增加 `projectId`，但不会自动返回项目名称或开放项目详情。

## 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见手动步骤，由 Agent 结合项目指引处理。

```prompt
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

## 声明并注册业务路由

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

[下载完整接口测试](/assets/core/downloads/tutorial-tasks-project-api.test.ts)，保存到上述路径。文件保留本例完整的正常、拒绝与数据范围验证，供查看或复制。

运行新增测试和原任务功能的回归测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

测试不仅检查 `200`，还检查非法输入不写入数据、项目不存在时原关联保留、任务与项目范围分别生效、权限撤销后请求被拒绝，以及 API 文档包含新增路由与输入定义。本例用 SQLite 验证。


## 继续阅读

事务与并发边界见[服务端业务服务](server-business-services.md)，允许与拒绝的验证矩阵见[认证、权限与数据范围](authentication-and-permissions.md)。接下来可按[UI 组件与交互](pages-and-interactions.md)把接口接到页面。
