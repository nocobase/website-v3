---
title: 搭建第一个应用
description: 搭建一个团队任务应用：分配负责人、设置截止日期、跟进进度，不同角色看到的任务和能做的操作各不相同。
---

完成这一篇，你会得到一个可以实际使用的团队任务应用：

- 任务有标题、描述、负责人、截止日期和进度（待处理、进行中、已完成），可以新建、查看、编辑、删除，按标题搜索、按进度筛选和分页，界面支持中英文。
- 三种任务角色：任务管理员管理全部任务；任务成员只看到分配给自己的任务，只能更新进度；任务只读用户能看到全部任务，但不能修改。
- 一套自动化测试，覆盖建表、接口、权限和页面。

![团队任务列表，包含进度、负责人、截止日期和分页。](/assets/core/tutorials/team-tasks/task-list.png)

下面分两种方式：让 Agent 完成，或者自己写代码。两种方式以相同的功能和权限要求为目标，完成后都按[试用应用](#试用应用)检查结果。

## 准备

按[创建应用](../getting-started/create-app.md)创建一个应用，启动后能用管理员账号登录。本文实操使用 Node.js 24、pnpm 11.7、默认模板 `1.0.0-beta.84` 和 SQLite；你的项目以创建时安装的版本和它自带的项目指引为准。

开始前先把项目提交到 Git，之后能清楚地看到这次改了哪些文件。

## 使用 Agent

### 1. 描述需求

在应用目录开启 Agent 会话。应用自带的 `AGENTS.md` 和 `.agents/skills/` 告诉 Agent 代码放在哪里、迁移和权限怎么写，内容与安装的版本配套。如果 `.agents/skills/` 不存在，先在应用目录运行 `pnpm nocobase skills sync`。

把下面的需求发给 Agent：

```prompt
帮我做一个团队任务管理应用，任务有标题、描述、负责人、截止日期和待处理、进行中、已完成三种进度。
支持新建、查看详情、编辑、删除、搜索、状态筛选和分页，界面支持中英文。
管理员可以管理全部任务；成员只能查看和更新分配给自己的任务进度；只读用户只能查看全部任务。
提供用户和角色管理入口，方便我添加测试成员并分配角色。
请按项目的 AGENTS.md 和 Skills 完成开发和相关测试，保留已有功能和数据。
做好后运行起来，告诉我访问地址、测试账号和角色的准备方式，以及检查结果和未验证的部分。
```

这段需求说清了三件事：任务有哪些信息和操作，谁能做什么，做完后要交付什么。把权限写进需求后，仍需检查服务端是否对每个请求落实了授权，并用普通账号验证；只隐藏按钮不能保护接口。

### 2. 检查交付

Agent 会新建任务表、接口、页面和三种任务角色，编写并运行测试，再启动应用。完成后，它应该告诉你：

- 应用的访问地址和登录账号；
- 改了哪些文件，运行了哪些测试，结果如何；
- 哪些部分还没有验证。

打开它给出的完整地址，保留末尾的 `/main/` 等路径，用管理员账号登录，然后按[试用应用](#试用应用)逐项检查。

同一段需求，每次生成的页面布局和文件组织可能不同。本文的截图和代码来自一次实操，按钮名称和位置以你的应用为准。想知道 Agent 具体改了什么，可以对照下面的「不使用 Agent」。

## 不使用 Agent

下面按建表、后端、前端、权限、测试的顺序，展开实现这个应用要做的改动。每一步给出关键代码，标为片段的代码需要放回对应文件；完整实现见[示例源码](#示例源码)。

在默认模板上，这次改动涉及这些位置：

| 位置 | 改动 |
| --- | --- |
| `database/main/migrations/`、`database/main/seeds/` | 新建任务表；初始化三种任务角色 |
| `server/tasks/` | 输入校验、业务服务和权限声明 |
| `server/providers/`、`server/routes/` | 注册任务服务和 HTTP 接口 |
| `client/pages/tasks/` | 列表、详情、表单和任务操作 |
| `client/routes.ts`、`client/pages/settings/` | 注册任务页面和系统设置；在权限编辑器中展示任务操作 |
| `client/locales/` | 中英文文案 |
| `client/components/ui/calendar.tsx` | 用 shadcn 添加的日历组件 |
| `tests/` | 任务相关的测试 |

### 1. 创建任务表

只新增一张业务表 `tasks`。用户、登录和角色用应用内置的能力，不另建用户表或权限系统。

| 字段 | 用途 |
| --- | --- |
| `id` | 任务 ID，由服务端生成 |
| `title` | 标题，必填，去掉首尾空格后最多 120 个字符 |
| `description` | 描述，最多 2,000 个字符 |
| `status` | 进度：`todo`、`inProgress`、`done` |
| `assigneeId` | 负责人，已有用户的 ID，可为空 |
| `dueDate` | 截止日期，`YYYY-MM-DD` 格式的日历日期，可为空 |
| `createdAt`、`updatedAt` | 创建和更新时间 |

在 [database/main/migrations/202610250101_create_tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts) 中声明字段和索引：

<details>
<summary>展开完整迁移</summary>

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250101_create_tasks',
  async up({ builder }) {
    await builder.createCollection('tasks', (c) => {
      c.string('id', { length: 36, primaryKey: true, nullable: false });
      c.string('title', { length: 120, nullable: false });
      c.text('description', { nullable: false, defaultValue: '' });
      c.string('status', { length: 16, nullable: false, defaultValue: 'todo' });
      c.string('assigneeId', { length: 255, nullable: true });
      c.string('dueDate', { length: 10, nullable: true });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.index(['assigneeId', 'status']);
      c.index('dueDate');
      c.index('updatedAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('tasks');
  },
});
```

</details>

迁移只负责表结构，字段的业务规则在后端校验。负责人通过用户服务检查，不直接读写认证插件的内部表。

默认配置下，应用启动时会自动执行待执行的迁移和 Seed。不想重启时，手动执行，再生成 Collection 文件：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections generate
```

`--dry-run` 只预览要执行的内容。`collections generate` 把表结构写到 `database/main/collections/`，这些文件由工具生成，不要手工修改。

### 2. 实现后端

后端分三层：输入校验、业务服务和 HTTP 接口。请求先通过认证和授权，再校验输入，最后交给服务处理。

**输入校验。** [server/tasks/schemas.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/schemas.ts) 把新建、编辑和更新进度分成三种输入。编辑任务信息时不能顺带修改进度，这样才能把“更新进度”单独授权给成员：

<details>
<summary>展开输入校验代码</summary>

```ts
export const taskStatus = z.enum(['todo', 'inProgress', 'done']);
export const taskDetails = z.strictObject({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  assigneeId: z.string().min(1).max(255).nullable().default(null),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.valueOf()) &&
        date.toISOString().slice(0, 10) === value
      );
    })
    .nullable()
    .default(null),
});
export const createTask = taskDetails.extend({
  status: taskStatus.default('todo'),
});
export const editTask = taskDetails.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const progressTask = z.strictObject({
  status: taskStatus,
  expectedUpdatedAt: z.iso.datetime(),
});
```

</details>

`expectedUpdatedAt` 是读取任务时拿到的更新时间。修改和删除时，服务端比对这个值；任务已经被别人改过，就返回 `409`，不会覆盖别人的修改。

**业务服务。** [server/tasks/service.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts) 的每次读写都通过 `withPolicy(policy)` 带上当前用户的权限策略。下面是新建任务的实现，`validateOwner` 拒绝不存在、已停用或不是真人的负责人：

```ts
async create(policy: RepositoryPolicy, input: TaskInput) {
  await this.validateOwner(input.assigneeId);
  const now = new Date();
  const result = await this.db
    .repository('tasks')
    .withPolicy(policy)
    .createOne({
      values: { ...input, id: randomUUID(), createdAt: now, updatedAt: now },
    });
  return rowSchema.parse(result.record);
}
```

同一个服务还提供列表、详情、可选负责人、编辑、更新进度和删除。列表在数据库中完成搜索、筛选、排序和分页，并返回总数。

**HTTP 接口。** [server/routes/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts) 提供下面这些接口，实际地址前面还有 `/main` 等基础路径：

| 方法和路径 | 用途 | 需要的权限 |
| --- | --- | --- |
| `GET /api/tasks` | 列表，支持搜索、进度筛选、排序和分页 | 查看 |
| `GET /api/tasks/:id` | 详情 | 查看 |
| `GET /api/tasks/assignees` | 可选的负责人 | 新建或编辑 |
| `POST /api/tasks` | 新建 | 新建 |
| `PATCH /api/tasks/:id` | 编辑标题、描述、负责人和截止日期 | 编辑 |
| `PATCH /api/tasks/:id/status` | 更新进度 | 更新进度 |
| `DELETE /api/tasks/:id` | 删除 | 删除 |

另有 `GET /api/tasks/:id/edit`、`/progress`、`/delete` 三个读取接口：页面在打开编辑表单、更新进度或删除之前，用它们确认当前用户对这条任务仍有对应权限。

认证和授权中间件只装在任务子路由上。`gate` 根据操作取得权限策略，没有权限直接拒绝。新建接口如下：

```ts
tasks.use('*', auth.required(), authz.middleware());
const gate =
  (action: TaskAction): MiddlewareHandler<Env> =>
  async (c, next) => {
    c.set('taskPolicy', await service.policy(c.get('authz'), action));
    await next();
  };

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

`describeRoute` 声明接口文档，`apiValidator` 校验请求；成功返回 `{ data }`，失败返回标准的 `ApiError`。写接口都要求 `Idempotency-Key` 请求头：`mutation` 通过 `executeIdempotentMutation` 把任务写入和操作回执放在同一个事务里，用同一个键重复提交时返回第一次的结果，不会重复创建。

**注册服务和接口。** [server/providers/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/providers/tasks.ts) 在应用启动时注册任务服务和权限声明：

<details>
<summary>展开 TasksProvider</summary>

```ts
export const taskServiceToken =
  createServiceToken<TaskService>('team-tasks/tasks');
export default class TasksProvider extends ServiceProvider<Application> {
  readonly name = 'team-tasks/tasks';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({ name: 'tasks', title: label('title') });
    authz.recordAccess.define(assignedTasks);
    authz.ui.sections.add({
      name: 'tasks',
      parent: 'business',
      title: label('title'),
    });
    authz.ui.place(authz.compositeResources.define(taskPermissions), {
      section: 'tasks',
    });
    this.app.container.instance(
      taskServiceToken,
      new TaskService(
        this.app.container.resolve(databaseManagerToken),
        this.app.container.resolve(userAdministrationServiceToken),
      ),
    );
  }
}
```

</details>

再把服务和路由加入应用已有的注册入口。`SubmissionProvider` 是模板自带的，负责上面提到的操作回执：

`server/providers/index.ts`

```ts
import TasksProvider from './tasks.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  TasksProvider,
];

export default serviceProviders;
```

`server/routes/index.ts`

```ts
import { taskRoutes } from './tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [taskRoutes];

export default routes;
```

登录后，在应用地址后面加上 `api/swagger/docs`（例如 `http://127.0.0.1:13000/main/api/swagger/docs`），可以在 Tasks 分组下看到这些接口。

### 3. 实现前端

前端增加任务列表、详情抽屉和新建／编辑弹窗，使用模板已有的布局、表格、表单和反馈组件。

**添加日历组件。** 选择截止日期要用日历，模板没有自带。在应用目录运行：

```bash
yes n | pnpm exec shadcn add calendar
```

它会生成 `client/components/ui/calendar.tsx`，并安装 `react-day-picker` 等依赖。`yes n` 对“是否覆盖已有文件”一律回答否，保留模板已有的组件。

**页面与路由。** 在 [client/routes.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts) 注册任务页面。`navigation` 生成侧边栏入口，`authz` 声明页面访问权限。新建、编辑和详情都是子路由，有自己的地址，刷新、后退或直接打开链接时能恢复对应的界面：

<details>
<summary>展开任务路由片段</summary>

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
  children: [
    { name: 'taskCreate', path: 'new', componentLoader: () => import('./pages/tasks/form.js') },
    { name: 'taskEdit', path: 'edit/:taskId', componentLoader: () => import('./pages/tasks/form.js') },
    {
      name: 'taskDetail', path: ':taskId',
      componentLoader: () => import('./pages/tasks/detail.js'),
      children: [{ name: 'taskDetailEdit', path: 'edit', componentLoader: () => import('./pages/tasks/form.js') }],
    },
  ],
}
```

</details>

在同一个文件里，再注册模板准备好的系统设置页面。新建的应用不显示用户和权限管理；有了业务功能后，管理员要靠它们添加成员、分配角色：

```ts
import systemSettingsRoutes from './pages/settings/routes.js';

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  systemSettingsRoutes,
];
```

**列表。** [client/pages/tasks/index.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/index.tsx) 把搜索词、进度、页码和排序保存在 URL 中，用 `useApiClient` 请求列表接口，再交给模板的 `DataTable`。下面的片段省略了事件处理：

```tsx
<DataTable
  columns={columns}
  data={result.data}
  getRowId={(row) => row.id}
  manualPagination
  rowCount={result.meta.total}
  paginationState={pagination}
  pageSizeOptions={[10, 20, 50]}
  manualSorting
  sortingState={sorting}
  loading={loading}
