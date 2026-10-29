---
title: React Provider 的注册与挂载
---

React Provider 为页面树提供上下文，例如表单状态、主题或共享交互。它是接收 `children` 的 React 组件，和注册应用服务的 ServiceProvider 各有职责。

## 声明 Provider

下面的模块可放在应用的 React Provider 聚合位置，或作为插件的 `reactProviders` 贡献：

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

示例的偏好只存在当前 React 树内，刷新后恢复默认。若组件需要持久化，另行接入浏览器存储或服务端接口。

## 排序与挂载时机

运行时按照 `layer` 和显式 `before` / `after` 关系从外到内排列 Provider。只有确实依赖另一个上下文时才声明顺序，名称应稳定且避免冲突。

解析声明不会执行组件。宿主在应用启动后渲染 `AppClientRoot`，Provider 才挂载。Effect 的订阅必须返回清理函数，并能应对 React 开发环境中的重复挂载检查。

## 与服务容器配合

应用服务的注册和生命周期放在 ServiceProvider；React Provider 可以通过应用上下文解析服务，再把可订阅状态适配给组件。不要在 React render 中新建共享连接，也不要认为 `useService()` 自动订阅服务对象的变化。

测试同时检查消费者是否拿到上下文、更新是否重渲染、卸载是否清理。已有应用应加入原聚合声明，不要绕过框架再创建一套不相连的页面树。

进一步阅读[客户端服务](../services/integration.md#客户端服务)与[组件与样式](../../extension-development/frontend-components.md)。

## 接口与实现

- [React Provider contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
