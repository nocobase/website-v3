---
title: 前后端服务接入
description: 把共用的服务契约接入客户端和服务端的容器，明确应用、插件、请求与组件各自拥有哪些资源。
---

`@nocobase/service-provider` 为应用和插件提供同一套容器、Token 和生命周期机制。浏览器和服务端各自拥有自己的容器；“共享契约”并不意味着跨网络共享实例。

## 选择注册与调用的位置

| 位置 | 注册方式 | 使用方式 |
| --- | --- | --- |
| 应用客户端 | 应用的客户端 ServiceProvider，由运行时接入 | 在 React 中用 `useService()`；普通服务通过构造参数取得依赖 |
| 插件客户端 | `client/plugin.ts` 中的 `serviceProviders` | 从插件的公开入口导入 Token，使用当前的客户端容器 |
| 应用服务端 | 应用的 Provider 汇总入口，由运行时接入 | 通过 `app.container.resolve()` 解析后传给业务代码 |
| 插件服务端 | `server/plugin.ts` 中的 `serviceProviders` | 使用宿主的容器，生命周期由应用统一调度 |

应用的 Provider 汇总文件通常是 `client/service-provider.ts` 和 `server/providers/index.ts`，具体以项目当前运行时实际引用的文件为准。文件存在并不代表已经注册。具体的接入方法见 [客户端业务服务](../../developing-apps/client-business-services.md)、[服务端业务服务](../../developing-apps/server-business-services.md) 和 [插件声明](../../extension-development/plugin-declarations.md)。

## 客户端服务

客户端服务适合存放跨页面协作的业务逻辑、请求封装或共享状态。组件负责展示，服务负责可以独立调用的行为；临时的表单输入通常仍然放在组件或 React Context 中。

### 把服务状态变成可订阅的状态

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

把 `CompactServiceProvider` 加入应用客户端的 `serviceProviders`，或插件贡献中的同名数组，组件即可调用 `useCompact()` 读取和更新这项偏好。

`useService()` 只负责解析服务，不会订阅变化。示例通过 `useSyncExternalStore` 把服务状态接入 React，并在卸载时移除监听。值没有变化时，快照必须保持稳定；每次都返回一个新对象作为快照，会导致无意义的更新。

### 与后端通信

通过 `useApiClient()`、`apiClientToken` 或构造函数参数，使用已经配置好的 HTTP 客户端。服务收到取消信号时，应继续传递给请求；界面根据请求的状态处理加载、失败和重试。

不要把浏览器中缓存的权限或当前用户对象当作服务端授权的依据。切换登录身份时，应清理与旧身份相关的状态和请求缓存。

### 资源与测试

示例只有内存中的状态，不做持久化。连接和全局监听由 Provider 的生命周期建立和关闭；组件内部的订阅在组件卸载时清理。测试时，验证单例是否被共享、值更新后是否重新渲染，以及卸载后的监听数量。

相关主题：[API Client](../http/api-client.md)、[React Provider 的注册与挂载](../runtime/react-providers.md)。

### 接口与实现

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)

## 服务端服务

服务端服务集中处理业务规则，让 HTTP 接口、CLI 和后台任务复用同一套行为。输入校验和身份提取在入口处完成，数据范围和业务约束则沿调用链显式传递。

### 把框架资源注入业务类

以下片段假设已经有一个包含 `id`、`title` 字段的 `orders` Collection：

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export class OrdersService {
  constructor(private readonly database: DatabaseManager) {}

  async list(policy: RepositoryPolicy) {
    return this.database.repository('orders').withPolicy(policy).findMany({
      select: (s) => s.fields('id', 'title'),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
  }
}
```

ServiceProvider 通过 `databaseManagerToken` 解析应用数据库，注入 `OrdersService`，再用业务 Token 注册这个服务。路由从应用容器中取得服务，并传入授权得出的策略；不能直接信任请求中携带的策略对象。

### 请求状态不属于单例

不要在服务的字段中保存当前用户、当前事务或本次请求的输入，否则并发的请求可能互相覆盖。请把这些值作为方法参数传入。HTTP Context 可以在路由层转换成业务所需的小型上下文，避免服务与某个 Web 框架绑定。

### 事务与外部副作用

需要多步原子写入时，在服务方法中创建事务，并通过回调中的连接取得 Repository。方法返回之后，就不能再使用这个事务连接。发送邮件、调用外部 HTTP、投递队列消息通常不会随数据库一起回滚；请把它们安排在提交之后的流程中，并按业务需要记录重试信息和幂等键。

不要把“数据库已提交”和“通知已送达”合并成一个无法恢复的状态。如果投递必须强一致，需要明确设计持久化的待投递记录和恢复流程。

### 多个入口复用与测试

CLI 命令或后台任务没有浏览器请求的身份，应明确系统执行者以及允许访问的数据范围。不能因为复用了同一个服务，就默认拥有管理员权限。

业务规则用单元测试验证；策略、事务和并发行为则用真实数据库测试。完整的接入方式见 [服务端业务服务](../../developing-apps/server-business-services.md) 和 [事务](../database/transactions.md)。

### 接口与实现

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
