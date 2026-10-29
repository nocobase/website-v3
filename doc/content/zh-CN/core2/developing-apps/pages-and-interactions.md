---
title: UI 组件与交互
description: 以 shadcn 基础组件和 NocoBase UI Library 为基础，自由组织业务组件，实现列表、表单和弹窗交互，并验证用户操作。
---

开发应用和插件时，前端组件可以自由编写和组织，基础组件使用 shadcn。构建模块化界面时，建议先参考 [NocoBase UI Library](https://ui.nocobase.com/) 中分发的组件和区块，再按业务需要修改、组合。

本篇先介绍组件的组织方式和源码资产的使用，再通过“项目列表”“新建项目”“修改任务项目”三个界面说明业务交互。完整项目示例的版本与前置条件见 [开始之前](#开始之前)；组件组织方式和 Library 的用法可以直接应用到你自己的项目。

## 组件的编写与组织

先查看应用中已有的页面和组件，确认哪些可以直接使用、哪些需要调整。下面是一种参考组织方式，可按项目规模和业务边界调整：

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

只在某个页面使用的小组件，可以先和页面放在一起；被多处使用后，再提取到合适的位置。组件可以通过 Props 接收数据，也可以按需使用 Hooks、上下文或客户端服务，不要求所有业务组件采用同一种模式。

按钮、输入框、弹窗等基础交互使用项目中的 shadcn 组件。缺少某个基础组件时，在应用根目录用项目已有的 CLI 添加，例如：

```bash
pnpm exec shadcn add button input
```

组件写入的位置由 `components.json` 中的别名配置决定。如果目标文件已存在，先查看差异，保留应用自己的定制；具体操作见 [shadcn CLI](https://ui.shadcn.com/docs/cli#add)。

后文的项目示例用到了以下组件和机制。模板或 Library 提供通用实现，业务页面负责接入自己的数据、权限和反馈：

| 需求 | 本例使用的组件或机制 | 业务页面仍需负责 |
| --- | --- | --- |
| 页面标题与内容布局 | `PageContainer`、`PageHeader` | 标题、操作入口和内容；避免重复嵌套页面容器 |
| 列表与分页 | `DataTable` | 列定义、权限范围内的数据、总数和服务端分页 |
| 新建或修改弹窗 | `RouteDialog` | 表单、提交、关闭保护和返回上下文 |
| 表单校验 | `react-hook-form` 与 `zodResolver` | 业务校验、服务端返回的字段错误和焦点 |
| 请求应用接口 | `useApiClient()` | 请求参数、取消旧请求、处理结果 |
| 操作可见性 | `useCan()` | 按操作控制入口，同时保留服务端的独立授权 |

请通过 `#components/...` 等应用已有的入口引用组件，并使用语义化的主题样式和翻译文案，具体约定见 [多语言](localization.md) 和 [主题与样式](themes-and-styles.md)。

## 使用 NocoBase UI Library

[NocoBase UI Library](https://ui.nocobase.com/) 通过 shadcn UI Registry 分发可编辑的组件和区块源码。Agent 或开发者把资产添加到应用后，就可以直接阅读、修改和组合这些文件。

### 查找与添加

先查看 Library 中组件的说明、示例和安装命令，确认它解决什么界面问题，以及需要哪些依赖或应用能力。添加进来的组件仍需接入页面；涉及业务插件的区块，还要按资产说明准备相应的插件、接口和权限。

在应用根目录检查 `components.json`。默认模板已经配置了 `@nocobase`；已有项目缺少这一项时，把下面的条目合并到现有的 `registries` 中，保留原有的样式、别名和其他 Registry 配置：

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

配置说明见 [shadcn components.json](https://ui.shadcn.com/docs/components-json#registries)。例如，应用缺少页面标题组件时，可以这样添加：

```bash
pnpm exec shadcn add @nocobase/page-header
```

这个资产会写入 `client/components/page-header.tsx`。从应用已有的 `#components/page-header` 入口导入 `PageHeader`，传入页面标题，并按需提供描述和操作区。如果项目中已经有这个组件，优先使用或调整现有文件。

### 修改与组合

添加后，先检查生成的文件、依赖和样式变化，再接入业务。你可以调整组件布局、增减操作，或把大区块拆成更适合当前应用的组件；文案接入应用的多语言，颜色和间距沿用主题约定。

例如，把 `PageHeader` 用在项目列表上时，页面传入翻译后的标题和“新建项目”操作，列表组件展示业务数据，表单组件处理输入。源码资产只提供界面起点，具体的业务行为由应用实现。

这些文件从此由应用维护。以后再次添加或获取上游更新时，请比较差异并保留业务修改，尤其是权限判断、表单行为和多语言接入。

`client/extensions/` 可以按模块组织添加进来的组件、Hooks 和其他 UI 源码。具体写入位置取决于资产声明和项目配置，并非所有资产都放在这里。这些文件通过普通 import 接入页面；放进这个目录本身不会自动注册插件、路由或服务。

### 使用本地源码资产

团队提供的 Registry 资产也可以从本地添加。例如，已构建好的资产位于工作区中的 `packages/announcements-ui/public/r/announcement-list.json`：

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

这里传入的是包含组件源码的单个资产 JSON，路径相对于执行命令的应用目录。它可以来自本地构建或其他项目，不需要先为本地文件启动 HTTP 服务；不过，资产声明的其他 Registry 项和 npm 依赖仍可能需要联网获取。CLI 同时支持名称、URL 和本地路径三种写法，见 [shadcn CLI](https://ui.shadcn.com/docs/cli#add)。

## 使用 React Context 与 Provider

多个组件需要共享选择项、编辑状态或其他界面上下文时，可以使用 React Context。只在某个页面或组件子树中使用的 Provider，直接在对应位置组合即可。

需要覆盖整个应用的 Provider，通过 `client/react-providers.ts` 接入：先编写一个接收并渲染 `children` 的 React 组件，再把它追加到已有的 `defineClientReactProviders(...)` 声明中，填写 `name`、`component` 和合适的 `layer`。依赖应用上下文的 Provider 通常使用 `application` 层；请保留模板中已有的主题和 Toast 声明。

两类 Provider 的职责不同：React Provider 向组件树提供上下文；客户端 ServiceProvider 向服务容器注册业务服务并管理其生命周期，对应 `client/service-provider.ts`。需要把服务提供给组件时，两者可以配合使用，但注册服务并不会让服务的字段自动变成 React 响应式状态，组件仍需通过 React 状态或明确的订阅机制来更新。

Provider 的挂载层级、顺序和插件接入方式见 [React Providers](../framework/runtime/react-providers.md)；服务的注册与获取见 [客户端服务](../framework/services/integration.md#客户端服务)；应用启动与运行时装配见 [客户端运行时](../framework/runtime/client.md)。

## 实现业务交互

组件接入页面后，还要明确加载、空结果、提交中、失败和成功时分别如何表现。下面用已有的项目功能说明这些交互。请求参数和返回数据以业务接口为准，通用的请求机制见 [API Client](../framework/http/api-client.md)。

请求 Hooks、URL 状态、竞态处理和保存后的刷新另见 [数据请求与状态管理](data-requests-and-state.md)，页面容器与应用外框见 [页面布局](page-layouts.md)。本篇保留完整的业务交互示例，便于连贯阅读。

### 分清三种状态

**URL 状态**保存可分享、可恢复的视图，例如搜索词、排序、页码，以及当前打开的路由弹窗。关闭弹窗后，仍应回到对应的列表上下文。

**服务端状态**包括记录、候选项、总数和本次操作的权限结果。搜索词或页码变化后重新读取，旧请求的结果不能覆盖新结果。保存时仍由服务端检查权限，不能把打开弹窗时读到的权限当作永久授权。

**表单草稿**保存用户尚未提交的输入、已选中的项目和字段错误。候选项翻页、网络失败或重试都不应意外清空草稿；只有提交成功或用户明确放弃时，这次编辑才结束。

三种状态各有用途，不能混用。把整个列表复制到弹窗、再整条写回，容易覆盖其他人修改过的字段；把已选值只存在当前候选页里，翻页时就会丢失选择。

### 示例界面

示例新增一个项目列表和两个弹窗，沿用应用模板的页面、表格和表单组件：

- **项目列表**：按名称搜索，按创建时间排序，分页查看。
- **新建项目**：填写名称，校验通过后保存，回到原来的列表。
- **修改任务项目**：读取任务当前所属的项目，选择一个允许分配的项目，或解除关联。

![项目列表，包含名称搜索、创建时间排序和分页](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

本篇不增加项目详情、删除或审批流程。任务列表保留原有的列，通过行操作打开“修改项目”弹窗，弹窗中显示任务当前的归属。

### 开始之前

运行本示例前，需要先完成 [建表与数据初始化](data-models-and-migrations.md) 和 [路由与 HTTP 接口](apis-and-services.md) 中的示例，并保留相应的迁移、服务、路由和权限声明。示例基于 `@nocobase/app-template-default@1.0.0-beta.78`，不需要安装新插件。

本章的增量包只适用于上述历史项目示例，不适用于当前入门示例的 `tasks` 表及其三阶段进度。

本篇涉及多个前端文件。你可以下载 [本章增量源码包](/assets/core/downloads/team-tasks-pages-and-interactions.zip)，其中包含新增和修改的文件、增量补丁和说明。它以前述两篇示例完成后的状态为基础，不包含配置、账号、数据库或依赖目录。

已发布的示例仍通过仓库中的章节标签定位；本章源码先随文档提供，不依赖尚未发布的标签。如果你的应用已有自己的修改，请先查看补丁再合并，避免覆盖业务代码。

### 使用 Agent

在应用目录中把本篇作为参考交给 Agent，再描述下面的需求。字段、接口和组件的具体约定见下文的手动步骤，由 Agent 结合项目指引处理。

```text
请把已有的项目功能做成可以直接操作的页面，沿用应用现有的界面风格，并提供中英文文案。
基础组件使用 shadcn，优先参考 NocoBase UI Library 中的组件和区块。
先检查项目已有组件，按需添加源码资产，再根据业务调整和组合，保留已有定制。

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

### 不使用 Agent

#### 明确页面与接口的对应关系

页面路由相对于应用入口，API 路径相对于应用的 API 根路径，代码中都不要写死 `/main` 或服务器地址。

| 页面路由 | 展示方式 | 使用的 API |
| --- | --- | --- |
| `/projects` | 项目列表 | `GET /tutorialProjects` |
| `/projects/create` | 新建弹窗 | `POST /tutorialProjects` |
| `/tasks/:taskId/project` | 修改项目弹窗 | `GET`、`PATCH /tutorialTasks/:id/project` |

“业务服务与 HTTP 接口”一章中的项目列表只有分页参数，本章再增加 `q` 和 `order`：按名称做包含匹配的搜索，按创建时间升序或降序排序，默认最新的在前。创建时间相同时按 `id` 稳定排序；列表数据和 `total` 使用相同的过滤条件和权限策略。

修改弹窗还需要一个读取接口。它先按 `assignTask` 操作的任务范围读取当前任务，再按该操作的项目范围读取候选项目和当前项目的名称：

```ts
{
  data: {
    task: { id, title, projectId, projectName },
    options: [{ id, name, createdAt }],
  },
  meta: { page, pageSize, total },
}
```

`projectName` 可能为 `null`：任务已关联的项目，现在可能已不在允许范围内。这时界面显示“项目不可用”，既不泄露项目名称，也不把它当成“未设置项目”。保存时服务仍会重新检查任务和目标项目，不能把打开弹窗时的检查结果当作长期授权。

完整变更位于源码包的 `server/providers/tutorial-project-service.ts`、`tutorial-projects.ts` 和 `server/routes/tutorial-projects.ts` 中。新增的 GET 接口同样通过 `describeRoute()` 声明文档、通过 `apiValidator()` 校验参数，不需要新的迁移。

#### 用路由声明页面、菜单与弹窗

在 `client/routes.ts` 的 `defineAppRoutes()` 中加入项目页面，并保留已有的任务、登录和系统设置路由：

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

`FolderKanban` 从 `lucide-react` 导入。菜单由 `navigation` 生成，不需要修改侧边栏。页面模块默认导出 React 组件，父页面中要保留 `<Outlet />` 来渲染子路由。

任务的“修改项目”路由放在已有的 `tasks.children` 中，路径为 `:taskId/project`，使用 `tutorial.projects/assignTask` 操作权限。

打开弹窗时保留列表的查询参数：

```tsx
<Button
  nativeButton={false}
  render={<Link to={{ pathname: 'create', search: location.search }} />}
>
  {t('projects.new')}
</Button>
```

这样，复制链接、刷新页面和关闭弹窗时都有明确的落点。例如 `/projects/create?q=launch&page=2` 仍以对应的项目列表为背景，关闭后回到原来的查询条件。

#### 让列表状态与 URL 保持一致

`client/pages/projects/index.tsx` 使用模板中的 `PageContainer`、`PageHeader` 和 `DataTable`。`useUrlSearch()` 管理搜索词和中文输入法的组合输入状态，`useTableUrlState()` 管理页码、每页条数和排序。

通过 `useApiClient()` 发起请求：

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

在 effect 的清理函数中调用 `controller.abort()`，并在更新状态前检查请求是否已取消，防止较早发出的搜索请求的响应覆盖较新的结果。只有当前查询成功返回的 `total`，才能用来纠正超出范围的页码。

表格开启 `manualPagination` 和 `manualSorting`，使用服务端返回的数据和总数。界面上默认的排序箭头也要显示为按创建时间降序，不能只在接口里设置默认值。

不同状态需要不同的反馈：

| 状态 | 页面表现 |
| --- | --- |
| 首次加载 | 显示骨架屏，暂不展示新建入口 |
| 刷新已有列表 | 保留现有行，显示加载提示 |
| 没有项目 | 显示空状态；有权限时，在空状态中提供唯一的新建入口 |
| 没有搜索结果 | 提示无结果，保留顶部的新建入口和“清除筛选” |
| 搜索有结果 | 同样保留“清除筛选” |
| 请求失败 | 明确提示错误；网络或服务错误允许重试 |
| 登录失效或权限不足 | 隐藏旧数据，提示重新登录或联系管理员 |

#### 实现新建表单

`client/pages/projects/create.tsx` 使用 `RouteDialog`；只有一个字段的弹窗采用 `sm:max-w-md` 宽度。表单由 `react-hook-form` 管理，`zodResolver` 校验名称在去除首尾空格后为 1–120 个字符。

![在项目列表上打开新建弹窗](/assets/core/developing-apps/pages-and-interactions/create-project.png)

提交前后依次处理以下事项：

1. 提交前先校验；错误显示在名称字段下方，并关联 `aria-invalid` 和 `aria-describedby`。
2. 请求进行中禁用“提交”和“取消”，输入框只读，并通过 ref 防止重复提交和关闭时的竞态。
3. 服务端返回名称字段的错误时，保留输入，把错误显示回字段并聚焦；其他失败显示为表单级提示。
4. 成功后，用接口返回的项目更新列表，显示包含项目名称的提示，再关闭弹窗。

弹窗的关闭按钮、“取消”和 Escape 键，通过模板提供的 `beforeClose` 统一控制：

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

保存期间还要阻止浏览器后退和应用内导航。源码中的 `usePendingNavigation` 调用 `@nocobase/app-client` 的 `useNavigationGuard`，用同一个 ref 判断请求是否仍在进行；同时只在保存期间注册 `beforeunload`，在用户刷新或关闭标签页时触发浏览器提示。只配置 `beforeClose` 无法覆盖这些导航路径。

上面的代码只示意组件之间的关系：完整代码中，表单把提交状态同步给父组件，页脚通过 `form` 属性关联表单。不要用这段未连线的示意代码直接替换源码包中的文件。

新增的记录不一定属于当前可见的这一页。例如，列表按创建时间升序排列、停留在第二页，或者搜索词与新项目不匹配时，不能强行把它插到列表顶部。本例只在“第一页、降序、符合搜索条件”时立即插入新记录；其他情况下保留当前上下文，提示已创建的项目名称，并提供“查看最新项目”操作。

#### 从任务行打开修改项目弹窗

任务同时支持“完成／恢复”和“修改项目”两个操作时，把它们放进同一个行操作菜单；只有一个可用操作时，直接显示单个按钮。每个操作是否可见，由对应的 `useCan()` 结果决定。

![任务行操作菜单中的修改项目入口](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

`client/pages/tasks/[taskId]/project.tsx` 打开后，请求最新的任务和候选项目。选择器每页加载 20 个项目，通过“上一页”“下一页”继续查看，不会把第一页误当成完整列表。

![修改任务项目，显示按操作权限加载的候选项目](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**选项分页和表单草稿是两份独立的状态。** 第一次读取的结果用于初始化选择，之后翻页只更新选项。已选的项目即使不在当前这一页选项中，也要保留它的名称和选中值；加载失败后重试，也不能重置用户的输入。

保存时提交所选项目的 ID；选择“不属于任何项目”时提交 `null`：

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

接口只返回 `id`、`projectId` 和 `updatedAt`。把这些字段合并回已有的任务数据，再重新读取列表；不要用弹窗中缓存的旧任务对象覆盖标题、负责人或完成状态。重新打开弹窗时，再次从服务端读取最新的关联。

#### 让失败之后可以继续操作

| 情况 | 处理方式 |
| --- | --- |
| 尚未做任何修改 | 禁用保存，并说明无需保存 |
| 目标项目不可用 | 把错误关联到项目字段，聚焦选择框，保留草稿 |
| 任务不存在或已超出权限范围 | 停止编辑，关闭后回到刷新后的任务列表 |
| 登录失效 | 提供重新登录入口 |
| 操作权限已被撤销 | 说明没有权限，不提供无效的重试按钮 |
| 网络或服务错误 | 保留已输入的内容，允许重试 |

![真实接口拒绝无效项目，错误显示在选择字段下](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

表单还需要处理好键盘操作：用中文输入法确认候选字时不能误触发提交；保存进行中不能重复提交；弹窗关闭后，焦点回到触发它的入口；如果入口已经消失，或弹窗是通过直接链接打开的，则回到父页面的标题。

## 提取组件与复用交互逻辑

先围绕实际业务把页面做出来，再根据重复的内容和变化的边界提取组件。以本例来说，可以让页面负责路由、权限和数据接入，列表负责行展示和操作入口，表单负责草稿、字段错误和提交交互。

| 需要复用的内容 | 可以怎样提取 |
| --- | --- |
| 多个页面共用的展示 | 组件接收数据、文案和事件回调，由页面传入业务上下文 |
| 同一业务的编辑表单 | 共享字段和校验逻辑，明确初始值、提交状态、保存和取消行为 |
| 多处重复的交互流程 | 提取为 Hook，说明它的输入、输出、重置条件和资源清理 |
| 跨页面的业务能力 | 按需使用客户端服务，实现与接入见 [客户端业务服务](client-business-services.md) |

Props 适合表达明确的数据和回调；React Context 可以向一组组件提供共享值；客户端服务可以封装跨页面的业务能力。按需组合使用它们，并明确状态由谁维护、组件如何订阅变化。注意，自定义 Hook 复用的是逻辑，多次调用同一个 Hook 并不会自动共享同一份状态。

提取 Hook 时，不要把 URL 状态、远程数据和未提交的草稿混成一份状态。例如，候选项目翻页时只更新选项，保留表单中的选择；关闭弹窗后编辑另一条记录时，则需要重新初始化草稿。组件用 `useCan()` 控制操作入口的同时，接口仍需独立授权。

应用内部的复用，直接通过组件、Hooks 或本地共享包完成即可。如果要把组件作为源码资产发布，供 Agent 在其他项目中按需取用、修改和组合，见 [按需分发 UI 源码资产](../extension-development/frontend-components.md#按需分发-ui-源码资产)。

## 测试与验证

检查组件时，展示、交互和应用接入都要覆盖：

- 在实际页面中确认正常数据、空结果、加载和失败状态，并检查中英文、明暗主题和窄屏布局。
- 用组件测试验证输入校验、重复提交、失败后保留草稿，以及选择器翻页后已选值是否保留。
- 用键盘检查焦点、弹窗关闭和中文输入法的行为；用普通用户检查操作入口和服务端的拒绝结果。
- 添加或调整 Library 资产后，运行项目的类型检查、相关测试和构建，确认导入、依赖和样式都已接入。

测试的组织方式和验证范围见 [测试与验收](testing-and-acceptance.md)。下面的测试文件和命令属于本篇的历史项目源码包；在你自己的应用中，请选择对应的测试文件。

### 项目示例的权限与测试

沿用接口示例中的业务权限，在“系统设置 → 权限管理”中为指定角色配置：

- “项目”页面的访问权限，以及需要的查看、新建操作。
- “任务”页面的访问权限，以及“修改任务项目”操作。
- 修改归属时，分别设置任务范围和可选的项目范围。

再通过用户管理把角色分配给具体用户。能进入项目页面，不代表可以读取或新建项目；能查看某个项目，也不代表允许把任务分配给它。隐藏按钮只是界面反馈，服务端仍会独立检查每一次请求。

源码包中包含真实接口测试、组件测试和浏览器测试：

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run tests/components/tutorial-projects.test.tsx
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts tests/logic/app-locale-coverage.test.ts tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

浏览器测试在单独的本地测试应用中运行，会创建项目和任务。把 `APP_URL` 设为 `pnpm dev` 输出的完整应用入口，用本地测试账号运行：

```bash
APP_URL=http://127.0.0.1:13321/main/ pnpm exec playwright test tests/playwright/tutorial-projects.test.ts
```

测试账号可以通过 `TUTORIAL_USERNAME` 和 `TUTORIAL_PASSWORD` 环境变量指定，不要把生产账号写进脚本。创建、分配、解除关联和权限范围都在真实数据库上验证；组件测试只在会话、网络传输和 jsdom 浏览器能力这些必要的边界上使用替身。

### 示例边界

至此，项目模型、业务接口和页面操作已经连在一起。以后新增其他业务页面时，也可以沿用这个顺序：先明确数据和权限，再声明路由和组件，最后补齐加载、失败、保存反馈和验证。

本例仍采用“最后一次成功保存生效”的规则，没有增加并发版本检查。搜索只按名称做包含匹配，排序只提供创建时间一种，并不支持按中文拼音排序。
