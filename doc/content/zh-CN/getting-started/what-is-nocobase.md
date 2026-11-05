---
title: NocoBase 3 是什么
metaDescription: "理解 Core、Studio 与 Solution 的关系，以及开发 Agent、业务 Agent 和应用运行的边界。"
---

NocoBase 3 用于开发和运行业务应用。应用的页面、数据结构与业务规则保存在自己的代码仓库中，由人与 Agent 一起开发；Core 提供基础能力，Studio 组织团队的开发、检查与交付。

## Core、Studio 与 Solution

<figure class="layers" aria-label="Studio 让人与 Agent 协同开发业务应用，业务应用建在 Core 上">
<div class="ly-stack">
<div class="ly-b"><b>业务应用</b><span>企业的业务系统</span></div>
<div class="ly-t"><b>你的业务应用，以及现成的 Solution</b><span>代码和数据归企业所有，发布后独立运行；Solution 可以直接使用，也可以继续定制。</span></div>
<div class="ly-k up">基础能力 · 架构规范</div>
<div class="ly-b co"><b>NocoBase Core</b><span>开源应用底座</span></div>
<div class="ly-t"><b>基础能力和统一的架构规范</b><span>权限、流程、文件等 20 多项基础能力，以及统一的项目结构和开发规范。</span></div>
</div>
<div class="ly-governance">
<div class="ly-b st"><b>NocoBase Studio</b><span>人与 Agent 协同开发的治理平台</span></div>
<div class="ly-t"><b>人做决策，Agent 写代码、做执行</b><span>统一调度 Agent 团队，组织检查和评审，沉淀方法和经验。</span></div>
<div class="ly-k">开发 · 交付 · 治理 · 迭代</div>
</div>
</figure>

- **[Core](../core/index.md)** 是 AI 开发和运行业务系统的开源应用底座。权限、流程、文件等基础能力现成可用，Agent 在统一架构上只开发企业自己的业务。
- **[Studio](../studio/index.md)** 是人与 Agent 协同开发的治理平台。把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。
- **Solution** 是由 Agent 驱动的、基于 Core 构建的一系列企业业务应用，例如 NocoCRM、NocoITAM。Agent 做大部分执行工作，人只做关键决策。可以直接安装使用，也可以让 Agent 按自己的业务继续定制。

Studio 在商业版中提供。

## 开发中的 Agent 与应用中的 Agent

开发 Agent 使用 Claude Code、Codex 等编码工具，在应用代码仓库中实现和验证需求。你可以在本地与它协作，也可以在 Studio 中由调度 Agent 组织执行 Agent 分工。开发完成后，业务用户使用发布的应用。

业务 Agent 在运行中的应用内处理业务，例如调研客户、起草邮件、核对资产台账。它们通过 Core 的 Agents 插件接入，按用户的角色与权限执行工作，需要业务决策时交给负责人。开发 Agent 修改应用，业务 Agent 使用应用提供的业务能力。

## 应用的运行与部署

Core、Solution 和 Studio 都部署在企业自己的服务器上，代码和数据归企业所有。模型和 Agent 由企业自由选择，不绑定厂商，Claude Code、Codex 等编码工具和各类大模型都可以接入。业务应用发布后独立运行，日常业务请求不经过 Studio。

从[开发第一个应用](develop-your-first-app.md)体验创建和迭代业务功能，或通过[使用 Studio 协作开发](collaborate-with-studio.md)走完团队交付流程。用过 NocoBase 2，可查阅 [NocoBase 2 与 NocoBase 3](../faq/from-v2.md)。
