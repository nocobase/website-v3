---
title: NocoBase Studio
description: NocoBase Studio 是人与 Agent 协同开发的治理平台。把 Claude Code、Codex、OpenCode 组成一支 Agent 团队自主推进任务，进展一目了然，关键处由人做决策。
---

## 概览

NocoBase Studio 是面向团队的 AI 开发治理平台，让人与 Agent 在同一套流程中协同交付。

它支持接入多家厂商的 Coding Agent 与模型，由调度 Agent 按能力分派设计、开发、评审和测试，也支持直接与 Agent 对话推进工作；将需求与项目管理接入开发流程，并对接 Git 代码平台、CI/CD 和发布流程；通过技能和项目记忆沉淀团队的开发规范，为每个任务提供一致的质量基准。

Studio 提供完整的命令行工具，团队可以在本地 Coding Agent 中发起和跟进任务，由 Studio 统一执行与治理。Studio 部署在企业自己的服务器上，代码与数据归企业所有。

![Studio 组织 Agent 推进多个应用的开发与交付，新需求与反馈持续进入任务](/assets/studio/architecture.svg)

![调度 Agent 把需求交给擅长的 Agent 推进，每次交接、执行结果和评审都留在任务里，最后交给人验收](https://static-docs.nocobase.com/studio-zh-home-20261030-v3.png)

## 学习

<div class="learn">

- [**介绍**](intro/what-is-studio.md)
  Studio 解决什么问题，一个需求从提出到上线怎样完成，Agent 团队怎样分工。
- [**安装与配置**](setup/index.md)
  管理员部署 Studio，准备 Git 平台、运行环境、Agent、项目和检查方式，再邀请成员。
- [**开始使用**](join/index.md)
  成员接受邀请并登录，提出需求，跟进开发，验收结果。
- [**任务开发**](use/raise-a-request.md)
  提出需求，在会话里和 Agent 讨论，跟进进展，回答提问，验收。
- [**项目管理**](project/settings.md)
  新建项目，管理成员和设置、知识库和项目记忆，掌握项目进展。
- [**Agent 管理**](configure/agents.md)
  启用 Agent，接入共享和个人运行环境，维护技能，查看用量。
- [**质量管理（开发中）**](project/checks-and-review.md)
  检查与评审，测试计划与质量报告。
- [**发布管理**](release/overview.md)
  PR 预览、测试环境、版本与发布，部署到自己的服务器并记录生产版本。
- [**系统管理**](admin/members-and-roles.md)
  成员与角色、API 密钥、通知、升级与备份。
- [**参考**](reference/statuses-and-permissions.md)
  任务状态与权限、nb-studio 命令、配置项、常见问题与排错。

</div>
