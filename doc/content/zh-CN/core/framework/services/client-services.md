---
title: 客户端服务
---

客户端服务适合保存跨页面的业务协作逻辑、请求封装或共享状态。组件负责展示，服务负责可独立调用的行为；短暂的表单输入通常仍放在组件或 React Context 中。

## 从服务到可订阅状态

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { useService } from '@nocobase/app-client';
import { ServiceProvider, createServiceToken } from '@nocobase/service-provider';
import { useSyncExternalStore } from 'react';

export class CompactPreference {
  private value = false;
  private listeners = new Set<() => void>();
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  set(value: boolean) {
    if (value === this.value) return;
    this.value = value;
    for (const listener of this.listeners) listener();
  }
}
export const compactToken = createServiceToken<CompactPreference>('orders.compact');

export class CompactServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'orders.compact';
  register() {
    this.app.container.singleton(compactToken, () => new CompactPreference());
  }
}

export function useCompact() {
  const service = useService(compactToken);
  const value = useSyncExternalStore(service.subscribe, service.getSnapshot);
  return { value, set: (next: boolean) => service.set(next) };
}
```

将 `CompactServiceProvider` 加入应用的客户端 `serviceProviders`，或插件贡献中的同名数组。组件调用 `useCompact()` 读取和更新偏好。

`useService()` 只解析服务，不会订阅变化。示例通过 `useSyncExternalStore` 把服务状态接入 React，并在卸载时移除监听。快照必须在值不变时稳定；返回新对象作为每次快照可能导致无意义的更新。

## 与后端通信

通过 `useApiClient()`、`apiClientToken` 或构造函数参数使用已配置的 HTTP 客户端。服务收到取消信号时向请求继续传递，界面按请求状态处理加载、失败和重试。

不要将浏览器缓存的权限或当前用户对象作为服务端授权依据。登录切换时，应清理与旧身份有关的状态和请求缓存。

## 资源与测试

示例只有内存状态，不进行持久化。连接和全局监听由 Provider 生命周期建立与关闭；组件局部订阅由组件卸载清理。验证单例共享、值更新后重渲染和卸载后的监听数量。

相关主题：[API Client](../http/api-client.md)、[React Provider](../runtime/react-providers.md)。

## 接口与实现

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
