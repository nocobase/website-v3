---
title: UI 组件与交互
description: 选择和添加 shadcn 与 NocoBase UI Library 组件，组织业务组件，并实现列表、表单和弹窗的完整交互。
---

业务页面可以由应用已有组件、shadcn 基础组件和 NocoBase UI Library 的组件与区块组合而成。组件源码由应用维护，可以按业务需要修改；页面负责接入数据、权限和操作反馈。

## 选择与添加组件

### 先使用应用已有组件

开发前先查看现有页面和 `client/components/`，确认哪些组件可以直接使用，哪些需要调整。按钮、输入框、弹窗等基础交互使用项目中的 shadcn 组件，避免为同一种操作维护多套实现。

缺少基础组件时，在应用根目录添加：

```bash
pnpm exec shadcn add button input
```

添加位置由 `components.json` 的别名配置决定。已有同名文件时先比较差异，保留应用定制。命令选项见 [shadcn CLI](https://ui.shadcn.com/docs/cli#add)。

### 从 NocoBase UI Library 添加组件与区块

[NocoBase UI Library](https://ui.nocobase.com/) 通过 shadcn UI Registry 分发可编辑的源码。先查看组件说明、示例和依赖；涉及业务插件的区块，还需要准备对应插件、接口和权限。

默认模板已在 `components.json` 中配置 `@nocobase`。已有项目缺少时，将以下条目合并到 `registries`，保留原来的样式、别名和其他 Registry 配置：

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

例如，应用缺少页面标题组件时，在应用根目录执行：

```bash
pnpm exec shadcn add @nocobase/page-header
```

这个资产写入 `client/components/page-header.tsx`。从 `#components/page-header` 导入 `PageHeader`，传入标题，并按需提供描述和操作区。添加后检查生成文件、依赖与样式变化，再接入页面。

文案接入应用[多语言](localization.md)，颜色与间距沿用[主题与样式](themes-and-styles.md)约定。以后获取上游更新时，比较差异并保留业务修改，尤其是权限判断和表单行为。

<details>
<summary>添加本地 UI 源码资产</summary>

团队提供的 Registry 资产也可以从本地添加。例如，已构建的资产位于工作区中的 `packages/announcements-ui/public/r/announcement-list.json`：

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

传入包含组件源码的单个资产 JSON，路径相对于执行命令的应用目录。本地文件无需启动 HTTP 服务；资产声明的其他 Registry 项和 npm 依赖仍可能需要联网获取。

如需制作和分发自己的资产，见[按需分发 UI 源码资产](../extension-development/frontend-components.md#按需分发-ui-源码资产)。

</details>

## 编写与复用业务组件

### 按使用范围组织文件

只在一个页面使用的组件可以与页面放在一起，多个页面确实需要时再提取到共享位置。例如：

```tree
client/
├── pages/
│   └── projects/
│       ├── index.tsx             # 页面与业务接入
│       └── components/           # 仅此页面使用的组件（按需）
├── components/
│   ├── ui/                      # shadcn 基础组件
│   └── projects/                # 跨页面共享的项目组件（按需）
├── hooks/                       # 复用交互逻辑（按需）
├── extensions/                  # 模块化 UI 源码资产（按需）
├── locales/                     # 多语言文案
├── react-providers.ts           # 应用级 React Provider 注册
└── styles.css                   # 样式入口
```

`client/extensions/` 可以按模块组织引入的 UI 源码，具体写入位置由资产声明和项目配置决定。文件通过普通导入接入页面；放进目录本身不会注册插件、路由或服务。

### 明确组件与状态的职责

以项目页面为例：

| 组成 | 职责 |
| --- | --- |
| 页面 | 接入路由、权限和数据，组合标题、列表与表单 |
| 列表组件 | 展示记录、分页和操作入口，接收页面提供的数据与回调 |
| 表单组件 | 维护草稿、字段错误和提交状态，处理保存与取消 |
| 业务 Hook | 复用请求或交互逻辑，明确初始化、重置和清理时机 |

组件通过 Props 接收数据、文案和事件回调，需要共享上下文时再使用 Context。不必预先拆出所有组件，也不要求所有业务组件都采用同一种模式。

自定义 Hook 复用的是逻辑，多次调用不会自动共享同一份状态。搜索、排序和页码属于 URL 状态，接口结果属于服务端状态，未提交输入属于表单草稿；不要在列表刷新时顺便重置草稿。具体实现见[数据请求与状态管理](data-requests-and-state.md)。

### 使用 React Context 与 Provider

多个组件需要共享选择项或编辑状态时，可以使用 React Context。只在一个页面或组件子树中使用的 Provider，直接在对应位置组合。

应用级 Provider 通过 `client/react-providers.ts` 接入：编写接收并渲染 `children` 的组件，将它追加到已有 `defineClientReactProviders(...)` 声明，填写 `name`、`component` 和合适的 `layer`。依赖应用上下文时通常使用 `application` 层；保留模板已有的主题和 Toast 声明。

React Provider 向组件树提供上下文；`client/service-provider.ts` 中的 ServiceProvider 向服务容器注册业务服务并管理生命周期。注册服务不会让字段自动成为 React 响应式状态，组件仍需通过状态或订阅更新。

挂载层级与顺序见 [React Provider 的注册与挂载](../framework/runtime/react-providers.md)；跨页面业务能力的封装见[客户端业务服务](client-business-services.md)。

## 实现列表、表单与弹窗交互

### 示例与前提

下面沿用项目列表、新建项目和修改任务所属项目三个界面。完整代码见[项目示例增量源码包](/assets/core/downloads/team-tasks-pages-and-interactions.zip)，包含新增与修改的文件、补丁和说明，不包含配置、账号、数据库或依赖目录。

运行示例需要先完成[建表与数据初始化](data-models-and-migrations.md)和[路由与 HTTP 接口](apis-and-services.md)中的历史项目示例，保留其迁移、服务、路由与权限声明。基线为 `@nocobase/app-template-default@1.0.0-beta.78`，无需新增插件。**增量包不适用于当前入门示例的 `tasks` 表及三阶段进度。** 已有业务修改时，先查看补丁再合并。

在“系统设置 → 权限管理”中为指定角色配置项目页面访问、查看和新建权限，以及任务页面访问和修改任务项目权限；修改归属需要分别设置任务范围与可选项目范围，再通过用户管理分配给具体用户。能进入页面不代表能操作数据，能查看项目也不代表能把任务分配给它；服务端必须独立检查每次请求。

本例不包含项目详情、删除或审批流程。保存采用“最后一次成功保存生效”，没有并发版本检查；搜索按名称包含匹配，排序按创建时间，不提供中文拼音排序。

### 展示项目列表

`client/pages/projects/index.tsx` 使用 `PageContainer`、`PageHeader` 和 `DataTable`，组合标题、新建入口、搜索与表格。页面只保留一层页面容器；布局调整见[页面布局](page-layouts.md)。

![项目列表，包含名称搜索、创建时间排序和分页](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

搜索、排序和页码保存在 URL 中，打开与关闭弹窗时保留查询参数。表格使用服务端分页和排序，默认按创建时间降序，表头箭头与接口排序保持一致。

| 状态 | 页面反馈 |
| --- | --- |
| 首次加载 | 展示骨架屏，暂不显示新建入口 |
| 刷新已有列表 | 保留现有行，显示加载提示 |
| 没有项目 | 展示空状态；有权限时提供一个新建入口 |
| 搜索结果 | 无匹配时说明情况；有无匹配都保留清除筛选和顶部新建入口，新建入口仍受权限控制 |
| 请求失败 | 说明原因；网络或服务错误允许重试 |
| 登录失效或权限不足 | 隐藏旧数据，提示重新登录或联系管理员 |

<details>
<summary>示例的列表请求实现</summary>

`useUrlSearch()` 管理搜索词和中文输入法组合状态，`useTableUrlState()` 管理页码、每页条数与排序。通过 `useApiClient()` 请求：

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

在 effect 清理函数中执行 `controller.abort()`，更新状态前检查是否已取消，防止旧响应覆盖新结果。只有当前查询成功返回的 `total` 才能用于纠正超出范围的页码。

表格开启 `manualPagination` 和 `manualSorting`，使用服务端返回的数据与总数。通用请求机制见 [API Client](../framework/http/api-client.md)。

</details>

### 新建项目

`client/pages/projects/create.tsx` 使用 `RouteDialog` 展示表单，`react-hook-form` 管理输入，`zodResolver` 校验名称去除首尾空格后为 1–120 个字符。

![在项目列表上打开新建弹窗](/assets/core/developing-apps/pages-and-interactions/create-project.png)

提交过程需要让用户知道当前发生了什么：

1. 校验失败时，把错误显示在名称字段下，用 `aria-invalid`、`aria-describedby` 关联输入与提示。
2. 保存期间禁用提交和取消，输入只读，并用同步的提交锁防止连续点击发出多次请求。
3. 服务端返回字段错误时，保留输入、显示错误并聚焦该字段；其他失败显示表单提示。
4. 保存成功后，用接口返回的项目更新列表，提示已创建的项目名称，再关闭弹窗。

新增项目未必属于当前可见页。本例只在“第一页、降序、符合搜索条件”时立即插入；其他情况保留筛选和页码，并提供“查看最新项目”操作。

### 修改任务所属项目

任务行通过 `useCan()` 控制操作入口。完成／恢复与修改项目都可用时，放进同一个行操作菜单；只有一个操作时显示单个按钮。

![任务行操作菜单中的修改项目入口](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

`client/pages/tasks/[taskId]/project.tsx` 打开时读取最新任务和允许分配的项目。候选项目每页 20 条，通过上一页、下一页继续选择。

![修改任务项目，显示按操作权限加载的候选项目](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**候选项与已选值分别维护。** 首次读取用于初始化选择，之后翻页只更新候选项；已选项目不在当前页时，仍保留其值与名称。加载失败后重试也不应重置草稿。

已有项目不在允许范围内时，显示“项目不可用”，不泄露名称，也不能当成“未设置项目”。提交时服务端重新检查任务和目标项目，打开弹窗时的权限结果不能代替保存授权。

保存时仅提交所选项目 ID，解除关联则提交 `null`：

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

返回的 `id`、`projectId`、`updatedAt` 合并回已有任务，再刷新列表，避免用旧任务对象覆盖标题、负责人或完成状态。重新打开弹窗时再次读取最新关联。

### 处理关闭与异常

保存期间，关闭按钮、取消、Escape、浏览器后退和应用内导航需要使用同一个提交状态判断，避免请求尚未完成就退出编辑。

<details>
<summary>RouteDialog 的关闭保护</summary>

```tsx
<RouteDialog
  title={t('projects.new')}
  className="sm:max-w-md"
  beforeClose={() => !pendingRef.current}
  footer={<Footer pending={pending} />}
>
  <ProjectForm />
</RouteDialog>
```

保存期间还要阻止浏览器后退和应用内导航。源码中的 `usePendingNavigation` 调用 `@nocobase/app-client` 的 `useNavigationGuard`，使用同一个 ref 判断请求是否进行中；同时仅在保存期间注册 `beforeunload`，对刷新或关闭标签页触发浏览器提示。仅配置 `beforeClose` 不能覆盖这些导航路径。

这是组件关系示意；完整代码中表单把提交状态同步给父组件，页脚通过 `form` 属性关联表单。不要把未连线的示意代码直接替代源码包中的文件。

</details>

关闭后恢复原列表的筛选、排序和页码，焦点回到触发入口；入口已消失或从直接链接打开时，回到父页面标题。中文输入法确认候选字时不能误提交表单。

| 情况 | 处理方式 |
| --- | --- |
| 尚未修改 | 禁用保存，并说明无需保存 |
| 目标项目不可用 | 错误关联项目字段，聚焦选择框，保留草稿 |
| 任务不存在或已超出范围 | 停止编辑，关闭后回到刷新后的列表 |
| 登录失效 | 提供重新登录入口 |
| 操作权限被撤销 | 说明无权限，不提供无效的重试按钮 |
| 网络或服务错误 | 保留输入，允许重试 |

![真实接口拒绝无效项目，错误显示在选择字段下](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

<details>
<summary>项目示例的接口与路由接入</summary>

**页面与接口**

页面路由相对于应用入口，API 路径相对于应用 API 根路径。代码中不用写死 `/main` 或服务器地址。

| 页面路由 | 展示方式 | 使用的 API |
| --- | --- | --- |
| `/projects` | 项目列表 | `GET /tutorialProjects` |
| `/projects/create` | 新建弹窗 | `POST /tutorialProjects` |
| `/tasks/:taskId/project` | 修改项目弹窗 | `GET`、`PATCH /tutorialTasks/:id/project` |

[路由与 HTTP 接口](apis-and-services.md)示例中的项目列表只有分页参数。本章增加 `q` 和 `order`：按名称包含匹配搜索，按创建时间升序或降序排序，默认最新在前。相同时间用 `id` 稳定排序；列表与 `total` 使用相同过滤条件和权限策略。

修改弹窗还需要一个读取接口。它先按 `assignTask` 的任务范围读取当前任务，再按这个操作的项目范围读取候选项和当前项目名称：

```ts
{
  data: {
    task: { id, title, projectId, projectName },
    options: [{ id, name, createdAt }],
  },
  meta: { page, pageSize, total },
}
```

`projectName` 可以是 `null`：已有项目现在可能不在允许范围内。此时展示“项目不可用”，不泄露名称，也不把它当成“未设置项目”。保存时服务仍会重新检查任务与目标项目，不能把打开弹窗时的结果当成长期授权。

完整变更在源码包的 `server/providers/tutorial-project-service.ts`、`tutorial-projects.ts` 和 `server/routes/tutorial-projects.ts` 中。新 GET 接口同样声明 `describeRoute()`，通过 `apiValidator()` 校验参数，不需要新增迁移。

**页面、菜单与弹窗路由**

在 `client/routes.ts` 的 `defineAppRoutes()` 中加入项目页面。保留已有任务、登录和系统设置路由：

```tsx
{
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: {
    resource: { type: 'page', id: 'projects' },
    action: 'access',
  },
  navigation: { title: 'projects.title', icon: FolderKanban },
  breadcrumb: { title: 'projects.title' },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'projectCreate',
      path: 'create',
      authz: {
        resource: { type: 'composite', id: 'tutorial.projects' },
        action: 'create',
      },
      breadcrumb: { title: 'projects.new' },
      componentLoader: () => import('./pages/projects/create.js'),
    },
  ],
}
```

`FolderKanban` 从 `lucide-react` 导入。菜单由 `navigation` 生成，不需要改侧栏。页面模块默认导出 React 组件，并在父页面保留 `<Outlet />` 供子路由渲染。

任务的修改项目路由放在已有 `tasks.children` 中，路径为 `:taskId/project`，使用 `tutorial.projects/assignTask` 操作权限。

打开弹窗时保留列表查询参数：

```tsx
<Button
  nativeButton={false}
  render={<Link to={{ pathname: 'create', search: location.search }} />}
>
  {t('projects.new')}
</Button>
```

这样复制链接、刷新页面和关闭弹窗都有明确位置。例如 `/projects/create?q=launch&page=2` 仍然以对应项目列表为背景，关闭后回到原查询条件。

路由声明与覆盖层机制见[页面、路由与导航](pages-routes-and-navigation.md)。

</details>

## 使用 Agent 开发页面

在已有项目与任务功能的应用目录中，把本文作为参考交给开发 Agent，再描述需要的页面和业务规则：

```text
帮我给现有项目功能加上页面，沿用应用风格，支持中英文。
项目列表能按名称搜索、按创建时间排序和翻页，并通过弹窗新建项目。
任务行可以修改所属项目或解除关联，只能选择当前用户允许分配的项目，不要扩大现有权限。
切换候选项目的页码时保留已选值，保存失败保留输入，成功后更新列表；关闭弹窗后保留原来的筛选和页码。
```

示例接口、权限与组件接入要求见上文。开发自己的业务页面时，替换页面名称和操作规则，并按下面的检查项验收结果。

## 验证交互结果

- 检查有数据、空结果、加载和失败时的页面反馈，以及中英文、明暗主题和窄屏布局。
- 验证字段校验、重复提交与失败重试；失败后保留输入，候选项翻页后保留选择。
- 检查关闭弹窗、直接打开链接、刷新和前进后退，确认列表上下文与焦点恢复正确；用键盘与中文输入法完成操作。
- 使用普通用户验证允许和拒绝的操作，分别检查入口可见性、任务范围与候选项目范围。隐藏按钮不能替代服务端授权。
- 添加或修改组件后，运行项目的类型检查、相关测试与构建，确认导入、依赖和样式接入正确。

组件测试验证输入与交互，真实接口和浏览器测试验证授权、持久化及页面接入。测试组织见[测试与验收](testing-and-acceptance.md)。

<details>
<summary>运行历史项目示例的测试</summary>

以下文件和命令属于上面的增量源码包，应在合并示例后的应用根目录执行；自己的应用使用对应测试文件。

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run tests/components/tutorial-projects.test.tsx
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts tests/logic/app-locale-coverage.test.ts tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

浏览器测试运行在单独的本地测试应用中，会创建项目与任务。将 `APP_URL` 设置为 `pnpm dev` 打印的完整应用入口，用本地测试账号运行：

```bash
APP_URL=http://127.0.0.1:13321/main/ pnpm exec playwright test tests/playwright/tutorial-projects.test.ts
```

账号可通过 `TUTORIAL_USERNAME`、`TUTORIAL_PASSWORD` 环境变量指定；不要把生产账号写进脚本。真实数据库验证创建、分配、解除关联和权限范围；组件测试仅在必要的会话、传输和 jsdom 浏览器能力边界提供替身。

</details>
