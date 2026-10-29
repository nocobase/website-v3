---
title: 搭建第一个应用
description: 从一句业务需求出发，搭建一个能分工、安排日期和跟进进度的团队任务应用。
---

本教程搭建一个可以实际使用的团队任务应用：任务包含标题、描述、负责人、截止日期和进度，支持新建、查看、编辑、删除、搜索、筛选和分页。

![团队任务列表，包含负责人、截止日期、进度和分页。](/assets/core/tutorials/quickstart/task-list.png)

开始前，先按 [创建应用](../getting-started/create-app.md) 准备好项目。下面两种方式得到的是同一个结果，任选其一即可。

## 使用 Agent

在应用目录中打开 Agent，告诉它：

```text
帮我做一个团队任务管理应用，可以分配负责人、设置截止日期、跟进任务进度。做好后运行起来让我看看。
```

Agent 会根据项目的 `AGENTS.md` 和 Skills 完成建表、接口、页面、权限和验证。你负责检验业务结果：创建任务、安排负责人、修改进度，再刷新页面确认数据仍在。哪里用着不顺手，就直接描述出来，例如“点击标题后先看详情，再决定是否编辑”。

下面展示的是本次实操得到的结果。同一段需求可能产生不同的布局和代码，不需要把所有实现细节都写进提示词。

![在抽屉中查看任务详情。](/assets/core/tutorials/quickstart/task-detail.png)

## 不使用 Agent

这一部分展开 Agent 在背后做了什么：先建表，再实现后端和前端，然后接入权限，最后验证。每一步都给出关键代码；标为片段的代码需要放回对应的文件中，完整实现可以通过固定版本的 GitHub 链接查看。

### 1. 创建任务表

只需要新增一张业务表 `tasks`。用户、登录和角色复用内置能力，不另建用户表或权限系统。

| 字段 | 用途 |
| --- | --- |
| `id` | 任务 ID |
| `title` | 必填标题，去掉首尾空格后最多 120 个字符 |
| `description` | 任务描述，最多 2,000 个字符 |
| `status` | 进度：`todo`、`inProgress`、`done` |
| `assigneeId` | 已有用户的 ID，可为空 |
| `dueDate` | `YYYY-MM-DD` 格式的日历日期，可为空 |
| `createdAt`、`updatedAt` | 创建时间、更新时间 |

在 [database/main/migrations/202610250101_create_tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/migrations/202610250101_create_tasks.ts) 中声明字段和索引：

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

迁移只负责表结构，字段的业务校验放在后端完成。应用通过用户服务检查负责人是否有效，不直接读取或修改认证插件的内部表。执行迁移后，Collection 文件会自动生成：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections doctor
```

生成结果位于 `database/main/collections/tasks/`，不要手工修改这些文件。示例任务属于运行时数据，不要放进应用必需的初始化种子。

### 2. 实现后端

后端分为三部分：输入校验、业务服务和 HTTP 路由。请求通过认证和授权后，路由先校验输入，再把业务处理交给服务。

**输入校验。** [server/tasks/schemas.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/schemas.ts) 为新建、编辑和更新进度分别定义输入，避免编辑任务信息时意外覆盖进度：

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

**保存任务。** [server/tasks/service.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/service.ts) 使用带权限策略的 Repository。下面是 `TaskService.create` 的实际实现，其中 `validateOwner` 通过用户服务拒绝无效或已停用的负责人：

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

同一个服务还提供列表、详情、编辑、进度变更和删除。列表的筛选、排序和分页都在数据库中完成，并返回总数；编辑和删除时会检查 `expectedUpdatedAt`，如果数据已被他人修改，则返回 `409`，避免覆盖别人的改动。

**注册接口。** [server/routes/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/routes/tasks.ts) 在任务子路由上安装认证和授权中间件。`gate` 按操作取得权限策略，之后才进行参数校验。新建接口的片段如下：

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
  apiValidator('json', createTask),
  async (c) => {
    const row = await service.create(c.get('taskPolicy'), c.req.valid('json'));
    return c.json(
      { data: (await service.present([row], c.get('authz')))[0] },
      201,
    );
  },
);
```

