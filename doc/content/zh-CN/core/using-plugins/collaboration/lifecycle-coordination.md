---
title: "流程协调器"
description: "协调父流程等待多个独立子流程，按条件分支、阈值或策略汇聚结果，并处理协作取消与中断恢复。"
minimumEdition: professional
---

## 提供的能力

`@nocobase/app-plugin-lifecycle-coordination` 为基于 `@nocobase/lifecycle` 的[工作流](../../developing-apps/business-workflows.md)提供父子流程编排、结果汇聚、协作取消与中断恢复能力。它以纯服务端插件形式提供，不注册公开 HTTP 路由或前端页面，业务表、接口、权限和界面均由应用自行组合。安装前确认对应包的访问权限与使用授权，详见[管理插件](../../developing-apps/manage-plugins.md)。

| 能力 | 插件提供什么 | 应用需要做什么 |
| --- | --- | --- |
| 协调台账与迁移 | 在默认数据库连接上提供 `lifecycleCoordinations` 台账表与迁移 | 为参与协调的业务表维护生命周期字段和定义绑定字段，子表额外增加 `coordination` JSON 字段 |
| 条件分支与汇聚 | `LifecycleCoordinator`、`waitingState()`、`complete()`，支持条件选分支、整数成功阈值与版本化自定义策略 | 声明父子流程定义、分支条件与终态上报钩子，保护结论流转 |
| 退出与协作取消 | 支持 `retain`（保留）与 `cancel`（协作取消），撤回后重提自动隔离旧轮次；支持最多 16 层嵌套父子流程 | 为子流程声明取消流转和业务补偿（如退款、释放库存） |
| 事务重试与恢复 | `transaction()` 冲突重试、`recover()` / `resume()` 恢复未结算结果与未送达取消，以及 `inspect()` 诊断视图 | 在启动和宿主周期任务（如 `onSweep`）中调用 `recover()`，记录并告警错误 |
| 流程图元数据 | `waitingState()` 支持声明嵌套子流程与结论边元数据 | 按需在应用页面渲染定义图、执行轨迹图和子流程钻取 |

审批插件（`@nocobase/app-plugin-approval`）与流程协调器是平级扩展，互不强制依赖。子流程内部可以使用审批插件处理人工评审，再把最终业务结果上报给父流程。

## 使用场景与示例

流程协调器主要用于以下两类场景：

1. **并行分支**：父流程进入等待阶段后按条件同时启动多个分支，各分支独立推进；汇聚时根据预定策略（全部通过、达到成功阈值或自定义版本化策略）计算父流程流向，并对未完成分支执行保留或协作取消。
2. **子流程**：将某一阶段拆成独立子流程（即使只有一个子流程、没有并行分支），让它拥有自己的生命周期，可以独立经历退回修改、人工审批、外部执行与重试，只在到达业务终态时向父流程回报结果；子流程内部还可继续嵌套下级子流程。

以下相邻场景通常不需要引入流程协调器：

- 单条业务记录的顺序流转、条件路由、守卫校验和自动处理：直接使用[工作流](../../developing-apps/business-workflows.md)。
- 多人针对同一张单据进行会签、或签或顺序审批：使用[审批](approval.md)。只有当各分支本身是独立的多步骤子流程时，才引入流程协调器。
- 普通的异步任务执行与失败重试：使用[后台任务](../../developing-apps/background-tasks.md)。

每轮等待所启动的分支集合在进入时固定快照；运行时动态增删分支、跨数据库分布式事务、全局暂停以及强制中断正在运行的代码均不在本插件契约范围内。

### 示例：采购单并行审核与条件分支

采购单提交后进入并行审核阶段：默认发起法务审核，勾选需要财务评估时同时发起财务审核。法务与财务各自拥有独立生命周期，均可经历退回修改、重新提交、审批和后续执行；按采购单规则决定“全部通过才可下单”或“任一通过即下单并取消另一分支”。若任一分支审批通过但在外部执行环节失败，仍按该分支失败计入汇聚。

前提：应用已具备采购单和部门审核表、身份认证与权限，已配置 `@nocobase/lifecycle` 及宿主 Jobs，并按[管理插件](../../developing-apps/manage-plugins.md)安装注册了流程协调器插件。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
帮我给采购单接入并行部门审核：提交后自动发起法务审核，勾选需要财务评估时同时发起财务审核。法务和财务各自能退回修改、重新提交、审批并确认执行；按采购单规则决定全部通过才下单，或者任一通过就下单并通知另一分支取消。审批通过后如果后续执行失败，也要按分支失败处理。在采购单详情里展示执行图和各分支进度。
```

插件本身不提供界面；下面截图来自配套示例插件在宿主应用中组合的采购协同详情页，展示“法务审核已完成执行、财务审核仍在进行、主采购单处于等待汇聚状态”的执行轨迹图与轮次信息。

![示例应用中的采购协同执行轨迹图与分支状态](/assets/core/lifecycle-coordination/coordination-execution.png)

### 示例：多级父子流程与撤回取消

大宗订单履约需要多级并行协同：主订单提交后同时启动“仓储备货”和“物流安排”两个子流程，每个子流程下再分别启动“质检核验”和“单据确认”两个子步骤。每一层都要求全部下级成功才向上汇聚；任一步骤失败，或者业务人员在履约前撤回主订单时，未完成的同级和下级子流程都会收到协作取消请求。撤回后修改订单并重新提交会开启新一轮子流程，旧轮次迟到的完成结果不能推进新订单。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
帮我把大宗订单履约做成多级父子流程：主订单提交后并行启动仓储备货和物流安排，每个子流程下再分别启动质检核验和单据确认。每一层都必须全部成功才继续推进上一层；任一步骤失败或者撤回主订单时，自动通知未完成的下级流程取消。撤回后再提交要开启新一轮，旧流程后面完成的结果不能影响新的一轮。
```

