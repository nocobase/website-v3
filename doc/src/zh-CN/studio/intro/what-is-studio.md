---
title: Studio 是什么
description: NocoBase Studio 是人与 Agent 协同开发的治理平台。把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。
---

个人电脑和团队服务器上的 Claude Code、Codex 等接入后，组成一支 Agent 团队，由调度 Agent 分派设计、开发、测试、评审工作，自主推进多个项目。每个任务做到哪里、下一步做什么，都一目了然。方法和经验沉淀在技能、知识库和项目记忆中，换人、换 Agent 都能无障碍交接。在每个关键处，Agent 会附上报告、截图，由人来做决策。

## 为什么需要 Studio

你的企业已经在用 AI 开发或者 Vibe Coding，代码写得很快。但团队同时推进的项目和任务一多，新的问题就随之出现。每个人在多个终端和对话之间切换，Agent 交过来的改动也越来越多，人看不过来，又不敢放手。需求背景、业务资料、项目经验散落在不同电脑的不同会话里，换人、换 Agent 就很难找到。

NocoBase Studio 正是为治理人与 Agent 协同开发而生。

### 一支持续推进的 Agent 团队

Studio 接入多台机器上的 Agent 统一调度，组成一支 Agent 团队，24 小时同步推进多个项目和大量任务。Claude Code、Codex、Gemini CLI、Cursor、OpenCode 等常见编码工具都可以接入。调度 Agent 怎样分派工作，见 [Agent 团队怎样工作](agent-team.md)。

### 各项进展一目了然

在 Studio 里，每个任务做到哪里、下一步做什么，都一目了然，项目进展、Agent 工作负荷和模型用量也都清晰可见。需要你处理的事，都排在「我的任务」最前面。见 [跟进进展](../use/follow-progress.md) 和 [项目进展](../project/progress.md)。

### 有理有据做决策

在 Studio 里，设计、开发、测试和评审由多个 Agent 协同完成，检查和评审都通过了，才交给人。需要人做决策时，Agent 会附上详细的报告、清单、截图和建议，不懂代码的业务专家也可以直接拍板。见 [验收](../use/accept.md)。

### 方法、经验、知识沉淀在团队里

Studio 用技能保存做事的方法，用知识库保存业务资料，用项目记忆保存 Agent 自主学到的经验，换人、换 Agent 都能无障碍交接。见 [技能](../project/skills.md)、[知识库](../project/knowledge-base.md) 和 [项目记忆](../project/project-memory.md)。

## 人和 Agent 怎样分工

Agent 写代码、做执行，人来做决策。

::figure roles | Studio 里人和 Agent 的角色

人在三个关键处做决策：

1. **回答提问。** 遇到方案取舍、业务规则、例外情况，调度 Agent 写清要决定什么，交给任务负责人回复。
2. **验收。** 调度 Agent 附上交付报告、验收标准和截图，需要时还有可以亲自试用的预览。任务负责人确认没问题就合并，不满意就退回修改。
3. **批准上线。** 部署到受保护的环境（例如生产环境）之前，要由审批人批准；出了问题，可以回滚到上一个版本。

一个需求从提出到上线的全过程，见 [一个需求怎样完成](how-a-request-gets-done.md)。

## 与 NocoBase Core 的关系

NocoBase 在 AI 开发之上补齐底座和治理能力。Core 是应用底座，提供业务系统共用的基础能力和开发规范；Studio 是人与 Agent 协同开发的治理平台。

<figure class="map" aria-label="团队在 Studio 中与 Agent 团队协同，基于 Core 开发业务应用">
<div class="row"><div class="box human"><b>你的团队</b><span>提出需求，掌握进展，在关键处做决策</span></div></div>
<div class="down">需求</div>
<div class="row c2"><div class="box brand"><b>NocoBase Studio</b><span>统一调度 Agent 团队，组织检查和评审，沉淀方法和经验</span></div><div class="box agent"><b>Agent 团队</b><span>Claude Code、Codex 等编码工具，分工设计、开发、测试、评审</span></div></div>
<div class="down">开发</div>
<div class="row"><div class="box"><b>你的业务应用 · 建在 NocoBase Core 上</b><span>使用 Core 的权限、流程、文件等基础能力；发布后独立运行</span></div></div>
</figure>

在 Studio 里新建项目，代码默认用 NocoBase 应用模板初始化。Agent 使用 Core 现成的权限、流程、文件等基础能力，只开发企业自己的业务部分，需要开发和验证的代码大幅减少，系统在统一架构下长期稳定迭代。业务应用发布后独立运行，日常业务请求不经过 Studio。

## 私有部署

Studio 在 NocoBase 商业版中提供，Core 和 NocoCRM 等 Solution 应用开源免费。Studio 和业务应用都部署在企业自己的服务器上，代码和数据归企业所有。模型和 Agent 由企业自由选择，不绑定厂商。
