---
title: 工作流
description: 定义工作流的状态、操作和条件，接入自动处理、外部结果、超时与恢复，并展示进度和处理记录。
---

工作流基于状态机定义业务记录的状态、允许的流转及其触发条件，适合需要跨越多次请求、持续较长时间，并由人员操作、自动处理或外部系统共同推进的业务流程。例如，订单可以等待用户付款、接收支付回调，再由人员确认发货；等待期间只需保存当前状态，无需持续占用运行中的任务。`@nocobase/lifecycle` 用代码声明这些规则，应用负责接入存储、业务接口和页面。

下面以示例项目的 **Order payment（订单支付）** 为例：用户发起付款，系统创建收银台并等待支付回调；付款后可以发货或退款，未付款超时会关闭订单，取消后到账则自动退款。多级审批、会签和加签等人工审批需求见[审批插件](../using-plugins/collaboration/approval.md)。

## 状态与流转

**状态**表示记录当前所处的阶段，**流转**表示一次明确的推进，例如发起付款、取消或发货。订单的 `status` 就是流程状态，不另存一份独立的流程实例状态。流转历史记录操作者、时间和前后状态，自动处理记录则保存提交后的执行情况。

通过 `defineLifecycle()` 声明初始状态、允许的流转和结束状态。下面摘录 `server/lifecycles/order.ts` 的定义，省略参数配置等内容，并用 `orderTransitions`、`orderTriggers` 代指其流转和超时规则。`OrderTypes` 与 `orderProblems` 分别是示例的类型和创建校验函数。

```ts
export const orderLifecycle = defineLifecycle<OrderTypes>({
  name: 'orders',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.orders,
  initial: 'draft',
  create: { validate: orderProblems },
  states: [
    'draft', 'creatingCheckout', 'awaitingPayment', 'paymentFailed',
    'paid', 'cancelled', 'refunding', 'refundNeedsAttention',
    { name: 'fulfilled', final: true },
    { name: 'refunded', final: true },
  ],
  parameters: { paymentWindowMinutes: 3 },
  transitions: orderTransitions,
  onEnter: { creatingCheckout: [createCheckout], refunding: [refund] },
  triggers: orderTriggers,
});
```

发起付款后，订单从草稿进入创建收银台，再进入等待付款；支付回调将其推进到已付款，随后可以发货或退款。`fulfilled`（已发货）和 `refunded`（已退款）是结束状态。`cancelled` 不是结束状态，因为取消后仍可能收到付款，此时会进入退款。

使用 `runtime.create('orders', values, { actor })` 创建记录，由 runtime 写入初始状态和 `$create` 历史。`actor` 来自服务端验证的身份，`values` 只包含允许创建的业务字段。后续状态变化统一通过流转入口处理，不能由通用更新接口直接写入。

## 操作、条件与分支

操作对应具名流转。`from`、`to` 限定起点和目标，`set` 更新同事务内的业务字段，`accept` 保存允许的输入。下面是订单定义中发起付款和收银台创建成功的两个条目：

```ts
checkout: {
  from: ['draft', 'paymentFailed'],
  to: 'creatingCheckout',
  set: ({ record }) => ({
    paymentAttempt: record.paymentAttempt + 1,
    paymentSessionId: null,
    checkoutUrl: null,
    lastError: null,
  }),
},
checkoutCreated: {
  manual: false,
  from: 'creatingCheckout',
  to: 'awaitingPayment',
  accept: ['paymentSessionId', 'checkoutUrl'],
},
```

点击 **Pay** 发起 `checkout`，支付轮次增加并清除上一轮收银台信息；自动处理成功后，`checkoutCreated` 保存支付会话和地址。创建订单时，`create.validate` 检查客户、订单名称和大于零的金额。通用的 `guard`、流转 `validate` 和 `route` 可用于条件、输入与目标选择；本例的分支由支付结果和当前状态对应的不同流转表达。

支付被拒进入 `paymentFailed`，可以再次发起付款；付款成功进入 `paid`，可以选择 `ship` 发货或 `refundOrder` 退款。退款失败进入 `refundNeedsAttention`，由 `retryRefund` 重新进入退款。

`cancel` 允许从 `draft`、`awaitingPayment`、`paymentFailed` 取消订单，同时安排关闭收银台。支付回调和自动处理结果对应的流转设置 `manual: false`，人工接口传入 `manual: true`，防止用户直接选择支付成功。角色权限与记录范围仍由接口授权检查。

## 应用接入与权限控制

应用准备订单表、流转历史表和自动处理执行表。订单表除业务字段外，保存 `status`、`statusChangedAt` 和 `lifecycleVersion`，分别用于状态、等待计时和并发检查。包不自动执行迁移，字段与索引按所用版本的[存储要求][storage]创建；应用接入见[数据模型与迁移](data-models-and-migrations.md)。

