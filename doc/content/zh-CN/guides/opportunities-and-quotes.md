---
title: 商机与报价数据建模
metaDescription: 为客户增加商机、产品和报价，理解关联数据、价格快照与金额计算，并验证升级后已有数据保持完整。
lesson: 5
---

在[客户跟进 CRM](test-and-deliver.md)中增加商机、产品和报价。保存报价时记下当时的价格，让旧报价不受产品调价影响。

使用管理员账号，保留已有客户、联系人和跟进记录，以便检查新增功能是否影响原有数据。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#使用示例项目的-tag">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-4"><code>lesson-4</code></a></td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-5"><code>lesson-5</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-5/docs/lesson-5.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/framework/http/validation.md">请求校验</a></td></tr>
</tbody>
</table>
</div>
</div>

## 明确业务关系与计算规则

客户表示往来对象，商机表示一次可能成交的业务，报价表示为这次业务提供的一组产品和价格。同一客户可以讨论多项业务，同一商机也可能提供多套报价。

![客户、商机、报价、报价明细与产品的 ER 图。1:N 表示一对多；报价明细保存报价时的单价，产品保存当前单价。](/assets/guides/crm-sales-er.svg)

产品目录记录当前单价，报价明细保存这次报价的单价。这份保存下来的价格称为“价格快照”。以后产品调价，旧报价仍使用原单价。客户、商机和报价之间的关系由 Core 的[数据库关联](../core/framework/database/relations.md)管理。

保存报价还要满足两条规则：

- 服务端按明细重新计算金额，不能直接采用浏览器提交的合计值。
- 报价和全部明细一起保存。任何一行不合法，都不能留下部分数据。

## 开发商机、产品与报价

新增数据结构时，使用[数据库迁移](../core/developing-apps/data-models-and-migrations.md)保留原有记录。报价与明细一起保存或一起撤销，称为[事务](../core/developing-apps/transactions-and-consistency.md)。输入检查见[请求校验与错误](../core/developing-apps/request-validation-and-errors.md)。

在应用根目录的 Agent 会话中发送：

```prompt
在现有 CRM 中增加商机、产品和报价。能从客户打开商机，再查看报价明细。保留已有客户、联系人和跟进记录，沿用英文界面，用虚构数据演示。

业务规则如下：
- 一个客户可以有多个商机，每个商机可以有多份报价。
- 产品记录名称、编码和当前单价。报价明细记录产品、数量、报价单价和折扣。
- 数量为正整数，单价不为负数。折扣范围是 0–100%，10% 表示减免十分之一。
- 每行金额为数量 × 单价 ×（1 − 折扣百分比），四舍五入保留两位小数。总额是各行舍入后的金额之和。
- 产品调价不改变旧报价。修改报价明细后，按报价保存的单价重新计算。
- 报价使用 USD，先不计算税费、运费和汇率，也不做审批、附件和通知。
```

报价尚不代表已审批或已成交，也不会自动发送给客户。

## 创建报价并检查价格

我们用管理员账号完成下面这一组操作，后两课继续使用这些记录：

1. 打开 **客户** 中的 **Northstar Labs**。已有客户可直接沿用；没有这条记录时先创建，并添加联系人和跟进记录。
2. 在 **产品** 中创建 **Team workspace license**（编码 `TEAM-LICENSE`，单价 `100.00`）和 **Onboarding workshop**（编码 `ONBOARDING`，单价 `250.00`）。若练习中已建过，核对这两项产品及价格即可。
3. 回到 Northstar Labs，打开 **Northstar sales workspace** 商机；没有时通过 **新建商机** 创建。
4. 在这个商机中新建 **Annual rollout proposal**，选择上面的产品，按下表填写数量和折扣。选择产品时应带入目录单价，保存后总额应为 `1150.00`。

如果加载过示例数据，商机中还会有 **Northstar team rollout**，总额为 `2096.00`。它是另一份预置报价，本练习另外创建 Annual rollout proposal。

| 产品                   | 数量 | 报价单价 | 折扣 | 行金额      |
| ---------------------- | ---- | -------- | ---- | ----------- |
| Team workspace license | 10   | 100.00   | 10%  | 900.00      |
| Onboarding workshop    | 1    | 250.00   | 0%   | 250.00      |
| **总额**               |      |          |      | **1150.00** |

1. 沿 **Northstar Labs → Northstar sales workspace → Annual rollout proposal** 重新打开报价并刷新，确认明细仍在。
2. 把 Team workspace license 的目录价格改为 `120.00`。旧报价仍用 `100.00`，新建明细才带入 `120.00`。
3. 将旧报价第一行的数量从 `10` 改为 `12`，保留单价和折扣。行金额应为 `1080.00`，总额为 `1330.00`。
4. 将数量改回 `10`，总额应恢复为 `1150.00`。

![报价保存了两行单价与折扣，总额为 1,150.00 USD。](/assets/guides/quote-details.png)

## 检查报价金额与保存结果

在界面中逐项检查，可对照上面的报价截图核对明细和总额：

| 操作                                   | 应有结果                                      |
| -------------------------------------- | --------------------------------------------- |
| 为同一客户添加两个商机，各建一份报价   | 两份报价分别属于正确商机，不混入另一商机      |
| 按上表创建报价并刷新                   | 两行金额分别为 900.00、250.00，总额为 1150.00 |
| 调整产品目录价格后重新打开旧报价       | 保存的报价单价、折扣和金额不变                |
| 修改旧报价的数量                       | 使用该报价保存的单价重新计算                  |
| 输入零数量、负单价或超过 100% 的折扣   | 拒绝保存，原报价保持完整                      |

保存失败和重试等情况由 Agent 检查，并用业务结果说明：保存失败不会留下部分报价明细，同一次保存重试不会新增重复报价或明细，已删除的商机或产品不能用于创建报价。界面截图可以展示金额和保存后的明细；无法从截图判断的情况，应以 Agent 实际完成的检查结果为准。

未登录或没有页面权限的人不能访问这些页面。销售之间的客户隔离将在第 7 课实现。

## 确认原有客户资料完整

打开上一课创建的客户，确认客户资料、联系人和跟进记录仍在，并且可以继续新增跟进。新增商机和报价后，也应能回到对应客户查看这些记录。

继续[销售工作台 UI 搭建](sales-workspace.md)，把这些入口组织成销售每天使用的页面。
