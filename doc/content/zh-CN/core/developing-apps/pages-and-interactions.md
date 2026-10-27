---
title: UI 组件与交互
description: 选择和组合模板组件，管理列表与表单状态，并处理接口调用、加载、错误和操作反馈。
---

页面把业务能力交给用户操作。除了展示数据，还要明确加载、空结果、提交中、失败和成功时的行为，并保持筛选、表单输入和权限状态一致。

本篇使用项目列表、新建项目和修改任务项目三个界面，说明怎样组合模板组件、调用接口和管理交互状态。可以按问题直接查阅；运行完整示例时，需要下方列出的项目模型与接口。页面路由在这里仅说明这些界面需要的接入，不展开完整的布局和嵌套路由机制。

## 先选择已有组件

先查看应用的 `client/components/`、`client/components/ui/` 和已有页面，再决定是否新增组件。模板提供的页面、表格和路由弹窗已处理一部分通用行为，业务页面负责组合它们、提供数据和连接反馈。

| 需求 | 本例使用的组件或机制 | 业务页面仍需负责 |
| --- | --- | --- |
| 页面标题与内容布局 | `PageContainer`、`PageHeader` | 标题、操作入口和内容；避免重复嵌套页面容器 |
| 列表与分页 | `DataTable` | 列定义、权限内的数据、总数和服务端分页 |
| 新建或修改弹窗 | `RouteDialog` | 表单、提交、关闭保护及返回上下文 |
| 表单校验 | `react-hook-form` 与 `zodResolver` | 业务校验、服务端字段错误和焦点 |
| 请求应用接口 | `useApiClient()` | 请求参数、取消旧请求和处理结果 |
| 操作可见性 | `useCan()` | 按操作控制入口，同时保留服务端独立授权 |

通过 `#components/...` 等应用已有入口引用组件。需要缺少的基础组件时按项目指引添加，优先使用组合和现有 props；页面使用语义主题样式和翻译文案，避免为一个功能另写一套视觉规则。

## 分清三种状态

**URL 状态**保存可分享和可恢复的视图，例如搜索词、排序、页码，以及当前打开的路由弹窗。关闭弹窗后仍应回到对应列表上下文。

**服务端状态**包括记录、候选项、总数和本次操作的权限结果。搜索或页码变化后重新读取；旧请求不能覆盖新结果。保存时仍由服务端检查权限，不能把打开弹窗时读到的权限当作永久授权。

**表单草稿**保存用户尚未提交的输入、选中的项目和字段错误。候选项翻页、网络失败或重试不应无意清空草稿；只有成功提交或明确放弃时才结束这次编辑。

这三种状态各有用途。把整个列表复制到弹窗后再整条写回，容易覆盖其他人修改的字段；把已选值只保存在当前候选页里，则会在翻页时丢失选择。

## 示例界面

新增一个项目列表和两个弹窗，沿用应用模板的页面、表格与表单组件：

- **项目列表**：按名称搜索，按创建时间排序，分页查看。
- **新建项目**：填写名称，校验后保存，回到原列表。
- **修改任务项目**：读取任务当前的项目，选择一个允许分配的项目，或解除关联。

