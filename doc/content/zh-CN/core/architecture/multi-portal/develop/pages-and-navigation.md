---
title: 页面与导航
metaDescription: 在门户的页面清单中新增页面，注册页面组件并添加导航入口。
---

下面以[快速开始](../quickstart.md)中生成的库存门户为例，新增 **Materials**（物料）和 **Stock**（库存）两个页面，并把它们加入侧栏。页面沿用 shadcn/ui 组件约定，优先复用应用已有的组件和 NocoBase UI Library。

## 门户由哪些部分组成

门户代码位于 `packages/app-portal-inventory/`。和页面相关的文件有这几个：

| 文件 | 负责什么 |
| --- | --- |
| `package.json` | 门户的名称、说明、图标和地址 |
| `portal-routes.ts` | 页面清单：门户有哪些页面、路径和标题 |
| `client/routes.ts` | 用 `definePortalRoutes` 把页面清单、布局和页面组件组合成门户的路由 |
| `client/layout.tsx` | 门户的布局：Logo、导航、头部按钮 |
| `client/pages/` | 各个页面组件 |
| `client/locales/index.ts` | 页面文案的翻译 |

页面清单同时供前端和服务端读取：前端据此生成路由，服务端据此生成每个页面的授权项，显示在 **角色与权限 → 多门户** 中。所以新增页面时只改清单一处，页面和授权项就能保持一致。

门户的所有页面都显示在门户自己的布局中，不会出现应用的侧栏和头部。页面组件只渲染自己的内容，不需要再包一层布局。

## 新增页面

### 在页面清单中声明页面

在 `portal-routes.ts` 中追加两项：

```ts
export const portalRoutes: readonly PortalRouteDeclaration[] = [
  { name: 'overview', path: '', breadcrumb: { title: 'overview' } },
  { name: 'materials', path: 'materials', breadcrumb: { title: 'materials' } },
  { name: 'stock', path: 'stock', breadcrumb: { title: 'stock' } },
];
```

- `name` 是页面名，在门户内不能重复。
- `path` 是相对门户地址的路径。`materials` 对应 `/portals/inventory/materials`；`''` 是门户首页。
- `breadcrumb.title` 是页面标题的翻译键，标题显示在门户头部，也是权限配置中这个页面的名称。

路径不能以 `/` 开头，也不能包含 `..`、`?query`、`#` 或 `*`；不符合时应用启动会报错。

### 编写页面组件

新建 `client/pages/materials.tsx`，默认导出页面组件：

```tsx
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

const materials = [
  { sku: 'MAT-001', name: 'Steel bolt M8', unit: 'pcs' },
  { sku: 'MAT-002', name: 'Copper wire 2.5 mm', unit: 'm' },
  { sku: 'MAT-003', name: 'Packing tape', unit: 'roll' },
];

export default function MaterialsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-portal-inventory');
  return (
    <section className='p-6'>
      <p className='text-muted-foreground'>{t('materialsDescription')}</p>
      <ul className='mt-6 divide-y rounded-xl border'>
        {materials.map((item) => (
          <li key={item.sku} className='flex justify-between gap-4 p-4'>
            <span className='font-medium'>{item.name}</span>
            <span className='text-sm text-muted-foreground'>
              {item.sku} · {item.unit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

页面标题已经由布局根据 `breadcrumb.title` 显示，页面中不用重复。按同样方式新建 `client/pages/stock.tsx`。

这里的物料直接写在代码中，用来演示页面结构；需要保存和读取数据时，见[数据与接口](data-and-apis.md)。

### 注册页面组件

在 `client/routes.ts` 中，按页面名在 `components` 中加上对应组件：

```ts
const routes: AppClientRouteContribution = definePortalRoutes({
  manifest,
  layout: () => import('./layout.js'),
  routes: portalRoutes,
  components: {
    overview: () => import('./pages/overview.js'),
    materials: () => import('./pages/materials.js'),
    stock: () => import('./pages/stock.js'),
  },
});
```

清单中的页面在 `components` 中找不到组件时，应用启动会报错。

### 补充页面文案

在 `client/locales/index.ts` 中，为每种语言加上新文案。以英文为例：

```ts
'en-US': async () => ({
  default: {
    overview: overview['en-US'],
    materials: 'Materials',
    stock: 'Stock',
    materialsDescription: 'Materials stocked in the warehouse.',
  },
}),
```

其他语言按同样的键补充翻译；缺少翻译时显示英文。

## 添加导航入口

在 `client/layout.tsx` 中，向 `sidebar` 追加两个菜单项：

```tsx
import { Boxes, ChartNoAxesCombined, Package } from 'lucide-react';

// …

<PortalLayout
  logo={<Logo title={title} />}
  switcher={<PortalSwitcher />}
  sidebar={[
    { path: portal.entry, title: t('overview'), icon: ChartNoAxesCombined, end: true },
    { path: `${portal.entry}/materials`, title: t('materials'), icon: Package },
    { path: `${portal.entry}/stock`, title: t('stock'), icon: Boxes },
  ]}
/>
```

- `portal.entry` 是门户地址 `/portals/inventory`，不要在路径中写 `/main` 等应用基础路径。
- `icon` 使用 `lucide-react` 中的图标组件。
- `end: true` 表示只在地址完全一致时高亮，通常用于首页。

成员没有权限打开的页面，对应的菜单项会自动隐藏。改用顶部导航或调整 Logo、头部按钮，见[门户布局](layout.md)。

## 子页面与带参数的页面

### 让多个页面共用一个授权项

默认情况下，每个页面在权限配置中都是单独的一项。希望 **Stock** 和 **Materials** 一起开放时，给 Stock 加上 `group`：

```ts
{ name: 'stock', path: 'stock', group: 'materials', breadcrumb: { title: 'stock' } },
```

之后在 **角色与权限 → 多门户** 中，勾选 Materials 就同时开放这两个页面。

### 带参数的页面

物料详情这类页面需要在地址中带上记录 ID：

```ts
{ name: 'material', path: 'materials/:id', group: 'materials', breadcrumb: { title: 'material' } },
```

页面组件中用路由参数读取 `id`。参数加上 `?` 表示可选，如 `stock/:warehouse?` 同时匹配 `/portals/inventory/stock` 和 `/portals/inventory/stock/main-warehouse`。

如果成员只被开放了需要参数的页面，从我的门户进入时会看到提示：此门户通过记录链接打开。

页面清单还支持子页面、单独授权和自定义权限检查，完整字段见[门户开发参考](../reference.md#页面清单字段)。

## 验证页面

修改页面清单或注册后，重启应用：

```bash
pnpm dev
```

然后检查：

- 点击侧栏中的 **Materials** 和 **Stock** 能打开对应页面，标题显示在门户头部。
- 直接打开 `/main/portals/inventory/materials` 并刷新，页面仍能显示；应用基础路径不是 `/main` 时，换成实际路径。
- **角色与权限 → 多门户** 中，库存门户下出现了新页面。

最后在应用根目录运行门户的检查：

```bash
pnpm --filter @nocobase/app-portal-inventory check
```
