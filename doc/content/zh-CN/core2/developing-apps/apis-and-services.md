---
title: 路由与 HTTP 接口
description: 编写和注册应用接口，在 Repository 数据接口与业务路由之间做选择，并维护 API 文档和接口验证。
---

应用接口写在 `server/routes/` 中，通过 `server/routes/index.ts` 注册。应用运行时会把这些声明挂载到 API 根路径下；目录里有一个文件，并不代表接口已经生效。

本篇先说明路由如何接入应用，以及 Repository 数据接口的用法，再给出项目示例完整的 HTTP 实现。业务逻辑、参数校验和权限配置分别见 [服务端业务服务](server-business-services.md)、[请求校验与错误处理](request-validation-and-errors.md) 和 [认证、权限与数据范围](authentication-and-permissions.md)。

## 接口放在哪里

| 位置 | 用途 |
| --- | --- |
| `server/routes/<feature>.ts` | 用 `defineApiRoutes()` 声明自定义 Hono 路由，或用 `defineRepositoryApiRoutes()` 声明 Repository 操作 |
| `server/routes/index.ts` | 汇总应用接口；保留已有声明，再追加新接口 |
| `server/runtime.ts` | 模板已把路由入口接入运行时，新增接口时通常无需修改 |
| `server/app.ts` | 应用级中间件和运行装配，机制见 [服务端运行时](../framework/runtime/server.md) |

业务 API 的声明路径中不写 `/api` 或部署基础路径，例如 `/projects` 会挂载为 `<APP_BASE_PATH>/api/projects`。Webhook 等确实需要使用根路径协议的入口，另见 [路由与请求上下文](../framework/http/routes.md)；不要为了省掉一段路径而改变全局的 API 挂载方式。

## 怎样划分接口与服务的边界

| 情况 | 处理方式 |
| --- | --- |
| 单个集合上的简单操作 | 使用 [Repository 数据接口](../framework/http/repository-routes.md)，配置开放的操作、策略、认证和业务输入校验 |
| 一次操作涉及多类记录，或有明确的业务规则 | 编写业务服务，路由只处理 HTTP 边界 |
| 多个入口需要相同的业务规则 | 复用同一个服务，并明确每个入口提供的身份、策略和已校验的输入 |
| 服务依赖数据库等资源 | 在 Provider 中注册服务，通过 Token 从容器中取得 |

本例修改任务归属时，需要同时检查任务和目标项目，因此使用自定义路由加业务服务。服务并不是绕过权限的内部通道：调用它的每个入口，仍须提供适用于本次操作的权限策略。

## 使用 Repository 数据接口

`defineRepositoryApiRoutes()` 适合对单个 Collection 进行标准的查询或修改。下面是一个独立的示例，假设迁移已经建立了包含 `id`、`title` 字段的 `categories` 表，并且这两个字段可以公开读取；它不依赖后文的历史项目示例。保存为 `server/routes/public-categories.ts`：

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

再把声明加入 `server/routes/index.ts`：

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

客户端可以通过 `api.repository('publicCategories')` 调用；直接使用 HTTP 时，路径形如 `POST <APP_BASE_PATH>/api/publicCategories/findMany`，查询操作也使用 POST。这个声明不会创建数据库表，也不会生成管理页面。

这个例子明确允许匿名读取，并禁止一切写入。实际业务需要认证时，必须接入由身份和授权产生的策略。`actions` 决定开放哪些操作，`policy` 决定允许访问哪些记录、哪些字段，以及能否写入，两者缺一不可。动态策略、Repository 写入的幂等性和完整的输入格式见 [Repository 数据接口](../framework/http/repository-routes.md)。

## 项目示例的准备

