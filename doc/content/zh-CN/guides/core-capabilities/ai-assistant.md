---
title: "搭建知识库"
metaDescription: 在 CRM 中接入知识库，管理产品手册、报价政策与销售话术，通过修改建议、版本审阅、全文检索和节点权限保证资料准确可控。
---

在 CRM 应用中接入团队产品知识库：销售主管维护产品手册、报价政策与销售话术，销售人员随时检索并在发现遗漏时提交修改建议，经审阅后形成可追溯的新版本，同时对内部敏感资料设置访问隔离。

在完整示例中体验时，准备管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（角色配置见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)）。

**学习模块**

- [知识库](../../core/using-plugins/agents-and-knowledge/knowledge.md)

## 明确知识空间与角色权限

产品知识库使用独立空间 `crm-products`（界面标题为 **Product knowledge**），与客户业务记录分开维护。不同角色在空间内拥有不同操作范围：

| 角色 | 空间权限 | 可执行操作 |
| --- | --- | --- |
| 销售（Alex、Taylor） | `read`、`propose` | 浏览、检索文档并提交修改建议；不能直接修改或决定建议 |
| 销售主管（Morgan） | `read`、`propose`、`edit` | 创建目录和文档、直接编辑、审阅并接受或拒绝建议 |
| 管理员 | `manage`（含上述全部） | 管理空间与单篇文档的自定义访问权限 |

对只面向管理层的内部文档（例如内部折扣底线说明），管理员可以将单篇文档改为**自定义权限**并仅授予销售主管。被限制的文档对普通销售既不可见，也不会出现在检索结果中。

## 接入知识库并维护产品文档

[知识库插件](../../core/using-plugins/agents-and-knowledge/knowledge.md)提供知识空间、目录树、Markdown 编辑、版本历史、基础全文检索与修改建议界面，无需预先启用 Agents 或语义向量索引。完整示例在[助手 Provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-assistant.ts)中绑定了空间权限解析与用户主体目录，并在[客户端路由](https://github.com/nocobase/doc-demo-crm/blob/main/client/routes.ts)将 **Product knowledge** 挂入主导航。

将第一节的角色权限表连同下面的提示词交给开发 Agent：

```prompt
给 CRM 增加一个产品知识库入口，用来维护产品手册、报价政策和销售话术。

- 销售可以浏览、搜索文档并提交修改建议，但不能直接改正文或审批建议。
- 销售主管可以创建、编辑文档，并审核销售提交的修改建议。
- 管理员可以为敏感文档单独设置可见人员，未授权的销售看不到也搜不到。
- 先使用内置的文本搜索，不要求额外配置向量模型。
```

完成接入并启动应用后，按下面步骤准备初始资料：

1. Morgan 登录应用，打开左侧导航的 **Product knowledge**，新建三个目录：**Product guides**、**Pricing & policies** 和 **Sales playbooks**。
2. 在 **Product guides** 下新建文档 **Enterprise Implementation Guide**，记录多区域 CRM 实施的标准四周排期（第 1 周需求与建模、第 2 周工作台与权限、第 3 周 UAT 与培训、第 4 周上线）。
3. 在 **Pricing & policies** 下新建文档 **Quotation Discount Policy**，记录报价折扣规则（10% 及以下自动确认，超过 10% 需销售主管审批，申请人不能自审，已确认报价锁定价格快照）。
4. 在 **Sales playbooks** 下新建文档 **Sales Discovery Playbook**，记录初次需求沟通清单。
5. 管理员在 **Pricing & policies** 下新建 **Internal Discount Margin Floor**，打开该文档右上角菜单的权限设置，切换为自定义权限并仅授予 Morgan 读取权限。

![Alex 在产品知识库中浏览已发布的第 2 版报价折扣政策，未授权的内部文档不会显示](/assets/guides/crm-knowledge-space.png)

## 提交修改建议与版本审阅

销售发现产品资料或话术需要补充时，通过修改建议发起变更，由主管核对差异后决定是否发布新版本，避免正文被随意改写：

1. Alex 打开 **Product knowledge → Pricing & policies → Quotation Discount Policy**。界面顶部显示 **Propose only**，点击 **Propose changes**。
2. 补充主管审批时效说明（例如超过 10% 折扣在 2 个工作日内完成审批），填写修改理由并提交。
3. Morgan 打开 **Product knowledge**，在左侧点击 **Pending review**，打开待审阅条目并切换到 **Changes** 标签查看改动差异。
4. 确认内容准确后点击 **Accept**。文档自动生成新版本（`v2`），并保留修改人与提交理由。

![Morgan 在待审阅视图中查看 Alex 提交的修改差异并选择接受或拒绝](/assets/guides/crm-knowledge-proposal.png)

如果审阅期间原文档已有其他人更新导致版本冲突，系统会拒绝旧版本覆盖，需读取最新版本后重新处理。

## 验证全文检索、版本历史与访问边界

使用独立账号逐项检查界面与权限行为：

| 操作 | 预期结果 |
| --- | --- |
| Alex 使用搜索框（`Ctrl/Cmd + K`）搜索 `discount` | 返回 **Quotation Discount Policy**（`v2`），不出现 **Internal Discount Margin Floor** |
| Morgan 搜索 `discount` | 同时返回 **Quotation Discount Policy** 与带锁图标的 **Internal Discount Margin Floor** |
| Alex 在 **Quotation Discount Policy** 点击 **History** | 可查看 `v1` 与 `v2` 的变更记录，且界面只允许提交建议，不能直接编辑 |
| Alex 尝试通过接口直接修改文档或接受建议 | 服务端拒绝，原文档版本保持不变 |

版本并发冲突（携带过期 `expectedVersion` 提交更新）以及越权读取受限文档的接口校验，由示例的[自动化集成测试](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/crm-assistant.test.ts)在隔离环境中验证。本专题使用内置文本检索；如需为扫描件或语义问答配置向量索引，请参阅[知识库插件文档](../../core/using-plugins/agents-and-knowledge/knowledge.md#搜索与语义索引)。

## 小结与下一步

**完成的标志**：产品知识库已在导航中可用，销售主管能维护文档并审阅发布新版本，销售只能浏览、检索和提交建议，单篇受限文档在目录树和搜索结果中均对未授权销售不可见。

产品资料准备就绪后，继续查看[接入业务 Agent](business-agent.md)，让客户详情页的销售助手结合这些知识与客户记录生成可核对的跟进草稿。
