---
title: 插件总览
description: NocoBase 3 插件清单、主要用途及是否内置。
---

本页列出已核对源码中的应用插件：主仓库 24 个、商业仓库 2 个。清单按包名字母顺序排列，公开源码通过包名链接提供。

“内置插件”表示创建应用时是否已随默认模板包含该插件。已包含标记为“是”，需要另外安装标记为“否”；是否启用以应用的插件注册文件为准。注册、移除和更新方法见[管理插件](../developing-apps/manage-plugins.md)。

## 主仓库插件

| 插件包 | 用途 | 内置插件 |
| --- | --- | --- |
| [`@nocobase/app-plugin-agent-sessions`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agent-sessions) | Agent 会话：连接本地编码 Agent，在浏览器中管理会话、记录和工作产物。 | 否 |
| [`@nocobase/app-plugin-agents`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agents) | Agents：管理 Agent、模型服务、运行记录、对话和执行节点。 | 是 |
| [`@nocobase/app-plugin-api-keys`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-api-keys) | API keys：通过 API key 认证接口请求。 | 是 |
| [`@nocobase/app-plugin-authentication`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authentication) | 认证：提供登录、会话及身份认证集成。 | 是 |
| [`@nocobase/app-plugin-authorization`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authorization) | 权限：声明业务权限、检查访问权限并提供权限管理界面。 | 是 |
| [`@nocobase/app-plugin-authz-default-access`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-default-access) | 默认数据范围：为业务资源配置默认数据访问范围。 | 是 |
| [`@nocobase/app-plugin-authz-restriction-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-restriction-rules) | 限制规则：通过规则进一步限制可访问的数据。 | 是 |
| [`@nocobase/app-plugin-authz-sharing-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-sharing-rules) | 共享规则：按规则扩展记录的共享访问范围。 | 是 |
| [`@nocobase/app-plugin-database-explorer`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-database-explorer) | 数据库浏览：只读查看数据库连接、数据表和字段。 | 是 |
| [`@nocobase/app-plugin-demo-mode`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-demo-mode) | 演示模式：为演示环境提供可重置数据、访客账号和写入保护。 | 否 |
| [`@nocobase/app-plugin-file`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4/packages/plugins/app-plugin-file) | 文件：提供文件仓库、上传与内容访问接口；可编辑文件界面由 NocoBase UI Library 提供。 | 是 |
| [`@nocobase/app-plugin-foundation`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-foundation) | 应用底座：展示应用实际使用的 Core 能力及其运行信息。 | 是 |
| [`@nocobase/app-plugin-i18n`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-i18n) | 多语言：接入多语言基础库，提供应用语言切换。 | 是 |
| [`@nocobase/app-plugin-knowledge`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-knowledge) | 知识库：管理 Markdown 文档空间、版本、搜索、变更提案与审阅。 | 是 |
| [`@nocobase/app-plugin-mail`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-mail) | 邮件：提供邮件发送、邮箱同步及邮件服务扩展机制。 | 是 |
| [`@nocobase/app-plugin-notification`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification) | 通知：提供通知存储、投递运行时和日志。 | 是 |
| [`@nocobase/app-plugin-notification-in-app`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-in-app) | 站内信：提供站内通知渠道、个人收件箱接口和界面能力。 | 是 |
| [`@nocobase/app-plugin-notification-providers`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-providers) | 通知渠道：提供内置通知渠道和服务提供方。 | 是 |
| [`@nocobase/app-plugin-notification-web-push`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-web-push) | Web Push：管理浏览器推送订阅并发送 Web Push 通知。 | 否 |
| [`@nocobase/app-plugin-projects`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-projects) | 项目：管理项目、事项和研发协作。 | 否 |
| [`@nocobase/app-plugin-releases`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-releases) | 发布：管理应用、版本、运行环境及可扩展的部署驱动。 | 否 |
| [`@nocobase/app-plugin-scheduler`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-scheduler) | 定时任务：在代码中声明计划任务，提供执行记录和启停接口。 | 是 |
| [`@nocobase/app-plugin-template-print`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-template-print) | 模板打印：提供实现 DOCX、PDF 模板打印的 Agent Skills。 | 是 |
| [`@nocobase/app-plugin-users`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-users) | 用户：提供用户管理接口和页面。 | 是 |

`app-plugin-template-print` 当前仅分发 Skills，没有 Client、Server 或 CLI 运行时入口，因此不需要添加到插件注册数组。`agents` 和 `knowledge` 已在默认模板依赖中，但没有默认注册。

## 商业仓库插件

以下商业插件未包含在默认模板中，使用范围以实际授权为准。

| 插件包 | 用途 |
| --- | --- |
| `@nocobase/app-plugin-approval` | 审批：将人工审批与记录生命周期关联，处理审批策略和结果。 |
| `@nocobase/app-plugin-task-center` | 任务中心：聚合不同业务来源的个人待办，提供查询接口和可复用界面。 |

## 数据库方言

`@nocobase/db` 通过以下 8 个方言包适配数据库，其中主仓库 5 个、商业仓库 3 个。公开源码通过包名链接提供。

| 方言包 | 数据库 | 所属仓库 |
| --- | --- | --- |
| `@nocobase/db-dameng` | 达梦（DM） | 商业仓库 |
| `@nocobase/db-kingbase` | 人大金仓 KingbaseES（PostgreSQL 兼容模式） | 商业仓库 |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mssql) | Microsoft SQL Server | 主仓库 |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mysql) | MySQL | 主仓库 |
| `@nocobase/db-oceanbase` | OceanBase CE（MySQL 兼容租户） | 商业仓库 |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-oracle) | Oracle Database | 主仓库 |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-postgres) | PostgreSQL | 主仓库 |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-sqlite) | SQLite | 主仓库 |

商业方言包通过 Pro registry 分发，源码访问和使用范围以相应授权为准。当前核对版本的 `db-dameng` 标记为实验性，仍需针对所用达梦服务端版本验证集成契约。

## 核对范围

清单于 2026-10-25 按 [nocobase `db419f1d4`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins) 及商业插件源码核对，默认模板状态取自同一主仓库修订。具体发行版本的插件和注册状态可能不同。

文件界面的归属另按源码提交 [`d9a625d93b40`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4) 核对；其余清单与默认模板状态以上述基线为准。
