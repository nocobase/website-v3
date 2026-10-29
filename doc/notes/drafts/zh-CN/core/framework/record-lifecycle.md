---
title: 记录状态与流转
---

`@nocobase/lifecycle` 将一条业务记录的状态、允许的流转、操作条件和副作用放在同一份定义中。例如订单从草稿提交再关闭。它与应用启动时的 [Provider 生命周期](runtime/lifecycle.md) 是两个概念。

## 声明状态机

```ts
import { defineLifecycle, type LifecycleRecord } from '@nocobase/lifecycle';

interface Order extends LifecycleRecord {
  status: 'draft' | 'submitted' | 'closed';
  ownerId: string;
}
interface OrderLifecycle {
  record: Order;
  state: Order['status'];
}

export const orderLifecycle = defineLifecycle<OrderLifecycle>({
  name: 'orders',
  initial: 'draft',
  states: ['draft', 'submitted', { name: 'closed', final: true }],
  transitions: {
    submit: {
      from: 'draft',
      to: 'submitted',
      guard: ({ record, actor }) => record.ownerId === actor.id,
    },
    close: {
      from: 'submitted',
      to: 'closed',
      guard: ({ record, actor }) => record.ownerId === actor.id,
    },
  },
});
```

`from`、`to` 声明状态变化，`guard` 决定当前操作者能否执行。需要输入校验时定义 `validate`，允许写入的输入通过 `accept` 声明。`onEnter` 可安排进入某个状态后的效果，`triggers` 可声明时间触发规则。

## 接入持久化与服务

定义本身不会创建数据库表或 HTTP 接口。应用或插件需要：

1. 通过迁移建立业务状态、状态变更时间、并发版本字段，以及流转日志和效果执行记录表。
2. 用 `createRepositoryLifecycleStore()` 接到 DatabaseManager，创建 `LifecycleRuntime` 并注册定义。
3. 用 `runtime.create()` 创建记录，通过 `runtime.fire()` 执行流转。
4. 在自己的路由中完成认证和资源权限检查，再调用运行时；将错误转换成标准 API 错误。
5. 用 `createLifecycleJobs()` 接入任务执行与定期恢复，并安排关闭处理。

库没有内置迁移，需要按实际存储契约建表。不要只创建 `status` 字段就直接启动持久运行时。

## 并发、重试与 UI

流转请求可携带 `requestId` 和预期版本。重复请求识别和版本冲突检测保护状态变化；效果调用外部服务仍需使用幂等键。没有 dispatcher 时，效果在当前进程执行；需要持久恢复时应接入 Jobs。

`view()` 提供可执行操作和阻止原因，`@nocobase/lifecycle/react` 的 `createLifecycleHook()` 可以连接应用自己的路由。前端按钮可用状态只是预览，服务端 `fire()` 会在执行时重新判断。

不要用普通 Repository 更新状态字段绕过运行时，否则会跳过守卫、版本检查、日志和效果。测试可用 `@nocobase/lifecycle/testing`，覆盖不同操作者、非法状态、重复请求和超时触发。审批等业务插件可以在此机制之上组织自己的领域规则。

## 接口与实现

- [Lifecycle integration guide](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle/docs/guide.md)
- [Lifecycle types](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle/src/types.ts)
