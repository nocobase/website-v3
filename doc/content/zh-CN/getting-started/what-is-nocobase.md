---
title: NocoBase 3 是什么
metaDescription: "NocoBase 是企业用 AI 开发和运行业务系统的开源平台。人提需求、做决策；Agent 写代码、做执行；NocoBase 确保系统可靠、过程可控。"
---

NocoBase 是企业用 AI 开发和运行业务系统的开源平台。人提需求、做决策；Agent 写代码、做执行；NocoBase 确保系统可靠、过程可控。

NocoBase 由应用底座（Core）和工作台（Studio）两部分组成。你可以按阶段直接从应用底座独立起步，也可以用工作台开展团队协作；两者配合，把 AI 的能力转化为企业持续交付和运行可靠业务系统的能力。

## 为什么需要 NocoBase

AI 写代码很快，但构建可靠的业务系统依然不简单。无论是刚开始用 AI 建设系统的企业，还是已经在用 Claude Code、Codex 等编码工具的团队，业务系统一旦投入正式使用并长期迭代，都会遇到四个核心问题。

### 底层能力不必从零建设

即使交给 AI，权限、登录认证、工作流引擎、审批等底层模块从零开发，设计难度依然很高，边界情况多，验证和维护成本大。

Core 提供 30 多项开箱即用的基础能力，由 NocoBase 持续维护和升级。Agent 只开发企业自己的业务部分，需要开发、测试和安全审查的代码大幅减少。

### 架构统一，长期稳定迭代

换人、换模型甚至换一个会话，AI 都可能随机发挥，同一个系统里逐渐出现多种写法，架构漂移、越来越难维护。

Core 提供统一的项目结构、开发规范和随底座发布的 Skill，不同的人、模型和会话都在同一套架构下开发，系统能够长期稳定迭代，也随时支持人工接手维护。

### 过程可控，质量由工具把关

团队同时推进多个项目和大量任务时，各自在终端和会话之间来回切换，Agent 交回的改动越来越多，人看不过来，又不敢放手上线。

Studio 按工作流程推进每个任务，常驻 Skill 每次运行自动加载；改动经过自动检查和不同模型交叉评审后，附上交付报告、截图和可操作的测试环境再交给人验收。企业版还支持调用业界成熟工具对功能、冒烟、权限、安全、性能、代码质量和 UX 进行多维度实测，并将发现的问题自动登记为跟进任务闭环修复。

### 协作集中，经验沉淀在团队里

每个人在自己的电脑上用 AI，需求背景、业务资料、项目进展和踩过的坑散落在各自的会话里，别人看不到，换人、换模型就接不上。

Studio 把所有项目的需求、讨论、进展和花费集中在一处；用 Skill 沉淀做事方法，用知识库管理业务资料，用项目记忆持续记录踩过的坑和已确认的规则，换人、换 Agent 都能无障碍交接。

## NocoBase 3 的组成

<figure class="arch-overview" aria-label="NocoBase 3 由 NocoBase Studio 工作台和 NocoBase Core 应用底座组成：通过 Studio 或本地 Coding Agent 开发业务应用，业务应用运行在 Core 底座之上">
<div class="ao-top">
<div class="ao-box ao-studio"><div class="ao-box-head"><b>NocoBase Studio</b><span class="ao-tag">团队开发工作台</span></div><p>组织 Agent 团队协作、按流程评审与质量把关。</p></div>
<div class="ao-box"><div class="ao-box-head"><b>本地 Coding Agent</b><span class="ao-tag">本地直接开发</span></div><p>Claude Code、Codex、Cursor 等。</p></div>
</div>
<div class="ao-down"><svg viewBox="0 0 16 20" fill="none" aria-hidden="true"><path d="M8 2v14M3 11.5L8 16.5l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>开发与迭代</span></div>
<div class="ao-system">
<div class="ao-app">
<div class="ao-sys-head"><b>你的业务应用</b><span class="ao-pill">独立运行</span></div>
<p>页面、接口、数据模型与业务规则，源码归企业所有。</p>
</div>
<div class="ao-core">
<div class="ao-core-head"><b>NocoBase Core</b><span>开源应用底座</span></div>
<div class="ao-core-band"><span class="ao-chip">权限与认证</span><span class="ao-chip">流程与审批</span><span class="ao-chip">多数据库</span><span class="ao-chip">文件与通知</span><span class="ao-chip">AI 与业务 Agent</span><span class="ao-chip">统一架构规范</span></div>
</div>
</div>
</figure>

### NocoBase Core（应用底座）

**[NocoBase Core](../core/index.md)** 是面向 AI 开发的开源应用底座，开源免费，可独立起步、独立运行。

初始化新应用后，用户与权限、登录认证、流程管理、数据库、文件存储、通知与 AI 接入等 30 多项基础能力开箱可用，并自带统一的项目结构和开发规范。无论个人还是团队，都可以直接搭配 Claude Code、Codex、Cursor 等常用编码工具从 Core 起步开发业务系统，无需先安装 Studio。

### NocoBase Studio（工作台）

**[NocoBase Studio](../studio/index.md)** 是面向团队协作与治理的开发工作台。

它把个人电脑和团队服务器上的 Claude Code、Codex、OpenCode 等编码工具组建成一支 24 小时工作的 Agent 团队，由调度 Agent 按专长分派设计、开发、测试和评审任务，同时推进多个项目。人在电脑或手机上就能提需求、回答提问、看验收报告和测试环境并做决策，随时掌握所有项目的进展和花费。

Studio 社区版免费使用，包含两种内置工作流程（精简流程与标准流程）及核心协作能力；团队需要多角色与自定义流程、部署审批、质量管理等进阶能力时，可升级至专业版或企业版，见[选择版本](../studio/setup/index.md#选择版本)。

## 带来的变化与工作方式

### 开发与交付

人确定目标、业务规则和验收标准，Coding Agent 在 Core 的底座上编写页面、接口、数据结构与业务规则，源码保存在企业自己的代码仓库中。通过自动检查、交叉评审与验收后发布上线，后续业务变化时继续在现有应用上迭代演进。

### 业务 Agent 参与日常运行

系统上线后，业务 Agent 还可以在应用内持续参与日常业务执行。这些业务 Agent 由 Core 的 Agents 能力接入，继承所服务负责人的权限，按企业规则 24 小时主动处理日常事务，关键操作附上依据请求人确认。

## 私有部署与完全自主掌控

- **代码和数据归企业所有**：Core 和 Studio 都部署在企业自己的服务器上，支持纯内网环境。
- **应用独立运行**：业务应用发布后独立运行，日常业务请求不经过 Studio。
- **模型与工具自由选择**：不绑定厂商，支持 Claude Code、Codex、Cursor 等编码工具和各类云端或本地部署的大模型。

## 开始使用

- 了解推荐的两阶段推进方式，看清何时从本地 Core 切入 Studio：[先用 Core，再接入 Studio](from-core-to-studio.md)
- 从 Core 起步，直接搭配本地 Coding Agent 开发：[用 Core 开发第一个应用](develop-your-first-app.md)
- 一条命令安装免费的 Studio 社区版并走完第一个需求：[安装并使用 Studio](collaborate-with-studio.md)
- 跟随一个完整的 IT 资产管理项目实践：[基于 NocoBase 3 开发可靠的企业应用](../guides/build-reliable-enterprise-apps.md)
- 对比 Vibe Coding、低代码平台或了解 NocoBase 2 与 3 的关系：[常见问题](../faq/index.md)
