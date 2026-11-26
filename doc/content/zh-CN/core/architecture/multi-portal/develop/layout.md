---
title: 门户布局
metaDescription: 用 PortalLayout 设置门户的 Logo、侧栏或顶部导航、切换器、头部按钮和内容区。
---

每个门户都有自己的布局，写在门户的 `client/layout.tsx` 中。布局基于多门户插件提供的 `PortalLayout`，通过属性决定 Logo、导航、切换器和头部按钮。修改一个门户的布局不会影响应用和其他门户。

生成的布局如下：

```tsx
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { ChartNoAxesCombined } from 'lucide-react';
import {
  PortalLayout,
  PortalSwitcher,
  usePortal,
  usePortalText,
} from '@nocobase/app-plugin-multi-portal/client/layout';
import { Logo } from './assets/logo.js';

export default function Layout(): ReactElement | null {
  const { t } = useTranslation();
  const portal = usePortal()?.portal;
  const { title } = usePortalText(portal);
  if (!portal) return null;
  return (
    <PortalLayout
      logo={<Logo title={title} />}
      switcher={<PortalSwitcher />}
      sidebar={[
        { path: portal.entry, title: t('overview'), icon: ChartNoAxesCombined, end: true },
      ]}
    />
  );
}
```

`usePortal()` 返回当前门户，`usePortalText()` 返回门户在当前语言下的名称和说明。

## 选择侧栏或顶部导航

`sidebar` 和 `topNav` 接收同样的菜单项 `{ path, title, icon?, end? }`，二选一：

- **`sidebar`**：左侧菜单。桌面端可以收起，并按门户记住收起状态；手机上收进抽屉。
- **`topNav`**：头部横向导航，适合页面较少的门户。

例如，把一个销售门户改为顶部导航：

```tsx
<PortalLayout
  logo={<Logo title={title} />}
  topNav={[
    { path: portal.entry, title: t('overview'), end: true },
    { path: `${portal.entry}/orders`, title: t('orders') },
  ]}
/>
```

成员没有权限打开的页面，菜单项会自动隐藏。新增菜单项的步骤见[页面与导航](pages-and-navigation.md#添加导航入口)。

## 门户 Logo 与切换器

`logo` 显示在侧栏顶部，没有侧栏时显示在头部。门户不会使用应用的 Logo。

生成的 `client/assets/logo.tsx` 是一个占位图形，可以换成自己的图形，也可以直接使用图片：

```tsx
import logoUrl from './logo.svg';

<PortalLayout logo={<img src={logoUrl} alt={title} className='h-7 w-auto' />} … />
```

`switcher` 通常是 `<PortalSwitcher />`。它列出当前成员可以进入的门户，勾选当前门户，并提供 **返回我的门户**。门户多时列表可以滚动，过长的名称会截断显示。如果门户的使用者没有其他门户，可以不传 `switcher`。

## 头部按钮与头像菜单

门户的头部按钮来自应用，站内信、Agent 等按钮在门户中同样可用。应用通过头部按钮配置隐藏或替换某个按钮后，门户中也会同步生效。每个按钮还会按它对应页面的访问权限过滤。

`headerActions` 决定门户显示哪些应用按钮：

| 写法 | 效果 |
| --- | --- |
| 不传 | 显示应用的全部头部按钮 |
| `{ include: ['inbox'] }` | 只显示列出的按钮 |
| `{ exclude: ['agent'] }` | 隐藏列出的按钮 |
| `false` | 不显示应用的按钮 |

按钮名称以应用的头部按钮配置为准。

头像菜单固定在头部最右侧，默认包含头像、语言切换、个人设置和退出登录；个人设置会打开应用的个人设置页。用 `userMenu` 可以换成自己的菜单，或传 `false` 不显示。

例如，面向外部客户的门户只保留头像菜单：

```tsx
<PortalLayout logo={<Logo title={title} />} topNav={navigation} headerActions={false} />
```

## 页面内容区

内容区默认显示当前页面。希望门户的所有页面都使用同一个内容容器时，在 `children` 中用 `PortalOutlet` 包一层。例如，让内容居中并限制最大宽度：

```tsx
import { PortalOutlet } from '@nocobase/app-plugin-multi-portal/client/layout';

<PortalLayout logo={<Logo title={title} />} sidebar={navigation}>
  <div className='mx-auto w-full max-w-5xl'>
    <PortalOutlet />
  </div>
</PortalLayout>
```

只想调整某一个页面时，把容器写在那个页面组件中。

`PortalLayout` 只通过上面这些属性组合出不同的布局，没有单独的“顶部布局”选项。样式使用应用的主题变量和已有的样式类；门户包中新增的 Tailwind 类不生效时，检查应用的样式扫描是否包含 `packages/` 下的门户目录。

内容区还会根据成员的权限和门户状态显示提示，门户中不需要自己处理：成员没有门户的访问权限或门户已卸载时，显示对应提示；打开没有权限的页面时，在布局中显示无权访问。Agent 等应用侧栏也可以在门户中打开。

这些提示和菜单隐藏只影响界面，业务接口仍要在服务端检查权限，见[数据与接口](data-and-apis.md#检查访问权限)。

## 手机上的显示

手机上不需要另写布局：

- 使用 `sidebar` 时，侧栏收进抽屉。抽屉中包含 Logo、切换器和菜单，点击菜单后自动关闭。
- 头部按钮超过两个时，收进 **更多** 菜单，头像菜单仍在最后。

修改布局后，分别在桌面和手机宽度下检查导航、切换器和头部按钮。
