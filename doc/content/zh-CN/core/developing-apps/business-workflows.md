---
title: 工作流
description: 定义工作流的状态、操作、条件与版本，接入自动处理、外部结果、超时恢复和管理员处置在途流程，并展示进度与处理记录。
---

工作流基于状态机定义业务记录的状态、允许的流转及其触发条件，适合需要跨越多次请求、持续较长时间，并由人员操作、自动处理或外部系统共同推进的业务流程。例如，订单可以等待用户付款、接收支付回调，再由人员确认发货；等待期间只需保存当前状态，无需持续占用运行中的任务。`@nocobase/lifecycle` 用代码声明这些规则，应用负责接入存储、业务接口和页面。

下面以示例项目的 **Order payment（订单支付）** 为主线说明基础接入，并结合 **Expense approval（费用报销）** 与 **Help desk（客服工单）** 介绍多版本演进和管理员处置在途流程。多级审批、会签和加签等人工审批需求见[审批插件](../using-plugins/collaboration/approval.md)。

## 状态与流转

**状态**表示记录当前所处的阶段，**流转**表示一次明确的推进，例如发起付款、取消或发货。订单的 `status` 就是流程状态，不另存一份独立的流程实例状态。流转历史记录操作者、时间和前后状态，自动处理记录则保存提交后的执行情况。

通过 `defineLifecycle()` 声明标识、初始状态、允许的流转和结束状态。下面摘录 `server/lifecycles/order.ts` 的定义，省略参数配置等内容，并用 `orderTransitions`、`orderTriggers` 代指其流转和超时规则。`OrderTypes` 与 `orderProblems` 分别是示例的类型和创建校验函数。

```ts
export const orderLifecycle = defineLifecycle<OrderTypes>({
  name: 'orders',
  key: 'orders',
  version: 1,
  definitionField: 'lifecycleDefinition',
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

使用 `runtime.create('orders', values, { actor })` 创建记录，由 runtime 写入初始状态、定义绑定字段和 `$create` 历史。`actor` 来自服务端验证的身份，`values` 只包含允许创建的业务字段。后续状态变化统一通过流转入口处理，不能由通用更新接口直接写入。

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

应用准备订单表、流转历史表和自动处理执行表。订单表除业务字段外，保存 `status`、`statusChangedAt`、`lifecycleVersion` 和定义绑定字段 `lifecycleDefinition`，分别用于状态、等待计时、并发检查和绑定创建该记录的流程定义。包不自动执行迁移，字段与索引按所用版本的[存储要求][storage]创建；应用接入见[数据模型与迁移](data-models-and-migrations.md)。

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

应用自行提供创建、读取和操作接口。操作入口先认证、授权、校验输入，再按记录绑定的定义调用 runtime：

```ts
const actor = { id: String(signedInUserId) };
const definition = await runtime.boundLifecycle('orders', orderId);
const result = await runtime.fire(definition, orderId, body.transition, {
  actor,
  manual: true,
  input: body.input,
  requestId: body.requestId,
  expect: { version: body.expectVersion },
});

