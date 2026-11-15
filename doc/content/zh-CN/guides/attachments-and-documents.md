---
title: 附件管理与报价单生成
metaDescription: 将需求附件与客户权限关联，从已确认报价生成内容固定的 DOCX，并验证访问、下载与报价金额。
lesson: 9
---

在[报价审批与待办](quote-approvals.md)的基础上，我们为客户保存需求材料，并把已确认报价变成可下载的正式文件。

直接体验完成版且没有练习数据时，先准备：

- 按[账号与角色准备](team-permissions.md#配置用户与角色)创建管理员、销售 Alex 和 Taylor、主管 Morgan。
- 完成[第 8 课报价练习](quote-approvals.md#在待办中心查看和处理审批)，让 **Phase one implementation** 达到 **已确认**。
- 保持 Alex 为 **Northstar Manufacturing** 的负责人，Morgan 的主管角色有效。

无需重做前课的开发或撤销权限练习。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#使用示例项目的-tag">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-8"><code>lesson-8</code></a></td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-9"><code>lesson-9</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-9/docs/lesson-9.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/using-plugins/data-and-files/file-management.md">文件管理</a> · <a href="../core/framework/file-storage.md">文件存储</a> · <a href="../core/using-plugins/automation/template-print.md">模板打印（Skill）</a></td></tr>
</tbody>
</table>
</div>
</div>

## 明确附件与正式报价文件的用途

需求附件记录客户提供的材料，可以随业务补充或移除。正式报价文件记录已经确认的方案，不能随着商品目录或客户名称的后续修改而变化。

我们生成英文 DOCX 报价单，暂不提供 PDF 转换或在线模板编辑；调整方案时另建报价，确认后再生成文件。

## 上传和管理客户附件

[文件管理](../core/using-plugins/data-and-files/file-management.md)提供上传与预览，[文件存储](../core/framework/file-storage.md)保存文件内容。下载时仍需检查客户权限，不能仅凭下载地址读取。示例的[文件服务](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/providers/customer-files.ts)和[接口](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/routes/customer-files.ts)实现这些规则。

向开发 Agent 发送：

```prompt
给客户详情增加附件页，支持上传、查看和下载需求材料。每次最多 10 个文件，每个不超过 5 MB。

- 附件沿用客户权限。只读共享用户能查看和下载，不能上传或删除。
- 取消或上传失败时，不显示为已保存。删除附件后，原上传人也不能再访问或重新关联它。
- 在系统设置中展示存储规则。管理员能清理超过 24 小时且从未关联客户的暂存文件，不影响已保存附件或正式报价文件。

给已确认报价增加“生成报价单”，下载英文 DOCX：
- 使用固定模板，包含客户、商机、商品明细、数量、单价、折扣、币种和总额。
- 报价内容使用确认时的版本，客户和商机名称在首次生成时保存。之后始终返回同一份文件，不随产品或客户改名而变化。
- 未确认报价不能生成文件。失去客户访问权限后，不能下载附件或生成报价单。
- 管理员能在系统设置中查看实际使用的模板。
```

上传的文件保存在私有本地存储中，点击 **保存** 后才关联到客户。管理员可在 **系统设置 → 文件与报价文档** 清理超过 24 小时且未关联客户的暂存文件。

1. 准备 `Customer requirements.txt`，写入项目范围与实施数量。
2. Alex 打开 **Northstar Manufacturing → 附件**，点击 **添加附件**，上传文件并保存。
3. 核对列表中的文件名、类型、大小、上传人和时间。点击文件名预览，点击 **下载** 下载。

![客户详情中的需求附件](/assets/guides/customer-attachments.png)

## 从已确认报价生成文档

[模板打印](../core/using-plugins/automation/template-print.md)提供开发指引和参考代码，生成页面由 Agent 在应用中实现。示例使用[固定 DOCX 模板](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/docs/templates/quotation-v1.docx)，随应用版本发布。生成方式见[报价文件代码](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/providers/quotation-renderer.ts)，无需 PDF 转换器。

打开上一课已确认的 **Phase one implementation**，在 **正式报价文件** 点击 **生成 DOCX**。生成后点击文件名预览或下载。核对以下内容：

| 项目 | 预期值 |
| --- | --- |
| Customer | Northstar Manufacturing |
| Opportunity | Regional CRM rollout |
| Product | CRM implementation |
| Quantity / Unit price / Discount | 2 / 12000.00 / 15% |
| Total / Currency | 20400.00 / USD |

![运行示例中预览已生成的正式报价 DOCX](/assets/guides/quotation-document.png)

未确认的报价只显示先确认的提示，不提供生成操作。生成失败应保留报价并允许重试，不能出现一份内容不完整的正式文件。

## 检查文件内容与访问权限

用独立账号完成这些检查，不用管理员代替销售或共享用户：

- 上传后取消，客户列表不出现该文件；保存失败后保留选择，重试成功再进入列表。
- 客户负责人和有权主管能读取附件；只读共享用户能下载但不能修改；无关销售、未登录用户不能读取。转移客户后重试旧下载地址。
- 下载 DOCX 并打开，核对客户、商机、每条明细与总额。修改商品目录和客户名称，再次生成应返回原文件，内容不变。
- 连续点击或重试生成，不增加第二份正式文件；管理员清理只影响超时未关联上传，不影响已保存附件和报价文件。

同时生成文件、保存失败、清理时发生上传，以及升级后数据是否保留，都交给 Agent 在独立环境测试，并查看其报告中的实际结果和未完成的检查。

**完成的标志**：客户附件可保存、预览和下载，下载权限随客户访问范围变化；已打开生成的正式 DOCX，核对客户、商机、明细和 20400.00 USD 总额，重复生成仍返回原文件，清理不影响已保存文件。

下一课，我们为客户分配和审批结果接入[客户分配与报价结果的站内通知](notifications.md)。