/>
```

完整文件中的 `onPaginationChange` 和 `onSortingChange` 更新 URL，触发新的查询。页面还区分了首次为空、筛选无结果、加载中和加载失败几种状态；点击标题打开详情。

**详情与表单。** [detail.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/detail.tsx) 用 `RouteDrawer` 在抽屉中展示详情，[form.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx) 用 `RouteDialog` 展示新建和编辑表单。负责人用 [assignee-picker.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/assignee-picker.tsx) 从 `/api/tasks/assignees` 搜索，截止日期用 `Calendar` 和 `Popover` 选择。

![新建任务弹窗，填写标题、描述、负责人、截止日期和进度。](/assets/core/tutorials/team-tasks/task-create.png)

保存通过 `useSubmission` 提交。下面是简化后的保存逻辑，省略了字段校验和错误处理；新建时带上初始进度，编辑时只提交任务信息和读取时的版本：

```ts
const submission = useSubmission({
  scope: `${session?.user.id}:tasks:${taskId ?? 'new'}:form`,
});

const values = {
  title: fields.title.trim(),
  description: fields.description.trim(),
  assigneeId: fields.assignee?.id ?? null,
  dueDate: fields.dueDate,
  ...(creating ? { status: fields.status } : { expectedUpdatedAt: version }),
};
const saved = await submission.run(values, async (key, signal, snapshot) =>
  api.request<{ data: Task }>({
    path: creating ? 'tasks' : `tasks/${taskId}`,
    method: creating ? 'POST' : 'PATCH',
    json: snapshot,
    headers: { 'Idempotency-Key': key },
    signal,
  }),
);
```

保存结果不确定时（例如网络中断），`useSubmission` 保留原来的输入和操作键，重试时使用同一个键，服务端不会重复创建。表单在提交时校验，错误显示在对应字段旁；保存失败时保留输入，保存中禁止重复提交。

**任务操作。** [task-actions.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/task-actions.tsx) 集中了编辑、更新进度和删除，列表每行末尾的操作菜单使用它。接口返回的每条任务带有 `permissions`，没有权限的操作不显示；删除前要求确认。

**中英文文案。** 文案集中在 [client/locales/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/locales/tasks.ts)，再加入两种语言的资源。组件只使用翻译键，例如 `t('tasks.title')`：

```ts
// client/locales/en-US.ts
import { tasksEn } from './tasks.js';

