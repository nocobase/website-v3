---
title: "在 Studio 中协作"
description: "在 Studio 中接入已有项目，组织业务同事参与需求、沉淀项目知识、管理质量检查并完成测试与生产发布。"
---

适合已经在 Studio 中或准备引入 Studio 开展多人开发的团队。通过本系列，你可以把已有 Core 代码仓库接入 Studio，让业务同事直接参与需求与验收，将业务规则沉淀为团队资产，结合持续测试管理交付质量，并把代码更新安全推进到测试与生产环境。

## 开始前的准备

开始前，确认具备以下条件：

- **Studio 工作台**：已部署并可登录，至少有一台在线[运行环境](../../studio/setup/shared-runtimes.md)和可用 [Agent](../../studio/setup/agents.md)。尚未搭建时，管理员按[安装与配置](../../studio/setup/index.md)完成部署与 [Git 连接](../../studio/setup/git.md)；团队成员按[加入项目](../../studio/join/index.md)登录。
- **代码仓库**：手头已有 NocoBase Core 仓库时，从第一篇接入；想先练手，可直接 Fork 官方 CRM 示例仓库 [`nocobase/doc-demo-crm`](https://github.com/nocobase/doc-demo-crm)。已有接入好的项目可直接选用后续课程。
- **权限与版本**：邀请新成员需要管理员权限；发布需要配置好[检查与预览](../../studio/setup/ci.md)与[托管环境](../../studio/admin/environments.md)。其中《管理交付质量》需要 **Studio 企业版（EE）**，多角色验收适用于**专业版与企业版**。

> [!NOTE]
> 如果是首次接触 Studio、希望先体验单个需求的完整流程，可先阅读[使用 Studio 推进开发](../../getting-started/collaborate-with-studio.md)。

## 课程列表

除第一篇用于将已有仓库接入 Studio 外，其余各篇均围绕独立的团队协作环节展开，可按团队当前阶段直接选用，无需按固定顺序全部做完。

| 课程 | 完成后的结果 | 开始条件 |
| --- | --- | --- |
| [接入已有项目](open-crm-project.md) | 将已有代码仓库连接至 Studio，配置检查来源与 PR 预览，跑通首个 PR。 | Studio 工作台可用，具备目标仓库访问权限，且有在线运行环境与可用 Agent。 |
| [让业务同事参与](business-colleagues.md) | 业务负责人在 Studio 中直接提出需求、回答规则问题并在预览环境完成验收。 | 已接入 Studio 的项目、业务同事邮箱与成员邀请权限。 |
| [沉淀知识与经验](capture-knowledge.md) | 将已确认的业务规则、检查清单与项目经验沉淀到知识库、技能与项目记忆。 | 已接入 Studio 的项目（具备项目知识维护与技能管理权限）及待沉淀规则。 |
| [管理交付质量](enterprise-management.md) | 通过持续测试、核心场景检查与跟进任务把控并行开发的交付质量。 | Studio 企业版（EE）、已接入仓库的项目、有效项目负责人、可用 Agent 与在线运行环境。 |
| [发布到生产](release.md) | 在测试环境验收候选版本并发布到生产，同时保留已有业务数据。 | 已接入 Studio 的项目、候选提交、已配置的测试环境与自有生产服务器。 |
