---
title: 使用 AI Agent 搭建第一个应用
description: 用 AI Agent 开发团队任务应用，逐项理解界面与代码的改动，并通过项目约束、代码检查和真实测试保障实现质量。
---

本文搭建一个团队任务应用，支持创建任务、分配负责人、安排截止日期和跟进进度，并按角色控制任务的查看与操作范围。

![Tasks 页面：搜索与状态筛选位于表格上方，任务操作位于每行右侧，分页位于底部。](/assets/core/tutorials/quickstart/task-list.png)

开始前，按[创建应用](../getting-started/create-app.md)准备一个可以启动和登录的 NocoBase 3 开发项目。先使用提示词完成开发，再了解界面与代码的实现，并逐项验证数据、权限和交互行为。

## 使用 AI Agent

在应用根目录开启 Coding Agent 会话，将下面的提示词发给它。项目的 `AGENTS.md` 和 `.agents/skills/` 提供与当前版本配套的开发指引；如果指引缺失，先参阅[和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)。

```text
请按当前项目的 AGENTS.md 和相关 Skills，开发一个团队任务管理应用。
任务包含标题、描述、负责人、截止日期，以及待处理、进行中、已完成三种进度。
标题去掉首尾空格后必填且最多 120 字符，描述最多 2,000 字符；负责人和截止日期可以不填。
支持列表、详情、新建、编辑、删除、搜索、状态筛选、排序和分页，界面支持中英文。

任务管理员管理全部任务；成员只能查看和更新分配给自己的任务进度；只读用户可查看全部任务。
提供用户与角色管理入口，将业务角色分配给明确的测试用户。
保留已有功能和数据。保存失败时保留输入，两人修改同一任务时不能静默覆盖。

完成相关测试并启动应用，告诉我访问地址、测试角色的使用方式、主要改动和验证结果。
没有验证的部分请明确说明。
```

打开 Agent 提供的实际应用地址，创建一条任务，指定负责人和日期，再修改进度并刷新。完成后，对照下面的实现说明检查界面、代码和验证结果。

## 原理与实现

下面按界面变化对应代码改动，每一部分都说明实现和验证方法。项目指引帮助 Agent 选择当前版本的接口；服务端校验、权限策略和测试负责检查最终行为。

> [!NOTE]
> 本文代码与截图基于默认模板 `1.0.0-beta.81`，完整实现见[示例源码](#示例源码)。其他版本的应用以项目自身的指引和公开接口为准；页面布局和文件组织可以不同，业务规则与验证要求保持一致。

### 1. 应用结构与改动范围

默认模板提供应用外壳、登录能力和基础服务。任务功能主要增加业务页面、表结构、接口和权限声明，并接入模板准备好的管理页面。

| 位置 | 实现内容 | 用户可以做什么 |
| --- | --- | --- |
| 侧边栏 | 在 `client/routes.ts` 声明 Tasks 导航 | 从原有应用进入任务列表 |
| 任务列表 | 新增 `client/pages/tasks/index.tsx` | 搜索、筛选、排序、翻页，查看负责人和进度 |
| 详情与表单 | 新增 `detail.tsx`、`form.tsx` 和相关组件 | 查看任务详情，新建或编辑任务 |
| 系统设置 | 注册已有的用户与权限管理路由，扩展任务权限配置 | 添加成员、分配角色、调整任务操作范围 |
| 服务端与数据库 | 新增任务迁移、业务服务、路由和权限声明 | 将页面操作保存为有权限约束的持久数据 |

这些改动落在当前应用的源码中。示例沿用已有布局、登录页面和用户体系，新增业务功能无需另做一套应用外壳或认证系统。

**如何验证。** 对照上表检查改动文件与注册入口。已有路由和服务贡献应保留，新增页面、接口应能被实际访问。用 `git status --short` 查看新增文件、`git diff` 查看已有文件的变化；项目规则的维护方法见[和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)。

### 2. 任务列表与导航

界面增加 Tasks 菜单。进入后，上方是新建和刷新按钮，下面是标题搜索框、状态筛选和任务表格。表格显示标题、状态、负责人、截止日期和更新时间，底部提供分页。

**路由改动。** 在 `client/routes.ts` 的 `defineAppRoutes()` 中增加任务路由。下面是入口片段，子路由另行声明：

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
}
```

`navigation` 让应用生成侧边栏菜单，`componentLoader` 加载页面，`authz` 对应任务页的访问权限。因此增加一个业务入口主要修改路由声明，无需改写侧边栏组件。`/tasks` 是应用内路径，实际地址可能包含 `/main/` 等部署基础路径，由运行时处理。

**列表改动。** `client/pages/tasks/index.tsx` 使用现有的 `PageContainer`、`PageHeader` 和 `DataTable` 组织界面，通过 `useApiClient` 调用任务接口。表格采用服务端分页和排序，下面是其中的配置片段：

<details>
<summary>展开列表分页与排序配置</summary>

```tsx
<DataTable
  columns={columns}
  data={result.data}
  getRowId={(row) => row.id}
  manualPagination
  rowCount={result.meta.total}
  paginationState={pagination}
  manualSorting
  sortingState={sorting}
  loading={loading}
