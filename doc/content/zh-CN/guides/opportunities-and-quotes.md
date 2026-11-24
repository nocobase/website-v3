---
title: "多表关联建模与历史快照"
metaDescription: 从业务需求得到 ER 模型和数据库字典，用 Migration 建立关联数据，并通过调价理解报价如何保留历史价格。
---

在包含客户、联系人与跟进记录的业务应用中增加商机、产品和报价。保存报价时记下当时的价格，让旧报价不受产品调价影响。

使用管理员账号操作，并保留已有客户、联系人和跟进记录，以便检查新增结构是否影响原有数据。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="core-capabilities/index.md#示例项目说明">完整示例使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">示例项目</th><td><a href="https://github.com/nocobase/doc-demo-crm"><code>nocobase/doc-demo-crm</code></a>（最新完整 CRM 示例）</td></tr>
<tr><th scope="row">运行说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/main/README.MD">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/framework/database/overview.md">数据库</a></td></tr>
</tbody>
</table>
</div>
</div>

## 从需求或已有资料得到 ER 模型与数据库字典

数据建模过程将业务对象和关联关系整理为数据库表结构。

Northstar Labs 可能同时采购团队许可证和另一个部门的服务。客户资料描述的是同一家公司，每次销售机会却有各自的进度和报价，因此在客户下增加“商机”，再把报价归到对应商机。

在应用根目录的 Agent 会话中发送：

```prompt
我想在现有 CRM 中管理商机和报价。一个客户可以有多个商机，每个商机可以有多份报价。产品目录维护名称、编码和当前单价；每份报价可以选多个产品，分别填写数量和折扣，产品以后调价不能改变已保存的报价。

先帮我画出这些数据的 ER 图，再整理一份简短的数据库字典，说明关键字段的含义、类型、关联和约束。保留已有客户、联系人和跟进记录，先不改数据库。
```

ER 图用图形展示这些对象及其关系，数据库字典则用文字说明各类记录要保存哪些字段、字段代表什么。它们是同一个模型的两种表达，帮助你在开发前确认 Agent 对业务的理解。对照 Agent 给出的图，沿着客户找到商机、报价和明细，再看明细怎样关联产品：

![客户到商机、商机到报价、报价到明细、产品到明细均为一对多关系。产品保存当前价，报价明细保存报价时的单价。](/assets/guides/crm-sales-er.svg)

一份报价可以包含多个产品，一个产品也可以出现在多份报价中。**报价明细**连接两者：数量和折扣描述“这次卖多少、优惠多少”，所以属于明细，而不是产品目录。明细既保存 `productId`，也保存自己的单价；只有产品关联，重新读取报价时就会取到调价后的当前价。

下面是数据库字典的节选。重点看每类记录负责保存什么，以及它怎样连接其他记录：

| 记录 | 关键字段示例 | 在业务中的作用 |
| --- | --- | --- |
| 产品 `crmProducts` | 名称、编码、当前单价 | 维护可以销售的产品及其当前价格 |
| 商机 `crmOpportunities` | 客户关联、名称、阶段 | 将同一客户的不同销售机会分开管理 |
| 报价 `crmQuotes` | 商机关联、名称、总额 | 记录针对某次销售机会提出的报价 |
| 报价明细 `crmQuoteLines` | 报价关联、产品关联、数量、报价单价、折扣 | 记录这份报价具体卖什么、卖多少、按什么价格卖 |

