---
title: UI 组件与交互
description: 遵循 shadcn 规范，接入 NocoBase UI Library 的源码组件、业务区块、路由弹窗和应用上下文。
---

NocoBase 应用统一使用 shadcn 规范组织 UI。组件源码放在应用中，页面负责连接数据与操作，应用负责维护自己的组件和交互约定。

下面以商品目录示例展示各用法。商品、人员和评审记录都是演示数据；商品修改只保留到刷新页面，评审备注在离开页面后重置。完整源码与启动方式见文末[示例源码与运行](#示例源码与运行)。

## 组件规范

### 统一遵循 shadcn 规范

按钮、输入框、表单和确认框使用应用中的 shadcn 组件，沿用统一的主题、交互和可访问性约定。[NocoBase UI Library](https://ui.nocobase.com/) 通过 shadcn Registry 分发适合 NocoBase 应用的组件与业务区块，也遵循这套规范。

当前示例使用模板 `1.0.0-beta.85` 的 Base UI 组件。组合 API 以应用已经安装的源码为准，例如这里使用 `render`，不要直接混入其他实现的 `asChild` 用法。通用组件用法见 [shadcn 官方文档](https://ui.shadcn.com/docs)。

### 优先复用应用已有组件

先检查 `client/components/` 和现有页面。默认模板已提供 `PageContainer`、`PageHeader`、`DataTable` 和路由弹窗；基础组件在 `client/components/ui/`。缺少组件时再通过项目里的 shadcn CLI 添加。

商品目录复用已有的 `DataTable`、`Input` 和行操作菜单，把库存状态封装为可复用的 `StockBadge`。无需另写一套表格或按钮：

```tsx
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Input } from '#components/ui/input';

// CatalogPage 中的关键组合；筛选、列和状态见完整源码。
<PageHeader title={t('catalog.title')} description={t('catalog.description')} />
<DataTable
  data={products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))}
  columns={columns}
  pagination={false}
  toolbar={() => (
    <Input
      aria-label={t('catalog.search')}
      placeholder={t('catalog.search')}
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  )}
/>
```

打开示例的 **Product catalog**，搜索商品或从行菜单选择 **Edit**。[查看目录页源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/catalog.tsx)。

![商品目录复用页面标题、表格、搜索框和行操作菜单](/assets/core/developing-apps/pages-and-interactions/catalog.png)

## 使用 NocoBase UI Library

### 配置 Registry 与添加组件

默认模板的 `components.json` 已配置 NocoBase Registry。已有应用缺少此项时，在原配置中补充：

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

在应用根目录运行项目安装的 CLI。例如，添加页面标题组件或评审展示区块：

```bash
pnpm exec shadcn add @nocobase/page-header
pnpm exec shadcn add @nocobase/approval-ui
```

已有的组件可以直接使用。CLI 询问是否覆盖文件时，保留现有文件，先检查差异；不要为了添加区块一起覆盖应用里的基础组件。

示例安装 `approval-ui` 后新增 13 个文件，主要位置如下：

```text
client/components/page-header.tsx
client/extensions/nocobase-approval-ui/
  index.ts
  types.ts
  approval-progress.tsx
  approval-timeline.tsx
  approval-action-bar.tsx
  approval-ui-provider.tsx
  locales/
  ...
```

[查看 Registry 配置](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/components.json) · [查看已安装的区块源码](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/extensions/nocobase-approval-ui)。

### 使用组件与业务区块

从应用内的源码路径导入。单个组件通常位于 `client/components/`；区块包含多个组件、类型和语言资源，通常位于 `client/extensions/nocobase-<名称>/`。

示例的 **Review block** 把进度、历史和操作栏组合在同一页：

```tsx
import {
  ApprovalProgress,
  ApprovalTimeline,
  ApprovalActionBar,
} from '#extensions/nocobase-approval-ui/index';

// ReviewPage 中的区块组合；steps、lines、actions 由页面准备。
<ApprovalProgress steps={steps} />
<ApprovalTimeline lines={lines} />
<ApprovalActionBar actions={actions} />
```

打开 **Review block**，可以看到商品资料已提交、内容评审正在进行。[查看区块组合源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx)。

![进度、历史和操作栏组合成商品评审界面](/assets/core/developing-apps/pages-and-interactions/review-block.png)

### 确认依赖与源码位置

Registry 安装的是源码及其声明的依赖，不会自动完成业务接入。检查资产说明、生成的文件、`package.json` 和锁文件，确认区块需要哪些数据、回调、Provider、语言资源或插件。

例如，`approval-ui` 是展示区块，不要求安装审批插件，也不提供审批引擎。示例把固定评审数据传入组件，用回调更新页面中的备注。需要真实审批流程时，应另外接入相应的业务能力；按钮是否可见也不能代替服务端授权。

shadcn CLI 可能把新增的前端依赖写入 `dependencies`。按应用约定，将仅客户端使用的包放入 `devDependencies`，服务端也使用的包仍留在 `dependencies`。导入别名由 `package.json` 的 `imports` 和 `components.json` 共同确定，不要为同一目录另加一套 Vite 或 TypeScript 别名。

要分发自己的组件源码，见[前端扩展](../extension-development/frontend-components.md)；Registry 的通用机制见 [shadcn Registry](https://ui.shadcn.com/docs/registry)。

## 接入应用交互

### 接入业务区块的数据与操作

区块定义输入和交互契约，页面把业务数据转换为这些输入，并决定操作完成后的变化。`ApprovalActionBar` 的 `form` 定义输入与校验，`run` 执行操作；返回 `false` 时保留表单，其他正常返回会关闭表单。

示例的 **Add review note** 使用以下关键配置。完整的输入框渲染和状态声明见[操作接入源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx)：

```tsx
{
  key: 'note',
  label: t('catalog.review.addNote'),
  primary: true,
  form: {
    initialValues: { note: '' },
    validate: (values) => noteText(values.note).trim() ? [] : ['note'],
    // render 使用区块传入的 values、setValues、invalid 和 busy 绘制表单。
  },
  run: async (values) => {
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (rejectNext) {
      setRejectNext(false);
      setError(t('catalog.review.refused'));
      return false;
    }
    setComment(noteText(values.note).trim());
  },
}
```

点击 **Add review note**，空内容不能提交。填写备注后提交，历史区域出现新备注，操作表单关闭。这里的延迟用于观察执行状态，真实应用应在回调中调用业务接口，并处理失败。

![评审备注表单及必填校验](/assets/core/developing-apps/pages-and-interactions/review-note.png)

先点击 **Refuse the next note** 再提交，可以复现 `run` 返回 `false`：页面解释失败原因，输入仍然保留，再次提交即可成功。不要把异常直接丢给区块而不提供可见反馈。真实数据请求与刷新方式见[数据请求与状态管理](data-requests-and-state.md)。

![操作被拒绝后保留表单和已填写的备注](/assets/core/developing-apps/pages-and-interactions/review-refused.png)

### 使用路由弹窗与关闭保护

代表记录编辑或详情的弹窗使用子路由。父页面放置 `<Outlet />`，子页面用 `RouteDialog` 承载表单；打开状态由 URL 决定。商品示例中，`catalog/edit/:productId` 是目录页的子路由：

```tsx
// client/routes.ts 中 /ui-components 下的 catalog 路由。
{
  name: 'uiCatalog',
  path: 'catalog',
  componentLoader: () => import('./pages/ui-components/catalog.js'),
  children: [{
    name: 'uiProductEdit',
    path: 'edit/:productId',
    componentLoader: () => import('./pages/ui-components/edit.js'),
  }],
}
```

点击 **Arc desk lamp** 打开编辑弹窗，直接访问同一 URL 也能打开。路由声明与嵌套方式详见[页面、路由与导航](pages-routes-and-navigation.md)。[查看编辑页源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/edit.tsx)。

![通过商品子路由打开编辑弹窗](/assets/core/developing-apps/pages-and-interactions/edit-product.png)

`useRouteOverlay()` 必须在 `RouteDialog` 的后代组件中调用，例如传入 `footer` 的组件。它的 `close()` 先执行 `beforeClose`，允许后再返回父路由；默认保留查询参数。不要在返回 `RouteDialog` 的页面组件本身调用这个 Hook。

```tsx
function EditorFooter({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return <>
    <Button variant="outline" disabled={pending || isClosing}
      onClick={() => void close()}>{t('catalog.cancel')}</Button>
    <Button type="submit" form="product-edit"
      disabled={pending || isClosing || disabled}>{t('catalog.save')}</Button>
  </>;
}
```

示例的关闭检查先阻止正在提交的表单离开；存在未保存修改时，返回等待确认的 Promise。选择 **Keep editing** 保留输入，选择 **Discard** 才离开。共用同一个待确认 Promise，避免连续触发时出现多次确认。

```tsx
// useEditorLeave 中的核心判断；确认框和 Promise 管理见完整源码。
function guard() {
  if (allowedRef.current) return true;
  if (flagsRef.current.pending) return false;
  if (!flagsRef.current.dirty) return true;
  if (!requestRef.current) {
    let resolve!: (allow: boolean) => void;
    const promise = new Promise<boolean>((done) => { resolve = done; });
    requestRef.current = { promise, resolve };
    setOpen(true);
  }
  return requestRef.current.promise;
}
useNavigationGuard(guard);

// 编辑页把相同的检查传给弹窗。
<RouteDialog beforeClose={leave.guard} footer={<EditorFooter pending={pending} disabled={!product} />}>
  {/* 表单与确认框 */}
</RouteDialog>
```

上面的片段只展示连接位置；可运行实现见[关闭保护源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/use-editor-leave.tsx)。保存时同步更新状态与 ref，成功后先解除保护再关闭，避免刚保存就被旧的提交状态拦住。

![放弃修改前的确认框叠加在编辑弹窗上](/assets/core/developing-apps/pages-and-interactions/discard-changes.png)

三种离开途径需要分别处理：

| 离开途径 | 示例使用的机制 |
| --- | --- |
| 关闭按钮、Esc、点击遮罩、调用 `close()` | `beforeClose` |
| 浏览器前进后退、应用内路由跳转 | `useNavigationGuard` |
| 刷新或关闭浏览器页面 | `beforeunload`，显示浏览器自己的提示 |

勾选 **Simulate save failure** 后保存，弹窗保持打开，输入不丢失；取消勾选即可重试。示例的“保存”只更新当前页面会话，不写数据库。

![保存失败后保留弹窗和输入](/assets/core/developing-apps/pages-and-interactions/save-failure.png)

### 接入区块需要的应用上下文

区块可能需要应用提供的人员名称、头像、日期格式等上下文。`ApprovalUiProvider` 不负责查询用户；示例用自己的人员映射和日期格式器提供这些能力。未提供 `personName` 时，区块默认显示人员 ID。

`CatalogApprovalProvider` 的关键配置如下；头像组合与完整实现见[Provider 源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/approval-provider.tsx)：

```tsx
<ApprovalUiProvider
  personName={(id) => people[id] ?? id}
  formatDateTime={(iso) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
    }).format(new Date(iso)) + ' UTC'
  }
>
  {children}
</ApprovalUiProvider>
```

示例选择 UTC 以便观察一致的结果；业务应用应按自己的时区要求格式化。多页需要相同上下文时，在 `client/react-providers.ts` 注册到 `application` 层，不必在每页重复包裹：

```tsx
// 加入原有 defineClientReactProviders([...])，保留已有注册。
{
  name: 'catalog-approval-ui',
  layer: 'application',
  component: CatalogApprovalProvider,
}
```

同时把区块语言资源合并到应用对应语言文件中，例如 `client/locales/en-US.ts` 中的 `...approvalUi`。这与 `client/service-provider.ts` 的服务注册不同：前者提供 React 渲染上下文，后者负责应用服务及启动逻辑。详见 [React Providers](../framework/runtime/react-providers.md)。

在 **Review block** 提交备注后，可以看到映射后的姓名、头像和 UTC 时间。[查看应用注册](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/react-providers.ts) · [查看语言资源](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/locales)。

![共享上下文为评审进度和更新后的历史提供姓名、头像和日期格式](/assets/core/developing-apps/pages-and-interactions/review-updated.png)

## 定制与维护组件

### 组织组件源码

按复用范围放置源码，不把页面私有逻辑都提升为全局组件：

| 位置 | 商品示例中的内容 |
| --- | --- |
| `client/pages/ui-components/` | 页面、局部表单、演示数据和交互 Hook |
| `client/components/stock-badge.tsx` | 表格与卡片共用的库存标签 |
| `client/components/ui/` | 通过 shadcn CLI 安装的基础组件 |
| `client/extensions/nocobase-approval-ui/` | Registry 安装的完整区块 |
| `client/react-providers.ts` | 应用级 React Provider 注册 |
| `client/locales/` | 应用文案与区块语言资源 |

[查看示例源码目录](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client)。页面容器和布局的详细约定见[页面布局](page-layouts.md)。

### 按业务需要定制组件

优先用现有组件的属性、变体和组合表达业务含义。示例把库存规则放在 `StockBadge`，继续使用原有 `Badge`，让表格和卡片保持一致：

```tsx
export function StockBadge({ stock }: { stock: number }) {
  const { t } = useTranslation();
  const state = stock === 0 ? 'out' : stock < 5 ? 'low' : 'available';
  return (
    <Badge variant={state === 'out' ? 'outline' : state === 'low' ? 'secondary' : 'default'}>
      {t(`catalog.stock.${state}`)}
    </Badge>
  );
}
```

打开 **Component variants**，三张商品卡片分别显示有货、库存不足和缺货；目录表格复用同一个组件。[查看库存标签源码](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/components/stock-badge.tsx) · [查看卡片示例](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/customize.tsx)。

![同一库存标签组件在三种业务状态下的表现](/assets/core/developing-apps/pages-and-interactions/stock-variants.png)

使用 `bg-muted`、`text-muted-foreground` 等语义 token，主题调整遵循应用的 `client/theme/` 约定。需要修改复制来的区块源码时，把业务适配尽量留在外层组件，并记录必须保留的改动；不要直接改写基础按钮来满足某一页的需要。

### 更新组件并保留业务修改

复制到应用的源码不会随 npm 包升级自动更新。更新前先提交当前代码，检查 Registry 的变化，再合并所需部分。例如，查看 `PageHeader` 的差异：

```bash
pnpm exec shadcn add @nocobase/page-header --diff client/components/page-header.tsx
```

示例核对时输出 `No changes.`。有差异时，同时检查组件依赖、导入路径和调用方契约；不要用整批覆盖替代合并。更新后重新验证业务变体、回调和弹窗关闭行为。

Registry 内容可能继续变化。本文的源码链接固定到示例提交；其[来源记录](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/docs/registry-sources.json)保留模板版本和区块资产校验值，便于比较升级前后的源码。

## 验证交互结果

### 验证各用法与关键状态

运行示例后，可以按以下操作检查：

| 入口 | 操作与预期结果 |
| --- | --- |
| **Product catalog** | 搜索能过滤商品；没有匹配项时显示空结果 |
| **Edit product** | 空名称不能保存；保存成功后列表立即更新；刷新恢复初始演示数据 |
| 编辑弹窗关闭 | 修改后取消或后退会确认；继续编辑保留输入；直接 URL 打开后也能返回目录 |
| **Simulate save failure** | 保存中不能关闭；失败后保留输入并允许重试 |
| **Review block** | 空备注不能提交；拒绝一次后保留表单；重试后历史更新 |
| **Component variants** | 三种库存状态都有文字；切换深色主题和缩窄窗口后仍可读、可操作 |

截图展示操作状态，关闭和返回行为仍需要实际验证。[示例浏览器测试](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/tests/playwright/ui-components.test.ts)覆盖上述流程，并检查查询参数保留、刷新提示和移动端弹窗尺寸。

### 运行测试与构建

在示例 App 目录运行：

```bash
pnpm typecheck
pnpm exec vitest run tests/client/ui-components.test.tsx tests/client/client-routes.test.ts tests/client/page-permission-titles.test.ts tests/client/route-overlay.test.tsx tests/project/agents-md.test.ts
pnpm build
```

启动应用后，把实际入口地址传给浏览器测试，包含应用部署前缀：

```bash
pnpm exec playwright install chromium
APP_URL=http://<host>:<port>/main/ pnpm exec playwright test tests/playwright/ui-components.test.ts
```

不设置 `APP_URL` 会跳过浏览器测试。此示例已通过类型检查、上述 30 项定向测试、5 个浏览器场景和构建；业务持久化、真实审批和业务角色授权不属于此 UI 示例的验证范围。

## 示例源码与运行

### 完整示例 App 源码

[查看完整示例](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components) · [查看 README](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/README.MD)。

这是独立应用，不依赖其他章节的示例。README 对应每个用法列出操作入口、源码、截图和验证方式。

### 环境准备与启动

使用 Node.js 24、pnpm 11。示例基于模板 `1.0.0-beta.85`，锁文件中的 `@nocobase/app-client` 为 `4.0.0-beta.5`。以下命令使用 SQLite 保存模板自身的系统数据；UI 演示数据保存在内存中，无需外部服务。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout c8670ab1f784d76c4fef61936bdc3462fe1c1d89
cd apps/ui-components
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

打开启动日志打印的应用入口，在部署前缀后追加 `ui-components/catalog`。例如入口以 `/main/` 结尾时，目录页为 `/main/ui-components/catalog`。这三个演示页面不需要登录；`config.yml` 和本地数据库不提交到仓库。其他数据库配置、局域网访问和截图生成方式见示例 README。
