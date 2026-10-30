---
title: 搭建第一个应用
description: 在已创建的应用中加入任务管理功能，用 Agent 完成首次开发，再了解数据、接口和页面的关键代码。
---

这一篇，我们给刚创建的应用加上一个任务管理页面，可以新建任务、设置截止日期，并将任务标记为已完成。

![任务管理页面，展示任务名称、截止日期和进度。](/assets/core/tutorials/team-tasks/task-list.png)

截图和代码取自文末的完整任务示例，它还包含负责人、搜索和权限等功能。首次体验先完成新建任务和标记完成即可，生成的页面布局可能与截图不同。

## 准备

先完成 [创建应用](../getting-started/create-app.md)，确认应用能够启动并登录。在这个应用的项目目录中开启 Agent 会话，继续开发。

## 搭建应用

### 描述需求

把下面这句话发给 Agent：

```text
帮我在这个应用里加一个任务管理页面，能新建任务、设置截止日期、标记完成。做好后运行起来给我看看。
```

### 生成应用

Agent 会在当前项目中添加任务需要的数据表、接口和页面。应用自带的 `AGENTS.md` 和 Skills 提供实现指引，你只需要说明想要的功能。

如果 Agent 追问细节，按需要回答。例如，任务进度可以用“待处理、进行中、已完成”。先把基本功能做出来，其他需求可以在用过之后再补充。

### 打开应用

完成后，打开 Agent 给出的完整地址，用之前的管理员账号登录。地址中的端口和 `/main/` 等路径也要保留。

进入任务页面，新建一条“准备项目启动会”的任务，选一个将来的截止日期。保存后，将任务标记为已完成，再刷新页面，确认任务和完成状态都还在。到这里，你已经在自己的应用里完成了第一个业务功能。

如果结果不符合预期，直接告诉 Agent 你做了什么、看到了什么。例如：“我把任务标记为已完成，但刷新后又变回待处理了，帮我看看。”

## 了解生成的代码

应用跑起来后，可以按需阅读这一节，了解数据存在哪里、页面操作如何生效，以及继续修改时从哪里入手。

下面以 [完整任务示例](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks) 为参照，只选取相关代码片段，省略部分导入、辅助函数和界面代码。Agent 生成的文件和实现可能不同，可以对照查看。

### 代码在哪里

与任务功能直接相关的文件主要在这些位置：

```tree
database/main/migrations/
└── 202610250101_create_tasks.ts  # 任务表
server/
├── routes/tasks.ts              # 任务接口
└── tasks/
    ├── schemas.ts              # 输入校验
    └── service.ts              # 读写任务
client/
├── routes.ts                   # 页面和菜单注册
└── pages/tasks/
    ├── index.tsx               # 任务列表
    └── form.tsx                # 新建和编辑表单
```

想调整列表或表单，从 `client/pages/tasks/` 看起；想改变保存任务时的规则，查看 `server/tasks/`；需要增加持久保存的字段，则会涉及数据库迁移。

### 任务数据如何定义

[任务表迁移](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts) 通过 `builder.createCollection('tasks', ...)` 定义任务表。下面摘出与首次体验相关的三个字段：

```ts
c.string('title', { length: 120, nullable: false });
c.string('status', { length: 16, nullable: false, defaultValue: 'todo' });
c.string('dueDate', { length: 10, nullable: true });
```

`title` 保存任务名称，`dueDate` 保存截止日期，`status` 保存进度。示例用 `todo`、`inProgress` 和 `done` 分别表示待处理、进行中和已完成，新建时默认为 `todo`。

默认配置下，应用启动时会执行待执行的迁移，把这些定义应用到数据库。页面上的字段与这里的数据对应，因此刷新后仍然能读到保存的任务。数据库迁移的写法见 [数据模型与迁移](../developing-apps/data-models-and-migrations.md)。

### 新建任务如何实现

以刚才点击“保存”的操作为例，可以从前端表单一路看到数据写入的位置。

**页面提交数据。** [client/pages/tasks/form.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx) 用 `useApiClient` 获取接口客户端。下面是表单提交回调中的请求：

```ts
return api.request<{ data: Task }>({
  path: creating ? 'tasks' : `tasks/${taskId}`,
  method: creating ? 'POST' : 'PATCH',
  json: snapshot,
  headers: { 'Idempotency-Key': key },
  signal,
});
```

