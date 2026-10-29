---
title: 客户端业务服务
description: 在应用中编写和注册客户端服务，注入 API Client，并把共享的业务操作和可订阅状态接入页面。
---

当多个页面需要同样的业务操作，或者需要协作维护一份应用级状态时，可以提取客户端服务。三者各司其职：页面负责交互，服务封装可以独立调用的行为，ServiceProvider 把服务接入应用容器。

本篇以默认模板 `1.0.0-beta.84` 为参照，围绕“在多个页面修改任务后，通知其他视图刷新”展开。示例沿用 [数据请求与状态管理](data-requests-and-state.md) 中约定的 `PATCH /tasks/:id` 接口，该接口需要由你自己的服务端实现；客户端服务本身不会创建接口或数据库表。

## 什么时候需要服务

| 需求 | 起点 |
| --- | --- |
| 只在一处使用的展示转换或计算 | 普通函数 |
| 页面中的加载、表单和局部交互 | 组件状态或自定义 Hook |
| 一组组件共享上下文 | React Context 与 Provider |
| 多个页面复用业务操作、协调变更或管理共享资源 | 客户端服务与 ServiceProvider |

只在一个页面使用的简单请求，不必先包成服务。客户端服务也不能代替服务端的业务规则：权限、数据范围、事务和最终校验仍然由服务端执行。

## 使用 Agent

```text
请把多个页面使用的任务修改操作整理为客户端业务服务。

先检查 client/service-provider.ts 和现有 API Client 的接入，不替换模板原有 Provider。
服务通过构造函数接收 API Client，调用现有任务接口；页面保留草稿与提交反馈。
修改成功后通知订阅者刷新，失败或取消时不发布成功通知。
使用同一个 Token 注册和解析应用级单例；useService 本身不负责订阅状态。
补上 React 订阅及清理，并验证跨组件共享、失败处理和应用关闭时的释放。
```

## 组织服务代码

下面是一种可选的组织方式。注意，目录本身不会自动注册服务：

```tree
client/
├── services/
│   ├── tasks.ts                 # 业务方法与变更订阅
│   └── tokens.ts                # 服务契约入口
├── providers/
│   └── tasks.ts                 # 服务注册与释放
├── hooks/
│   └── use-task-revision.ts     # React 状态适配
├── service-provider.ts          # 应用 ServiceProvider 聚合
└── react-providers.ts           # React 组件 Provider 聚合
```

### 编写业务服务

在 `client/services/tasks.ts` 中实现服务。构造函数接收依赖，业务方法接收本次操作的数据和取消信号：

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Task {
  id: string;
  title: string;
}

export class TasksService {
  private revision = 0;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly api: ApiClient) {}

  getSnapshot = (): number => this.revision;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  async rename(id: string, title: string, signal?: AbortSignal): Promise<Task> {
    const response = await this.api.request<{ data: Task }>({
      method: 'PATCH',
      path: `/tasks/${encodeURIComponent(id)}`,
      json: { title },
      signal,
    });
    this.revision += 1;
    for (const listener of this.listeners) listener();
    return response.data;
  }

  dispose(): void {
    this.listeners.clear();
  }
}
```

`revision` 只表示这个服务观察到的成功修改次数，既不是服务端记录的版本，也不是任务列表的缓存。服务不会自动同步其他浏览器或其他用户的修改；需要实时更新时，请另行接入订阅机制。

这里的 `rename` 可以取代数据请求篇中的普通函数 `renameTask`，页面改为调用服务，避免同时维护两套修改逻辑。业务类型也应移到同一个入口，页面从服务模块导入类型即可。

接口调用失败时，异常照常交给调用方处理，变更次数不增加。页面负责文案、字段错误、提交锁和草稿保留；服务中不调用 React Hooks，也不直接操作页面 DOM。订阅回调只做轻量的失效通知；回调中自己发起的异步刷新，需要自行处理失败。

### 定义 Token

在 `client/services/tokens.ts` 中定义并导出一个稳定的 Token：

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { TasksService } from './tasks.js';

export const tasksServiceToken = createServiceToken<TasksService>('app.tasks');
```

注册方和使用方要导入同一个 Token。不要在组件中再次调用 `createServiceToken('app.tasks')`：名称相同，并不代表是同一个服务标识。

### 通过 ServiceProvider 注册

在 `client/providers/tasks.ts` 中声明 Provider：

```ts
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import { TasksService } from '../services/tasks.js';
import { tasksServiceToken } from '../services/tokens.js';

export class TasksServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'app.tasks';

  override register(): void {
    this.app.container.singleton(tasksServiceToken, (services) =>
      new TasksService(services.resolve(apiClientToken)),
    );
  }

  override async shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(tasksServiceToken)?.dispose();
  }
}
```

服务工厂在第一次被解析时运行，使用应用已有的 API Client；同一应用容器内的所有消费者得到的是同一个实例。`shutdown()` 中使用 `resolveIfCreated()`，避免在释放阶段反而创建一个从未用过的服务。

