---
title: NocoBase 3 是什么
description: NocoBase 是用 AI 持续开发和运行业务系统的开源平台。Agent 写代码、做执行，NocoBase 提供底座和治理能力，人来做决策。
---

Core 是应用底座，提供业务系统共用的基础能力和开发规范，Agent 在此基础上开发企业的业务需求；Studio 是人与 Agent 协同开发的治理平台，Agent 分工推进任务，人掌握进展，在关键处做决策。NocoBase 把 AI 的开发能力，转化为企业持续交付可靠业务系统的能力。

## 为什么需要 NocoBase

AI 写代码很快，但构建可靠的业务系统依然不简单。你的企业已经在用 AI 开发或者 Vibe Coding，第一个版本很快就能做出来。可业务系统要用很多年，要不断加功能、改流程，还会换人接手，新的问题随之出现。

### 底层能力要从零建设

即使交给 AI，权限、工作流引擎、审批等底层模块从零开发，设计难度依然很高，边界情况多，维护工作量大。

Core 提供现成的基础能力，由 NocoBase 持续维护和升级。例如采购团队要一个供应商管理系统，Agent 只写供应商档案、采购订单、审批规则这些业务部分，权限和审批直接用 Core 的。需要开发和验证的代码大幅减少。

### 架构随机漂移，逐渐失控

换人、换模型甚至换一个会话，AI 都可能随机发挥，同一个系统里出现几种写法，越来越难维护。

Core 提供统一的项目结构和开发规范，Agent 按随包提供的开发技能写代码，系统在统一架构下长期稳定迭代。

### 并行任务很多，人确认不过来

团队同时处理多个项目和任务，每个人都在多个终端和对话之间切换。Agent 交过来的改动越来越多，人看不过来，又不敢放手。

Studio 统一调度 Agent 团队同时推进大量项目和任务，进展一目了然。需要人介入时，Agent 会附上报告、清单、截图，人可以有理有据做决策。

### 知识和经验难以沉淀和共享

需求背景、业务资料、项目经验散落在不同电脑的不同会话里，换人、换 Agent 就很难找到。

Studio 用技能、知识库和项目记忆沉淀方法和经验，换人、换 Agent 都能无障碍交接。

## Core、Studio 和 Solution

<figure class="layers" aria-label="Studio 让人与 Agent 协同开发业务应用，业务应用建在 Core 上">
<div class="ly-b st"><b>NocoBase Studio</b><span>人与 Agent 协同开发的治理平台</span></div>
<div class="ly-t"><b>人做决策，Agent 写代码、做执行</b><span>统一调度 Agent 团队，组织检查和评审，沉淀方法和经验。</span></div>
<div class="ly-k down">开发 · 交付 · 治理 · 迭代</div><div class="ly-gap"></div>
<div class="ly-b"><b>业务应用</b><span>企业的业务系统</span></div>
<div class="ly-t"><b>你的业务应用，以及现成的 Solution</b><span>代码和数据归企业所有，发布后独立运行；Solution 可以直接使用，也可以继续定制。</span></div>
<div class="ly-k up">基础能力 · 架构规范</div><div class="ly-gap"></div>
<div class="ly-b co"><b>NocoBase Core</b><span>开源应用底座</span></div>
<div class="ly-t"><b>基础能力和统一的架构规范</b><span>权限、流程、文件等 20 多项基础能力，以及统一的项目结构和开发规范。</span></div>
</figure>

- **[Core](../core/index.md)** 是 AI 开发和运行业务系统的开源应用底座。权限、流程、文件等基础能力现成可用，Agent 在统一架构上只开发企业自己的业务。
- **[Studio](../studio/index.md)** 是人与 Agent 协同开发的治理平台。把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。
- **Solution** 是由 Agent 驱动的、基于 Core 构建的一系列企业业务应用，例如 NocoCRM、NocoITAM。Agent 做大部分执行工作，人只做关键决策。可以直接安装使用，也可以让 Agent 按自己的业务继续定制。

## 只用 Core，还是用 Studio

| | 只用 Core | 用 Studio |
| --- | --- | --- |
| 谁来开发 | 你在应用目录里打开 Claude Code、Codex 等编码工具，和 Agent 一起开发 | 团队的 Agent 组成 Agent 团队，调度 Agent 分派设计、开发、测试、评审 |
| 适合 | 一个人或一个小团队，做一个或几个应用 | 团队同时推进多个项目和大量任务，业务专家也要直接提需求、做决策 |
| 检查和上线 | 团队自己组织测试、评审和部署，Core 提供部署工具和开发指引 | 检查和评审通过后交给人验收，部署到受保护的环境要经审批人批准 |
| 开始 | [创建 Core 应用](../core/getting-started/create-app.md) | [Studio 是什么](../studio/intro/what-is-studio.md) |

两种方式开发出来的应用一样，都建在 Core 上。

## 业务系统里的 Agent

应用上线后，Agent 还可以在应用里承担业务上的执行工作，比如调研客户、起草邮件、核对资产台账、处理客户工单。这些业务 Agent 由 Core 的 Agents 插件接入，和人用同一套权限，遇到需要决策的事，附上依据交给负责人拍板。Solution 的每个应用都内置了业务 Agent，自己开发的应用也可以按需加上。

## 私有部署

Core、Solution 和 Studio 都部署在企业自己的服务器上，代码和数据归企业所有。模型和 Agent 由企业自由选择，不绑定厂商，Claude Code、Codex 等编码工具和各类大模型都可以接入。业务应用发布后独立运行，日常业务请求不经过 Studio。

## 和 Vibe Coding 的关系

Vibe Coding 让软件开发更加高效。项目涉及复杂业务、多人协作和长期迭代时，只靠 AI 生成代码还不够，还需要可靠的应用底座、统一的开发规范和完善的治理。NocoBase 在 Vibe Coding 之上补齐底座和治理能力，你的团队照样用 Claude Code、Codex 等编码工具写代码。

## 接下来

- 自己动手开发一个应用：[Core 是什么](../core/getting-started/what-is-core.md) → [创建应用](../core/getting-started/create-app.md)
- 了解团队怎样和 Agent 团队协同开发：[Studio 是什么](../studio/intro/what-is-studio.md)
- 用过 NocoBase 2：[从 NocoBase 2 来](from-v2.md)