新建时，`creating` 为真，请求会使用 `POST`，把表单内容 `snapshot` 发到任务接口；编辑时使用 `PATCH`。外层的 `useSubmission` 提供提交内容、操作键 `key` 和取消信号 `signal`，其中操作键用于避免重试时重复创建任务。

**后端接收请求。** [server/routes/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts) 中的新建接口如下；它挂在任务路由下，完整路径包含应用基础路径和 `/api/tasks`：

```ts
tasks.post(
  '/',
  gate('create'),
  describeRoute({
    tags: ['Tasks'],
    operationId: 'createTask',
    summary: 'Create a task',
    responses: { '201': dataResponse(taskSchema), ...errors },
  }),
  apiValidator('header', z.object({ 'idempotency-key': z.string() })),
  apiValidator('json', createTask),
  async (c) => {
    return c.json(await mutation(c, 'create', c.req.valid('json')), 201);
  },
);
```

`gate('create')` 检查新建权限，`apiValidator` 校验请求内容，`describeRoute` 声明接口文档。校验通过后，`mutation` 调用任务服务，并处理重复提交的回执。

**保存到数据库。** [server/tasks/service.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts) 的 `create` 方法通过 Repository 写入数据，下面是其中的保存片段：

```ts
const result = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .createOne({
    values: { ...input, id: randomUUID(), createdAt: now, updatedAt: now },
  });
```

`input` 是通过校验的任务内容，`id` 和时间由服务端补充。`withPolicy(policy)` 把当前用户的权限策略应用到写入操作。服务返回新任务后，接口把结果交给页面，新建操作就完成了。

示例沿用应用已有的登录和授权能力。权限规则的详细写法见 [认证、权限与数据范围](../developing-apps/authentication-and-permissions.md)。

### 任务页面如何接入应用

[client/routes.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts) 把任务页面注册进应用。下面省略了新建、编辑和详情的子路由：

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
  // 子路由省略
}
```

`path` 决定页面地址，`componentLoader` 指向任务列表组件，`navigation` 配置侧边栏入口。`auth` 要求登录，`authz` 声明页面访问权限。

列表页面使用模板的 `DataTable` 展示任务，表单使用已有的界面组件收集输入。想修改页面布局，可以从 `index.tsx` 和 `form.tsx` 入手；想调整菜单入口，则看这里的路由配置。更多页面写法见 [组件与交互](../developing-apps/pages-and-interactions.md)。

## 继续开发

用过之后，可以再提出一个小需求：

```text
加一个搜索框，让我能按名称查找任务。
```

做好后打开页面，试着搜索刚才创建的任务。后续也可以添加进度筛选、负责人或角色权限，每次围绕一个具体需求继续修改。

想深入了解开发方法，可以继续阅读：

- [和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)：描述需求、检查结果和继续迭代。
- [数据模型与迁移](../developing-apps/data-models-and-migrations.md)：增加字段、定义关联和调整数据结构。
- [组件与交互](../developing-apps/pages-and-interactions.md)：开发表格、表单和其他页面交互。
- [测试与验收](../developing-apps/testing-and-acceptance.md)：验证功能和权限，检查修改是否影响已有行为。

### 示例源码

完整代码在 [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks)，对应提交 `0185e4bfa9d7ef05dd180245005a6c1024fe41de`，基于默认模板 `1.0.0-beta.84`，在 SQLite 上验证。应用目录的 [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD) 提供运行步骤、文件对照和测试命令；[实操记录](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/docs/walkthrough.md) 记录了实操中遇到的问题、修复方式和没有验证的部分，例如 PostgreSQL、MySQL 和部署。

<details>
<summary>获取并运行完整应用</summary>

准备 Node.js 24 和 pnpm 11.7，在新目录中获取代码，不要覆盖正在开发的项目：

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0185e4bfa9d7ef05dd180245005a6c1024fe41de
cd apps/team-tasks
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config set i18n.defaultLocale=en-US
pnpm nocobase config check
pnpm dev
```

运行 `config init` 时选择 SQLite，与实操环境一致。`i18n.defaultLocale=en-US` 让界面默认显示英文，与截图对应，不需要时可以省略这一行。打开终端打印的完整 `Local:` 地址，用初始管理员登录。新安装的应用任务列表是空的，按 [打开应用](#打开应用) 创建第一条任务。配置文件、数据库和截图中的示例数据都不随源码分发。

</details>