const view = await runtime.view(definition, orderId, actor);
return c.json({ data: { ...view, replayed: result.replayed === true } });
```

其中 `body` 是校验后的输入，用户 ID 来自可信会话。接口还要检查记录范围，分别授权读取、流转和异常处理；恢复接口必须核对执行记录属于当前订单。store 不会自动继承请求的权限策略。具体接入见[认证、权限与数据范围](authentication-and-permissions.md)和[请求校验与错误处理](request-validation-and-errors.md)。

同一次操作因网络问题重发时复用 `requestId`，输入变化或新决定使用新标识；重放已成功的操作不会再次流转。`expectVersion` 传入页面读取的并发版本号，过期操作返回 `CONFLICT`，应刷新后重新决定。请求标识用于去重，并发版本号用于防止旧决定覆盖新进度。

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
const definition = await runtime.boundLifecycle('orders', orderId);
await runtime.fire(definition, orderId, 'paymentSucceeded', {
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

## 版本管理

流程规则需要调整时，已创建的记录通常仍在途。`@nocobase/lifecycle` 将一条记录永久绑定到创建它的具体定义版本，让新旧版本共享同一张业务表并安全并存，互不干扰。

### 版本标识与记录绑定

每个流程定义都应显式声明以下标识属性，用于区分不同版本并绑定记录：

| 属性 | 作用 |
| --- | --- |
| `name` | 单个具体定义的永久标识。记录、流转历史、effect 执行记录和参数快照均按 `name` 关联，禁止修改 |
| `key` | 所属业务流程的标识。同一流程的多个版本使用相同的 `key`；插件应使用带命名空间的 `key` 避免冲突 |
| `version` | `key` 内唯一的正整数版本号。最大版本号仅表示最新定义，不决定新记录默认使用哪个版本 |
| `collection` | 业务数据表。同一 `key` 的所有版本共享同一张表；新增版本必须显式填写，因为默认取 `name` |
| `definitionField` | 业务表中保存具体定义 `name` 的可空字符串字段（如 `lifecycleDefinition`）。若一张表承载多个流程，每个流程使用独立字段（如 `approvalDefinition`、`paymentDefinition`） |
| `versionField` | 记录自身的并发控制计数器（默认 `lifecycleVersion`），与定义版本号 `version` 无关 |

`runtime.create()` 会在创建记录的同一事务中写入 `definitionField`；该字段由 runtime 独占维护，`set`、`accept` 和创建入参均不得修改。之后所有的记录操作（`view()`、`available()`、`can()`、`fire()`、effect 与续执行）都会校验绑定关系，对未绑定或属于其他版本的记录返回 `DEFINITION_MISMATCH`（`lifecycleErrorFields()` 映射为 `400 FAILED_PRECONDITION`，并在 `metadata.bound` 中标明实际绑定），绝不自动回退到最新版本。每个版本的 trigger 也只扫描绑定到自身的记录。

注册定义时，runtime 会校验同一 `key` 下的所有版本是否共享相同的 `collection`、`stateField`、`changedAtField`、`versionField`、`definitionField`（以及启用管理员处置时的 `management.field`）。同一 `key` 存在多个版本时必须声明 `definitionField`；省略 `key`、`version` 或单版本省略 `definitionField` 当前会打印警告，并在下一个次版本变为必填。

### 创建新版本与切换入口

已合并到目标主分支的定义版本视为**冻结**：修改状态、流转条件或目标、守卫、`route`、`validate`、`set`、`accept`、钩子、trigger、effect 行为或参数契约时，应新增一个版本并保留旧版本及其依赖的原始行为。当前开发分支新增、尚未合并的版本可继续原地修改；仅涉及标题、描述或翻译等纯展示元数据的修改也可以原地调整。注意检查被多个版本复用的守卫、effect 和辅助函数，不要在复用处悄悄改变冻结版本的行为。

新增版本时，取当前所有定义及目标主分支历史（包含已删除版本）中该 `key` 的最大 `version` 加 1，并分配从未被已合并定义占用的 `name`。下面摘录 `server/lifecycles/expense-v2.ts`，展示在报销流程 v1 基础上新增 `awaitingAudit` 审计环节并共享同一张业务表：

```ts
export const expenseV2Lifecycle = defineLifecycle<ExpenseV2Types>({
  name: 'expenses-v2',
  key: 'expenses',
  version: 2,
  definitionField: expenseLifecycle.definitionField,
  collection: expenseLifecycle.collection,
  initial: 'draft',
  states: [
    'draft', 'awaitingManager', 'awaitingFinance', 'awaitingAudit',
    'needsInfo', 'approved',
    { name: 'rejected', final: true },
    { name: 'paid', final: true },
  ],
  parameterConfiguration: {
    groups: [expenseParameterGroup, expenseTimingGroup, expenseAuditGroup],
  },
  parameters: {
    autoApproveLimit: 5000,
    financeLimit: 50000,
    escalateAfterMinutes: 3,
    auditLimit: 20000,
  },
  transitions: {
    // ...新增 audit 与更新 approve 路由，未变动的规则直接复用 v1
    escalate: expenseLifecycle.transitions.get('escalate')!.definition as never,
    paid: expenseLifecycle.transitions.get('paid')!.definition as never,
  },
  onEnter: {
    awaitingManager: [notifyApprover as never],
    awaitingFinance: [notifyApprover as never],
    awaitingAudit: [notifyApprover as never],
    approved: [notifyApplicant as never, requestPayment as never],
  },
  triggers: { /* ... */ },
});
```

在同一个 `LifecycleRuntime` 上同时注册新旧版本（所有应用进程和后台 Worker 均需注册）。创建记录没有“默认走最新版本”的隐式规则：每个创建入口（业务接口、事件订阅、定时任务、导入、批处理或父流程创建子流程）都显式传入要启动的具体定义 `name`。发布时先部署包含新版本定义的进程和 Worker，再切换需要启用新版本的创建入口，并保持数据库变更向后兼容旧版本；回滚只需把创建入口切回旧定义，已经用新版本创建的记录会继续按新版本运行。

### 多版本查询、参数与下线

面向业务记录的路由按流程 `key` 寻址，不把版本写死在 URL 中。接口先用 `runtime.boundLifecycle(key, recordId)` 查出记录绑定的定义（如果已通过 Repository 读出记录，改用 `runtime.recordLifecycle(key, record)`，并确保查询投影与权限策略包含 `definitionField`），再把具体定义名传给 `view()`、`fire()` 等方法。定义描述接口接受可选的 `?definition=<name>`，缺省时描述 `runtime.group(key).latest`。

在多版本共存的业务列表页中，使用 `runtime.groupStates(key)` 获取所有版本状态的并集来渲染筛选器和状态标签；`runtime.groups()` 与 `runtime.group(key)` 用于聚合流程目录。单条记录详情页返回的 `view.lifecycle` 和 `view.definitionVersion` 始终代表该记录绑定的版本，按钮、流程图和历史均按该版本渲染。

**参数配置按具体定义版本独立维护**。当定义声明 `parameterConfiguration` 时，不同版本拥有各自独立的参数契约与配置修订，不隐式共享配置；可在界面上显式从旧版本复制兼容字段作为未保存输入，经目标版本校验后独立保存。`runtime.create()` 在创建记录（包括草稿状态）的同一事务中冻结当前有效参数并写入不可变的实例快照，后续流转、trigger、effect 和恢复始终读取该快照；管理员之后修改配置只影响该版本后续新建的记录，不会改变在途记录的参数或超时截止时间。

在 **Workflow management** 中，同一 `key` 的多个版本在定义列表合并为一行，以最新版本的元数据和全版本执行总数展示；定义详情页顶部提供版本切换器，流程图、执行记录链接与右侧参数面板均随所选版本联动，并明确提示“最新版本仅指最大版本号，新记录仍可能从旧版本启动”。

![工作流定义详情页的版本切换与分版本参数配置](/assets/core/developing-apps/business-workflows/workflow-version-detail.png)

**版本下线与删除**需在确认没有在途依赖后进行：

- 只要仍有在途记录、历史查看、失败恢复或待续执行任务引用旧版本，就必须保留旧版本定义及其依赖代码。
- 删除已合并到主分支的版本代码前，需确认所有相关部署环境中该版本不再使用，且没有需要保留、执行、查看或恢复的实例与任务；删除代码时一并清理对应的注册与创建入口，但不删除已合并的数据库迁移和历史数据。
- 已合并版本的 `name` 和 `key + version` 组合即使在代码删除后也永久保留，不得复用于新定义；删除整条流程后也不得将原 `key` 分配给其他流程。

## 管理员处置在途流程

当在途记录遇到异常阻塞、业务暂停或需要退回指定阶段重新处理时，可以通过 `@nocobase/lifecycle` 内置的管理员处置能力执行挂起、恢复、重置或指定状态重启。这些操作默认关闭，由流程定义显式声明策略，并在事务内记录完整的 `$manage` 审计日志。涉及审批人转交、加签等审批域操作时，仍应使用[审批插件](../using-plugins/collaboration/approval.md)及其适配层。

### 策略声明与存储迁移

在 `defineLifecycle()` 中配置 `management` 开启所需命令。下面摘录 `server/lifecycles/ticket.ts` 的工单管理策略：

```ts
export const ticketLifecycle = defineLifecycle<TicketTypes>({
  name: 'tickets',
  key: 'tickets',
  version: 1,
  definitionField: 'lifecycleDefinition',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.tickets,
  initial: 'new',
  management: {
    field: 'lifecycleManagement',
    suspend: true,
    reset: true,
    resetWhileActive: true,
    restartAt: ['new', 'open', 'awaitingCustomer', 'closed'],
    restartWhileActive: true,
    canEnter: ({ previous, to }) =>
      to === 'new' || to === 'closed' || Boolean(previous.assigneeId),
    set: ({ to }) => ({
      closedReason: to === 'closed' ? 'administrative' : null,
      ...(to === 'new' ? { assigneeId: null } : {}),
    }),
  },
  // ...states, parameters, transitions, triggers
});
```

使用 Repository 存储时，启用 `management` 需要补充以下数据库迁移（参考示例迁移 `202611190001_lifecycle_example_ticket_management.ts`）：

1. 在业务表中新增可空 JSON 字段 `management.field`（如 `lifecycleManagement`）和可空整型字段 `<field>Revision`（如 `lifecycleManagementRevision`）。已有记录该字段为 `null` 时，runtime 默认视为第 1 轮活跃状态。
2. 在流转历史表（默认 `lifecycleTransitions`）中新增可空 JSON 字段 `management` 和非空整型字段 `journalRevision`（默认 `0`）。
3. 将流转历史表的唯一约束从 `(lifecycle, recordId, version)` 替换为 `(lifecycle, recordId, version, journalRevision)`，并保留 `(lifecycle, recordId, requestKey)` 唯一约束。独立的 `journalRevision` 让挂起与恢复在保持业务版本号不变的同时写入各自的审计条目。

> [!NOTE]
> `management` 属于流程执行行为，同样遵循版本冻结规则。如果在 v2 中新增 `management` 策略并完成表结构迁移，只有绑定到 v2 的记录才能使用这些命令；绑定到 v1 的旧记录仍按 v1 规则运行，不会自动获得 v2 的管理能力。

### 处置命令与在途保护

四类处置命令的前提与运行时效果如下：

| 命令 | 前提条件 | 运行时效果 |
| --- | --- | --- |
| `suspend` | 当前处于活跃状态，且 `management.suspend: true` | 保持业务版本号与当前停留（stay）不变；阻塞普通业务流转（返回 `SUSPENDED`），暂停 trigger 超时计时和 effect 派发/续执行 |
| `resume` | 当前处于挂起状态 | 延续同一次停留，将本次挂起时长计入 `pausedMs` 并顺延 `dueAtField`；在事务内执行 `management.onResume`；提交后恢复排队中的 effect 和已到期的续执行 |
| `reset` | `management.reset: true`，已挂起或配置了 `resetWhileActive: true`，且通过 `canEnter` | 清除挂起，业务版本号与轮次（`round`）加 1，以定义初始状态开启新一轮 |
| `restartAt` | 目标在 `management.restartAt` 中，已挂起或配置了 `restartWhileActive: true`，且通过 `canEnter` | 清除挂起，业务版本号与轮次加 1，在指定状态开启新一轮（策略允许时可重入当前状态） |

`reset` 与 `restartAt` 属于**管理重入**：在同一事务内应用 `management.set` 更新业务字段、调用 `management.onReenter` 完成领域清理与重建（如关闭旧待办并创建新待办）、取消排队中的旧 effect 并隔离迟到的续执行（已发往外部系统的调用仍可能完成），最后只派发 `management.onEnter` 中为目标状态显式声明的 effect，并在其上下文中传入本次 `management` 事件。

`management.onResume` 仅在 `resume` 时运行，接收 `previous`、`record`、`suspendedAt`、`now`、`pausedForMs`、`actor`、`event`、`entry`、`services` 和 `tx`。请通过 `tx.handle` 或绑定事务句柄的 `services` 执行领域写入（如同步顺延关联任务期限），不得修改被恢复记录自身的流程托管字段，也不得在钩子内对被恢复记录调用 `tx.fire()`；一旦抛出异常或试图修改托管字段，恢复状态、日志、请求占位与领域写入会一起回滚，调用方可用同一个 `requestId` 重试。

对于不直接触发流转、但要求当前停留仍活跃的领域写入（例如多人审批中尚未推动阶段流转的一次投票），应先解析记录绑定定义，再在事务内调用 `tx.requireActive()` 锁定记录并校验绑定与挂起状态，随后核对目标停留并复用 `tx.handle` 写入：

```ts
const definition = await runtime.boundLifecycle(key, recordId);
await runtime.transaction(async (tx) => {
  const record = await tx.requireActive(definition, recordId);
  await assertCurrentStay(tx.handle, record, expectedStayId);
  await writeDomainChange(tx.handle, payload);
});
```

如果业务适配层需要在获取实例锁之前先持有自己的领域锁，在 `management.prepare` 中保持相同的加锁顺序。需要判断某次停留是否已退出（包括因 `reset` / `restartAt` 重入而结束）时，可使用 `@nocobase/lifecycle` 导出的 `findStayExit()`。

### 管理接口与界面接入

读取管理面板数据时，调用 `runtime.managementDetails(key, recordId, actor, authorize)`。其中 `actor` 来自可信会话，`authorize` 在服务端校验操作者对具体命令、绑定定义及当前记录数据范围的权限。若定义未启用 `management` 或调用者无任何命令权限，该方法返回 `undefined`；否则返回当前状态、是否挂起、轮次 `round`、不透明版本标识 `version`、可用命令 `actions`、可选目标 `targets`、进行中的工作 `work`（`queued` / `running` / `continuation`）以及 `$manage` 历史 `history`。计算可用命令与目标时，`managementDetails` 会以空 `reason` 调用只读的 `canEnter`。

执行处置命令时，应用暴露独立鉴权的 POST 接口，把前端提交的参数交给 `runtime.suspend()`、`runtime.resume()`、`runtime.reset()` 或 `runtime.restartAt()`。下面摘录 `server/routes/ticket-management.ts` 的核心处理：

```ts
const actor = { id: signedInUser(context) };
const authorize: ManagementAuthorization = (request) =>
  request.actor.id === actor.id && request.lifecycle === 'tickets';