Provider 负责装配共享 runtime、存储与执行器，流程规则仍在定义中。下面的 `database`、`executors` 来自应用的 `databaseManagerToken`、`jobExecutorServiceToken`；`flowServices` 是符合示例 `FlowServices` 接口的服务对象，包含支付沙箱和故障模拟能力：

```ts
import {
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';

const jobs = createLifecycleJobs({
  jobs: executors.getJobExecutor('app/orders'),
  schedule: executors.getScheduleExecutor('app/orders'),
  jobName: 'app/orders/effect',
  sweepEveryMs: 5_000,
});

const runtime = new LifecycleRuntime({
  store: createRepositoryLifecycleStore(database),
  dispatcher: jobs,
});
runtime.register(orderLifecycle, { services: flowServices });
```

将 runtime 通过服务 Token 注册到容器，把 Provider 追加到 `server/providers/index.ts`。在 `start()` 中调用 `jobs.start(runtime)`，在 `shutdown()` 中调用 `jobs.shutdown()`；路由复用同一个 runtime。注册方式见[服务端服务](server-business-services.md)，执行后端与多实例配置见[后台任务与定时执行](background-tasks.md)。

一次流转将记录变化、历史和待执行工作写入同一事务，外部调用在提交后执行。条件校验需要读取其他表时，通过绑定当前事务的 services 工厂取得连接。事务使用方式见[事务与数据一致性](transactions-and-consistency.md)。

应用自行提供创建、读取和操作接口。操作入口先认证、授权、校验输入，再调用 runtime：

```ts
const result = await runtime.fire('orders', orderId, body.transition, {
  actor: { id: String(signedInUserId) },
  manual: true,
  input: body.input,
  requestId: body.requestId,
  expect: { version: body.expectVersion },
});

const view = await runtime.view('orders', orderId, {
  id: String(signedInUserId),
});
return c.json({ data: { ...view, replayed: result.replayed === true } });
```

其中 `body` 是校验后的输入，用户 ID 来自可信会话。接口还要检查记录范围，分别授权读取、流转和异常处理；恢复接口必须核对执行记录属于当前订单。store 不会自动继承请求的权限策略。具体接入见[认证、权限与数据范围](authentication-and-permissions.md)和[请求校验与错误处理](request-validation-and-errors.md)。

同一次操作因网络问题重发时复用 `requestId`，输入变化或新决定使用新标识；重放已成功的操作不会再次流转。`expectVersion` 传入页面读取的版本，过期操作返回 `CONFLICT`，应刷新后重新决定。请求标识用于去重，版本用于防止旧决定覆盖新进度。

## 自动处理、等待与恢复

**自动处理（effect）**是流转提交后要执行的工作。例如进入 `creatingCheckout` 后创建收银台，成功后通过 `checkoutCreated` 进入等待付款；重试耗尽则通过 `checkoutFailed` 进入 `paymentFailed`。

```ts
import { defineEffect } from '@nocobase/lifecycle';

const createCheckout = defineEffect<OrderTypes>({
  name: 'orders.createCheckout',
  retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
  timeoutMs: 10_000,
  onSuccess: 'checkoutCreated',
  onFailure: 'checkoutFailed',
  async run({ record, services }) {
    if (services.shouldFail(`order-checkout:${record.id}`, record.failCheckouts)) {
      throw new Error('The payment provider is unavailable (simulated).');
    }
    const session = await services.sandbox.createCheckout({
      idempotencyKey: `order-checkout:${record.id}:${record.paymentAttempt}`,
      orderId: String(record.id),
      amountCents: record.amountCents,
    });
    return { paymentSessionId: session.sessionId, checkoutUrl: session.url };
  },
});
```

`services.sandbox.createCheckout` 是示例的支付沙箱接口，不会发起真实支付。`failCheckouts` 用于模拟失败次数；同一支付轮次的重试复用幂等键，用户再次发起付款时才增加 `paymentAttempt` 并创建新会话。`attempts: 3` 包括首次尝试。

**等待外部结果**只需保存状态，不占用持续运行的任务。收银台创建成功不代表已付款，支付服务的回调才决定是否到账。下面展示通过回调推进未取消订单的调用，来源验证由回调接收端完成：

```ts
import { SYSTEM_ACTOR } from '@nocobase/lifecycle';

// After verifying the payment callback, for an order still awaiting payment.
await runtime.fire('orders', orderId, 'paymentSucceeded', {
  actor: SYSTEM_ACTOR,
  input: { paymentRef },
  requestId: `payments:${eventId}`,
});
```

`SYSTEM_ACTOR` 不负责验证外部来源，接收端先检查签名和事件格式。同一事件重投使用同一标识；`paymentSucceeded` 允许从 `creatingCheckout` 或 `awaitingPayment` 进入 `paid`，因此也能处理早于收银台创建结果到达的付款。订单已取消时，接收端改用 `paidAfterCancel` 推进到退款。数据库错误和并发冲突仍需重投处理。

**等待超时**通过 trigger 推进。示例默认等待 3 分钟；以下 `orderTriggers` 条目在 `awaitingPayment` 或 `paymentFailed` 停留超时后触发 `expire`，将订单转为 `cancelled`：

