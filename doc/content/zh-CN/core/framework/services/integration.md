---
title: 前后端服务接入
description: 将共用服务契约接入客户端和服务端容器，明确应用、插件、请求与组件的资源归属。
---

`@nocobase/service-provider` 为应用和插件提供同一套容器、Token 与生命周期机制。浏览器和服务端各自拥有容器；“共享契约”不表示共享跨网络的实例。

## 选择注册与调用位置

| 位置 | 注册方式 | 使用方式 |
| --- | --- | --- |
| 应用客户端 | 应用客户端 ServiceProvider，由运行时接入 | React 中用 `useService()`，普通服务通过构造参数取得依赖 |
| 插件客户端 | `client/plugin.ts` 的 `serviceProviders` | 从插件公开入口导入 Token，使用当前客户端容器 |
| 应用服务端 | 应用 Provider 聚合入口，由运行时接入 | 通过 `app.container.resolve()` 解析后传给业务代码 |
| 插件服务端 | `server/plugin.ts` 的 `serviceProviders` | 使用宿主容器，生命周期由应用统一调度 |

应用的 Provider 汇总通常位于 `client/service-provider.ts` 和 `server/providers/index.ts`，以项目当前运行时引用为准。文件存在不等于已经注册。具体接入见[客户端业务服务](../../developing-apps/client-business-services.md)、[服务端业务服务](../../developing-apps/server-business-services.md)与[插件声明](../../extension-development/plugin-declarations.md)。

## 客户端服务

客户端服务适合保存跨页面的业务协作逻辑、请求封装或共享状态。组件负责展示，服务负责可独立调用的行为；短暂的表单输入通常仍放在组件或 React Context 中。

### 从服务到可订阅状态

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

### 与后端通信

通过 `useApiClient()`、`apiClientToken` 或构造函数参数使用已配置的 HTTP 客户端。服务收到取消信号时向请求继续传递，界面按请求状态处理加载、失败和重试。

不要将浏览器缓存的权限或当前用户对象作为服务端授权依据。登录切换时，应清理与旧身份有关的状态和请求缓存。

### 资源与测试

示例只有内存状态，不进行持久化。连接和全局监听由 Provider 生命周期建立与关闭；组件局部订阅由组件卸载清理。验证单例共享、值更新后重渲染和卸载后的监听数量。

相关主题：[API Client](../http/api-client.md)、[React Provider](../runtime/react-providers.md)。

### 接口与实现

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)

## 服务端服务

服务端服务集中处理业务规则，让 HTTP、CLI 和后台工作复用同一行为。输入校验与身份提取发生在入口，数据范围和业务约束在调用链中显式传递。

### 把框架资源注入业务类

以下片段假设已有包含 `id`、`title` 的 `orders` Collection：

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

ServiceProvider 从 `databaseManagerToken` 解析应用数据库，将它注入 `OrdersService`，再用业务 Token 注册服务。路由从应用容器取得服务并传入授权产生的策略；不能直接信任请求中的策略对象。

### 请求状态不属于单例

不要在服务字段中保存当前用户、当前事务或本次请求的输入，否则并发请求可能互相覆盖。将这些值放进方法参数。HTTP Context 可在路由层转换成业务需要的小型上下文，避免服务绑定某个 Web 框架。

### 事务与外部效果

需要多步原子写入时，在服务方法中创建事务，并使用回调连接取得 Repository。事务连接不能从方法返回后继续使用。邮件、HTTP 调用和队列投递通常不随数据库回滚；将它们安排在提交后的流程，并按业务要求记录重试和幂等键。

不要把“数据库已提交”与“通知已送达”合并成一个无法恢复的状态。强一致的投递需求需要明确设计持久化待投递记录及恢复过程。

### 多入口复用与测试

CLI 或任务没有浏览器请求身份，应明确系统执行者和允许的数据范围。不能因为复用同一服务就默认拥有管理员权限。

对规则用单元测试，对策略、事务和并发行为用真实数据库测试。完整接入见[服务端业务服务](../../developing-apps/server-business-services.md)和[事务](../database/transactions.md)。

### 接口与实现

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
