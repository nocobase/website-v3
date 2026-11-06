---
title: 学习路径
metaDescription: "查看文档站全貌，按应用开发、Studio 协作、完整项目和部署维护选择阅读路线。"
---

## 文档全貌

| 板块 | 内容 | 使用方式 |
| --- | --- | --- |
| [开始](what-is-nocobase.md) | 整体概念、开发第一个应用、Studio 协作、学习路径 | 第一次接触 NocoBase 3 时阅读 |
| [Core 手册](../core/index.md) | 开发应用、使用插件、开发插件、框架原理、部署维护、参考 | 按正在开发或维护的功能查阅 |
| [Studio 手册](../studio/index.md) | 安装配置、成员接入、任务开发、项目管理、Agent 管理、质量管理、发布管理、系统管理、参考 | 按角色与当前操作查阅 |
| [完整项目教程](../guides/build-reliable-enterprise-apps.md) | 准备环境与选择 Agent、用 Core 开发应用、通过 Studio 协作、最佳实践与附录 | 希望跟随一个项目逐步实践时阅读 |
| [FAQ](../faq/from-v2.md) | NocoBase 2 与 3 的区别、功能对应与迁移 | 需要了解版本关系时查阅 |

## 完成首次上手

先读 [NocoBase 3 是什么](what-is-nocobase.md)，理解应用底座、开发治理与业务应用的关系。

- 自己创建应用：按[开发第一个应用](develop-your-first-app.md)创建、启动并开发客户管理，检查角色权限后再继续迭代。
- 已加入 Studio 团队：直接按[使用 Studio 协作开发](collaborate-with-studio.md)完成一个需求；管理员尚未准备环境时，先进入[安装与配置](../studio/setup/index.md)。

两篇上手文章各自给出所需前提，无需先读完所有手册。

## 深入开发与扩展应用

应用能运行后，从[应用开发概览](../core/developing-apps/overview.md)了解功能的组成，结合[项目结构](../core/developing-apps/project-structure.md)定位文件。开发应用手册覆盖页面与交互、服务与接口、数据与权限、后台任务、命令行以及测试。

需要认证、文件、通知等通用能力时，查[使用插件](../core/using-plugins/overview.md)；功能要独立维护或跨应用复用时，进入[开发插件](../core/extension-development/when-to-write-a-plugin.md)。理解运行时、服务容器、HTTP、数据库等底层机制时，再查[框架原理](../core/framework/overview.md)。

## 使用与管理 Studio

- 成员日常工作：从[提出需求](../studio/use/raise-a-request.md)和[会话](../studio/use/sessions.md)开始，按需查[跟进进展](../studio/use/follow-progress.md)、[回答提问](../studio/use/answer.md)和[验收](../studio/use/accept.md)。
- 项目负责人：查[项目设置](../studio/project/settings.md)、[知识库](../studio/project/knowledge-base.md)、[项目记忆](../studio/project/project-memory.md)和[项目进展](../studio/project/progress.md)，再了解[检查与评审](../studio/project/checks-and-review.md)及[发布](../studio/release/overview.md)。
- 管理员：完成[安装配置](../studio/setup/index.md)，再按需管理[Agent](../studio/configure/agents.md)、[运行环境](../studio/configure/runtimes.md)、[技能](../studio/project/skills.md)、[用量](../studio/project/usage.md)、[成员与角色](../studio/admin/members-and-roles.md)及[升级备份](../studio/admin/upgrade-and-backup.md)。

状态、权限、Agent 执行规则、命令和配置项集中在 Studio 的参考部分。

## 跟随完整项目教程

[构建可靠业务系统](../guides/build-reliable-enterprise-apps.md)以资产管理应用为线索，按顺序完成环境准备、设计、设备管理、申请审批、角色权限、验收和部署，再进入 Studio 的团队协作、知识积累与发布。

这条路线适合希望持续练习完整项目的人。已完成快速上手，可根据已有基础选择继续阅读的位置；遇到具体机制，返回对应手册查阅。

## 部署维护与参考查阅

准备让他人使用应用时，先读[选择部署方式](../core/deployment/choose-a-deployment-method.md)，再按[发布应用新版本](../core/deployment/publish-app-release.md)交付更新。数据库环境见[数据库兼容性](../core/reference/compatibility.md)与[数据库配置](../core/reference/database-configuration.md)。

需要查命令或设置时，直接进入 Core 的[命令行](../core/reference/cli.md)、[配置项](../core/reference/configuration.md)，或 Studio 的[命令行](../studio/reference/cli.md)、[执行机命令](../studio/reference/runner.md)和[配置项](../studio/reference/config.md)。
