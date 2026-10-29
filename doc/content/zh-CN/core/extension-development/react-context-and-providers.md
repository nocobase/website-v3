---
title: React Context 与 Provider
description: 在插件中定义显示偏好上下文，通过 reactProviders 接入应用组件树，并验证共享状态与挂载范围。
---

本篇为公告页面提供紧凑显示偏好，重点说明 `contexts.ts`、Provider 组件和 `react-providers/` 怎样连接。状态由 React 树维护，不需要数据库、HTTP 接口或 ServiceProvider。React Context 的一般使用见[UI 组件与交互](../developing-apps/pages-and-interactions.md)，挂载与排序机制见[React Provider 的注册与挂载](../framework/runtime/react-providers.md)。

## 前提与相关文件

沿用[第一个插件](write-your-first-plugin.md)的 `@nocobase/app-plugin-announcements`，本篇只需要 Client 入口。以下文件路径相对于插件根目录，命令在 App 根目录执行。已有同名文件或声明时合并改动，保留页面、语言资源和其他贡献。

新建插件时可选 `client.react-providers`；已有插件按下文补齐文件，无需重新创建。`react` 使用插件约定的兼容 peer 依赖，测试沿用脚手架的 jsdom 配置。

## 使用 Agent

```prompt
给公告插件增加紧凑显示偏好，用 React Context 在页面组件间共享。
将 Provider 接入插件的 reactProviders，保留已有路由和语言资源。
本例不持久化偏好，刷新后恢复默认值。验证多个消费者同步更新，
并通过真实 Client 插件声明渲染测试，不直接调用带 Hook 的组件函数。
```

## 定义上下文

新增或合并 `client/contexts.ts`。缺少 Provider 时明确报错，避免默认空函数掩盖接入遗漏：

```ts
import { createContext, useContext, type Context } from 'react';

export interface AnnouncementDisplay {
  readonly compact: boolean;
  readonly setCompact: (value: boolean) => void;
}
export const AnnouncementDisplayContext: Context<AnnouncementDisplay | undefined> =
  createContext<AnnouncementDisplay | undefined>(undefined);

export function useAnnouncementDisplay(): AnnouncementDisplay {
  const value = useContext(AnnouncementDisplayContext);
  if (!value) throw new Error('AnnouncementDisplayProvider is required.');
  return value;
}
```

## 实现 Provider

在 `client/components/provider.tsx` 中维护状态。这个 Provider 实例里的消费者共享同一个值；不同应用实例或额外嵌套的 Provider 各自维护状态。

```tsx
import { useMemo, useState, type PropsWithChildren, type ReactElement } from 'react';
import { AnnouncementDisplayContext, type AnnouncementDisplay } from '../contexts.js';

export function AnnouncementDisplayProvider({ children }: PropsWithChildren): ReactElement {
  const [compact, setCompact] = useState(false);
  const value = useMemo<AnnouncementDisplay>(
    () => ({ compact, setCompact }),
    [compact],
  );
  return (
    <AnnouncementDisplayContext.Provider value={value}>
      {children}
    </AnnouncementDisplayContext.Provider>
  );
}
```

本例没有外部资源，无需添加空 Effect。需要订阅浏览器事件时，在 Effect 中返回清理函数，并能应对开发环境的重复挂载检查。该状态不跨浏览器共享，页面刷新或 Provider 重新挂载后恢复默认值。

## 声明并接入插件

`client/react-providers/index.ts` 汇总 React Provider：

```ts
import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';
import { AnnouncementDisplayProvider } from '../components/provider.js';

const reactProviders: readonly AppClientReactProviderDefinition[] = defineClientReactProviders([
  {
    name: 'announcements-display',
    layer: 'extension',
    component: AnnouncementDisplayProvider,
  },
]);
export default reactProviders;
```

`name` 是稳定的贡献名称，采用 `announcements-display` 这样的短名，不把包含 `@`、`/` 的包路径直接用作它的名字。运行时另行记录所属插件。确实依赖其他上下文时，才按框架规则声明排序关系。

在 `client/plugin.ts` 导入这个聚合文件，并把 `reactProviders` 加入已有的 `defineClientPlugin()` 声明。保留 `packageName`、`routes`、`locales` 和已有服务注册。`client/index.ts` 继续导出插件工厂；App 在 `client/plugins.ts` 中注册该工厂后，Provider 随应用组件树挂载。

组件通过 `useAnnouncementDisplay()` 读取 `compact` 和 `setCompact`。已有公告页面可把 `compact` 传给列表组件，在既有的 shadcn 控件中调用 `setCompact()`；文案使用插件语言资源。不要再在页面外层手动包一份同样的 Provider，否则会产生另一份状态。

需要让应用或其他插件使用这个 Hook 时，在 `client/index.ts` 增加命名导出，同时保留默认导出：

```ts
export { useAnnouncementDisplay } from './contexts.js';
```

导入 Hook 不会自动挂载 Provider；消费方仍需注册插件。公开入口约定见[插件声明与公开入口](plugin-declarations.md)。

## 验证共享状态与接入

替换脚手架中直接调用 Provider 函数的测试。Provider 现在包含 Hook，必须通过 React 渲染。以下内容保存到 `tests/client/react-provider.test.tsx`；原生按钮只用于测试消费者，不是业务 UI 示例：

```tsx
import { fireEvent, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it } from 'vitest';
import plugin from '../../client/index.js';
import { useAnnouncementDisplay } from '../../client/contexts.js';

function Consumer({ id }: { id: string }): ReactElement {
  const { compact, setCompact } = useAnnouncementDisplay();
  return <button onClick={() => setCompact(!compact)}>{id}:{String(compact)}</button>;
}

it('shares display state through the registered plugin Provider', async () => {
  const view = await renderWithApp(<><Consumer id="a" /><Consumer id="b" /></>, {
    plugins: [plugin()],
  });
  fireEvent.click(screen.getByText('a:false'));
  expect(screen.getByText('a:true')).toBeDefined();
  expect(screen.getByText('b:true')).toBeDefined();
  view.unmount();
});
```

还应检查缺少注册时的失败、重新挂载后的默认值，以及新增 Effect 的订阅清理。`renderWithApp()` 已提供应用与路由环境，不再包另一层 Router。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

注册命令只在需要新增或核对接入时执行；已有注册保留原条目。测试证明上下文接入和状态变化，实际页面仍需检查显示密度、导航和主题效果。
