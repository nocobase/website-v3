---
title: NocoBase 3 文档
nav: 首页
description: NocoBase 是企业用 AI 开发和持续改进业务系统的开源平台。Agent 写业务部分，NocoBase 提供底座和工作流程，人确定目标、作出决定。
---

## 从这里开始

| 你想 | 从这里开始 |
| --- | --- |
| 了解 NocoBase 3 | [NocoBase 3 是什么](start/what-is-nocobase.md) |
| 用自己的 Agent 基于 Core 开发一个应用 | [Core 是什么](core/getting-started/what-is-core.md) → [创建应用](core/getting-started/create-app.md) |
| 带领 Agent 团队开发，同时推进多个项目 | [Studio 是什么](studio/intro/what-is-studio.md) |
| 部署和运维应用 | [部署与运维](core/deployment/choose-a-deployment-method.md) |
| 从 NocoBase 2 来 | [从 NocoBase 2 来](start/from-v2.md) · [管理插件](core/developing-apps/manage-plugins.md) |

## 整体架构

<figure class="layers" aria-label="Studio 让人与 Agent 协同开发业务应用，业务应用建在 Core 上">
<div class="ly-b st"><b>NocoBase Studio</b><span>人与 Agent 协同开发的治理平台</span></div>
<div class="ly-t"><b>人做决策，Agent 写代码、做执行</b><span>把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。</span></div>
<div class="ly-k down">开发 · 交付 · 治理 · 迭代</div><div class="ly-gap"></div>
<div class="ly-b"><b>业务应用</b><span>企业的业务系统</span></div>
<div class="ly-t"><b>应用由 Agent 开发，归你所有，上线后独立运行</b><span>也可以从现成的 Solution 开始，例如开源的 NocoCRM，直接使用或继续定制。</span></div>
<div class="ly-k up">基础能力 · 架构规范</div><div class="ly-gap"></div>
<div class="ly-b co"><b>NocoBase Core</b><span>开源应用底座</span></div>
<div class="ly-t"><b>20 多项基础能力，统一的项目结构和开发规范</b><span>数据、权限、工作流与审批、文件、通知、AI 接入等现成可用，Agent 只开发业务部分。</span></div>
</figure>

- **[Core](core/index.md)** 是开发和运行业务系统的开源底座。只用 Core，你可以让自己的 Agent 直接开发应用。
- **[Studio](studio/index.md)** 是人带领 Agent 团队开发应用的工作台，在商业版中提供。开发出来的应用同样建在 Core 上。

## 关于这份文档

- 文档分三部分，在顶栏切换：**开始**（全站共用的介绍和术语）、**Core**、**Studio**。
- Core 通过团队任务应用讲解开发、测试和部署；Studio 通过采购团队的场景讲解怎样带领 Agent 团队推进工作。
- 文档按中文界面编写。产品自带的界面名称写在「」里，路径写成「A › B」，例如「系统设置 › 用户管理」。
- NocoBase 3 的各个包目前都是 beta 版本，接口和界面可能还会调整，以产品为准。
- 左侧菜单里颜色较浅的是还没写好的页面。