![项目列表，包含名称搜索、创建时间排序和分页](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

本篇不增加项目详情、删除或审批流程。任务列表保留原有列，通过行操作打开“修改项目”；弹窗显示当前归属。

## 开始之前

运行此示例需要[数据模型与迁移](data-models-and-migrations.md)和[业务服务与 HTTP 接口](apis-and-services.md)中的示例，保留相应迁移、服务、路由与权限声明。示例基于 `@nocobase/app-template-default@1.0.0-beta.78`，不需要安装新插件。

本章增量包仅适用于上述历史项目示例，不适用于当前入门示例的 `tasks` 表及三阶段进度。

本篇涉及多个前端文件。可以下载[本章增量源码包](/assets/core/downloads/team-tasks-pages-and-interactions.zip)，其中包含新增和修改的文件、增量补丁及说明。它以这两篇示例完成后的状态为基础，不包含配置、账号、数据库或依赖目录。

仓库中的章节标签仍是已发布示例的定位方式；本章源码先随文档提供，不依赖尚未发布的标签。如果应用已有自己的修改，先查看补丁并合并，避免覆盖业务代码。

## 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见手动步骤，由 Agent 结合项目指引处理。

```text
请把已有的项目功能做成可以直接操作的页面，沿用应用现有的界面风格，并提供中英文文案。

我需要一个“项目”页面，可以按名称搜索、按创建时间排序和翻页；点击“新建项目”后在弹窗中填写并保存。
任务列表中增加“修改项目”操作，在弹窗中查看当前归属、选择允许分配的项目，或者解除关联。
打开时读取最新信息，切换候选项目的页码时不要丢失我已选的值。
只能选择允许这次分配操作使用的项目，不能因为用户有查看权限就放开分配。

加载时显示进度，没有数据或搜索不到结果时说明情况。
填写有误时在对应字段旁提示；保存失败时保留输入并允许重试。
保存过程中避免重复提交；保存成功后更新列表并提示结果，关闭弹窗后保留原来的筛选和页码。
登录失效时引导重新登录，权限不足时说明原因，任务已不存在时停止编辑。

请按项目已有指引实现，保留现有用户权限，不自动给用户增加角色。
实际检查新建、分配、解除关联和权限拒绝，以及键盘操作、中文输入和窄屏使用。
这一轮不增加项目详情、删除或工作流。完成后告诉我改动和验证结果。
```

## 不使用 Agent

### 明确页面与接口的对应关系

页面路由相对于应用入口，API 路径相对于应用 API 根路径。代码中不用写死 `/main` 或服务器地址。

| 页面路由 | 展示方式 | 使用的 API |
| --- | --- | --- |
| `/projects` | 项目列表 | `GET /tutorialProjects` |
| `/projects/create` | 新建弹窗 | `POST /tutorialProjects` |
| `/tasks/:taskId/project` | 修改项目弹窗 | `GET`、`PATCH /tutorialTasks/:id/project` |

“业务服务与 HTTP 接口”中的项目列表只有分页参数。本章增加 `q` 和 `order`：按名称包含匹配搜索，按创建时间升序或降序排序，默认最新在前。相同时间用 `id` 稳定排序；列表与 `total` 使用相同过滤条件和权限策略。

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

### 用路由声明页面、菜单与弹窗

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

### 让列表状态与 URL 保持一致

`client/pages/projects/index.tsx` 使用模板中的 `PageContainer`、`PageHeader` 和 `DataTable`。`useUrlSearch()` 管理搜索词与中文输入法组合状态，`useTableUrlState()` 管理页码、每页条数和排序。

通过 `useApiClient()` 发起请求：

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

在 effect 清理函数中执行 `controller.abort()`，并在更新状态前检查是否已取消，防止较早的搜索响应覆盖较新的结果。只有当前查询成功返回的 `total` 才能用于纠正超出范围的页码。

表格开启 `manualPagination` 和 `manualSorting`，使用服务端返回的数据与总数。界面上的默认排序箭头也要显示创建时间降序，不能只在接口中设置默认值。

不同状态需要不同反馈：

| 状态               | 页面表现                                     |
| ------------------ | -------------------------------------------- |
| 首次加载           | 骨架屏，暂不展示新建入口                     |
| 刷新已有列表       | 保留现有行，显示加载提示                     |
| 没有项目           | 空状态；有权限时在空状态中提供唯一的新建入口 |
| 没有搜索结果       | 显示无结果，保留顶部新建入口和清除筛选       |
| 搜索有结果         | 同样保留清除筛选                             |
| 请求失败           | 明确错误；网络或服务错误允许重试             |
| 登录失效或权限不足 | 隐藏旧数据，提供重新登录或联系管理员的提示   |

### 实现新建表单

`client/pages/projects/create.tsx` 使用 `RouteDialog`，单字段弹窗采用 `sm:max-w-md`。表单由 `react-hook-form` 管理，`zodResolver` 校验名称去除首尾空格后为 1–120 个字符。

![在项目列表上打开新建弹窗](/assets/core/developing-apps/pages-and-interactions/create-project.png)

提交前后分别处理以下事情：

1. 提交前校验；错误显示在名称字段下，并关联 `aria-invalid`、`aria-describedby`。
2. 请求进行中禁用提交和取消，输入只读，通过 ref 防止重复提交及关闭竞态。
3. 服务端返回名称字段错误时，保留输入，把错误放回字段并聚焦；其他失败显示表单提示。
4. 成功后使用接口返回的项目更新列表，显示包含项目名称的提示，再关闭弹窗。

弹窗的关闭按钮、取消和 Escape 通过模板提供的 `beforeClose` 控制：

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

新增记录未必属于当前可见页。例如列表按创建时间升序排列、停在第二页，或搜索词不匹配时，不能强行把它插到顶部。本例只在“第一页、降序、符合搜索条件”时立即插入；其他情况保留上下文，显示已创建的项目名称，并提供“查看最新项目”操作。

### 从任务行打开修改项目弹窗

任务同时支持完成／恢复和修改项目时，使用同一个行操作菜单；只有一个可用操作时显示单个按钮。操作是否可见由对应的 `useCan()` 结果决定。

![任务行操作菜单中的修改项目入口](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

`client/pages/tasks/[taskId]/project.tsx` 打开后请求最新任务与候选项目。选择器每页加载 20 个项目，通过上一页、下一页继续查看，不会把第一页误当成完整列表。

![修改任务项目，显示按操作权限加载的候选项目](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**选项分页和表单草稿是两份状态。** 第一次读取结果用于初始化选择，之后翻页只更新选项。已选项目即使不在当前选项页，也要保留名称和选择值；加载失败后重试不能重置用户输入。

保存时提交所选项目 ID，选择“不属于任何项目”则提交 `null`：

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

返回值只有 `id`、`projectId`、`updatedAt`。把这些字段合并回已有任务，再重新读取列表；不要用弹窗中的旧任务对象覆盖标题、负责人或完成状态。重新打开弹窗时，再次读取服务端最新关联。

### 把失败变成可继续的交互

| 情况                   | 处理方式                               |
| ---------------------- | -------------------------------------- |
| 尚未修改               | 禁用保存，并说明无需保存               |
| 目标项目不可用         | 错误关联项目字段，聚焦选择框，保留草稿 |
| 任务不存在或已超出范围 | 停止编辑，关闭后回到刷新后的任务列表   |
| 登录失效               | 提供重新登录入口                       |
| 操作权限被撤销         | 说明无权限，不提供无效的重试按钮       |
| 网络或服务错误         | 保留已输入内容，允许重试               |

![真实接口拒绝无效项目，错误显示在选择字段下](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

表单还需要处理键盘：中文输入法确认候选字时不能误提交；保存进行中不能重复提交；弹窗关闭后焦点回到触发入口，入口已经消失或从直接链接打开时，回到父页面标题。

### 配置权限并验证

沿用接口示例中的业务权限，在“系统设置 → 权限管理”中为指定角色配置：

- “项目”页面访问权限，以及需要的查看、新建操作。
- “任务”页面访问权限，以及修改任务项目操作。
- 修改归属时分别设置任务范围和可选项目范围。

再通过用户管理把角色分配给具体用户。能进入项目页面不代表可以读取、新建项目；能查看某项目也不代表允许把任务分配给它。按钮隐藏只是界面反馈，服务端仍独立检查每次请求。

源码包包含真实接口测试、组件测试和浏览器测试：

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

## 复用到其他页面

项目模型、业务接口和页面操作已经连在一起。以后新增其他业务页面，也可以沿用这条顺序：先明确数据与权限，再声明路由与组件，最后补齐加载、失败、保存反馈和验证。

本例仍采用“最后一次成功保存生效”的规则，没有增加并发版本检查。搜索按名称包含匹配，排序只提供创建时间；没有宣称支持按中文拼音排序。
