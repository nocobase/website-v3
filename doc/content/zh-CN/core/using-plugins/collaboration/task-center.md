---
title: "待办中心"
description: "聚合多个业务来源的个人待办，提供默认待办页面、顶栏计数入口、认证查询接口和可复用组件。"
minimumEdition: professional
---

## 提供的能力

`@nocobase/app-plugin-task-center` 用于把不同业务模块中需要当前登录用户处理的事项聚合到同一个个人待办中心。它不依赖审批插件，既可以独立承载设备领用、工单确认等普通业务待办，也可以与[审批](approval.md)配合，把审批任务、抄送和其他业务待办统一展示在一起。安装前确认对应包的访问权限与使用授权，详见[管理插件](../../developing-apps/manage-plugins.md)。

| 能力 | 插件提供什么 | 应用需要做什么 |
| --- | --- | --- |
| 个人待办索引 | `userTasks` 索引表与按来源隔离的写入器（`UserTaskWriter`） | 在业务事务中写入或更新待办状态，维护接收人资格和安全的展示标题 |
| 默认页面与顶栏入口 | 已登录用户可访问的 `/task-center` 页面及标准顶栏的待处理计数快捷入口 | 按需隐藏入口、移除或替换默认页，并接入业务详情与处理操作 |
| 查询接口与客户端组件 | `GET /api/userTasks*` 认证接口、`createTaskCenterDataSource` 与 `TaskCenter` 组件 | 在工作台、角标或自定义页面中按一致范围加载列表、分类与统计 |
| 审批集成 | 不反向依赖审批；提供统一索引和展示基础 | 在审批定义中开启 `userTasks` 映射，并通过业务路由加载审批详情与决策操作 |

待办索引只记录“谁有哪些待处理或已完结事项”，不授予查看或修改业务记录的权限。业务详情查询、处理动作、状态流转和权限校验始终由各业务模块负责；消息推送与提醒仍由[通知](../notifications/notification.md)负责。

## 使用场景与示例

当用户希望在同一处处理来自多个业务的个人工作时使用待办中心，例如把采购审批、请假审批和设备领用集中到一个待办页面，或者在顶栏和工作台展示当前用户的待处理数量。

以下情况不需要引入待办中心：

- 只需要向用户发一条提醒或站内消息，使用[通知](../notifications/notification.md)或[站内信](../notifications/in-app.md)。
- 只需要在单个业务详情页内编辑或查看记录。
- 需要统计全组织范围的管理员报表；待办中心接口仅读取当前登录用户自己的索引。
- 需要追踪“我发起的申请”；审批待办只索引待办与抄送，申请人追踪需作为独立业务视图或自定义来源接入。

### 示例：统一处理审批与业务待办

员工登录后，希望在同一个页面里查看自己的采购审批、请假审批和待签收设备，左侧按来源与业务分类筛选，点击条目后进入对应业务详情执行审批或确认签收；处理完成后，待办自动从未处理列表移至已完结，顶栏与标签页数量同步更新。

前提：应用已启用登录认证、采购/请假审批或设备领用等业务模块，并已按[管理插件](../../developing-apps/manage-plugins.md)安装并注册待办中心插件。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
帮我把采购审批、请假审批和设备领用接入待办中心。点开待办时进入对应业务详情去审批或确认签收，处理完成后待办状态同步更新。每个人只能看到自己的待办。
```

注册插件并执行迁移后，登录用户可通过顶栏快捷入口或 `/task-center` 打开默认待办页面。左侧按来源与业务分类展示待处理计数，顶部切换待处理、已完结与全部列表，点击卡片可查看索引信息或打开应用接入的业务详情。

![待办中心默认页面与顶栏待办计数入口](/assets/core/task-center/task-center.png)

截图使用英文界面与示例业务数据展示默认 `/task-center` 布局及顶栏计数入口；应用接入自定义业务处理组件后，点击待办可直接进入对应的审批或业务详情。

### 示例：在仪表盘或顶栏展示待办数量

业务工作台首页只需要展示当前用户在采购审批下的待处理数量和最新 5 条待办，不需要另建一整套待办页面；或者应用已有自定义待办入口，需要隐藏插件自带的顶栏按钮。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
帮我在采购工作台首页加一张“我的待审批”卡片，显示我当前待处理的采购审批数量和最新 5 条待办，点某一条直接打开对应采购单详情。顶栏不再需要默认待办按钮，顺便把它隐藏掉。
```

这种局部展示只需通过待办中心提供的客户端数据源读取指定来源的统计与列表，并在业务操作成功后刷新缓存；如果只需隐藏默认顶栏按钮，在客户端运行时配置中排除其 ID 即可。