/>
```

</details>

完整文件还通过分页和排序回调更新 URL，再发起查询。搜索词、状态、页码和排序保存在 URL 中，打开详情再返回时可以恢复。数据库查询同时计算总数，并用任务 ID 作为额外排序条件，让相同日期的任务也有确定顺序。

列表区分“还没有任务”和“筛选没有结果”，分别提供合适的操作提示。连续改变筛选时，通过取消请求和检查请求序号，避免旧请求覆盖新结果。

实现见[页面路由](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/routes.ts)与[任务列表](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/index.tsx)。

**如何验证。** 搜索并翻页后打开详情，再返回或刷新，确认条件保留；快速切换筛选，最后显示的结果必须对应当前条件。分别检查空列表和无搜索结果，并在窄屏及中英文界面中操作。

### 3. 详情与编辑交互

点击任务标题，右侧抽屉展示状态、负责人、截止日期、更新时间和描述。列表仍保留在背景中。新建和编辑使用弹窗，其中负责人是可搜索的用户选择器，截止日期使用日历。

![任务详情抽屉，底部提供编辑、任务操作和返回列表入口。](/assets/core/tutorials/quickstart/task-detail.png)

**页面拆分。** `detail.tsx` 使用 `RouteDrawer` 展示详情；`form.tsx` 使用 `RouteDialog`，由新建和编辑共用；`assignee-picker.tsx` 负责选择用户；`task-actions.tsx` 集中处理编辑、进度和删除操作。

这些界面有各自的应用内路径：

| 路径 | 界面 |
| --- | --- |
| `/tasks` | 任务列表 |
| `/tasks/new` | 列表上的新建弹窗 |
| `/tasks/:taskId` | 任务详情抽屉 |
| `/tasks/edit/:taskId` | 从列表打开的编辑弹窗 |
| `/tasks/:taskId/edit` | 从详情打开的编辑弹窗 |

路径和界面对应后，刷新、浏览器后退和直接打开链接都有明确含义。列表页渲染子路由，详情页也为编辑弹窗保留子路由出口。

**表单改动。** 打开编辑弹窗时，`form.tsx` 重新获取该任务，保存字段值以及当前的 `updatedAt`。提交时，新建请求包含初始状态；编辑请求只包含任务信息和读取时的版本：

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

把进度更新留给独立操作，可以避免“修改标题”同时覆盖别人刚更新的状态，也能让任务成员只拥有更新进度的权限。

![任务表单：标题、描述、负责人和截止日期使用已有输入组件，新建时还可以选择初始状态。](/assets/core/tutorials/quickstart/task-create.png)

**交互保障。** 示例用提交锁阻止同一表单重复发出保存请求，保存中禁用按钮并阻止关闭；失败后保留草稿，将错误关联到字段。放弃未保存内容时要求确认。删除前读取当前任务并显示名称，用户确认后才发送删除请求。

保存成功时，页面先用服务端返回的任务更新列表，再重新查询。查询失败会单独提示已保存，保留确认过的结果。这避免用户把“刷新失败”误认为“创建失败”而再次提交。

中英文文案放在 `client/locales/tasks.ts`，分别合入 `en-US.ts` 和 `zh-CN.ts`。按钮、字段错误和权限名称都需要翻译，不能只翻译页面标题。

实现见[表单](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/form.tsx)、[详情](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/detail.tsx)和[任务操作](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/task-actions.tsx)。

**如何验证。** 在测试环境让保存请求在写入前失败，确认草稿保留、错误可见；恢复请求后重试，再查询服务端，确认只有一条新任务。另一次检查让保存成功、只让后续列表查询失败，确认界面仍显示已保存的结果。延迟保存响应并连续点击，检查当前表单只发出一次写入请求。

<details>
<summary>查看保存失败与重试的测试断言</summary>

示例通过 `beforeRequest` 在传输边界制造失败，保留真实应用、认证和数据库。下面是[组件测试](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests/client/tasks.test.tsx)中的关键断言，测试先填写标题并触发保存失败，再恢复请求后重试：

```ts
expect(title).toHaveValue('Write the project brief');
// 恢复请求并点击 Create 重试后：
const response = await view.session.fetch('/tasks');
expect(await response.json()).toMatchObject({ meta: { total: 1 } });
```

检查同时覆盖输入和持久化结果；只断言保存函数被调用，无法证明数据正确。

</details>

### 4. 数据表与 HTTP 接口

新增迁移 `database/main/migrations/202610250101_create_tasks.ts`，创建 `tasks` 表：

| 字段 | 存储内容 | 业务约束 |
| --- | --- | --- |
| `id` | 任务标识 | 服务端生成 |
| `title`、`description` | 标题与描述 | 标题去除首尾空格后必填，最多 120 字符；描述最多 2,000 字符 |
| `status` | 进度 | `todo`、`inProgress`、`done` |
| `assigneeId` | 已有用户 ID | 可以为空；指定时由用户服务检查有效性 |
| `dueDate` | 截止日期 | 可为空的 `YYYY-MM-DD` 日历日期 |
| `createdAt`、`updatedAt` | 创建、更新时间 | 服务端生成；更新时间也作为修改版本 |

迁移声明字段、默认值和查询索引，Collection 文件由工具生成。添加迁移后，在应用目录预览并执行变更：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections doctor
```

