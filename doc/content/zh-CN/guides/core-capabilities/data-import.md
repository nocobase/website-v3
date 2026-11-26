---
title: "数据批量导入与后台处理"
metaDescription: 结合后台任务与事务校验，实现 CRM 客户与联系人 CSV 批量导入、冲突处理、错误报告与整批回滚。
---

在 CRM 应用中导入来自历史表格或展会名单的客户与联系人，通过后台任务异步处理大批量数据，并在界面中查看进度、事务回滚结果和逐行错误报告。

在完整示例中体验时，准备管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（角色配置见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)）。导入任务只依赖应用内置的后台执行器，不要求额外的消息队列或第三方服务。

**学习模块**

- [后台任务与定时执行](../../core/developing-apps/background-tasks.md)
- [事务与数据一致性](../../core/developing-apps/transactions-and-consistency.md)
- [Jobs 后台任务](../../core/framework/background/jobs.md)

## 明确导入字段、冲突处理与事务规则

批量导入不是把 CSV 原样塞进数据库，而是沿用应用已有的字段校验、客户归属和重复处理规则：

- **支持字段**：每行包含客户字段（`customerName`、`industry`、`status`、`website`、`notes`）与可选联系人字段（`contactName`、`contactRole`、`contactEmail`、`contactPhone`）。`customerName` 必填；`status` 默认 `prospect`；`website` 需为完整 HTTP/HTTPS 地址；填写了任意联系人信息时，联系人姓名必填且邮箱格式合法。单次上传上限 500 行、2 MB。
- **客户识别与冲突策略**：按去除首尾空格、不区分大小写的客户名称，在提交人有权访问的客户范围内匹配已有记录，并提供三种策略：

| 策略 | 遇到同名已有客户时的处理 |
| --- | --- |
| 跳过已有客户（`skip`） | 保留原客户不变，记录为跳过 |
| 更新已有客户（`update`） | 更新非空客户字段，并按邮箱或姓名新增或更新联系人；需同时具备编辑客户权限 |
| 冲突按错误处理（`reject`） | 记录冲突错误，不修改已有数据 |

- **事务边界与两种模式**：
  - **整批原子（`allOrNothing`）**：整份文件在单一数据库事务中处理。只要任意一行校验失败、触发冲突拒绝或越权，整批回滚，已处理的客户和联系人全部撤销（写入 0 条），同时保存完整的逐行错误报告。
  - **逐行提交（`rowByRow`）**：每一行的“客户 + 联系人”在独立事务内提交。合法行正常入库，错误行只回滚当前行并写入错误报告，避免留下“客户已创建、联系人失败”的半条脏数据。
- **归属与权限边界**：新建客户默认归属提交人。后台任务不继承浏览器 Cookie，执行时按提交人当前的有效角色与数据范围实时校验——销售 Alex 只能匹配和更新自己负责的客户，不能借批量导入改写 Taylor 负责的客户；批次记录默认只对提交人本人与销售主管/管理员可见。

## 接入文件导入与后台处理任务

### 交给 Agent 开发

将上一节的字段、冲突策略与事务规则连同下面的提示词交给开发 Agent：

```prompt
给 CRM 增加客户与联系人的 CSV 批量导入功能，在客户列表提供“批量导入 CSV”入口，并支持下载导入模板：
- 支持按“跳过已有客户 / 更新已有客户 / 冲突按错误处理”三种策略匹配同名客户。
- 支持“整批原子（任一错误全部回滚）”和“逐行提交（每行客户和联系人一起成功或失败）”两种事务模式。
- 提交后交由后台任务异步处理，页面展示批次状态、进度和统计数量；有错误时展示逐行错误报告，并允许下载错误 CSV 修正后重新上传。
- 后台执行时按提交人当前的真实权限与客户归属校验，新建客户默认归属提交人；保留现有客户和商机数据。
```

### 理解后台任务与事务校验

在 CRM 示例中，批量导入由三个协作部分组成，而不是把解析和写库塞进单个 HTTP 请求：

1. **共享业务写入规则（`server/providers/crm-intake.ts`）**：统一负责 CSV 解析、沿用 CRM 既有 `CustomerInput` / `ContactInput` 校验，以及 `ingestCustomerRow()` 客户识别与联系人写入。下一篇[外部 API 与系统集成](external-integrations.md)的线索接入接口复用同一套函数，避免“表格导入一套规则、外部接口另一套规则”。
2. **异步投递入口（`server/routes/crm-imports.ts`）**：`POST /api/crmImports/batches` 通过 `executeIdempotentMutation()` 在事务中写入 `crmImportBatches` 批次记录（状态 `queued`）并保存幂等回执，事务提交后再交给 `JobExecutor` 投递后台任务，立即返回 `202 Accepted` 和批次 ID。重复提交同一 `Idempotency-Key` 不会重复入队。
3. **后台执行器（`server/providers/crm-imports.ts`）**：在 Provider 启动时注册 `crm.import.customers` 任务类，从数据库读取批次并按提交人 ID 构造实时授权上下文（`authz.for(identity)`），同时检查账号是否已停用：

```ts
this.executor = this.app.container
  .resolve(jobExecutorServiceToken)
  .getJobExecutor('crm.imports');
this.executor.registerJob(JobClass);
await this.executor.setup({ consume: true });
```