const enUS = {
  ...systemEnUS,
  tasks: tasksEn,
  ...fileUi,
};

// client/locales/zh-CN.ts
import { tasksZh } from './tasks.js';

const zhCN: AppResource = {
  ...systemZhCN,
  tasks: tasksZh,
  ...fileUi,
};
```

### 4. 接入权限

权限分三层检查：能不能进入任务页面，能执行哪些操作，能操作哪些任务。前端按权限显示入口和按钮只是为了好用，真正的限制在服务端，每个请求都要检查。

**声明操作和数据范围。** [server/tasks/permissions.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/permissions.ts) 声明五种操作：查看、新建、编辑、更新进度和删除，每种操作只能读写指定的字段。另外声明“分配给我的任务”这个数据范围，条件是 `assigneeId` 等于当前用户：

<details>
<summary>展开权限声明</summary>

```ts
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { buildFilter } from '@nocobase/repository-input';
import metadata from '../../package.json' with { type: 'json' };
import type { TaskRow } from './schemas.js';
export const label = (key: string) => ({
  ns: metadata.name,
  key: `tasks.${key}`,
});
const fields = [
  'id',
  'title',
  'description',
  'status',
  'assigneeId',
  'dueDate',
  'createdAt',
  'updatedAt',
] as const;
const data = defineDatabasePermission((p) =>
  p.collection<TaskRow>('tasks').title(label('title')).read(fields),
);
export const assignedTasks = defineRecordAccess('tasks.assigned', (access) =>
  access
    .title(label('assignedScope'))
    .collections('tasks')
    .resolver(({ principal }) =>
      principal.type === 'user'
        ? buildFilter((f) => f.string('assigneeId').eq(principal.id))
        : false,
    ),
);
export const taskPermissions = defineCompositeResource('tasks', (r) =>
  r
    .title(label('title'))
    .action('read', (a) =>
      a.title(label('readPermission')).grant('tasks', data),
    )
    .action('create', (a) =>
      a.title(label('createPermission')).grant('tasks', data.create(fields)),
    )
    .action('edit', (a) =>
      a
        .title(label('editPermission'))
        .grant(
          'tasks',
          data.update([
            'title',
            'description',
            'assigneeId',
            'dueDate',
            'updatedAt',
          ]),
        ),
    )
    .action('progress', (a) =>
      a
        .title(label('progressPermission'))
        .grant('tasks', data.update(['status', 'updatedAt'])),
    )
    .action('delete', (a) =>
      a.title(label('deletePermission')).grant('tasks', data.delete()),
    ),
);
export type TaskAction = 'read' | 'create' | 'edit' | 'progress' | 'delete';
```

</details>

第 2 步的 `TasksProvider` 在启动时把这些声明注册到授权服务。

**在服务中使用权限策略。** 路由的 `gate` 调用下面的方法，取得当前用户对这个操作的权限策略，没有权限就拒绝：

```ts
async policy(
  authz: AuthorizationContext,
  action: TaskAction,
): Promise<RepositoryPolicy> {
  const decision = await authz.authorize({
    resource: { type: 'composite', id: 'tasks' },
    action,
  });
  const policy = decision.conditions?.database?.tasks;
  if (decision.effect === 'deny' || !policy)
    throw taskError('PERMISSION_DENIED', 'TASK_ACTION_DENIED');
  return policy;
}
```

策略里包含数据范围。服务的每次查询和写入都带上它，例如读取详情：

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

这样，即使成员拿到别人任务的 ID 直接调用接口，也读不到、改不了。

**初始化三种角色。** 用 Seed 创建三个角色：

| 角色 | 可执行的操作 | 数据范围 |
| --- | --- | --- |
| Task manager（任务管理员） | 全部操作 | 全部任务 |
| Task member（任务成员） | 查看、更新进度 | 分配给自己的任务 |
| Task reader（任务只读用户） | 查看 | 全部任务 |

Seed 只在角色不存在时写入，不会在每次启动时覆盖管理员之后的调整，也不会把角色自动分配给任何用户：

<details>
<summary>展开角色初始化代码</summary>

```ts
const taskRoles = [
  {
    key: 'task-manager',
    title: 'managerRole',
    actions: ['read', 'create', 'edit', 'progress', 'delete'],
    scope: 'allRecords',
  },
  {
    key: 'task-member',
    title: 'memberRole',
    actions: ['read', 'progress'],
    scope: 'tasks.assigned',
  },
  {
    key: 'task-reader',
    title: 'readerRole',
    actions: ['read'],
    scope: 'allRecords',
  },
].map(({ key, title, actions, scope }) =>
  definePermissionSet(key)
    .title({ ns: metadata.name, key: `tasks.${title}` })
    .grant({
      resource: { type: 'page', id: 'tasks' },
      actions: [{ action: 'access' }],
    })
    .grant({
      resource: { type: 'composite', id: 'tasks' },
      actions: actions.map((action) => ({
        action,
        policy: { type: 'composite', scopes: { tasks: scope } },
      })),
    })
    .build(),
);
export default defineSeed({
  name: '202610250102_task_roles',
  transaction: true,
  async run({ query }) {
    for (const role of taskRoles) {
      const existing = await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', role.key)
        .executeTakeFirst();
      if (existing) continue;
      const now = new Date();
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: role.key,
          key: role.key,
          title: encodeAuthorizationTitle(role.title),
          grants: JSON.stringify(role.grants),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
```

</details>

完整文件见 [database/main/seeds/202610250102_task_roles.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/seeds/202610250102_task_roles.ts)。

**在权限编辑器中展示。** 把任务操作加入 [client/pages/settings/permission-workspace.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/settings/permission-workspace.ts) 的业务操作，管理员才能在“权限管理”中调整每个角色的操作和数据范围。新建的任务还不存在，新建操作不需要选择数据范围，用 `hiddenActionScopes` 隐藏：

```ts
business: [
  {
    type: 'composite',
    id: 'tasks',
    actions: ['read', 'create', 'edit', 'progress', 'delete'],
    hiddenActionScopes: { create: ['tasks'] },
  },
],
```

任务的子页面没有菜单标题，在 [client/pages/settings/page-permission-titles.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/settings/page-permission-titles.ts) 中为它们指定在权限编辑器里显示的名称：

```ts
export const pagePermissionTitles: PagePermissionTitles = {
  taskCreate: 'tasks.new',
  taskEdit: 'tasks.edit',
  taskDetail: 'tasks.detail',
  taskDetailEdit: 'tasks.edit',
};
```

![权限管理中的三种任务角色。](/assets/core/tutorials/team-tasks/roles.png)

### 5. 编写测试

测试放在 `tests/`，沿用模板已有的测试配置，在隔离的数据库上运行真实应用。本例新增了下面这些测试，完整代码见 [tests 目录](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/tests)：

```tree
tests/
├── database/
│   └── tasks-migration.test.ts   # 建表后的字段与索引，回退后表被删除
├── server/
│   └── tasks.test.ts             # 增删改查、输入校验、版本冲突、角色与数据范围、重复提交
├── client/
│   └── tasks.test.tsx            # 表单校验、只保存一次、失败保留输入、只读用户看不到修改入口
└── playwright/
    └── tasks.test.ts             # 在浏览器中完成任务操作、筛选分页和不同角色的使用流程
```

加入任务页面和系统设置后，模板自带的 `tests/client/client-routes.test.ts`、`tests/client/foundation-integration.test.ts` 和 `tests/server/app-server.test.ts` 中关于初始路由和服务的断言也要同步更新。

运行数据库、服务端和前端测试，不需要先启动应用：

```bash
pnpm test
```

提交前运行 `pnpm check`，它依次执行包检查、lint、格式检查、类型检查、测试和构建。

浏览器测试需要一个单独运行的测试应用。第一次运行先安装 Chromium：

```bash
pnpm exec playwright install chromium
```

`TUTORIAL_ORIGIN` 填测试应用的地址，不带 `/main`。管理员账号不是默认的 `nocobase` / `admin123` 时，再用 `TUTORIAL_USERNAME` 和 `TUTORIAL_PASSWORD` 指定：

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 pnpm exec playwright test tests/playwright/tasks.test.ts
```

测试会创建任务和 `taske2ealice` 等四个测试账号，结束后删除任务，账号会保留。不要对正在使用的应用运行。

## 试用应用

下面用实操时的数据走一遍。截图来自英文界面，操作中先写英文界面的名称，括号里是中文界面的名称；可以在应用的语言菜单中切换。

### 添加一个成员

进入 **System settings → Users → New user**（系统设置 → 用户 → 新建用户），添加测试成员 Alice：用户名填 `alice`，再填邮箱和初始密码。角色保留默认的 `Member`，再添加 `Task member`（任务成员）。

`Member` 是通用角色，不包含任务权限。检查成员能看到什么时，不要同时分配 `Task manager` 或 `System administrator`，它们会扩大能看到的任务和能做的操作。

### 创建并分配任务

打开 **Tasks → New task**（任务 → 新建任务），新建一条任务：

- 标题：`Prepare the project kickoff`
- 描述：`Draft the agenda and list the decisions to confirm.`
- 负责人：Alice
- 截止日期：选一个将来的日期
- 进度：**To do**（待处理）

保存后，任务出现在列表中。点击标题打开详情，检查负责人、日期和描述；再编辑描述，保存后重新打开，确认修改已生效。

![任务详情抽屉，显示进度、负责人、截止日期和描述。](/assets/core/tutorials/team-tasks/task-detail.png)

### 更新进度

在任务行末尾的操作菜单中选择 **Start**（开始），进度变为 **In progress**（进行中）。刷新浏览器，任务和进度都还在。搜索 `kickoff`，再筛选 **In progress**，能找到这条任务。

### 换成员登录

在管理员窗口再新建一条任务 `Review the project budget`，负责人保持 **Unassigned**（未分配）。然后在另一个浏览器或无痕窗口用 Alice 登录：

1. 任务列表里只有 `Prepare the project kickoff`，看不到 `Review the project budget`。
2. 在操作菜单中选择 **Mark as done**（标记完成），进度变为 **Done**（已完成）。Alice 能更新进度，但不能新建、编辑或删除任务。
3. 回到管理员窗口刷新，这条任务的进度已经是 **Done**。

想检查只读角色，再添加一个账号，保留 `Member`，只添加 `Task reader`（任务只读用户）。它能看到两条任务，但不能新建或修改。

**Done when**: 管理员能创建任务、分配负责人、更新进度，刷新后数据仍在；Alice 只看到分配给自己的任务，并能把它标记为完成；管理员刷新后能看到 Alice 的更新。

### 继续调整

遇到不符合预期的地方，把用的账号和角色、做了什么、看到了什么告诉 Agent，例如：

```prompt
我用只分配了任务成员角色的账号登录，仍能看到没有分配给自己的任务。
请检查数据范围权限，修复后补充相应测试，并告诉我怎样重新验证。
```

交互上的改进也可以直接描述，例如“点击标题后先看详情，再决定是否编辑”。每次调整后，重新走一遍受影响的操作。

页面上的检查不能代替服务端测试。让 Agent 确认直接调用接口时也会检查权限，测试覆盖了数据保存和输入校验。测试的组织和写法见[测试与验收](../developing-apps/testing-and-acceptance.md)。

## 示例源码

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

运行 `config init` 时选择 SQLite，与实操环境一致。`i18n.defaultLocale=en-US` 让界面默认显示英文，与截图对应，不需要时可以省略这一行。打开终端打印的完整 `Local:` 地址，用初始管理员登录。新安装的应用任务列表是空的，按[试用应用](#试用应用)添加成员和任务。配置文件、数据库和截图中的示例数据都不随源码分发。

</details>

## 遇到问题

| 现象 | 处理 |
| --- | --- |
| 浏览器打开后找不到页面 | 使用 `pnpm dev` 打印的完整 `Local:` 地址，包括端口和末尾的 `/main/`。默认端口被占用时会自动换一个 |
| 需要从局域网的其他设备访问 | 在 `.env.local` 中设置 `APP_SERVER_HOST=0.0.0.0` 和 `APP_SERVER_PORT`，再运行 `pnpm nocobase config set app.publicOrigin=http://<局域网 IP>:<端口>`，并确认与 `pnpm dev` 打印的实际端口一致 |
| 新建用户时提示 `Username is invalid` | 用户名只用字母和数字，例如 `alice`。当前版本中，含短横线的用户名会报错 |
| 成员登录后看不到任务菜单 | 确认添加了 `Task member`。`Member` 本身不包含任务权限 |
| 成员能看到没有分配给自己的任务 | 检查是否还分配了 `Task manager`、`Task reader` 或 `System administrator`，只保留 `Member` 和 `Task member` 再试 |
| 保存时提示任务已被其他人修改 | 另一个窗口或其他人先改了这条任务。重新加载最新的任务后再保存，草稿会保留 |
| 直接调用写接口返回 `400` | 新建、编辑、更新进度和删除都要带 `Idempotency-Key` 请求头。页面上的表单会自动带上 |
| 在 SQLite 上保存任务超时 | 在开启事务前取得权限策略；事务内用 `users.withConnection(transaction)` 让用户服务使用同一个连接，不要使用外层连接 |
| `.agents/skills/` 不存在 | 在应用目录运行 `pnpm nocobase skills sync` |

## 下一步

- [选择部署方式](../deployment/choose-a-deployment-method.md)：通过测试后，用 Docker 或 PM2 部署到服务器。部署后检查登录、任务操作和角色权限，并确认重启后数据仍在。
- [和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)：怎样描述需求、拆分任务和检查结果。
- [认证、权限与数据范围](../developing-apps/authentication-and-permissions.md)：深入了解页面授权、业务操作和数据范围。
- [测试与验收](../developing-apps/testing-and-acceptance.md)：测试夹具、隔离数据库与浏览器验证。
