---
title: "接入业务 Agent"
metaDescription: 在 CRM 客户详情接入遵守角色权限的销售助手，结合产品知识库与客户记录生成带引用依据的可编辑跟进草稿，并经人工确认后再保存。
---

在 CRM 客户详情中接入应用内销售助手：销售人员点击生成后，助手按当前登录账号的权限读取客户记录、商机与产品知识库，输出客户摘要、下一步建议、资料引用与缺少依据的提醒，并填入可编辑的跟进草稿，由人工核对修改后再手动保存。

注意区分本专题涉及的两种 Agent：**开发 Agent**（Coding Agent）在代码仓库中帮你编写业务工具和界面；**应用内业务 Agent**（销售助手）运行在已启动的 CRM 应用内，为终端用户提供受权限约束的业务辅助。

在完整示例中体验时，准备：

- 管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)）。
- 已有客户跟进与商机数据（例如 Alex 负责的 **Northstar Manufacturing** 及商机 **Regional CRM rollout**）。
- 已录入产品文档的知识库（见[搭建知识库](ai-assistant.md)）。
- 一个可用的对话模型服务及 API 密钥（如 DeepSeek、OpenAI 或兼容 OpenAI 协议的服务）。

**学习模块**

- [Agents](../../core/using-plugins/agents-and-knowledge/agents.md)
- [知识库](../../core/using-plugins/agents-and-knowledge/knowledge.md)

## 明确销售助手的能力与权限边界

销售助手只提供**只读查询**与**草稿生成**，不代替销售直接执行外部或写操作：

- **业务数据范围**：每次工具调用都按当前登录用户重新校验客户访问权限。无权查看的客户在调用模型前即被拒绝；模型输入不能自行指定其他用户或切换客户。
- **知识检索范围**：检索产品知识库时沿用当前用户的知识库权限，未授权的内部受限文档（例如仅主管可见的 **Internal Discount Margin Floor**）不会进入模型上下文或引用列表。
- **引用与诚实边界**：涉及产品排期、报价政策等说明必须先检索知识库，仅引用实际命中的文档标题和版本号；知识库未覆盖的承诺（如定制违约金条款）必须明确列出在**缺少资料依据**中，不能编造。
- **人工确认保存**：生成过程绝不自动发送邮件、修改报价或写入跟进记录。销售需人工核对并编辑草稿后，通过已有跟进保存接口显式提交；只读共享用户只能查看草稿，不能保存跟进记录。

## 配置模型服务并注册业务工具

[Agents 插件](../../core/using-plugins/agents-and-knowledge/agents.md)提供模型服务管理、密钥加密存储与 `OnlineAgent` 编排能力；CRM 应用负责注册受权限保护的业务工具与客户详情交互。

### 交给 Agent 开发

将第一节的权限与安全边界连同下面的提示词交给开发 Agent：

```prompt
在 CRM 客户详情里增加一个“销售助手”标签页，并把 AI 模型管理接到系统设置中：
- 生成跟进草稿时，只读取当前用户有权访问的该客户资料、联系人、跟进记录、商机和报价，以及当前用户有权检索的产品知识库。
- 输出客户摘要、建议下一步、引用的知识文档及版本号、缺少依据的说明，以及一份可编辑的跟进草稿。
- 不能自动发邮件、改报价或直接写跟进记录；由销售核对修改后手动保存，只读共享用户不能保存。
- 没有启用对话模型时，在页面给出清晰提示。
```

### 理解实现

完整示例中的[助手 Provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-assistant.ts)注册了两个只读业务工具和一个命名作用域 `crm-follow-up`：

- `crm_customer_context`：使用请求上下文中的 `customerId` 和当前用户身份重新构造权限策略，读取客户、联系人、最近跟进以及商机与报价。
- `crm_product_knowledge`：先复核客户读取权限，再以当前用户身份调用 `knowledgeToken.docs.search` 检索 `crm-products` 空间并返回命中的文档 ID、标题、版本号与正文片段。

[助手接口](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-assistant.ts)先校验当前用户对目标客户的查看权限及模型可用性，再通过 `agents.onlineAgent.background(...)` 执行带 JSON Schema 约束的后台生成，返回结构化摘要与草稿，不执行任何写入：

```ts
const session = await agents.onlineAgent.background(
  {
    user: { id: authCtx.user.id },
    authorization: authzCtx,
    credentials: authCtx,
    business: { customerId },
  },
  {
    scope: ['crm-follow-up'],
    selectedModel: resolvedModel,
    source: 'crm-follow-up-draft',
    title: `Follow-up draft: ${customerName}`,
  },
);
await session.run(
  [{ role: 'user', content: userPrompt }],
  FOLLOW_UP_DRAFT_JSON_SCHEMA,
);
const draft = FollowUpDraftResult.parse(await session.get());
```

