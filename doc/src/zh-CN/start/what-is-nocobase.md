---
title: NocoBase 3 是什么
description: NocoBase 是企业用 AI 开发和持续改进业务系统的开源平台。Agent 写业务部分，NocoBase 提供底座和工作流程，人确定目标、作出决定。
---

让 Agent 做一个业务系统，第一个版本几个小时就能上线。难的是之后：每加一个功能、改一次流程、升一次级，系统都要继续可靠。业务系统要用很多年，能一直可靠地改下去，比第一版做得快更重要。

NocoBase 3 为此把工作分成三份：

<div class="roles">
<div class="col human"><div class="col-h">人做决定</div><div class="role"><span>确定目标，作出判断，批准关键操作，验收结果。</span></div></div>
<div class="col agent"><div class="col-h">Agent 执行</div><div class="role"><span>开发和测试功能，处理资料，推进业务任务。</span></div></div>
</div>

**NocoBase 提供底座和工作流程**：Core 的数据、权限、审批和定时任务每次都按同样的规则运行，Agent 的每一步都有记录；Studio 接入并调度大量 Agent，每次变更经过检查、验收和批准再上线。

## 业务部分和底座分开

NocoBase 把一个业务系统分成两部分：

- **业务部分**是每个企业不一样的地方：数据模型、页面、流程、业务规则和业务 Agent。由 Agent 开发，代码在你自己的仓库里。
- **底座**是每个系统都需要的能力：数据、权限、审批、文件、通知、部署等。由 NocoBase 提供，随版本独立升级。

每次修改只动业务部分，底座不用重写。这是“可靠”的主要来源。

## 产品结构

| 产品 | 是什么 | 版本 |
| --- | --- | --- |
| **Core** | 开发和运行业务系统的开源底座。Agent 直接使用它的能力，把开发集中在企业自己的业务上 | 开源，商业版有增强 |
| **Studio** | 人带领 Agent 团队开发应用的工作台。Agent 完成从需求到上线的执行，人只处理需要决定的事 | Professional、Enterprise |
| **Solutions** | 基于 NocoBase 开发的开源业务应用，配好了业务 Agent，可以直接使用，也可以继续定制 | 开源 |
| **Launch** | 实战培训与项目陪跑，NocoBase 团队和你的团队一起完成一个真实项目 | 按需选择 |

全部产品都可以私有部署，模型和 Agent 由企业自己选择。

## 只用 Core，还是用 Studio

| | 只用 Core | 用 Studio |
| --- | --- | --- |
| 谁来开发 | 你在应用目录里打开自己的编码工具，和 Agent 一起开发 | Studio 把团队的 Agent 组成 Agent 团队，调度 Agent 安排开发、测试、评审 |
| 适合 | 一个人或一个小团队，做一个或几个应用 | 团队同时推进多个任务和项目，懂业务的人也要主导需求 |
| 测试、部署、备份 | 团队自己组织，Core 提供部署工具和开发指引 | 按 Studio 的流程进行：检查、评审、验收、批准后发布 |
| 开始 | [创建 Core 应用](../core/getting-started/create-app.md) | [Studio 是什么](../studio/intro/what-is-studio.md) |

两种方式开发出来的应用一样，都建在 Core 上，上线后独立运行，日常业务请求不经过 Studio。

## Agent 在 NocoBase 里做两类工作

- **开发应用**：Claude Code、Codex 等编码工具，读 Core 随包提供的技能，在应用的代码仓库里编写页面、接口、数据表和流程。
- **在应用里处理业务**：应用上线后，**业务 Agent** 在权限范围内整理资料、分类工单、提醒到期事项，关键操作交给人批准。它由 Core 的 Agents 插件接入，使用和同事一样的角色与权限。

两类工作遵循同一套原则：Agent 有明确的身份和授权，过程有记录，结果可以检查，关键操作由人批准，人随时可以接手。

## 接下来

- 想动手：[Core 是什么](../core/getting-started/what-is-core.md) → [创建应用](../core/getting-started/create-app.md)
- 想了解团队怎样带领 Agent 团队：[Studio 是什么](../studio/intro/what-is-studio.md)
- 用过 NocoBase 2：[从 NocoBase 2 来](from-v2.md)