`describeRoute` 同时声明接口文档；`apiValidator` 校验请求。成功时返回 `{ data }`，失败时使用标准的 `ApiError`。任务路由和服务需要分别接入应用已有的注册入口：

`server/routes/index.ts`

```ts
import { taskRoutes } from './tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [taskRoutes];

export default routes;
```

`server/providers/index.ts`

```ts
import TasksProvider from './tasks.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  TasksProvider,
];

export default serviceProviders;
```

完整的服务注册见 [server/providers/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/providers/tasks.ts)。登录后，可以在应用的 `/api/swagger` 中查看 Tasks 接口的声明。

### 3. 实现前端

前端新增任务列表、详情抽屉和新建／编辑弹窗，继续使用模板提供的布局、表格、表单和反馈组件。

**页面与侧边栏。** 在 [client/routes.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/routes.ts) 中注册路由，`navigation` 会生成侧边栏入口。详情和弹窗也各有 URL，打开、刷新或关闭它们时都能保留列表的查询条件：

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

**列表。** [client/pages/tasks/index.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/index.tsx) 把搜索词、状态、排序和页码保存在 URL 中，用 `useApiClient` 请求接口，再把结果交给 `DataTable`。关键配置如下：

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

完整文件中，`onPaginationChange` 和 `onSortingChange` 会更新 URL 并触发新的查询。列表还区分了四种状态：初次为空、筛选后无结果、加载中和加载失败；任务标题通过 `RecordLink` 打开详情。

**表单与保存。** [client/pages/tasks/form.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/form.tsx) 在打开编辑弹窗时重新读取任务。下面是保存请求的片段：新建时带上初始进度，编辑时只提交任务信息和版本：

```ts
const values = {
  title: fields.title.trim(),
  description: fields.description.trim(),
  assigneeId: fields.assignee?.id ?? null,
  dueDate: fields.dueDate,
  ...(creating ? { status: fields.status } : { expectedUpdatedAt: version }),
};
const { data } = await api.request<{ data: Task }>({
  path: creating ? 'tasks' : `tasks/${taskId}`,
  method: creating ? 'POST' : 'PATCH',
  json: values,
});
```

表单在提交时校验，错误信息显示在对应字段旁；保存失败时保留输入，保存过程中禁止重复提交和关闭弹窗。保存成功后，先用返回的任务更新界面，再刷新列表；如果只是刷新列表失败，单独提示“已保存”，不要求用户重新提交。

![新建任务弹窗，填写描述、负责人和截止日期。](/assets/core/tutorials/quickstart/task-create.png)

负责人选择器见 [client/pages/tasks/assignee-picker.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/assignee-picker.tsx)，日期选择使用 `Calendar` 和 `Popover`，详情见 [client/pages/tasks/detail.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/detail.tsx)。编辑、更新进度和删除操作集中在 [client/pages/tasks/task-actions.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/task-actions.tsx) 中；删除前会提示任务名称，并说明删除不可撤销。

**中英文文案。** 文案集中在 [client/locales/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/locales/tasks.ts)，再分别并入两种语言资源。组件中只引用翻译键：

```ts
// client/locales/en-US.ts
import { tasksEn } from './tasks.js';
const enUS = { ...systemEnUS, tasks: tasksEn };

// client/locales/zh-CN.ts
import { tasksZh } from './tasks.js';
const zhCN: AppResource = { ...systemZhCN, tasks: tasksZh };
```

### 4. 接入权限

页面入口和数据操作需要分别授权。隐藏按钮只是界面上的处理，后端仍然必须检查每一次请求及其数据范围。

[server/tasks/permissions.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/permissions.ts) 声明了五种操作，以及“分配给我的任务”这一数据范围：

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

路由通过下面的服务方法取得权限策略，所有读写都使用 `withPolicy(policy)`：

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

接着用一次性种子初始化三个角色，这些角色之后可以在管理后台编辑。种子只提供初始配置，不会在每次启动时覆盖管理员的调整：

