---
title: NocoBase 3 文档
nav: 首页
description: NocoBase 是企业用 AI 开发和持续改进业务系统的开源平台。Agent 写业务部分，NocoBase 提供底座和工作流程，人确定目标、作出决定。
---

## 从这里开始

| 你想 | 从这里开始 |
| --- | --- |
| 了解 NocoBase 3 | [NocoBase 3 是什么](start/what-is-nocobase.md) |
| 用自己的 Agent 基于 Core 开发一个应用 | [Core 是什么](core/intro/what-is-core.md) → [快速开始](core/quickstart.md) |
| 带领 Agent 团队开发，同时推进多个项目 | [Studio 是什么](studio/intro/what-is-studio.md) |
| 查一项能力或一个插件 | [能力总览](core/capabilities/index.md) · [插件目录](core/plugins/index.md) |
| 部署和运维应用 | [部署与运维](core/operations/deployment.md) |
| 从 NocoBase 2 来 | [从 NocoBase 2 来](start/from-v2.md) · [插件怎样工作](core/intro/how-plugins-work.md) |
| 开发可复用的插件 | [扩展开发](core/extend/when-to-write-a-plugin.md) |

## NocoBase 3 由什么组成

<figure class="map" aria-label="团队带领 Agent，基于 Core 开发业务应用；Studio 组织 Agent 团队；Solutions 是现成的应用">
<div class="row"><div class="box human"><b>你的团队</b><span>确定目标、回答提问、验收，上线后管理用户和权限</span></div></div>
<div class="down">交代需求</div>
<div class="row c2"><div class="box agent"><b>Agent</b><span>Claude Code、Codex 等编码工具，按技能编写应用的代码</span></div><div class="box brand"><b>Studio <span class="tag pro">商业版</span></b><span>把多个 Agent 组织成 Agent 团队，管理任务、流程和记录</span></div></div>
<div class="down">基于 Core 开发</div>
<div class="row"><div class="box"><b>你的业务应用 · 建在 Core 上</b><span>Core 提供数据、权限、工作流与审批、文件、通知等底座能力；应用归你所有，上线后独立运行</span></div></div>
<div class="down">或者从现成的应用开始</div>
<div class="row"><div class="box"><b>Solutions</b><span>基于 NocoBase 开发的业务应用，例如开源的 NocoCRM，可以直接使用，也可以继续定制</span></div></div>
</figure>

- **[Core](core/index.md)** 是开发和运行业务系统的开源底座。只用 Core，你可以让自己的 Agent 直接开发应用。
- **[Studio](studio/index.md)** 是人带领 Agent 团队开发应用的工作台，在商业版中提供。开发出来的应用同样建在 Core 上。

## 关于这份文档

- 文档分三部分，在顶栏切换：**开始**（全站共用的介绍和术语）、**Core**、**Studio**。
- 例子都来自同一个场景：一家企业的采购团队用 NocoBase 做采购应用。Core 讲这个应用怎样做出来，Studio 讲团队怎样带领 Agent 团队继续改进它。
- 文档按中文界面编写。产品自带的界面名称写在「」里，路径写成「A › B」，例如「系统设置 › 用户管理」。
- NocoBase 3 的各个包目前都是 beta 版本，接口和界面可能还会调整，以产品为准。
- 左侧菜单里颜色较浅的是还没写好的页面。