表结构变化通过迁移管理，保留已有表和数据；生成的 Collection 由工具维护。后续已发布结构的调整继续增加迁移，避免重写已执行的历史。演示任务由测试或实际使用创建，不写入必需的初始化种子。

**服务端改动。** 新增 `server/tasks/schemas.ts`、`service.ts` 和 `server/routes/tasks.ts`，分别处理输入定义、业务逻辑和 HTTP 请求。任务接口包括：

| 接口（相对于应用 API 基础路径） | 用途 |
| --- | --- |
| `GET /tasks` | 按可见范围搜索、筛选、排序和分页 |
| `POST /tasks` | 新建任务 |
| `GET /tasks/:id` | 读取详情 |
| `PATCH /tasks/:id` | 修改标题、描述、负责人和日期 |
| `PATCH /tasks/:id/status` | 更新进度 |
| `DELETE /tasks/:id` | 删除任务，查询参数携带版本 |
| `GET /tasks/assignees` | 查询可选的有效用户 |

此外，编辑、进度和删除分别有读取当前记录的接口，例如 `GET /tasks/:id/edit`；这些读取也按对应操作授权。

路由在自己的任务子路由内安装认证和授权中间件，使用 `apiValidator()` 校验请求，并通过 `describeRoute()` 声明接口文档。服务端生成 ID 和时间、检查负责人，再使用 Repository 写入数据库；前端通过返回的 `{ data }` 显示真实保存结果。

**注册改动。** `server/providers/tasks.ts` 通过应用容器获取数据库和用户服务，注册 `TaskService` 及任务权限声明；把它加入 `server/providers/index.ts`。任务路由加入 `server/routes/index.ts`。如果 AI 只创建了类或路由文件、没有接入这些入口，功能不会随应用加载。

实现见[迁移](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/migrations/202610250101_create_tasks.ts)、[服务 Provider](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/providers/tasks.ts)和[HTTP 路由](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/routes/tasks.ts)。