生成迁移时，Agent 还需要把这些字段落实为数据库中的名称、类型和约束。具体定义可对照完整示例中的[模型与字段说明](https://github.com/nocobase/doc-demo-crm/blob/main/docs/sales-model.md)。

确认图和字典表达了业务含义后再继续：同一客户的两次销售机会能否分开？同一产品在不同报价中能否有不同数量、折扣和单价？旧报价能否不依赖目录当前价？

如果已有 ER 图或数据库字典，可以直接交给 Agent 读取并补齐缺少的关联、类型和约束，再进入下一步。优先提供文本或结构化导出；图片中未标出的信息需要补充，外部 SQL 也需要结合现有项目转换成增量迁移。

## 将模型转换为 Migration 并执行

Migration（数据库迁移）是内核 DB 提供的建表机制，主数据源中的业务表及后续结构变更必须通过 Migration 创建和管理，接入外部数据源不受这一要求限制。

确认模型后，继续发送：

```prompt
这个模型可以。请按确认的 ER 图和字典，给现有 CRM 增加商机、产品、报价和报价明细相关的表，保留原有记录。先让我看一下这次会增加哪些表和关联。
```

相关迁移分别创建四张表及关联约束、补充应用查询关联数据所需的定义。执行后，数据库才能存储这些记录，应用也能沿着“客户 → 商机 → 报价 → 明细”读取数据。具体写法见[数据库迁移](../core/developing-apps/data-models-and-migrations.md)和[数据库关联](../core/framework/database/relations.md)。

确认待执行内容只增加新增结构、没有删除原表后，在已配置好数据库的应用根目录执行：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

先备份已有数据库；`--dry-run` 用于预览，第二条命令才实际执行。若开发服务已自动应用迁移，预览可能没有待执行项，按迁移记录核对即可。

执行后核对新增表和关联，再打开原客户，查看联系人、跟进记录并新增一条跟进。它们应仍可正常使用。此时只是具备了存储结构：Migration 不会自动把产品价复制到报价明细，保存报价时还需要实现这段业务逻辑。

## 创建商机与报价，连接产品和报价明细

继续让 Agent 接上业务操作：

```prompt
请把这些数据接到页面上：能维护产品，从客户创建和打开商机，再新建、查看和编辑报价。沿用英文界面。

选择产品时带入当前单价，保存时记下本次报价的单价；编辑旧报价时沿用已保存的单价。按数量、单价和折扣计算每行金额，四舍五入到两位小数，再相加得到总额。10% 折扣表示减免十分之一。

使用 USD，先不计算税费、运费和汇率。做好后运行起来，我来创建一份报价。
```

完整示例中的[报价保存逻辑](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/sales.ts)负责保存单价、按整数美分计算金额，并在编辑时使用报价自己的单价。服务端重新计算合计，不接受浏览器直接指定总额；通过[事务](../core/developing-apps/transactions-and-consistency.md)把报价和明细一起保存，避免某一行失败后留下半份报价。

用管理员账号在英文界面完成以下操作：

1. 打开 **Customers → Northstar Labs**。没有这条客户记录时先创建，并添加联系人和跟进记录。
2. 在 **Products** 中创建或更新 **Team workspace license**（编码 `TEAM-LICENSE`，单价 `100.00`）和 **Onboarding workshop**（编码 `ONBOARDING`，单价 `250.00`）。
3. 回到客户，通过 **New opportunity** 创建 **Northstar sales workspace**；已有同名商机则直接打开。
4. 新建 **Annual rollout proposal**，选择两个产品，按下表填写数量和折扣，保存后重新打开并刷新。

| 产品 | 数量 | 报价单价 | 折扣 | 行金额 |
| --- | --- | --- | --- | --- |
| Team workspace license | 10 | 100.00 | 10% | 900.00 |
| Onboarding workshop | 1 | 250.00 | 0% | 250.00 |
| **总额** | | | | **1150.00** |

若加载过示例数据，还会有 **Northstar team rollout**，总额为 `2096.00`；它是另一份预置报价，本练习另建 Annual rollout proposal。

![Annual rollout proposal 保存两行产品、单价及折扣，总额为 1,150.00 USD。](/assets/guides/quote-details.png)

沿 **Northstar Labs → Northstar sales workspace → Annual rollout proposal** 打开记录，检查报价归属和两行明细是否一致。这条访问路径对应刚才建立的关联。

## 调整产品价格，验证历史报价

先预测：把 Team workspace license 从 `100.00` 调到 `120.00` 后，产品目录、已保存的 Annual rollout proposal，以及重新选择该产品的新报价，分别应该使用哪个价格？

然后操作并核对：

| 操作 | 应观察到的结果 |
| --- | --- |
| 在 Products 将许可证单价改为 `120.00` | 目录显示 `120.00` |
| 重新打开旧报价并刷新 | 许可证单价仍为 `100.00`，总额仍为 `1150.00` |
| 在同一商机新建 **Repriced rollout check**，重新选择两种产品，数量和折扣与上表一致并保存 | 许可证带入 `120.00`，行金额为 `1080.00`，报价总额为 `1330.00` |
| 编辑旧报价，将许可证数量从 `10` 改为 `12`，不改单价和折扣 | 使用旧单价 `100.00` 重算，行金额为 `1080.00`，总额为 `1330.00` |
| 将旧报价数量改回 `10`，保存并刷新 | 总额恢复为 `1150.00` |

新报价的 10 个许可证和旧报价的 12 个许可证恰好得到相同金额，但采用的单价不同。解释结果时要看明细，而不能只看总额。产品关联回答“选了哪个产品”，明细上的单价回答“这次按什么价格报价”；关联和保存下来的历史值各有作用。

输入校验、保存失败及原有功能回归等配套检查，交给 Agent 在隔离数据库中运行自动化测试（参考[验证说明](https://github.com/nocobase/doc-demo-crm/blob/main/docs/verification.md)），并核对实际结果。

想要了解如何基于已有业务数据搭建销售日常使用的工作台界面，继续查看[使用 UI Library 搭建工作台界面](sales-workspace.md)。