然后在 `client/service-provider.ts` 中合并 import，并把 Provider 追加到已有的数组中：

```ts
import { TasksServiceProvider } from './providers/tasks.js';

// Keep the existing DefaultClientServiceProvider implementation and imports.
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  TasksServiceProvider,
];

export default serviceProviders;
```

这只是对聚合文件的局部修改，请保留其中原有的类型 import、默认 Provider 和其他条目。默认 Provider 还负责 Toast 服务和页面标题，不能用上面的片段覆盖整个文件。模板的 `client/runtime.ts` 已经导入了这个聚合入口，通常不需要再修改运行时。

## 在页面中调用服务

在组件或自定义 Hook 的顶层调用 `useService(tasksServiceToken)`，然后在提交事件中调用 `tasks.rename(id, title, signal)`。不要在事件回调里调用 `useService()`，也不要在每次 render 时 `new TasksService(...)`。

服务返回成功保存的记录后，页面再更新详情、结束编辑状态或重新读取列表。异常的处理方式与普通 API 调用一致；需要由页面取消请求时，由页面创建 `AbortController` 并传入信号。请注意，取消请求并不保证服务端撤销修改。

容器单例的作用范围是当前这个浏览器中的应用实例，不会在标签页、浏览器或服务端之间共享。示例不持久化任何记录或用户数据；如果扩展为按身份缓存结果，需要在身份变化时清理缓存和尚未完成的请求。

## 把服务的变化接入 React

`useService()` 只负责取得服务实例，不会监听实例上的字段。组件需要观察变更次数时，在 `client/hooks/use-task-revision.ts` 中把它适配为外部状态：

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { tasksServiceToken } from '../services/tokens.js';

export function useTaskRevision(): number {
  const tasks = useService(tasksServiceToken);
  return useSyncExternalStore(tasks.subscribe, tasks.getSnapshot);
}
```

服务通过订阅回调通知变化，React 再读取快照；组件卸载时会自动取消订阅。状态没有变化时，快照必须保持稳定，这里使用的是数字。如果快照是对象，应在状态未变时复用同一个对象，不能每次调用 `getSnapshot()` 都构造新对象。这个示例只适用于浏览器渲染；服务端渲染还需要提供合适的 `getServerSnapshot`。详见 [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)。

如果页面只需要在修改后刷新列表，可以直接订阅刷新动作。在已有的列表 Hook 中合并以下代码：

```ts
// Inside the list Hook, with useEffect/useService and tasksServiceToken imported:
const tasks = useService(tasksServiceToken);
const { reload } = request; // The existing useListData result.
useEffect(() => tasks.subscribe(reload), [tasks, reload]);
```

这个订阅在页面挂载期间生效，返回的函数负责卸载时的清理。列表初次挂载时仍会正常读取，因此不依赖于收到过去的事件。每次保存只选一条刷新路径：不要既订阅服务通知，又在提交回调中重复调用 `reload()`。这一机制也不能代替其他来源的修改所需要的刷新或实时通知。

两类 Provider 的入口不同：React Provider 给组件树提供上下文，入口是 `client/react-providers.ts`；ServiceProvider 面向服务容器，入口是 `client/service-provider.ts`。两者可以配合使用，但不需要为了调用服务再包一层 React Provider。

## 管理生命周期与资源

注册阶段只声明服务及其依赖，不发起网络请求，也不访问页面 DOM。只有确实需要在应用启动时连接的资源，才在对应 Provider 的生命周期中建立；关闭时，释放它自己拥有的连接、定时器和监听。

页面发起的请求和局部订阅，随页面卸载一起清理；服务自己创建的后台请求，由服务负责取消。释放自身资源时，不要关闭由运行时共享的 API 客户端或实时客户端。

本例的 Provider 只清理服务中的监听集合，没有创建后台任务或全局连接。完整的容器契约、生命周期顺序，以及插件中的复用方式，见 [服务容器](../framework/services/container.md) 和 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md)。

## 验证结果

围绕公开的行为编写测试，而不只是检查类有没有被创建：

- 在同一个容器中解析两次，得到的是同一个实例；不同的应用容器之间相互独立。
- 请求使用注入的客户端，并正确传递 ID、JSON 数据和取消信号。
- 保存成功后返回服务端记录并通知订阅者；失败或请求被取消时，成功次数不增加。
- 两个组件订阅同一个服务时都能更新，卸载其中一个不会影响另一个。
- 取消订阅或关闭应用后，不再保留对应的监听；从未使用过服务时，关闭应用也不会创建它。
- 页面仍然保留草稿、提交锁、错误文案和服务端权限处理。

可以先通过构造函数传入测试客户端来验证业务方法，再用真实的 `ServiceContainer` 验证注册和释放，最后用组件测试验证订阅。运行项目的类型检查、相关测试和构建；端到端的数据和权限验证见 [测试与验收](testing-and-acceptance.md)。

源码基线：[模板 ServiceProvider](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/service-provider.ts)、[客户端服务 Hooks](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/app/app-client/src/hooks.ts)。
