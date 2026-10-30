---
title: 团队任务应用的实现
description: 逐步展开团队任务应用的建表、后端、前端、权限和测试代码，用来读懂 Agent 的改动，或者不使用 Agent 时自己实现。
---

本篇展开[搭建第一个应用](build-your-first-app-2.md)中团队任务应用的实现：按建表、后端、前端、权限、测试的顺序，说明每一步改了哪里、为什么这样写。可以用它读懂 Agent 的改动，也可以在不使用 Agent 时参考它自己实现。

每一步给出关键代码，标为片段的代码需要放回对应文件；完整实现见[示例源码](#示例源码)。代码基于默认模板 `1.0.0-beta.84`，你的应用以创建时安装的版本和项目自带的指引为准。

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

## 1. 创建任务表

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

## 2. 实现后端

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

## 3. 实现前端

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

## 4. 接入权限

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

## 5. 编写测试

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

## 实现中的常见问题

| 现象 | 处理 |
| --- | --- |
| 直接调用写接口返回 `400` | 新建、编辑、更新进度和删除都要带 `Idempotency-Key` 请求头。页面上的表单会自动带上 |
| 在 SQLite 上保存任务超时 | 在开启事务前取得权限策略；事务内用 `users.withConnection(transaction)` 让用户服务使用同一个连接，不要使用外层连接 |

## 示例源码

完整代码在 [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks)，对应提交 `0185e4bfa9d7ef05dd180245005a6c1024fe41de`，基于默认模板 `1.0.0-beta.84`，在 SQLite 上验证。运行步骤、文件对照和测试命令见应用目录的 [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD)。