## 原理与实现

以下是实现上述场景时的典型接入位置与效果；具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| `server/plugins.ts` 与数据库迁移 | 注册待办中心 Server 插件并应用 `202610190001_user_tasks` 迁移 | 创建 `userTasks` 索引表并注册认证查询接口 |
| `client/plugins.ts` 与 `client/runtime.ts` | 注册 `taskCenter()`，按需配置入口排除或页面替换 | 启用 `/task-center` 默认页与顶栏待处理计数入口，或切换为自定义页面 |
| 业务服务端（如设备领用服务） | 解析 `userTaskServiceToken`，注册来源并在业务事务中调用写入器 | 业务创建、完成或取消时与个人待办索引保持原子同步 |
| 业务页面或工作台组件 | 组合 `<TaskCenter sources={...} />` 或 `createTaskCenterDataSource(client)` | 展示来源标签、按需加载待办卡片并跳转到授权业务详情 |

### 注册插件与自定义默认界面

在应用服务端插件列表注册 `@nocobase/app-plugin-task-center/server` 默认导出、注册认证插件并应用迁移；在 `client/plugins.ts` 中无参注册 `taskCenter()`：

```ts
// client/plugins.ts（片段）
import taskCenter from '@nocobase/app-plugin-task-center/client';

// 加入应用的客户端插件数组
taskCenter();
```

注册后，已登录用户可访问 `/task-center`，标准页头自动显示带待处理总数的快捷入口（窗口激活时每 30 秒及重新聚焦时刷新）。自定义壳层可通过 `<AppHeaderActions />` 渲染已注册的顶栏入口。

需要调整默认界面时，保留 `client/plugins.ts` 中的 `taskCenter()`，在 `client/runtime.ts` 的 `defineAppRuntime()` 中声明选项（两个常量均从 `@nocobase/app-plugin-task-center/client` 导出）：

| 目标 | `defineAppRuntime()` 配置 |
| --- | --- |
| 隐藏顶栏入口，保留 `/task-center` 默认页 | `excludedHeaderActionIds: [TASK_CENTER_HEADER_ACTION_ID]` |
| 移除默认页及其关联的顶栏入口 | `excludedRouteIds: [TASK_CENTER_ROUTE_ID]` |
| 保留 `/task-center` 地址与顶栏入口，替换为自定义页面 | `routeComponentOverrides` 指向 `TASK_CENTER_ROUTE_ID` |

如需将待办中心嵌入应用自有路由，排除默认路由后，在业务页面组合导出的 `<TaskCenter sources={sources} />`，通过 `TaskCenterSource` 为各 `sourceType` 提供展示名称和 `renderTask(task, refresh)` 业务入口。这三种定制都不影响服务端接口和客户端多语言资源。

### 接入业务来源与事务一致性

从 `@nocobase/app-plugin-task-center/server` 解析 `userTaskServiceToken`，在应用初始化阶段为每个业务来源注册一次并持有返回的 `UserTaskWriter`（重复注册同一 `sourceType` 会失败）。下面片段展示在设备领用事务中同步写入与完成待办的写法（省略业务表操作与权限检查）：

```ts
// server/services/deliveries.ts（片段）
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';

const userTasks = container.resolve(userTaskServiceToken);
const deliveries = userTasks.registerSource('asset.delivery');

await database.connection().transaction(async (tx) => {
  // 先使用 tx 写入权威业务记录，再在同一事务内投影个人待办
  await deliveries.put(
    {
      userId: recipientId,
      sourceKey: deliveryId,
      subject: 'equipment',
      title: 'Confirm laptop pickup',
      status: 'pending',
    },
    tx,
  );
});
```

每条个人待办由 `(userId, sourceType, sourceKey)` 唯一标识：`sourceKey` 应保持稳定且不透明，`subject` 用于业务分类，条目自身的 `id` 不等于业务记录 ID。重复写入相同内容会保留原 ID 与时间戳；业务完成或撤回时在同一事务调用 `setStatus(..., tx)`。当接收人集合发生变化时，使用 `writer.listBySourceKey(sourceKey, tx)` 读取该来源下已有接收人并对账，不要直接查询插件内部表。

与[审批](approval.md)配合时，`approval.task` 和 `approval.cc` 由审批插件自身的共享贡献服务写入，普通业务不应手工注册或写入这两个来源；审批侧通过定义级 `userTasks` 配置开启同步。如果从旧版审批插件内置的 `userTasks` 迁移升级，需将审批与待办中心同步升级以保留 `202610190001_user_tasks` 迁移历史与既有记录，历史业务单据仍需显式回填。