**如何验证。** 在隔离数据库中运行迁移的建表、回退和重新应用测试。通过真实接口创建任务，再读取并比较字段；刷新或重启应用后记录仍应存在。检查新增接口出现在应用的 API 文档中，确认 Provider 和路由已注册。

### 5. 角色与数据权限

任务功能需要有人管理成员和授权，因此示例在 `client/routes.ts` 注册模板已有的 `systemSettingsRoutes`。系统设置中出现 Users 和 Permission management 入口，并能管理任务角色。

![权限管理页面中的 Task manager、Task member 和 Task reader 三种任务角色。](/assets/core/tutorials/quickstart/roles.png)

`server/tasks/permissions.ts` 声明 `read`、`create`、`edit`、`progress`、`delete` 五个业务操作，以及“分配给我”的记录范围。`client/pages/settings/permission-workspace.ts` 把这些操作加入权限编辑界面；角色种子 `database/main/seeds/202610250102_task_roles.ts` 提供初始授权：

| 角色 | 可执行操作 | 可操作任务 |
| --- | --- | --- |
| Task manager | 查看、新建、编辑、变更进度、删除 | 全部任务 |
| Task member | 查看、变更进度 | 分配给自己的任务 |
| Task reader | 查看 | 全部任务 |

角色创建后，由管理员在用户管理中分配给具体用户。初始化代码保留已有角色，不在每次启动时覆盖管理员的调整，也不自动给所有登录用户授予任务权限。

**权限如何影响数据。** `TaskService.policy()` 根据当前用户与操作取得数据库策略；缺少策略时拒绝请求。列表、总数、详情和写入都带上该策略。例如读取任务的关键调用是：

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

成员即使拿到别人的任务 ID，也只能在获准的记录范围内查询。前端隐藏不可用按钮改善体验，服务端仍独立检查每次请求。验证时要使用普通账号，并检查是否叠加了其他角色授权；只用管理员操作无法证明这些边界。

实现见[权限声明](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/permissions.ts)和[角色初始化](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/seeds/202610250102_task_roles.ts)。

**如何验证。** 使用没有额外授权的普通测试账号：无业务授权时请求任务接口返回 `403`；成员请求他人的任务详情或进度接口返回 `404`；只读账号直接提交写入返回 `403`。失败后再次查询，确认数据没有变化。运行授权初始化测试，确认没有向所有登录用户授予任务角色。

### 6. 输入校验与并发更新

页面能正常操作，还需要检查接口收到异常输入时会发生什么。`schemas.ts` 在服务端校验长度、状态、有效日期和查询范围。例如 `2026-02-30` 虽然满足日期字符串格式，仍会被拒绝。

编辑信息与更新进度使用不同的严格输入对象，禁止夹带其他操作的字段：

```ts
export const editTask = taskDetails.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const progressTask = z.strictObject({
  status: taskStatus,
  expectedUpdatedAt: z.iso.datetime(),
});
```

`taskDetails` 只有标题、描述、负责人和截止日期。前端表单校验负责及时提示，服务端校验负责阻止绕过页面的请求。

**旧版本如何被拒绝。** 编辑、进度和删除请求带上读取时的 `expectedUpdatedAt`。`TaskService.change()` 在事务中读取有权限的记录，比较版本，再让实际写入同时匹配 ID 和版本：

<details>
<summary>展开带版本条件的更新代码</summary>

```ts
const filter = buildFilter((f) =>
  f.and([
    f.string('id').eq(id),
    f.date('updatedAt').notBefore(row.updatedAt),
    f.date('updatedAt').notAfter(row.updatedAt),
  ]),
);
const result = await repository.updateOne({
  filter,
  values: {
    ...values,
    updatedAt: new Date(Math.max(Date.now(), row.updatedAt.valueOf() + 1)),
  },
});
```

</details>

这是事务内部的片段，`repository` 已附加权限策略，`row` 已通过版本比较。实际写入仍带版本条件，可以发现读取之后发生的修改；更新时间至少推进一毫秒，避免本次修改仍沿用旧版本。版本不匹配或条件写入找不到记录时，示例转换为 `409`，页面要求重新加载后继续编辑。