中间层子流程保留来自父流程的 `coordination` 绑定，同时以自身作为父流程再打开一层 `waitingState()`；底层全部完成后先推进中间层，待中间层到达业务终态后再向顶层订单上报结果。

## 原理与实现

以下是实现上述场景时的典型接入位置与效果；具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| `server/plugins.ts` 与数据库迁移 | 注册流程协调器 Server 插件并应用迁移；为业务表与子表增加绑定字段 | 创建 `lifecycleCoordinations` 台账表，业务与子记录具备版本与协调绑定 |
| 流程定义与协调器 Provider | 构造 `LifecycleCoordinator`，定义 `waitingState()`、子终态 `complete()` 与 `protect()` | 进入等待自动分叉，子终态按阈值或策略驱动父流程结算 |
| 宿主 Jobs 与启动流程 | 在所有定义与策略注册完成后，于启动及 `onSweep` 调用 `coordinator.recover()` | 进程中断、唤醒丢失或父结算失败后可持续恢复 |
| 业务路由与详情页 | 使用 `coordinator.transaction()` 包裹并发操作，通过 `inspect()` 读取轮次与轨迹 | 并发提交安全重试，页面可展示各轮次状态与嵌套执行图 |

### 接入配置与版本绑定

在 `server/plugins.ts` 注册 `@nocobase/app-plugin-lifecycle-coordination/server` 默认导出并应用迁移（插件无需客户端或 CLI 注册）。协调器必须复用业务 `LifecycleRuntime` 的同一个 `LifecycleStore` 和数据库连接；如果应用有多个独立恢复的 runtime，需为它们配置各自的台账集合并分别恢复。

每个参与协调的父子定义都必须声明稳定的 `key`、数字 `version` 和 `definitionField`（例如 `lifecycleDefinition`）：

- 运行时在创建记录时写入精确定义名（如 `procurement.v1`、`procurement.legal.v1`），并拒绝通过其他定义操作该记录。
- 分支配置中的 `lifecycle` 与 `protect()` 参数都使用精确定义名，而非进程 `key` 或 `latest` 查找。
- 子记录表额外包含 `coordination` JSON 字段，由协调器在创建时写入，业务接口不得修改。
- 当业务规则变更时，新增定义版本或策略版本，并保留仍在途轮次引用的旧版本实现；注册新版本不会自动迁移已启动的轮次。

### 定义等待状态、结果汇聚与退出策略

下面片段演示如何构造协调器、声明等待状态与保护结论流转，以及在子流程终态上报结果（省略业务字段校验与授权路由）：

```ts
// server/services/procurement.ts（片段）
import {
  LifecycleCoordinator,
  createRepositoryCoordinationStorage,
} from '@nocobase/app-plugin-lifecycle-coordination/server';

const coordinator = new LifecycleCoordinator(
  runtime,
  createRepositoryCoordinationStorage(database, store),
);

// 在父流程定义（如 procurement.v1）的 states 中声明等待阶段：
coordinator.waitingState('waiting', 'reviews', ({ record }) => ({
  key: 'reviews',
  success: 'order',
  failure: 'reject',
  remaining: 'cancel',
  branches: (record.financeRequired ? ['legal', 'finance'] : ['legal']).map(
    (department) => ({
      key: department,
      lifecycle: `procurement.${department}.v1`,
      values: { department },
      outcomes: {
        succeeded: ['succeeded'],
        failed: ['failed'],
        cancelled: ['cancelled'],
      },
      cancelTransition: 'cancel',
    }),
  ),
}));

// 在 runtime.register(parent) 之后、受理请求之前保护结论流转：
coordinator.protect('procurement.v1', ['order', 'reject']);

// 在子流程定义的终态钩子中上报结果：
{
  name: 'succeeded',
  final: true,
  onEnterState: (context) =>
    coordinator.complete(context, 'succeeded', { receipt: 'business-result' }),
}
```

关键机制：

