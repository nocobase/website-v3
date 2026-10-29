---
title: 搭建第一个应用（Agent 优先）
description: 用 AI Agent 搭建团队任务应用，创建任务、安排负责人和日期，并体验不同成员的操作权限。
---

这次搭建一个可以实际使用的团队任务应用：创建任务、分配负责人、设置截止日期，再跟进任务进度。应用还支持搜索、筛选和分页，并让管理员、成员和只读用户拥有不同的操作权限。

![团队任务列表，包含负责人、截止日期、进度和分页。](/assets/core/tutorials/team-tasks/task-list.png)

本教程通过 AI Agent 完成开发。先把应用运行起来，亲手完成一轮任务协作；想了解背后的代码，可以继续阅读后面的实现解析。

## 1. 准备项目

先按[创建应用](../getting-started/create-app.md)准备一个可以启动和登录的 NocoBase 3 开发项目。在应用根目录开启 Coding Agent 会话，确保它能够读取项目的 `AGENTS.md` 和 `.agents/skills/`。这些文件提供与当前项目版本配套的开发指引；如果缺失，先参阅[和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)。

本文实操使用 Node.js 24、pnpm 11.7 和默认模板 `1.0.0-beta.84`，数据库选择 SQLite。新项目应以创建时安装的版本及其项目指引为准。

打开 `pnpm dev` 输出的完整 `Local:` 地址，保留末尾的 `/main/` 等基础路径。如果需要在局域网访问，让 Agent 配置监听地址和端口，并把 `app.publicOrigin` 设为实际访问的来源地址。开发端口可能自动避让，不能只按配置值猜地址。

## 2. 让 Agent 搭建应用

把下面的需求发给 Agent：

```text
帮我做一个团队任务管理应用，任务有标题、描述、负责人、截止日期和待处理、进行中、已完成三种进度。
支持新建、查看详情、编辑、删除、搜索、状态筛选和分页，界面支持中英文。
管理员可以管理全部任务；成员只能查看和更新分配给自己的任务进度；只读用户只能查看全部任务。
提供用户和角色管理入口，方便我添加测试成员并分配角色。
请按项目的 AGENTS.md 和 Skills 完成开发和相关测试，保留已有功能和数据。
做好后运行起来，告诉我访问地址、测试账号和角色的准备方式，以及检查结果和未验证的部分。
```

Agent 会根据项目指引完成页面、数据表、接口和权限的改动。涉及数据库或启动配置时，按项目的实际情况补充信息。完成后，打开 Agent 提供的应用地址，使用项目配置的初始管理员登录。

同一段需求可能产生不同的页面布局和文件组织。下面用这次实操完成的示例说明如何体验；截图来自英文界面，示例数据也使用英文，方便对照。可以在应用的语言菜单切换语言，按钮名称和位置以你的应用为准。

## 3. 体验任务协作

### 准备一个成员

进入 **System settings → Users → New user**，添加测试成员 Alice，填写用户名 `alice`、邮箱和初始密码。在 **Permission sets** 中保留默认的 `Member`，再添加 `Task member`。记下登录方式，稍后在另一个浏览器或无痕窗口中使用。

`Member` 是通用角色，本示例不会给它自动添加任务权限。检查成员权限时，不要同时分配 `Task manager` 或 `System administrator`，否则这些角色会扩大可访问的数据和操作。三种任务角色分别是 `Task manager`、`Task member` 和 `Task reader`。

### 创建并分配任务

打开 **Tasks → New task**，新建一条任务：

- 标题：`Prepare the project kickoff`（准备项目启动会）。
- 描述：`Draft the agenda and list the decisions to confirm.`
- 负责人：Alice。
- 截止日期：选择一个未来日期。
- 进度：`To do`（待处理）。

保存后，确认任务出现在列表中。点击标题查看详情，检查负责人、日期和描述是否正确；再编辑描述，保存后重新打开，确认修改生效。

![任务表单，填写标题、描述、负责人和截止日期。](/assets/core/tutorials/team-tasks/task-create.png)

### 更新进度并确认保存

在任务行末尾的操作菜单中选择 **Start**，进度变为 **In progress**（进行中）。刷新浏览器，确认任务和新进度仍然存在。搜索标题中的 `kickoff`，再筛选 **In progress**，确认能找到刚才的任务。

