---
title: "用模板生成单据文件"
metaDescription: 从 CRM 草稿报价下载英文 DOCX，核对明细并在修改数量后重新生成。已有确认报价时，可另外出具使用确认快照的正式件。
---

有一份已保存的草稿报价，就可以在客户报价页面下载英文 DOCX，核对准备发给客户的价格。整个草稿练习都用销售账号操作，无需提交报价或先完成审批课。

**学习模块**

- [模板打印](../../core/using-plugins/automation/template-print.md)
- [文件管理](../../core/using-plugins/data-and-files/file-management.md)

## 准备一份草稿报价

运行[完整 CRM 示例](https://github.com/nocobase/doc-demo-crm/blob/main/README.MD)时，按示例说明安装并启动应用。完整项目依赖商业审批和待办中心插件，安装依赖需要相应的授权和包仓库访问权限。示例已包含草稿预览和正式件生成功能。运行示例时，准备好报价后，可以直接按各节的页面操作下载文件。

如果练习账号还没有角色，请管理员按[配置用户与角色](roles-and-permissions.md#配置用户与角色)分配 **Sales** 和 **Sales manager**。在开发环境中，如果还没有加载练习数据，在应用根目录运行：

```sh
pnpm nocobase db sample --json
```

初始示例客户没有负责人。请销售主管把 **Northstar Labs** 分配给练习用的销售账号 Alex。以 Alex 登录，打开 **Customers → Northstar Labs → Opportunities → Northstar sales workspace → Northstar team rollout**，检查状态为 **Draft**。草稿应有以下两行，币种为 USD。

| 产品 | 数量 | 单价 | 折扣 | 折后金额 |
| --- | ---: | ---: | ---: | ---: |
| CRM workspace license | 12 | 120.00 | 10% | 1296.00 |
| Implementation workshop | 1 | 800.00 | 0% | 800.00 |

如果报价已提交、内容已改过，或示例客户另有负责人，Alex 可以在自己负责的客户下创建商机，点 **New quote**，输入报价名称并按表添加两行，保存即可。重复运行样例命令会保留已有修改。产品和金额可对照[示例数据](https://github.com/nocobase/doc-demo-crm/blob/main/database/main/seeds/202611120001_sales_samples.ts)。

## 添加草稿预览并下载第一份英文报价单

在应用根目录向开发 Agent 提出需求：

```prompt
请在客户的草稿报价页加一个“下载草稿 DOCX”按钮。用英文报价单模板，在页首醒目标出 DRAFT，列出客户、商机、每项产品的数量、单价、折扣、折后金额，以及报价的总额和币种。每次下载都用最近保存的报价，改了数量就能看到新金额。下载后报价仍是草稿，只有能查看这份报价的人才能下载。
```

示例的下载按钮向服务端请求当前报价。服务端按登录用户的权限读取报价及明细，交给渲染器填入 Word 模板。例如，`{d.lines[i].quantity}` 会在每一行显示对应产品的数量，`{d.total}` 显示已保存的报价总额。生成的 DOCX 直接返回给销售，预览不会提交审批或创建正式文件。参见[英文模板](https://github.com/nocobase/doc-demo-crm/blob/main/docs/templates/quotation-v2.docx)和[渲染器](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/quotation-renderer.ts)。

在报价详情的 **Draft quotation preview** 区域点 **Download draft DOCX**，打开下载的文件。页首应有粗体 **DRAFT QUOTATION**。核对客户、商机和报价名称，再逐行核对产品、数量、单价和折扣。两行金额相加，文末应为 **Total: 2096.00 USD**。

![初次下载的英文草稿，页首标有 DRAFT QUOTATION，两行产品合计 2096.00 USD。](/assets/guides/quotation-draft.png)

## 修改数量，重新生成并核对金额

保持报价为 **Draft**，点击 **Edit quote**，把 **CRM workspace license** 的数量从 `12` 改为 `13`，保存。页面总额应变为 `2204.00`。再次点 **Download draft DOCX**，打开刚下载的文件，与第一份对照：

| 文件中的值 | 首次下载 | 修改后下载 |
| --- | ---: | ---: |
| 许可证数量 | 12 | 13 |
| 许可证折后金额 | 1296.00 | 1404.00 |
| 工作坊金额 | 800.00 | 800.00 |
| 总额（USD） | **2096.00** | **2204.00** |

两份文件都应带有 **DRAFT**。回到报价页，状态仍为 **Draft**，可以继续编辑。

## 可选：为已确认报价生成正式件并验证重复下载

需要对外出具正式报价单时，可以继续向开发 Agent 提出需求：

```prompt
请给已确认的报价加一个“生成正式报价单”按钮，沿用草稿的英文模板，把标题改成 QUOTATION。产品、价格和金额都按确认时的报价填写。第一次出具后就保存这份文件，即使产品后来调价，再次下载也要拿到同一份。每次下载都要检查这个人现在还能不能查看这份报价。
```

正式件从确认时保存的快照取数，客户和商机名称在首次出具时定格。服务端将生成的文件关联到该报价，之后的下载都读取这份文件。参见[报价文件服务](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/customer-files.ts)。

打开一份有权查看的 **Confirmed** 报价，在 **Quotation document** 区域点 **Generate DOCX**，再点文件名预览或下载。正式件标题为 **QUOTATION**，正文标有 **Confirmed quotation**。逐行对照已确认报价的数量、单价、折扣和总额。

如果在独立练习环境使用上面改为 13 份许可证的报价，按默认折扣门槛提交后会直接确认。出具时应得到 `2204.00 USD`。请主管调整练习产品的目录价，再下载同一正式件：文件内容和金额应完全一致。用另一位无权查看该客户的销售账号打开同一下载链接，应被拒绝。参见[下载权限测试](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/customer-files.test.ts)。

![确认后的正式报价单，文中标有 Confirmed quotation，总额为 2204.00 USD。](/assets/guides/quotation-document.png)

## 小结与下一步

**完成的标志**：打开两份带 **DRAFT** 标记的英文报价单，把许可证数量从 12 改为 13 后，两份文件的总额分别为 **2096.00 USD** 和 **2204.00 USD**。报价仍可编辑。

已有确认报价的正式件时，可以继续按[邮件接入与业务收发](email.md)将文件发给客户。
