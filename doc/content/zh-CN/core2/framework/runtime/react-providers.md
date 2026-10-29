---
title: React Provider 的注册与挂载
description: 了解如何声明 React Provider、它们的排序与挂载时机，以及如何与服务容器配合。
---

React Provider 为页面树提供上下文，例如表单状态、主题或共享的交互。它是一个接收 `children` 的 React 组件，与注册应用服务的 ServiceProvider 职责不同。

## 声明 Provider

下面的模块可以放在应用汇总 React Provider 的位置，也可以作为插件的 `reactProviders` 贡献：

```tsx
import { createContext, useState, type PropsWithChildren } from 'react';
import { defineClientReactProviders } from '@nocobase/app-client/plugins';

export const CompactContext = createContext({
  compact: false,
  setCompact: (_value: boolean) => {},
});

function CompactProvider({ children }: PropsWithChildren) {
  const [compact, setCompact] = useState(false);
  return <CompactContext.Provider value={{ compact, setCompact }}>
    {children}
  </CompactContext.Provider>;
}

export default defineClientReactProviders([
  { name: 'orders.compact', layer: 'extension', component: CompactProvider },
]);
```

示例中的偏好只保存在当前的 React 树中，刷新页面后会恢复默认值。如果需要持久化，请另外接入浏览器存储或服务端接口。

## 排序与挂载时机

运行时根据 `layer` 以及显式声明的 `before` / `after` 关系，从外到内排列 Provider。只有确实依赖另一个上下文时，才需要声明顺序；Provider 的名称应保持稳定，并避免冲突。

解析声明并不会执行组件。宿主在应用启动后渲染 `AppClientRoot`，Provider 这时才会挂载。Effect 中的订阅必须返回清理函数，并能应对 React 开发环境中的重复挂载检查。

## 与服务容器配合

应用服务的注册和生命周期由 ServiceProvider 负责；React Provider 可以通过应用上下文解析服务，再把可订阅的状态提供给组件。不要在 React 的 render 过程中新建共享连接，也不要以为 `useService()` 会自动订阅服务对象的变化。

测试时要同时检查：使用方能否拿到上下文、更新后是否重新渲染、卸载时是否完成清理。在已有应用中，请把 Provider 加入原有的汇总声明，不要绕过框架另建一套互不相连的页面树。

继续阅读 [客户端服务](../services/integration.md#客户端服务) 和 [组件与样式](../../extension-development/frontend-components.md)。

## 接口与实现

- [React Provider contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