![任务详情抽屉，展示状态、负责人、截止日期和描述。](/assets/core/tutorials/team-tasks/task-detail.png)

### 切换成员检查权限

保持管理员窗口打开，再新建一条 `Review the project budget`，负责人保持 **Unassigned**。在另一个浏览器或无痕窗口登录测试成员：

1. 打开任务列表，应能看到 `Prepare the project kickoff`，看不到 `Review the project budget`。
2. 在自己的任务操作菜单中选择 **Mark as done**，进度变为 **Done**（已完成）。成员应能更新进度，但不能编辑任务信息或删除任务。
3. 回到管理员窗口并刷新，确认进度变成“已完成”。

如果还要体验只读角色，另建一个普通测试账号，保留默认 `Member`，再添加 `Task reader`，不要叠加其他任务角色。它应能查看两条任务，但不能新建或修改。

![权限管理中的三种任务角色。](/assets/core/tutorials/team-tasks/roles.png)

### 根据体验继续调整

遇到不符合预期的行为，把使用的角色、操作和实际结果告诉 Agent，例如：

```text
我用只分配了任务成员角色的账号登录，仍能看到没有分配给自己的任务。
请检查数据范围权限，修复后补充相应测试，并告诉我怎样重新验证。
```

也可以提出交互改进，例如“点击标题后先看详情，再决定是否编辑”。每次调整后，重新走一遍受影响的操作。

## 4. 确认完成并继续开发

**Done when**: 你能创建任务、分配负责人、更新进度，刷新后数据仍在；成员只看到分配给自己的任务，并能更新进度；管理员可以看到成员的更新。

请 Agent 汇总实际修改的文件、运行过的测试及其结果，单独说明未验证的部分。页面上的体验检查不能替代服务端权限测试；让 Agent 确认直接调用接口时也会检查权限，并覆盖数据保存和输入校验。测试组织和命令见[测试与验收](../developing-apps/testing-and-acceptance.md)。

至此，你已经完成了第一个应用的搭建和基础体验。可以继续让 Agent 增加业务功能；准备上线时，按[选择部署方式](../deployment/choose-a-deployment-method.md)完成部署前检查。下面的内容供想了解实现的读者选读。

## 实现解析（选读）

这部分说明示例如何把界面操作接入数据和权限，帮助你理解 Agent 的改动，无需逐段复制代码才能完成上面的体验。