| 角色 | 初始权限 |
| --- | --- |
| Task manager | 对全部任务进行查看、新建、编辑、进度变更和删除 |
| Task member | 查看和更新分配给自己的任务进度 |
| Task reader | 查看全部任务，不能修改 |

<details>
<summary>展开角色初始化关键代码</summary>

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
// Inside the transactional seed run callback:
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
```

</details>

完整种子见 [database/main/seeds/202610250102_task_roles.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/seeds/202610250102_task_roles.ts)。然后在 `client/routes.ts` 中注册模板准备好的系统设置页面，并把任务操作加入权限编辑器：

```ts
// client/routes.ts
import systemSettingsRoutes from './pages/settings/routes.js';
const routes = [appRoutes, systemSettingsRoutes];

// client/pages/settings/permission-workspace.ts: business entry
{
  type: 'composite',
  id: 'tasks',
  actions: ['read', 'create', 'edit', 'progress', 'delete'],
  hiddenActionScopes: { create: ['tasks'] },
}
```

进入“系统设置 → 用户”，把角色分配给明确的用户。不要把业务角色授予所有已登录用户，也不要扩大平台默认 `member` 角色的权限。需要调整操作或数据范围时，在“权限管理”中编辑对应角色。

![系统设置中的任务角色。](/assets/core/tutorials/quickstart/roles.png)

### 5. 编写测试

功能实现后，在 `tests/` 中补充对应的自动化测试。沿用项目已有的测试配置和工具，使用真实应用和测试数据库验证业务行为。本例实现了以下测试，完整代码见 [tests 目录](https://github.com/nocobase/app-tutorials/tree/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests)：

```bash
tests/
├── database/
│   └── tasks-migration.test.ts                  # 建表、回退与重新应用
├── server/
│   ├── tasks.test.ts                            # 增删改查、校验、筛选分页与权限
│   └── authorization-assignment-safety.test.ts  # 防止自动向所有用户授予业务角色
├── client/
│   ├── tasks.test.tsx                           # 表单校验、保存反馈与只读限制
│   ├── client-routes.test.ts                    # 页面路由与访问权限注册
│   └── page-permission-titles.test.ts           # 权限名称的中英文文案
└── playwright/
    └── tasks.test.ts                            # 任务操作、筛选分页与不同角色的使用流程
```

写好测试后，在应用目录运行数据库、服务端和前端测试，不需要先启动应用：

```bash
pnpm test
```

浏览器测试使用 `pnpm test:e2e` 运行。它需要一个事先启动的独立测试应用，并指定该应用的地址和账号。

首次运行前，先安装 Chromium：

```bash
pnpm exec playwright install chromium
```

然后替换下面的应用地址和测试管理员账号。测试会创建用户和任务，请务必使用独立的测试应用：

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

### 6. 下载并运行完整示例

读完上面的实现拆解后，可以下载成品，对照完整代码。示例仓库目前为私有，需要相应的 GitHub 访问权限；请在新目录中获取，以免覆盖自己的项目。

```bash
git clone --branch fix/v3-quickstart-npm https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git checkout da050f4dd4d9ddc36c8585489bd002c6e01ad76f
```

示例基于默认模板 `1.0.0-beta.81`，使用 npmjs.org 上已发布的包。准备好 Node.js 24 和 pnpm 11.7 后直接安装依赖即可：仓库中的 `.npmrc` 已配置 npmjs.org，锁文件固定了本次验证所用的版本。

```bash
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

打开终端输出的 `Local:` 应用入口。首次登录使用应用配置中的初始管理员；在用户管理中添加团队成员、分配任务角色后，就可以创建自己的任务了。配置、数据库以及截图中的示例数据都不随源码仓库分发。

## 部署应用

应用搭建完成并通过测试后，就可以独立部署到生产环境。请阅读 [选择部署方式](../deployment/choose-a-deployment-method.md)，根据服务器的运维方式选择 Docker 或 PM2（app-installer）；每种方式都提供使用 Agent 和不使用 Agent 的操作步骤。

部署后，检查登录、任务操作和角色权限，并确认应用重启后数据仍然保留。