项目与任务示例沿用默认模板 `1.0.0-beta.78`，使用 `tutorialTasks` 和 `tutorialProjects` 两张表。运行前需要先按 [建表与数据初始化](data-models-and-migrations.md#准备示例应用) 准备一个独立的应用，其中包括有访问权限的 `nocobase/app-tutorials` 私有仓库；它不能直接接在当前入门教程的 `tasks` 示例之后运行。没有该仓库的访问权限，也可以阅读代码和职责说明。

请先完成 [服务端业务服务](server-business-services.md) 中的 `TutorialProjectService`，再按 [认证、权限与数据范围](authentication-and-permissions.md) 注册完整的 Provider、权限能力和角色。下文的路由会用到这些文件。

## 示例的接口约定

以下路径都相对于应用的 API 根路径。例如应用入口为 `/main/` 时，完整的 API 根路径为 `/main/api`：

- `GET /tutorialProjects`：分页查询当前操作允许查看的项目。
- `POST /tutorialProjects`：新建项目，返回 `201` 和 `{ data }`。
- `PATCH /tutorialTasks/{id}/project`：修改任务所属的项目；传入 `projectId: null` 表示解除关联。

项目归属使用独立的子资源接口和独立的权限。已有的 `PATCH /tutorialTasks/{id}` 仍然只负责完成或恢复任务，不接受 `projectId`。任务列表的响应会增加 `projectId` 字段，但不会自动返回项目名称，也不会开放项目详情。

## 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见后文的手动步骤，由 Agent 结合项目指引处理。

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

路径中不写 `/api` 或部署基础路径，它们由 `defineApiRoutes()` 和应用运行时添加。认证中间件只作用于本文件自己的路径；接口不能依赖另一个路由文件碰巧先注册了认证。

每个接口都是先认证、再授权，之后才执行 `apiValidator()`。`describeRoute()` 声明操作、响应和错误，输入 schema 也会一并进入 API 文档。分页参数限制了取值范围，名称会去除首尾空格并限制长度，`strictObject()` 拒绝多余的字段，因此不能借归属接口顺便修改任务标题或完成状态。

本例中的项目 ID 都由 `randomUUID()` 生成，所以用 `z.uuid()` 校验。应用中的用户 ID 不一定是 UUID，不能把这条规则直接套用到已有的负责人字段上。

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

为了在原有的任务列表接口中读取新的归属，还需要两处小改动：

- 在 `server/providers/tutorial-tasks.ts` 中，把 `projectId` 加入 `taskData` 的 `.read([...])` 字段列表。不要把它加入原有的创建或完成操作的可写字段。
- 在 `server/routes/tutorial-tasks.ts` 的 `taskSchema` 中添加 `projectId: z.uuid().nullable()`，让文档中的响应与实际数据保持一致。原有的 `createInput` 和 `updateInput` 保持不变。

## 让接口进入 API 文档

每个 `/api` 路由都应声明 `describeRoute()`，提供稳定的 `operationId`、分组、用途说明，以及成功和错误时的响应。输入定义来自 `apiValidator()` 使用的 schema。修改接口时，要同时更新响应 schema，避免文档与实际返回值不一致。

运行中的应用在 `<APP_BASE_PATH>/api/swagger` 提供 API 描述，在 `<APP_BASE_PATH>/api/swagger/docs` 提供交互式页面。路由还必须加入 `server/routes/index.ts`：只在文件里声明而没有注册，不会成为可以调用的接口。

## 验证接口行为

在本地示例中运行 `pnpm dev`，用终端输出的完整应用入口登录。然后访问同一应用下的 `<APP_BASE_PATH>/api/swagger/docs`，例如 `/main/api/swagger/docs`。API 文档复用当前的登录会话，不需要在文章或代码中保存管理员密码。

在文档中找到 `Tutorial projects` 分组，可以看到本篇新增的三个接口。展开某个接口，点击 **Try it out** 填写参数，再点击 **Execute** 发送请求。

![API 文档中的 Tutorial projects 分组：项目查询、创建项目和修改任务项目三个接口](/assets/core/developing-apps/apis-and-services/api-overview.png)

按顺序验证：

1. 调用 `POST /tutorialProjects`，提交 `{ "name": "Product launch" }`，应返回 `201`；记下 `data.id`。
2. 调用 `GET /tutorialProjects?page=1&pageSize=20`，检查返回的项目，以及 `meta.page`、`meta.pageSize` 和 `meta.total`。
3. 从已有的任务列表中取得一个任务 ID，调用归属接口，把刚创建的项目 ID 填入 `projectId`。
4. 再次查询任务列表，确认该任务的 `projectId` 已经保存；传入 `null` 后，关联应被解除。
5. 用一个格式有效但并不存在的 UUID 作为项目 ID，应得到 `400`：`error.reason` 为 `PROJECT_UNAVAILABLE`，`fieldViolations` 指向 `projectId`，原有关联保持不变。
6. 换成一个只有“完成任务”权限的普通用户，确认他能完成任务，但调用归属接口返回 `403`。

![修改任务项目成功：实际请求返回 200，响应 data 中包含任务 id、projectId 和 updatedAt](/assets/core/developing-apps/apis-and-services/assign-project-success.png)

修改成功后，检查 **Server response** 中的状态码 `200` 和响应里的 `projectId`，再通过任务列表接口确认结果已经保存。截图中的 ID 来自本地示例，动手操作时请使用你自己创建的记录 ID。

![指定不存在的项目：实际请求返回 400，reason 为 PROJECT_UNAVAILABLE，fieldViolations 指向 projectId](/assets/core/developing-apps/apis-and-services/project-unavailable.png)

指定不存在的项目时，响应返回 `PROJECT_UNAVAILABLE`，并通过 `fieldViolations` 标记 `projectId`；再次读取任务，它原有的项目归属应保持不变。

不同的错误有明确区分：未登录返回 `401`；没有操作授权返回 `403`；有操作授权，但任务不存在或不在该操作的范围内，返回 `404`；请求体引用的项目不存在或不允许选择，返回同一个 `400` 字段错误。对“超出范围”和“不存在”返回相同的响应，可以避免有人通过接口探测隐藏的记录。

## 添加真实接口测试

新建 `tests/server/tutorial-tasks-project-api.test.ts`。它使用应用现有的测试配置、真实的登录、真实的权限和隔离的数据库，不替换认证或数据库服务。

[下载完整的接口测试](/assets/core/downloads/tutorial-tasks-project-api.test.ts)，保存到上述路径。这个文件包含本例完整的正常、拒绝和数据范围验证，可供查看或复制。

运行新增的测试，以及原有任务功能的回归测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

这些测试不只检查 `200`，还检查：非法输入不会写入数据；项目不存在时原有关联保持不变；任务范围和项目范围分别生效；权限撤销后请求被拒绝；API 文档包含新增的路由和输入定义。本例在 SQLite 上验证。

## 继续阅读

事务和并发边界见 [服务端业务服务](server-business-services.md)，允许与拒绝情况的验证矩阵见 [认证、权限与数据范围](authentication-and-permissions.md)。接下来，可以按 [UI 组件与交互](pages-and-interactions.md) 把这些接口接入页面。
