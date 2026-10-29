---
title: 客户端业务服务
description: 在应用中编写和注册客户端服务，注入 API Client，并把共享业务操作与可订阅状态接入页面。
---

当多个页面需要相同的业务操作，或需要协作维护一份应用级状态时，可以提取客户端服务。页面负责交互，服务封装可独立调用的行为，ServiceProvider 把服务接入应用容器。

本篇以默认模板 `1.0.0-beta.84` 为参照，围绕“多个页面修改任务后通知其他视图刷新”展开。示例沿用[数据请求与状态管理](data-requests-and-state.md)中的 `PATCH /tasks/:id` 接口约定，需要自己的服务端实现；服务本身不会创建接口或数据库表。

## 什么时候需要服务

| 需求 | 起点 |
| --- | --- |
| 一处使用的展示转换或计算 | 普通函数 |
| 页面中的加载、表单和局部交互 | 组件状态或自定义 Hook |
| 一组组件共享上下文 | React Context 与 Provider |
| 多个页面复用业务操作、协调变更或管理共享资源 | 客户端服务与 ServiceProvider |

只有一个页面使用的简单请求，不必先包成服务。客户端服务也不能替代服务端业务规则：权限、数据范围、事务和最终校验仍由服务端执行。

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

下面是一种可选组织方式，目录不会自动注册服务：

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

`revision` 只表示此服务观察到的成功修改次数，不是服务端记录版本，也不是任务列表缓存。服务没有自动同步其他浏览器或其他用户的修改，需要实时更新时另行接入订阅机制。

这里的 `rename` 可以替代数据请求篇中的普通 `renameTask` 函数，页面改为调用服务，避免并行维护两套修改逻辑。业务类型也应移到共同入口，页面从服务模块导入类型即可。

接口失败时异常继续交给调用方处理，不增加变更次数。页面负责文案、字段错误、提交锁和草稿保留；服务中不调用 React Hooks，也不直接操纵页面 DOM。订阅回调只执行轻量的失效通知，自己的异步刷新应处理失败。

### 定义 Token

在 `client/services/tokens.ts` 中定义并导出一个稳定的 Token：

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { TasksService } from './tasks.js';

export const tasksServiceToken = createServiceToken<TasksService>('app.tasks');
```

注册方和使用方导入同一个 Token。不要在组件中重复调用 `createServiceToken('app.tasks')`，相同名称不代表同一个服务标识。

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

服务工厂在首次解析时运行，使用应用已有的 API Client；同一应用容器内的消费者得到同一个实例。`shutdown()` 使用 `resolveIfCreated()`，避免在释放阶段反而创建一个从未使用过的服务。

然后在 `client/service-provider.ts` 中合并 import，并把 Provider 追加到已有数组：

```ts
import { TasksServiceProvider } from './providers/tasks.js';

// Keep the existing DefaultClientServiceProvider implementation and imports.
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  TasksServiceProvider,
];

export default serviceProviders;
```

这是聚合文件的局部修改，保留其中原有的类型 import、默认 Provider 和其他贡献。默认 Provider 还负责 Toast 服务与页面标题；不能用上面的片段覆盖整个文件。模板的 `client/runtime.ts` 已导入该聚合入口，通常不需要再次修改运行时。

## 在页面中调用服务

在组件或自定义 Hook 顶层调用 `useService(tasksServiceToken)`，然后在提交事件中调用 `tasks.rename(id, title, signal)`。不要在事件回调里调用 `useService()`，也不要在每次 render 时 `new TasksService(...)`。

服务返回成功记录后，页面再更新详情、关闭编辑状态或重新读取列表。异常处理与普通 API 调用一致；需要页面取消时，由页面创建 `AbortController` 并传入信号。取消请求不保证服务端撤销修改。

容器单例的范围是当前浏览器应用实例，不会跨标签页、浏览器或服务端共享。示例不持久化记录和用户数据；如果扩展为按身份缓存结果，要在身份变化时清理缓存和在途请求。

## 把服务变化接入 React

`useService()` 负责取得实例，不会监听实例字段。组件需要观察变更次数时，在 `client/hooks/use-task-revision.ts` 中适配外部状态：

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { tasksServiceToken } from '../services/tokens.js';

export function useTaskRevision(): number {
  const tasks = useService(tasksServiceToken);
  return useSyncExternalStore(tasks.subscribe, tasks.getSnapshot);
}
```

服务通过订阅回调通知变化，React 再读取快照；组件卸载时会取消订阅。快照在状态未变化时必须稳定，这里使用数字。返回对象时应复用未变化的快照，不能每次 `getSnapshot()` 都构造新对象。该示例用于浏览器渲染；服务端渲染还需要合适的 `getServerSnapshot`。详见 [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)。

如果页面只需要在修改后刷新列表，可以直接订阅刷新动作。在已有的列表 Hook 中合并：

```ts
// Inside the list Hook, with useEffect/useService and tasksServiceToken imported:
const tasks = useService(tasksServiceToken);
const { reload } = request; // The existing useListData result.
useEffect(() => tasks.subscribe(reload), [tasks, reload]);
```

此订阅在页面挂载期间生效，返回的函数负责卸载清理。列表初次挂载仍正常读取，因此不依赖接收到过去的事件。一次保存选择一条刷新路径，避免既订阅服务通知又在提交回调中重复 `reload()`。此机制也不替代其他来源修改所需的刷新或实时通知。

React Provider 用于给组件树提供上下文，入口是 `client/react-providers.ts`；ServiceProvider 用于服务容器，入口是 `client/service-provider.ts`。两者可以协作，但不需要为了调用服务再包一层 React Provider。

## 管理生命周期与资源

注册阶段声明服务与依赖，不启动网络请求或访问页面 DOM。只有需要在应用启动时连接的资源，才由对应 Provider 生命周期建立；关闭时释放它自己拥有的连接、定时器与监听。

页面发起的请求、局部订阅与页面卸载一起清理；服务自己创建的后台请求由服务负责取消。释放自己的资源时，不要关闭由运行时共享的 API 或实时客户端。

本例的 Provider 只清理服务监听集合，未创建后台任务或全局连接。完整的容器契约、生命周期顺序及插件复用方式见[服务容器与 Token](../framework/services/container.md)和 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md)。

## 验证结果

围绕公开行为测试，而不只检查类是否创建：

- 同一容器中两次解析得到同一实例，不同应用容器各自独立。
- 请求使用注入的客户端，正确传递 ID、JSON 数据和取消信号。
- 保存成功后返回服务端记录并通知订阅者；失败或请求被取消时不增加成功次数。
- 两个组件订阅同一服务时都能更新，卸载其中一个不会影响另一个。
- 取消订阅或关闭应用后不再保留对应监听；未使用过服务时，关闭不会创建它。
- 页面仍保留草稿、提交锁、错误文案与服务端权限处理。

可以通过构造函数传入测试客户端验证业务方法，再使用真实 `ServiceContainer` 验证注册和释放，最后用组件测试验证订阅。运行项目的类型检查、相关测试与构建；端到端的数据和权限验证见[测试与验收](testing-and-acceptance.md)。

源码基线：[模板 ServiceProvider](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/service-provider.ts)、[客户端服务 Hooks](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/app/app-client/src/hooks.ts)。