- **结论流转保护**：`success` 和 `failure` 流转都必须从等待状态出发并声明 `manual: false`，且经 `coordinator.protect()` 绑定服务端许可，外部调用即使知道轮次 ID 也无法直接触发父流程结算。
- **阈值与版本化策略**：未指定 `required` 时默认要求所有已选分支成功（0 个分支在进入提交后直接成功）；`required: 1` 表示任一成功，`required: K` 表示至少 K 个成功。失败与取消都会减少剩余可达成的成功数，一旦阈值无法达到会立即走向失败。需要按分支身份判断（如“财务必过且其余任一通过”）时，用 `coordinator.registerStrategy({ name, version, decide })` 注册纯函数策略并在计划中引用；恢复时必须保留对应版本的策略实现。
- **退出与协作取消**：`waitingState()` 同时安装进入与退出钩子，撤回或任意离开等待状态都会使旧轮次失效。`remaining: 'retain'` 让未完成子流程继续运行；`remaining: 'cancel'` 持久投递声明的 `cancelTransition`。注意 `cancellation: 'delivered'` 仅代表取消流转已提交，只有子流程到达声明的取消终态才计为 `outcome: 'cancelled'`；退费、释放库存等外部补偿由子流程状态和 effect 完成。
- **管理重入与嵌套**：若父流程配置了管理重置或重启，需将等待状态的 `onReenter` 接入 `management.onReenter`。嵌套协调复用同一绑定机制，最大深度为 16 层，超过会在进入事务中失败回滚。

### 事务边界、恢复与流程图展示

子流程终态与结果记录提交在**子流程自己的事务**中，父流程结算在**提交后的独立事务**中执行。这一边界是有意设计的：即使父流程后续守卫失败或下一阶段任务分配失败，已经提交的子流程外部执行结果不会回滚，而是留在台账中等待恢复，避免重复执行外部副作用。

在可能并发完成子流程或退出父流程的服务端操作边界，使用 `coordinator.transaction(tx => ...)` 包裹纯数据库读写（乐观锁冲突、序列化失败或死锁会自动整事务重试最多 5 次；外部调用应放在普通 lifecycle effect 中）。

插件不自动启动定时器。应用必须在注册完全部流程定义、结论守卫和策略版本之后，在启动阶段以及宿主 Jobs 的 `onSweep` 回调中调用 `coordinator.recover()`，并检查和告警返回的错误。`resume(id)` 可针对单个轮次重试，`inspect(id)` 返回完整的轮次、分支状态、取消投递与最近错误。

要在前端展示嵌套流程图，可向 `waitingState()` 传入第四参数 `{ nested: true, conclusions: ['order', 'reject'], branches: [...] }` 作为定义图元数据；执行期由应用按轮次和记录 ID 钻取父子历史并高亮当前与已访问节点。

## AI 开发的约束与验证

### 本插件的开发约束

- 接入前先读取当前安装版本随包分发的 `nocobase-app-plugin-lifecycle-coordination` Skill 与包内 `docs/coordination.md`，核对公开签名和存储要求。
- 本插件仅提供服务端原语：业务路由必须先完成身份认证与操作授权，绝不向客户端暴露原始 `complete()`、任意状态流转或直接修改 `lifecycleCoordinations` 与子记录 `coordination` / `definitionField` 的接口。
- 禁止在子流程的创建钩子中同步调用 `complete()`，此时子记录 ID 尚未完成绑定。
- 子流程内含人工审批时，部分投票或审批通过后尚未执行的外部动作都不能提前上报子流程成功，只有真正的业务终态钩子才能调用 `complete()`。
- 不要自动删除仍有未完成子流程或取消投递的台账记录；更新流程或策略语义时保留旧版本实现直至在途轮次全部结束。

### 恢复与验收检查

- **分支与阈值矩阵**：验证条件分支仅创建选中子流程；对 3 个分支且 `required: 2` 的场景分别验证：1 成功 2 进行中保持等待、2 成功立即走成功出口、1 失败加 1 取消立即走失败出口，且每个轮次只推进父流程一次。
- **嵌套与撤回隔离**：验证多级流程中下级完成先推进中间层再推进顶层；撤回父流程并重新提交后，旧轮次分支迟到的完成结果不会推进新轮次。
- **协作取消与幂等**：验证 `retain` 允许未完成子流程继续，`cancel` 能投递取消并在子流程进入取消终态后记录 `cancelled`；重复提交或重复上报结果不产生重复分支或重复结算。
- **并发与中断恢复**：验证两个子流程并发完成时不会双结算；模拟提交后唤醒丢失、应用重启、父流程结算失败以及缺失策略版本，确认 `recover()` 在修复后能正确结算并保留可观察的错误信息。

相关文档：[工作流](../../developing-apps/business-workflows.md)、[审批](approval.md)、[后台任务](../../developing-apps/background-tasks.md)、[事务与数据一致性](../../developing-apps/transactions-and-consistency.md)、[管理插件](../../developing-apps/manage-plugins.md)。

本篇按商业插件的公开导出、随包 Skill 与示例插件核对，截图采集自本地示例插件运行环境；包获取与使用以相应授权为准。

上述检查是接入后的验收要求，不表示本文已覆盖你的业务集成测试。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skills 与通用检查流程见[持续开发应用](../../../getting-started/develop-your-first-app.md#调整功能并继续迭代)和[测试](../../developing-apps/testing-and-acceptance.md)。