这项机制保护多人修改；表单提交锁保护当前页面的重复点击。它们的范围不同。如果以后增加自动重试或多客户端重复创建，还需要设计服务端幂等机制。数据库锁等待、真正同时发生的写入，也需要在目标数据库单独验证。

完整实现见[输入校验](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/schemas.ts)和[任务服务](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/service.ts)。

**如何验证。** 绕过表单，直接提交空白标题和 `2026-02-30`，应收到校验错误且没有写入记录。两个窗口读取同一任务，A 保存后 B 用旧版本提交，B 应收到 `409`，再次读取仍保留 A 的结果。重新加载前应确认是否放弃 B 的草稿。服务端测试使用真实认证、权限和数据库，不把正在验证的判断替换成固定成功结果。

## 检查与交付

### 运行相关检查

上面的验证点应转化为相应的数据库、接口、组件和浏览器测试。按业务要求断言结果；不要通过放宽权限、删除断言或跳过失败用例来消除错误。下面命令使用本文固定示例的测试文件；其他项目按自己的配置执行，并确认报告实际运行了预期用例。

```bash
pnpm exec vitest run tests/database/tasks-migration.test.ts tests/server/tasks.test.ts tests/server/authorization-assignment-safety.test.ts tests/client/tasks.test.tsx
```

路由注册和权限名称还分别由 `tests/client/client-routes.test.ts` 与 `tests/client/page-permission-titles.test.ts` 检查。按项目要求运行受影响代码的 lint、格式和类型检查。本例涉及前后端与数据库，交付前还需要应用构建检查：

```bash
pnpm typecheck
pnpm build
```

类型检查发现接口参数和返回值不匹配等问题，构建检查模块与产物集成；权限和持久化是否正确，仍由前面的真实行为测试验证。完整测试组织方式见[测试与验收](../developing-apps/testing-and-acceptance.md)。

### 完成浏览器验收

在独立测试应用中，按各节的“如何验证”检查实际操作。再走一遍创建、分配负责人、更新进度、刷新读取和删除，检查弹窗焦点、关闭确认和浏览器后退。自动化用例见[示例的 Playwright 测试](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests/playwright/tasks.test.ts)。

<details>
<summary>展开浏览器测试命令</summary>

首次运行安装浏览器：

```bash
pnpm exec playwright install chromium
```

启动独立测试应用，替换实际地址和测试账号后执行。测试会创建用户和任务；这些环境变量属于固定示例，新项目应读取自己的测试配置。

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

</details>

### 留下可核对的交付结果

让 Agent 说明界面变化、修改文件、关键实现和验证结果，并附上实际执行的命令及测试范围。对未运行的浏览器检查、未验证的数据库方言和并发场景，单独标明。

本文展示了示例实现及验证方法，不代表这些检查已在你的应用中执行。通过本地验收后，再按[选择部署方式](../deployment/choose-a-deployment-method.md)准备部署。

## 示例源码

完整代码位于 [nocobase/app-tutorials](https://github.com/nocobase/app-tutorials/tree/da050f4dd4d9ddc36c8585489bd002c6e01ad76f)，对应提交 `da050f4dd4d9ddc36c8585489bd002c6e01ad76f`。仓库需要相应的 GitHub 访问权限。正文中的代码片段用于说明关键实现，完整文件包含导入、注册和错误处理。

<details>
<summary>获取并运行完整应用</summary>

准备 Node.js 24 和 pnpm 11.7，在新目录获取代码，避免覆盖正在开发的项目：

```bash
git clone --branch fix/v3-quickstart-npm https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git checkout da050f4dd4d9ddc36c8585489bd002c6e01ad76f
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

示例使用 npmjs.org 已发布的依赖，锁文件固定对应版本。打开终端输出的完整 `Local:` 地址，使用应用配置中的初始管理员登录，在用户管理中添加测试成员并分配任务角色。运行配置、数据库及截图中的示例数据不随源码分发。

</details>

## 相关文档

- [和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)：维护项目规则、描述需求和检查交付。
- [测试与验收](../developing-apps/testing-and-acceptance.md)：测试夹具、隔离数据库与浏览器验证。
- [选择部署方式](../deployment/choose-a-deployment-method.md)：通过验收后准备部署。