> [!NOTE]
> 下面的代码和截图基于默认模板 `1.0.0-beta.84`，完整实现见[示例源码](#示例源码)。你的应用应使用自身项目指引和公开接口；布局、文件组织和具体校验规则可能不同。

### 页面与导航

默认模板已经提供应用外壳、登录能力和基础服务。任务功能沿用它们，在 `client/routes.ts` 注册页面和侧边栏入口：

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

`navigation` 生成菜单，`componentLoader` 加载任务页面，`authz` 声明页面访问权限。这个片段省略了子路由；实际地址可能包含 `/main/` 等基础路径，由运行时处理。

列表页面使用现有的 `PageContainer`、`PageHeader` 和 `DataTable`。搜索、状态、页码和排序保存在 URL 中，打开详情再返回时可以恢复；数据由接口在服务端筛选和分页。

实现见[页面路由](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts)和[任务列表](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/index.tsx)。

### 详情与表单

`detail.tsx` 用 `RouteDrawer` 展示详情，`form.tsx` 用 `RouteDialog` 展示新建和编辑表单。弹窗和抽屉拥有各自的路由，刷新、浏览器后退和直接打开链接时可以恢复相应界面。

表单使用已有的输入组件、用户选择器和日历。保存时通过 `useApiClient` 调用任务接口，成功后用返回的数据更新界面。下面是请求片段：

```ts
const result = await submission.run(values, (key, signal, snapshot) =>
  api.request<{ data: Task }>({
    path: creating ? 'tasks' : `tasks/${taskId}`,
    method: creating ? 'POST' : 'PATCH',
    headers: { 'Idempotency-Key': key },
    signal,
    json: snapshot,
  }),
);
```

这里的 `submission` 来自 `useSubmission`。保存结果不确定时，它保留原始请求和操作键，重试使用同一个键；服务端通过 `executeIdempotentMutation` 将任务写入与回执放在同一事务中，避免重复创建。

示例将编辑任务信息与更新进度分成不同操作，便于给成员单独授予进度权限。保存失败保留输入，保存中防止重复点击，删除前要求确认。中英文文案集中放在 `client/locales/tasks.ts`，再合入应用的两种语言资源。

实现见[表单](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx)、[详情](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/detail.tsx)和[任务操作](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/task-actions.tsx)。

### 数据表与接口

任务保存在新增的 `tasks` 表中，用户和登录继续使用内置能力。

| 字段 | 用途 |
| --- | --- |
| `id` | 服务端生成的任务标识 |
| `title`、`description` | 标题与描述 |
| `status` | 待处理、进行中、已完成 |
| `assigneeId`、`dueDate` | 可选的负责人和截止日期 |
| `createdAt`、`updatedAt` | 创建和更新时间 |

迁移声明表结构，工具生成 Collection 文件。`server/tasks/schemas.ts` 定义输入校验，`service.ts` 处理业务，`server/routes/tasks.ts` 提供列表、详情和写入接口。例如，这个示例要求标题去除首尾空格后必填且最多 120 字符，描述最多 2,000 字符；负责人必须是有效用户，截止日期必须是有效日历日期。

服务和路由分别加入 `server/providers/index.ts` 与 `server/routes/index.ts`，功能才会随应用加载。路由通过 `apiValidator()` 校验请求，用 `describeRoute()` 声明接口文档；服务通过 Repository 访问数据库。

实现见[迁移](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts)、[输入校验](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/schemas.ts)、[服务 Provider](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/providers/tasks.ts)和[HTTP 路由](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts)。

### 角色与数据范围

示例注册模板准备好的用户和权限管理页面，并声明五种任务操作：查看、新建、编辑、更新进度和删除。

| 角色 | 可执行操作 | 数据范围 |
| --- | --- | --- |
| Task manager | 全部任务操作 | 全部任务 |
| Task member | 查看、更新进度 | 分配给自己的任务 |
| Task reader | 查看 | 全部任务 |

角色种子只提供初始配置，管理员再把角色分配给具体用户；不会在每次启动时覆盖管理员的调整，也不自动向所有登录用户授予任务权限。

前端按权限显示入口，服务端仍独立检查请求。业务服务取得当前用户的权限策略后，每次查询和写入都使用该策略。例如读取详情：

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

这样即使成员拿到别人的任务 ID，也不能跳过数据范围限制。实现见[权限声明](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/permissions.ts)、[任务服务](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts)和[角色初始化](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/seeds/202610250102_task_roles.ts)。

### 进一步验证

示例还处理了保存失败、重复点击和旧版本修改冲突。多人编辑时，请求携带读取时的版本；版本已变化则返回 `409`，提示重新加载，避免静默覆盖。这些属于继续完善应用时需要了解的行为。

深入检查时，结合[测试与验收](../developing-apps/testing-and-acceptance.md)和[示例测试](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/tests)验证迁移、接口权限、失败后的输入保留，以及两个窗口修改同一任务的结果。并发细节和目标数据库行为需要在实际环境中验证；本文展示的示例不代表这些检查已在你的应用中执行。

## 示例源码

完整代码位于 [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks)，对应提交 `0185e4bfa9d7ef05dd180245005a6c1024fe41de`。应用目录的 [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD) 提供运行步骤、文件映射和测试命令；[实操记录](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/docs/walkthrough.md) 记录版本差异、修复和未验证项。正文中的代码片段用于说明关键实现，完整文件包含导入、注册和错误处理。

<details>
<summary>获取并运行完整应用</summary>

准备 Node.js 24 和 pnpm 11.7，在新目录获取代码，避免覆盖正在开发的项目：

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

配置初始化时选择 SQLite，可复现这次实操环境。示例使用 npmjs.org 已发布的依赖，锁文件固定对应版本。打开终端输出的完整 `Local:` 地址，使用应用配置中的初始管理员登录，在用户管理中添加测试成员并分配任务角色。运行配置、数据库及截图中的示例数据不随源码分发。

</details>

## 相关文档

- [和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)：维护项目规则、描述需求和检查交付。
- [测试与验收](../developing-apps/testing-and-acceptance.md)：测试夹具、隔离数据库与浏览器验证。
- [选择部署方式](../deployment/choose-a-deployment-method.md)：通过验收后准备部署。