```ts
expireUnpaid: {
  transition: 'expire',
  when: ['awaitingPayment', 'paymentFailed'],
  after: ({ paymentWindowMinutes }) => paymentWindowMinutes * 60_000,
},
```

超时检查间隔应短于等待期限，到期记录在检查时被发现。`expire` 保存超时原因并安排关闭收银台；若支付已经发生，只是回调迟到，后续通过 `paidAfterCancel` 自动退款。

**失败恢复**先区分外部工作是否已完成：

| 情况 | 处理方式 |
| --- | --- |
| 创建收银台暂时失败 | 按策略重试，同一支付轮次复用幂等键 |
| 创建收银台重试耗尽 | 进入 `paymentFailed`，用户可再次点击 Pay |
| 退款重试耗尽 | 进入 `refundNeedsAttention`，点击 Retry refund 后重新退款；按订单和付款引用去重 |
| 其他符合条件的失败执行 | 授权后调用 `runtime.retryRun(runId)`；遇到 `RUN_SETTLED` 不默认强制重跑 |
| 外部处理已成功，后续流转受阻 | 解除条件后调用 `runtime.continueRun(runId)`，应用已有结果，不重发外部请求 |
| 应用重启或执行中断 | Jobs 适配器与定时检查恢复符合条件的工作 |

持久化存储保留待执行工作和已取得的结果；恢复可能再次调用外部服务，因此仍需幂等。保持流程、effect 和任务名称稳定，让新进程识别旧记录；执行错误接入日志，按保留策略清理可删除的记录。

## 进度与处理记录

页面沿用应用已有的 shadcn 组件，通过 `runtime.view()` 对应的接口取得记录、版本、候选操作和历史。客户端可使用：

```ts
import { useApiClient } from '@nocobase/app-client';
import { createLifecycleHook } from '@nocobase/lifecycle/react';

export const useOrderLifecycle = createLifecycleHook({
  useTransport: useApiClient,
  basePath: 'lifecycleExample',
});

// Inside the order detail component:
const { view, busy, fire } = useOrderLifecycle('orders', orderId);
```

此配置要求应用在 API 前缀下实现 `GET /lifecycleExample/orders/lifecycle`、`GET /lifecycleExample/orders/:id` 和 `POST /lifecycleExample/orders/:id/fire`，以 `{ data }` 返回结果；Hook 不会生成接口。

服务端按用户权限过滤或标记 `view.available`，页面根据 `allowed`、`blockers` 展示按钮及原因，提交时使用 `busy`。例如 **Pay** 调用 `fire('checkout')`，**Retry refund** 调用 `fire('retryRefund')`；字段错误显示在表单旁，版本冲突提示刷新。接口仍需再次授权。

详情页分别显示当前阶段、流转时间线和自动处理结果，包括尝试次数、错误及待继续的流转。Hook 默认定时刷新，便于看到外部结果。系统设置中的 **Workflow management** 可集中提供定义与执行记录，并限制重试、继续等处理权限。

流程图复用模板或 UI Library 的 `LifecycleDiagram`，传入定义、当前状态和实际历史。图形用于查看，不提供可视化流程设计；点击图形不能绕过操作接口推进流程。

![订单支付工作流](https://static-docs.nocobase.com/20261108090920.png)

## 示例与验证

在示例项目打开 **Order payment**，新建订单后点击 **Pay**，再在 **Payment provider (sandbox)** 中模拟付款或拒付。**Demo options** 可设置收银台或退款故意失败的次数；**Hold the webhook** 暂存回调，**Deliver** 投递，**Deliver again** 重投。

| 操作 | 应观察到的结果 |
| --- | --- |
| 发起付款，在沙箱付款后点击 Ship | 等待付款 → 已付款 → 已发货 |
| 将收银台失败次数设为 2，再发起付款 | 第三次尝试成功，进入等待付款 |
| 等待付款超过期限 | 超时关闭，订单进入已取消 |
| 暂存付款回调，取消订单后再投递 | 已取消 → 退款中 → 已退款 |
| 将退款失败次数设为 3，付款后退款 | 进入退款待处理；点击 Retry refund 后可完成退款 |
| 重复投递同一支付回调 | 显示 Replayed，不重复推进订单 |

支付、退款和回调均由示例沙箱模拟，不涉及真实资金。权限、并发、事务回滚和重启恢复仍需应用集成测试，见[测试](testing-and-acceptance.md)。

实现对照：[订单流程与 effects][order-source]、[回调接收][webhook-source]、[恢复测试][recovery-tests]。

[storage]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/libs/lifecycle/docs/design.md#storage
[order-source]: https://github.com/nocobase/nocobase/tree/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/examples/app-plugin-lifecycle-example/server/lifecycles
[webhook-source]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/examples/app-plugin-lifecycle-example/server/webhooks/receiver.ts
[recovery-tests]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/libs/lifecycle/tests/pending-continuation.test.ts
