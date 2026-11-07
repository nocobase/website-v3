---
title: Studio 是什么
description: 了解 Studio 如何组织团队的 AI 开发与交付，以及它与 NocoBase Core 的分工。
---

NocoBase Studio 是面向团队的 AI 开发治理平台。它连接 Coding Agent、项目管理和软件交付流程，让团队统一管理开发任务、质量标准和项目经验。

## 从本地 AI 开发到团队协作

本地 Coding Agent 提升个人开发效率。团队交付还需要持续处理需求、协调分工、核验质量和跟踪上线。Studio 将这些工作组织为团队共享的流程，减少对个人会话和手工协调的依赖。

### 多个 Agent 分工，持续推进任务

Studio 接入 Claude Code、Codex、OpenCode 等工具和模型。[调度 Agent](agent-team.md) 按能力分派设计、开发、评审和测试，并根据结果安排下一步，减少人工转交任务和结果的工作。成员也可以直接与 [Runner Agent](../use/sessions.md) 对话，讨论需求并驱动任务。

![调度 Agent 分派设计任务，并明确目标和交付要求](https://static-docs.nocobase.com/studio-zh-req-dispatch-20261030-v3.png)

### 需求方与开发团队共享进展

业务部门、客户等需求方的请求进入统一的项目与任务。讨论、Agent 执行记录和交付结果都关联到任务，项目成员可以直接查看进展。需求负责人在「我的任务」中回答问题、验收结果，减少反复同步进度和转述需求的工作。

![需求负责人处理决策与验收，团队通过任务动态查看 Agent 交接、执行结果和状态变化](https://static-docs.nocobase.com/studio-zh-home-20261030-v3.png)

### 从代码改动跟踪到发布上线

Studio 对接 Git 代码平台和 CI/CD，关联任务、PR、检查结果与评审记录。检查或评审未通过时，调度 Agent 安排修复。负责人依据交付报告和验收标准确认结果，需要时通过预览或测试环境验证。团队在 [发布](../release/overview.md) 中跟踪版本，自行部署生产，并记录生产版本。

![发布页面汇总版本及其在测试、生产环境中的状态](https://static-docs.nocobase.com/studio-zh-releases-20261030-v3.png)

### 开发规范与经验由团队积累

团队用 [技能](../project/skills.md) 统一设计、开发、评审和测试要求，为每个任务提供共同的质量基准。[知识库](../project/knowledge-base.md) 保存业务资料，[项目记忆](../project/project-memory.md) 保存已确认的规则和经验。更换成员或模型后，后续任务仍可复用这些规范与背景，减少重复说明和交付差异。

![项目记忆保存团队已确认的业务规则，供后续任务复用](https://static-docs.nocobase.com/studio-zh-project-memory-20261030-v3.png)

### 保留本地习惯，使用团队执行资源

通过命令行 [nb-studio](../reference/cli.md)，成员可以继续在常用的 Coding Agent 中创建任务、补充要求和跟进结果。任务交给 Studio 调度到共享运行环境后，执行不再依赖本地会话持续打开。进展与结果保存在 Studio 中，供团队跟进。

![共享运行环境集中提供 Claude Code、Codex 等编码工具和执行资源](https://static-docs.nocobase.com/studio-zh-shared-runtimes-20261030-v3.png)

## 人做决策，Agent 完成开发

人提出需求、确认业务规则、验收结果，并决定发布时机。设计、编码、测试和评审由 Agent 完成。

::figure roles | 人掌握决策与验收，调度 Agent 组织执行 Agent 完成任务

需要确认业务规则或方案取舍时，调度 Agent 向任务负责人提问。完成后，负责人依据交付报告和验收标准决定合并或退回修改。完整流程见 [一个需求怎样完成](how-a-request-gets-done.md)。

## Studio 管理交付，Core 支撑业务应用

Studio 组织 Agent 基于 NocoBase Core 开发业务应用。Core 提供数据、权限、工作流和文件等基础能力，Agent 在此基础上实现业务功能。

<figure class="map studio-architecture" aria-label="团队通过 Studio 调度 Agent 开发基于 Core 的业务应用">
<div class="row"><div class="box team"><b>你的团队</b><span>提出需求 · 确认规则 · 验收与发布</span></div></div>
<div class="down">通过 Studio 推进任务</div>
<div class="delivery"><div class="delivery-title"><b>NocoBase Studio</b><span>管理开发与交付</span></div><div class="row c2"><div class="box"><b>调度 Agent</b><span>分派任务 · 跟进结果 · 提请决策</span></div><div class="box"><b>执行 Agent</b><span>设计 · 开发 · 测试 · 评审</span></div></div><div class="delivery-tools">项目与任务 · Git 与 CI/CD · 技能与项目记忆</div></div>
<div class="down">开发、验证与交付</div>
<div class="application"><div class="app-title"><b>你的业务应用</b><span>业务功能与界面</span></div><div class="core-base"><b>NocoBase Core</b><span>数据 · 权限 · 工作流 · 文件</span></div></div>
</figure>

## 私有部署

Studio 在 NocoBase 商业版中提供，Core 和 NocoCRM 等 Solution 应用开源免费。Studio 和业务应用部署在企业自己的服务器上，代码与数据归企业所有。Coding Agent 和模型可按需选择。