在 `allOrNothing` 模式下，整批循环包裹在单次 `connection.transaction(async (tx) => { ... })` 中；若收集到任意行错误，主动抛出回滚异常撤销全部写入，再在事务外把批次更新为 `rolledBack` 并持久化 `crmImportErrors`。详情参见[后台任务与定时执行](../../core/developing-apps/background-tasks.md)与[事务与数据一致性](../../core/developing-apps/transactions-and-consistency.md)。

### 上传示例表格并查看导入任务

1. 打开 **Customers**，点击右上角 **Import CSV** 进入 **Bulk customer import** 页面；也可点击 **Download template** 获取标准表头。
2. 点击 **Load valid sample**（或上传包含 2 条正常客户的 CSV），冲突策略选择 **Skip existing customers**，事务模式选择 **All or nothing (roll back on any error)**。
3. 点击 **Start background import**，请求立即返回受理结果，下方 **Import batches** 表格自动轮询直到状态变为 **Completed**，结果显示 `+2 / ~0 / 0 skip / 0 err`。

![批量导入表单与多批次后台处理结果列表](/assets/guides/crm-bulk-import-submit.png)

4. 返回 **Customers** 列表，可以看到新导入的 **Harbor Robotics** 与 **Summit Logistics**，进入客户详情的 **Contacts** 标签可核对同步创建的联系人。

## 查看错误报告、事务回滚与修正重导

当历史表格夹杂非法网址或错误邮箱时，可以先用整批原子模式兜底，再下载错误行修正重传：

1. 在 **Bulk customer import** 页面点击 **Load sample with errors**，其中第 2 行 **Cobalt Energy** 字段合法，第 3 行 **Broken Record Corp** 包含非法网站 `not-a-valid-url` 与非法邮箱 `invalid-email`。
2. 保持事务模式为 **All or nothing (roll back on any error)**，点击 **Start background import**。
3. 在 **Import batches** 中点击该批次，状态显示 **Rolled back**，统计栏为 `Total rows: 2`、`Created: 0`、`Failed: 1`，下方错误表精确标出 `#3` 行、`Broken Record Corp`、`INVALID_FIELD` 与 `website: Invalid URL`。

![整批回滚后的批次报告、计数汇总与逐行错误明细](/assets/guides/crm-bulk-import-report.png)

4. 返回 **Customers** 搜索 `Cobalt Energy`，确认第 2 行已随整批事务一并回滚，没有残留半批数据。
5. 点击批次报告右上角 **Download error CSV**，下载带 `errorCode` 与 `errorMessage` 列的错误表格；修正网址与邮箱后重新上传，即可完成入库。

如果业务允许“先导入合法记录、错误行稍后补导”，可将事务模式切换为 **Row by row (commit valid rows)**。同样包含 1 条合法行与 1 条错误行的批次会以 **Completed with errors** 结束：合法行已提交，错误行被单独回滚并出现在错误报告中。

## 验证冲突策略、异常恢复与权限边界

通过界面和不同账号核对以下关键场景：

| 场景 | 操作 | 预期结果 |
| --- | --- | --- |
| 重复导入跳过 | 用 `skip` 策略再次上传刚才的正常 CSV | 状态 `Completed`，`Created: 0`、`Skipped: 2`，不产生重复客户 |
| 更新已有客户 | 修改 **Harbor Robotics** 的行业和状态，用 `update` + `rowByRow` 导入 | 原客户被更新，原联系人按邮箱匹配更新而非重复新建 |
| 冲突拒绝 | 对已存在客户使用 `reject` + `allOrNothing` 导入 | 触发 `CONFLICT_REJECTED`，整批回滚，原数据不受影响 |
| 销售数据隔离 | 销售 Alex 导入后，切换销售 Taylor 登录 | Taylor 看不到 Alex 的导入批次，也看不到 Alex 导入的客户；主管 Morgan 可查看 |
| 权限不足 | 对没有 `editCustomer` 权限的账号提交 `update` 模式导入 | 服务端直接拒绝（`403`），不入队后台任务 |

单进程开发环境默认使用内置 `memory` 后台执行器，重启前未完成的任务会在正常关闭时持久化到 `storage/jobs/`；多实例生产部署需切换共享 Redis 后端（详见[后台任务与定时执行](../../core/developing-apps/background-tasks.md#配置执行后端)），并在实际多实例环境单独验证并发消费。

提交幂等重放、大文件超限拒绝、中途账号停用与隔离库回滚等边界用例，可交给 Agent 运行 `tests/server/crm-imports.test.ts` 自动化检查并核对结果。

**完成的标志**：正常 CSV 通过后台任务完成客户与联系人入库；含错文件在整批原子模式下全部回滚且生成可下载的逐行错误报告；逐行提交、跳过/更新/拒绝三种冲突策略以及销售数据隔离均按规则生效。

## 小结与下一步

至此，CRM 已具备基于后台任务与事务校验的批量导入能力，并沉淀了可复用的客户与联系人校验、识别及冲突处理逻辑。

接下来，继续阅读[外部 API 与系统集成](external-integrations.md)，为外部线索系统签发带范围的 API 密钥、复用同一套客户接入规则，并打通已确认报价与赢单商机的 ERP / 财务出站同步。