### 在系统设置配置模型服务

应用存储模型密钥需要配置 `secrets.keys`（在私有 `config.yml` 中设置主密钥，切勿提交到仓库）。管理员登录应用后：

1. 打开 **系统设置 → AI → AI models**，点击 **+ Add service**。
2. 选择模型服务商（例如 **DeepSeek**、**OpenAI** 或 **OpenAI-compatible**），填写名称、Base URL，并在 **API key** 字段输入自己的真实密钥。密钥为只写加密保存，切勿写入提示词或截图。
3. 点击 **Fetch models** 或手动添加 `chat` 类型模型，执行 **Test connection** 确认连通。
4. 打开 **Enabled** 开关并保存。

![在系统设置中配置真实模型服务与加密保存 API 密钥](/assets/guides/crm-assistant-models.png)

如果尚未启用任何 `chat` 模型，客户详情的 **Sales assistant** 标签页会直接提示联系管理员配置模型，不会触发空调用。

## 在客户详情生成带依据的跟进草稿

模型服务启用后，使用销售账号体验完整流程：

1. Alex 打开 **Northstar Manufacturing → Sales assistant**。
2. 确认已选中可用的对话模型，在 **Focus for this follow-up** 输入本次沟通重点（例如：`Summarize recent progress, explain our 4-week implementation schedule and discount approval policy for the 15% quote, and note whether custom SLA penalties are covered.`）。
3. 点击 **Generate follow-up draft**，等待助手依次调用客户上下文工具与产品知识检索工具并输出结构化结果。
4. 核对左侧卡片：
   - **Customer summary** 与 **Suggested next step** 是否与该客户实际跟进、商机和报价一致。
   - **Product knowledge sources** 是否列出了命中的文档与版本（如 **Enterprise Implementation Guide** `v1`、**Quotation Discount Policy** `v2`）。
   - **Missing evidence** 是否明确指出知识库中不存在定制违约金条款，提醒销售先向内部确认，而非擅自承诺。
5. 在右侧 **Editable follow-up draft** 调整沟通方式、正文与下一步内容，确认无误后点击 **Save as follow-up**。
6. 点击成功提示中的 **View follow-ups**，确认该条记录已出现在客户的 **Follow-up records** 列表中。

![Alex 在客户详情查看带知识引用的摘要与可编辑跟进草稿](/assets/guides/crm-assistant-draft.png)

## 验证资料引用、权限隔离与人工确认

使用独立账号验证权限与安全边界：

| 操作 | 预期结果 |
| --- | --- |
| Alex 生成草稿后不点击保存，直接打开 **Follow-up records** | 列表不新增记录，证明生成阶段无自动写入 |
| Alex 在草稿中询问折扣规则 | 仅引用有权读取的 **Quotation Discount Policy**（`v2`），不泄露主管专属的 **Internal Discount Margin Floor** |
| 无关销售 Taylor 直接请求 Alex 客户的草稿接口 | 服务端在调用模型前返回 `404` |
| Morgan 将客户只读共享给 Taylor 后，Taylor 打开 **Sales assistant** | 可生成和查看草稿，但页面提示只读共享且不提供保存按钮，直接写跟进接口也被拒绝 |
| Morgan 将客户负责人从 Alex 转交给 Taylor 后，Alex 重试生成 | 服务端立即拒绝访问 |

自动化验证覆盖了两层范围：示例中的[服务端集成测试](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/crm-assistant.test.ts)与[客户端组件测试](https://github.com/nocobase/doc-demo-crm/blob/main/tests/client/crm-assistant.test.tsx)使用隔离 SQLite 与本地兼容 OpenAI 的测试夹具验证无模型提示、工具权限、知识隔离、只读共享和移交撤权；上述客户草稿截图由真实运行的 CRM 应用经本地兼容 OpenAI 桥接调用本地 Codex 实时生成，并实际验证了手动保存跟进记录。接入外部商业模型服务（如 DeepSeek、OpenAI）时，仍需在自己的环境中使用真实密钥完成 **Test connection** 和实际生成验收。

**完成的标志**：已在 **AI models** 启用可用对话模型；销售在客户详情能生成带准确文档版本引用和缺口提醒的跟进草稿，生成本身不写入业务数据，经人工编辑保存后正确出现在跟进记录中，且无关销售、只读共享与移交后的权限边界均实时生效。

回到[专题实战](index.md)查看其余 Core 能力专题，或前往 [Agents 插件文档](../../core/using-plugins/agents-and-knowledge/agents.md)深入了解实时聊天面板、业务 Skills 与机器编程助手的接入方式。
