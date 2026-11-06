---
title: NocoBase 3 是什么
metaDescription: "NocoBase 3 是用 AI 持续开发和运行业务系统的开源平台，提供应用底座、协同开发治理和可定制的业务应用。"
---

NocoBase 3 是用 AI 持续开发和运行业务系统的开源平台。Agent 写代码、做执行，NocoBase 提供底座和治理能力，人来做决策。

## 为什么需要 NocoBase

Vibe Coding 让软件开发更加高效，但业务系统往往要使用很多年，不断增加功能、调整流程，还会换人接手。NocoBase 在 Vibe Coding 之上提供应用底座、开发规范和协作治理，团队仍然可以使用 Claude Code、Codex 等编码工具开发。

### 可靠的基础能力

即使交给 AI，权限、工作流引擎、审批等底层模块从零开发，设计难度依然很高，边界情况多，维护工作量大。

Core 提供现成的基础能力，由 NocoBase 持续维护和升级。例如采购团队要一个供应商管理系统，Agent 只写供应商档案、采购订单、审批规则这些业务部分，权限和审批直接用 Core 的。需要开发和验证的代码大幅减少。

### 统一的开发规范

换人、换模型甚至换一个会话，AI 都可能随机发挥，同一个系统里出现几种写法，越来越难维护。

Core 提供统一的项目结构和开发规范，Agent 按随包提供的开发技能写代码，系统在统一架构下长期稳定迭代。

### 团队协作与经验积累

团队同时处理多个项目和任务，每个人都在多个终端和对话之间切换。Agent 交过来的改动越来越多，人看不过来，又不敢放手。

Studio 统一调度 Agent 团队同时推进大量项目和任务，进展一目了然。需要人介入时，Agent 会附上报告、清单、截图，人可以有理有据做决策。

需求背景、业务资料、项目经验散落在不同电脑的不同会话里，换人、换 Agent 就很难找到。

Studio 用技能、知识库和项目记忆沉淀方法和经验，换人、换 Agent 都能无障碍交接。

## NocoBase 3 的组成

<figure class="layers" aria-label="Solution 模板生成业务应用，Studio 治理业务应用开发，Core 提供底座">
<div class="ly-node ly-studio"><b>NocoBase Studio</b><strong>人与 Agent 协同开发</strong><p>人做决策，Agent 执行；统一组织开发、检查与交付。</p></div>
<div class="ly-link ly-develop"><span>开发治理</span><i aria-hidden="true"></i></div>
<div class="ly-node ly-app"><b>业务应用</b><strong>企业自己的业务系统</strong><p>代码和数据归企业所有，发布后独立运行。</p></div>
<div class="ly-link ly-generate"><span>模板生成</span><i aria-hidden="true"></i></div>
<div class="ly-node ly-solution"><b>Solution</b><strong>业务应用模板</strong><p>从现成应用开始，按业务需要继续定制。</p></div>
<div class="ly-foundation"><div><b>NocoBase Core</b><span>开源应用底座</span></div><p>权限、流程、文件等 20 多项基础能力 · 统一的项目结构与开发规范</p></div>
</figure>

### Core：开源应用底座

**[Core](../core/index.md)** 是 AI 开发和运行业务系统的开源应用底座，提供业务系统共用的基础能力和开发规范。

一个人或一个小团队开发一个或几个应用，可以直接在应用目录里打开 Claude Code、Codex 等编码工具，和 Agent 一起开发。团队自己组织测试、评审和部署，Core 提供部署工具和开发指引。使用 Core 不需要先安装 Studio。

### Studio：协同开发与治理

**[Studio](../studio/index.md)** 是人与 Agent 协同开发的治理平台，可以把 Claude Code、Codex、OpenCode 组成一支 Agent 团队。

团队同时推进多个项目和大量任务，或业务专家也要直接提需求、做决策时，可以使用 Studio。调度 Agent 分派设计、开发、测试、评审工作，检查和评审通过后交给人验收，部署到受保护的环境要经审批人批准。

Studio 在商业版中提供。

### Solution：现成的业务应用

**Solution** 是由 Agent 驱动的、基于 Core 构建的一系列企业业务应用，例如 NocoCRM、NocoITAM。Agent 做大部分执行工作，人只做关键决策。可以直接安装使用，也可以让 Agent 按自己的业务继续定制。

## 从开发到业务运行

### 开发与交付

以供应商管理系统为例，你确定要管理哪些供应商资料、采购订单如何审批、不同岗位可以查看和修改哪些数据。Agent 在 Core 的基础上实现页面、数据结构与业务规则，应用代码保存在自己的代码仓库中。团队检查业务流程、权限和测试结果，确认符合需求后再发布，业务用户就可以使用应用。

### 持续迭代

系统上线后，采购团队可能需要增加供应商评级，或调整采购订单的审批规则。你可以继续让 Agent 在现有应用上修改，并检查改动对已有数据和流程的影响。

### Agent 参与业务执行

应用上线后，Agent 还可以在应用里承担业务上的执行工作，比如调研客户、起草邮件、核对资产台账、处理客户工单。这些业务 Agent 由 Core 的 Agents 插件接入，和人用同一套权限，遇到需要决策的事，附上依据交给负责人拍板。Solution 的每个应用都内置了业务 Agent，自己开发的应用也可以按需加上。

## 完全自主掌控

### 私有部署与独立运行

Core、Solution 和 Studio 都部署在企业自己的服务器上，代码和数据归企业所有。业务应用发布后独立运行，日常业务请求不经过 Studio。

### 模型与 Agent 自由选择

模型和 Agent 由企业自由选择，不绑定厂商，Claude Code、Codex 等编码工具和各类大模型都可以接入。

## 开始使用

- 自己动手开发一个应用：[开发第一个应用](develop-your-first-app.md)。
- 体验团队与 Agent 协同交付：[使用 Studio 协作开发](collaborate-with-studio.md)。
- 用过 NocoBase 2：[NocoBase 2 与 NocoBase 3](../faq/from-v2.md)。
