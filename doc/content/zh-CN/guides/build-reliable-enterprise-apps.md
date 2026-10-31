---
title: 基于 NocoBase 3 开发可靠的企业应用
metaDescription: NocoBase Core 是 AI 开发和运行业务系统的开源应用底座，NocoBase Studio 是人与 Agent 协同开发的治理平台。
---

## 前言

让 Agent 直接 Vibe Coding 写一个业务系统，第一版通常很快，之后就会遇到下面这些问题：

1. 权限、工作流、审批等这些底层能力要从零开发，而且不一定可靠，容易出问题。
2. 换模型、换人、开新会话，写法就变，架构逐渐失控。
3. 并行任务多了，Agent 发来的消息和改动，人确认不过来。
4. 需求背景、业务规则、踩过的坑散在各个会话里，换人、换 Agent 就丢了。

基于此，NocoBase 3 推出了 [NocoBase Core](https://www.nocobase.com/zh-CN/core/) 和 [NocoBase Studio](https://www.nocobase.com/zh-CN/studio/)：既能够让企业在 AI Agent 时代快速开发自己的企业级应用，又能解决上述这些问题。本教程将以 IT 资产管理为例，讲述如何在 NocoBase 3 的加持下开发可靠的企业应用。

## Core：AI 开发和运行业务系统的开源应用底座

**基础能力不用从头开发和验证。** 用户与权限、数据与文件、流程与审批、消息、AI 与 Agent 等 20 多项基础能力现成可用，由 NocoBase 持续维护和升级。能力清单见 [认识 NocoBase Core](../core/index.md#通用能力不必从零开发)。

**统一的架构和规范。** 新建的应用自带统一的目录，页面、接口、迁移、测试各有固定位置；`AGENTS.md` 和随包发布的技能写明业务代码放在哪里、哪些直接用现成能力。换人、换模型、换会话，Agent 都按同一套写法开发。见 [项目结构](../core/developing-apps/project-structure.md)。

应用用了哪些 Core 能力，在「系统设置 › 应用底座」里能直接查看，见 [应用底座](../core/using-plugins/application-support/foundation.md)。

![应用底座：应用用到了哪些 Core 能力](https://static-docs.nocobase.com/20261030-itam-lite-ego-preview-foundation-2x.webp)

## Studio：人与 Agent 协同开发的治理平台

**Agent 团队自主推进。** Claude Code、Codex 等接入 Studio 组成 Agent 团队，调度 Agent 按专长分派设计、开发、测试、评审，多个任务在各自的分支上同时推进。每个任务做到哪一步、谁在做、下一步做什么，一目了然。

**关键处由人做决策。** 测试和评审都通过才交给人。人看报告、截图和预览，通过或退回；不懂代码的业务专家也能直接提需求、拍板、验收。

**方法和经验沉淀在团队里。** 技能保存做事的方法，知识库保存业务资料，项目记忆保存 Agent 学到的经验，换人、换 Agent 都能接着做。见 [Studio 是什么](../studio/intro/what-is-studio.md)。

只用 Core 就能开发和上线完整的应用。团队要同时推进多个项目，或者业务同事要直接参与时，再用 Studio。

> [!NOTE] Studio 的版本
> Studio 仅在 NocoBase 专业版和企业版中提供，见 [版本与价格](https://www.nocobase.com/zh-CN/pricing/)。

## 教程里的例子：IT 资产管理

下文称 ITAM：公司给员工配电脑、显示器，要知道每台设备在哪、归谁、状态如何，领用设备要走审批。三个角色：

| 角色       | 在系统里做什么                             |
| ---------- | ------------------------------------------ |
| 员工       | 查看自己名下的设备，提交领用申请           |
| IT 支持    | 处理领用申请，发放和回收设备，维护设备状态 |
| 资产管理员 | 维护设备台账，审批领用，组织盘点           |

第一部分做设备台账、领用与审批、三个角色的权限；第二部分让 Agent 团队做设备盘点，并邀请资产管理员直接参与。

教程代码见 [nocobase/docs-examples-v3](https://github.com/nocobase/docs-examples-v3/tree/main/apps/itam-lite)。更完整的 IT 资产管理系统可以参考 [NocoITAM 在线演示](https://solutions.nocobase.com/itam/)。

## 教程路线

### 起步

1. [基于 NocoBase 3 开发可靠的企业应用](build-reliable-enterprise-apps.md)：本篇。
2. [准备开发环境](prepare-environment.md)：装好 Node.js、pnpm 和 Git。
3. [选择 Agent 和模型](choose-agent-and-model.md)：选编码工具和模型。

### 第一部分：用 Core 做出一个应用

4. [创建应用](create-app.md)：让 Agent 创建应用，启动、登录，提交第一个版本。
5. [先写一份系统设计文档](write-a-design-doc.md)：和 Agent 聊清楚 ITAM 要做什么，写成设计文档。
6. [第一个功能：设备台账](first-feature-devices.md)：设备的录入、查询和状态。
7. [设备领用与审批](requests-and-approval.md)：员工提交领用申请，经审批后发放设备。
8. [角色与权限](roles-and-permissions.md)：三个角色各自能看到什么、能做什么。
9. [验收 Agent 的工作](accept-agent-work.md)：检查 Agent 交来的结果，让它修改。
10. [部署上线](deploy.md)：把应用部署到服务器。

### 第二部分：在团队中使用 Studio

11. [把项目接入 Studio](bring-into-studio.md)：把 ITAM 的代码仓库接入 Studio 项目。
12. [交给 Agent 团队推进一个需求](agent-team-request.md)：让 Agent 团队做设备盘点。
13. [让业务同事直接参与](business-colleagues.md)：邀请资产管理员提需求、回答提问、验收。
14. [沉淀方法和经验](capture-knowledge.md)：用技能、知识库和项目记忆留住方法和业务知识。
15. [发布到生产](release.md)：部署到测试环境，打 tag 发布，部署到自己的服务器。

### 最佳实践

- [最佳实践](best-practices.md)：用 Core 和 Studio 开发时的经验和技巧。

### 附录

- [常用提示词](prompts.md)：教程里用到的提示词汇总。
- [升级 NocoBase Core](upgrade-core.md)：用升级技能把 Core 升级到最新版本。