const options = { ...body, actor, authorize };
const data =
  body.command === 'restartAt'
    ? await runtime.restartAt('tickets', recordId, body.target, options)
    : await runtime[body.command]('tickets', recordId, options);
return context.json({ data });
```

请求必须包含非空 `reason`、`managementDetails` 返回的 `expectedVersion` 和幂等 `requestId`；若需要同时核对审批轮次等二层停留，再传入 `expectCurrent` 回调。运行时会**先执行 `authorize` 再检查幂等重放**：

- 无权限返回 `MANAGEMENT_FORBIDDEN`（`lifecycleErrorFields()` 映射为 `403`）。
- 同一 `requestId` 在命令、操作者 ID、`expectedVersion`、去空白后的 `reason`（以及 `restartAt` 的 `target`）完全一致时，直接返回首次执行结果，不重复执行 `expectCurrent` 或钩子；若参数不一致，返回 `CONFLICT`（`409`）。
- 并发变更导致 `expectedVersion` 或 `expectCurrent` 不匹配时返回 `CONFLICT`，界面应刷新详情并让管理员重新确认，再以新的 `requestId` 提交。

界面根据 `managementDetails` 返回的 `actions` 和 `targets` 渲染处置弹窗，要求管理员填写原因并在重置或重启前展示目标状态与影响范围。提交后刷新记录详情、可用业务按钮与管理历史；绘制当前轮次流程图时，可依据 `RecordView.roundStartedVersion` 筛选本轮流转，同时保留完整历史供审计查看。

![工单详情页中的管理员处置弹窗](/assets/core/developing-apps/business-workflows/workflow-management-dialog.png)

![挂起后展示暂停提示与管理操作历史](/assets/core/developing-apps/business-workflows/workflow-management-suspended.png)

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

详情页分别显示当前阶段、流转时间线和自动处理结果，包括尝试次数、错误及待继续的流转。Hook 默认定时刷新，便于看到外部结果。系统设置中的 **Workflow management** 集中提供按流程分组的定义版本、执行列表与执行详情，并限制重试、继续和管理处置权限。

流程图复用模板或 UI Library 的 `LifecycleDiagram`，传入定义、当前状态和实际历史。图形用于查看，不提供可视化流程设计；点击图形不能绕过操作接口推进流程。

![订单支付工作流](https://static-docs.nocobase.com/20261108090920.png)

## 示例与验证

在示例项目中打开 **Order payment**，新建订单后点击 **Pay**，再在 **Payment provider (sandbox)** 中模拟付款或拒付。**Demo options** 可设置收银台或退款故意失败的次数；**Hold the webhook** 暂存回调，**Deliver** 投递，**Deliver again** 重投。

| 操作 | 应观察到的结果 |
| --- | --- |
| 发起付款，在沙箱付款后点击 Ship | 等待付款 → 已付款 → 已发货 |
| 将收银台失败次数设为 2，再发起付款 | 第三次尝试成功，进入等待付款 |
| 等待付款超过期限 | 超时关闭，订单进入已取消 |
| 暂存付款回调，取消订单后再投递 | 已取消 → 退款中 → 已退款 |
| 将退款失败次数设为 3，付款后退款 | 进入退款待处理；点击 Retry refund 后可完成退款 |
| 重复投递同一支付回调 | 显示 Replayed，不重复推进订单 |

验证版本管理与管理员处置时，可结合示例项目中的 **Workflow management**（报销流程 `expenses` / `expenses-v2`）与 **Help desk**（工单 `tickets`）：

- 在 **Workflow management** 中打开 **Expense approval**，切换 Version 1 与 Version 2，确认流程图和参数设置随版本独立展示；创建新报销单后确认执行记录绑定到对应版本，且旧版本记录仍按 v1 流转。
- 在 **Help desk** 中以管理员身份打开工单详情，点击 **Manage lifecycle** 执行 **Suspend** 并填写原因，确认界面显示 `Suspended` 标识、业务按钮停用并记录管理历史；再依次验证 **Resume** 恢复停留与计时，以及 **Reset** / **Restart at** 开启新轮次并记录目标状态变化。

支付、退款和回调均由示例沙箱模拟，不涉及真实资金；工单示例中的管理员权限覆盖整个演示工单台，接入业务应用时应替换为记录级数据范围授权。权限边界、`tx.requireActive()` 并发保护、幂等重放、事务回滚和重启恢复仍需应用集成测试，见[测试](testing-and-acceptance.md)。

实现对照：[订单流程与 effects][order-source]、[报销多版本定义][expense-v2-source]、[工单管理接口][ticket-management-source]、[回调接收][webhook-source]、[版本设计说明][version-design]、[在途处置设计说明][management-design]、[恢复测试][recovery-tests]、[管理处置测试][management-tests]。

[storage]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#storage
[version-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#versions-of-a-process
[management-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#managing-a-running-instance
[order-source]: https://github.com/nocobase/nocobase/tree/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles
[expense-v2-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles/expense-v2.ts
[ticket-management-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/routes/ticket-management.ts
[webhook-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/webhooks/receiver.ts
[recovery-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/pending-continuation.test.ts
[management-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/management.test.ts