### 查询列表、分类与统计

插件在应用挂载路径下提供四组认证只读接口（例如应用位于 `/main` 时路径以 `/main/api/userTasks` 开头）：

| 接口 | 主要查询参数 | 用途 |
| --- | --- | --- |
| `GET /api/userTasks` | `status`、`sourceType`、`subject`、`orderBy`、`direction`、`pagination`、`page`、`pageSize`、`after`、`includeTotal` | 分页读取当前用户的待办列表；`status` 和 `sourceType` 均支持单值或多值数组（同字段 OR，跨字段 AND） |
| `GET /api/userTasks/statistics` | `status`、`sourceType`、`subject` | 返回 `{ pending, completed, cancelled }` 计数；省略 `status` 用于标签页汇总，传 `status=pending` 用于轻量角标 |
| `GET /api/userTasks/categoryStatistics` | 可选 `status`（默认 `pending`） | 从当前用户全历史中发现 `(sourceType, subject)` 分类并返回计数；仅含已完结记录的分类计数为 `0` |
| `GET /api/userTasks/:id` | 无 | 读取单条本人待办的索引元数据 |

客户端通过 `createTaskCenterDataSource(client)` 调用上述接口，支持 `list`、`statistics` 和 `categoryStatistics`：

- “已完结”标签对应 `status: ['completed', 'cancelled']`，“全部”省略 `status`；标签页计数保持与列表一致的 `sourceType`、`subject` 范围并省略 `status`。
- 交互式列表优先使用 `pagination: 'cursor'`，按 `(createdAt, id)` 游标翻页；仅在需要精确总数时传 `includeTotal: true`。角标计数只请求 `status: 'pending'`，避免扫描历史记录。
- 所有统计按个人待办条目计数，不对业务单据去重。

## AI 开发的约束与验证

### 本插件的开发约束

- 接入前先读取当前安装版本随包分发的 `nocobase-app-plugin-task-center` Skill（及其 `references/server.md`、`references/client.md`），按实际导出与版本契约编写代码。
- 待办查询始终以服务端认证身份为准，禁止在接口中放行客户端传入 `userId` 或身份覆盖，也不得暴露供浏览器任意写入待办或跳过业务逻辑直接“标为完成”的接口。
- 业务状态与待办索引必须在同一数据库事务中提交；不得绕过写入器直接读写内部 `userTasks` 表。
- `TaskCenter` 的 `sources` 适配器仅负责展示名称和业务渲染，不会过滤其他来源的数据；展示标题应面向接收人脱敏，详情读取和业务处理必须走业务侧授权接口。
- 普通业务待办直接通过来源写入器接入，不要为非审批业务伪造审批阶段，也不要让待办中心反向依赖审批插件。

### 验收检查

- **独立业务闭环**：在仅注册待办中心（不依赖审批）的业务中，写入一条待办 → 以接收人身份登录并查看列表、左侧分类与顶栏计数 → 通过授权业务接口完成处理 → 确认条目移入已完结且列表与计数同步刷新。
- **事务与幂等**：验证业务事务失败回滚时索引不残留脏数据；重复写入保留原 ID 与创建时间；接收人变更后通过 `listBySourceKey` 对账正确，旧接收人不再保留未处理待办。
- **隔离与异常路径**：未登录请求 `/api/userTasks*` 返回 `401`；传入 `userId` 等非法查询参数或空数组返回 `400`；访问他人或不存在的待办 ID 返回 `404`；切换或退出账号后界面不残留上一位用户的缓存条目。
- **自定义范围一致性**：在仪表盘卡片或自定义数据源中，确认列表与统计使用相同的 `sourceType`、`subject` 过滤范围；对于待处理但业务侧暂无可用操作的条目，界面应准确反映业务状态而非硬编码处理按钮。

相关文档：[审批](approval.md)、[通知](../notifications/notification.md)、[事务与数据一致性](../../developing-apps/transactions-and-consistency.md)、[管理插件](../../developing-apps/manage-plugins.md)。

本篇按商业插件的公开导出、随包 Skill 与默认界面实现核对，截图采集自本地示例运行环境；包获取与使用以相应授权为准。

上述检查是接入后的验收要求，不表示本文已覆盖你的业务集成测试。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skills 与通用检查流程见[持续开发应用](../../../getting-started/develop-your-first-app.md#调整功能并继续迭代)和[测试](../../developing-apps/testing-and-acceptance.md)。
