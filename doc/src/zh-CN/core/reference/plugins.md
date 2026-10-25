---
title: 插件总览
description: NocoBase 3 插件清单、主要用途及默认模板中的启用情况。
---

本页列出已核对源码中的全部应用插件：主仓库 24 个、商业仓库 2 个，另列出 19 个示例插件。清单按包名字母顺序排列，包名链接到对应源码。

默认模板已接入多数常用插件，可以直接使用其能力。下表区分“已注册”“已依赖，未注册”和“未包含”；实际项目以自己的 `package.json` 和插件注册文件为准。注册、移除和更新方法见[管理插件](../developing-apps/manage-plugins.md)。

## 主仓库插件

| 插件包 | 用途 | 默认模板 |
| --- | --- | --- |
| [`@nocobase/app-plugin-agent-sessions`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agent-sessions) | Agent 会话：连接本地编码 Agent，在浏览器中管理会话、记录和工作产物。 | 未包含 |
| [`@nocobase/app-plugin-agents`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agents) | Agents：管理 Agent、模型服务、运行记录、对话和执行节点。 | 已依赖，未注册 |
| [`@nocobase/app-plugin-api-keys`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-api-keys) | API keys：通过 API key 认证接口请求。 | 已注册 |
| [`@nocobase/app-plugin-authentication`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authentication) | 认证：提供登录、会话及身份认证集成。 | 已注册 |
| [`@nocobase/app-plugin-authorization`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authorization) | 权限：声明业务权限、检查访问权限并提供权限管理界面。 | 已注册 |
| [`@nocobase/app-plugin-authz-default-access`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-default-access) | 默认数据范围：为业务资源配置默认数据访问范围。 | 已注册 |
| [`@nocobase/app-plugin-authz-restriction-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-restriction-rules) | 限制规则：通过规则进一步限制可访问的数据。 | 已注册 |
| [`@nocobase/app-plugin-authz-sharing-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-sharing-rules) | 共享规则：按规则扩展记录的共享访问范围。 | 已注册 |
| [`@nocobase/app-plugin-database-explorer`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-database-explorer) | 数据库浏览：只读查看数据库连接、数据表和字段。 | 已注册 |
| [`@nocobase/app-plugin-demo-mode`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-demo-mode) | 演示模式：为演示环境提供可重置数据、访客账号和写入保护。 | 未包含 |
| [`@nocobase/app-plugin-file`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-file) | 文件：提供文件仓库、上传与内容访问接口，以及可复制到应用的文件组件。 | 已注册 |
| [`@nocobase/app-plugin-foundation`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-foundation) | 应用底座：展示应用实际使用的 Core 能力及其运行信息。 | 已注册 |
| [`@nocobase/app-plugin-i18n`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-i18n) | 多语言：接入多语言基础库，提供应用语言切换。 | 已注册 |
| [`@nocobase/app-plugin-knowledge`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-knowledge) | 知识库：管理 Markdown 文档空间、版本、搜索、变更提案与审阅。 | 已依赖，未注册 |
| [`@nocobase/app-plugin-mail`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-mail) | 邮件：提供邮件发送、邮箱同步及邮件服务扩展机制。 | 已注册 |
| [`@nocobase/app-plugin-notification`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification) | 通知：提供通知存储、投递运行时和日志。 | 已注册 |
| [`@nocobase/app-plugin-notification-in-app`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-in-app) | 站内信：提供站内通知渠道、个人收件箱接口和界面能力。 | 已注册 |
| [`@nocobase/app-plugin-notification-providers`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-providers) | 通知渠道：提供内置通知渠道和服务提供方。 | 已注册 |
| [`@nocobase/app-plugin-notification-web-push`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-web-push) | Web Push：管理浏览器推送订阅并发送 Web Push 通知。 | 未包含 |
| [`@nocobase/app-plugin-projects`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-projects) | 项目：管理项目、事项和研发协作。 | 未包含 |
| [`@nocobase/app-plugin-releases`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-releases) | 发布：管理应用、版本、运行环境及可扩展的部署驱动。 | 未包含 |
| [`@nocobase/app-plugin-scheduler`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-scheduler) | 定时任务：在代码中声明计划任务，提供执行记录和启停接口。 | 已注册 |
| [`@nocobase/app-plugin-template-print`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-template-print) | 模板打印：提供实现 DOCX、PDF 模板打印的 Agent Skills。 | 已包含 Skills |
| [`@nocobase/app-plugin-users`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-users) | 用户：提供用户管理接口和页面。 | 已注册 |

`app-plugin-template-print` 当前仅分发 Skills，没有 Client、Server 或 CLI 运行时入口，因此不需要添加到插件注册数组。`agents` 和 `knowledge` 已在默认模板依赖中，但没有默认注册。

## 商业仓库插件

以下插件位于 `nocobase/nocobase3-pro`，默认模板未包含。源码链接需要相应仓库访问权限，使用范围以实际授权为准。

| 插件包 | 用途 |
| --- | --- |
| [`@nocobase/app-plugin-approval`](https://github.com/nocobase/nocobase3-pro/tree/9689efc5da86dfc24883ffe6e83c2b724f888521/packages/plugins/app-plugin-approval) | 审批：将人工审批与记录生命周期关联，处理审批策略和结果。 |
| [`@nocobase/app-plugin-task-center`](https://github.com/nocobase/nocobase3-pro/tree/9689efc5da86dfc24883ffe6e83c2b724f888521/packages/plugins/app-plugin-task-center) | 任务中心：聚合不同业务来源的个人待办，提供查询接口和可复用界面。 |

## 示例插件

示例插件用于阅读源码和学习扩展方式，位于各仓库的 `packages/examples/`；默认模板不包含它们。示例中的业务流程可作为实现参考。

| 示例插件 | 演示内容 |
| --- | --- |
| [`@nocobase/app-plugin-approval-example`](https://github.com/nocobase/nocobase3-pro/tree/9689efc5da86dfc24883ffe6e83c2b724f888521/packages/examples/app-plugin-approval-example)（商业仓库） | 审批中心和审批场景验证。 |
| [`@nocobase/app-plugin-authorization-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-authorization-example) | 业务资源、角色、数据范围、共享和限制规则。 |
| [`@nocobase/app-plugin-cli-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-cli-example) | 扩展应用命令行。 |
| [`@nocobase/app-plugin-database-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-database-example) | 编写数据库迁移和种子数据。 |
| [`@nocobase/app-plugin-file-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-file-example) | 附件表、上传接口和文件页面。 |
| [`@nocobase/app-plugin-jobs-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-jobs-example) | 周期任务和一次性后台任务。 |
| [`@nocobase/app-plugin-lifecycle-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-lifecycle-example) | 工单流转和费用单的记录生命周期。 |
| [`@nocobase/app-plugin-mail-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-mail-example) | 使用模拟邮件服务演示邮箱同步和发送。 |
| [`@nocobase/app-plugin-notification-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-notification-example) | 任务分配和站内通知。 |
| [`@nocobase/app-plugin-office-flows-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-office-flows-example) | 数据使用申请和多级公文分发。 |
| [`@nocobase/app-plugin-pro-example`](https://github.com/nocobase/nocobase3-pro/tree/9689efc5da86dfc24883ffe6e83c2b724f888521/packages/examples/app-plugin-pro-example)（商业仓库） | 验证商业插件的构建、打包和发布流程。 |
| [`@nocobase/app-plugin-queue-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-queue-example) | 发布和消费队列消息。 |
| [`@nocobase/app-plugin-realtime-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-realtime-example) | 协作任务、个人通知和后台导出的实时更新。 |
| [`@nocobase/app-plugin-registry-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-registry-example) | 插件运行时 UI 与复制到应用的 UI 组件。 |
| [`@nocobase/app-plugin-repository-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-repository-example) | CRM 与订单的关联数据接口。 |
| [`@nocobase/app-plugin-routes-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-routes-example) | 服务端接口和前端懒加载路由。 |
| [`@nocobase/app-plugin-service-provider-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-service-provider-example) | 注册服务及管理服务生命周期。 |
| [`@nocobase/app-plugin-skills-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-skills-example) | 为插件提供 Agent Skills。 |
| [`@nocobase/app-plugin-template-print-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-template-print-example) | 通过授权后的发票数据打印 DOCX 和 PDF。 |

## 数据库与其他基础库

数据库能力由 `@nocobase/db`、数据库驱动和应用运行时提供；数据浏览界面由上面的 `app-plugin-database-explorer` 提供。记录生命周期使用 `@nocobase/lifecycle`，后台任务、队列、实时通信和文件存储分别使用 `@nocobase/jobs`、`@nocobase/queue`、`@nocobase/realtime` 和 `@nocobase/drive`。这些是基础库，不应列成不存在的 `app-plugin-db` 或 `app-plugin-lifecycle`。

## 核对范围

清单于 2026-10-25 按 [nocobase `db419f1d4`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins) 和 [nocobase3-pro `9689efc5d`](https://github.com/nocobase/nocobase3-pro/tree/9689efc5da86dfc24883ffe6e83c2b724f888521/packages/plugins) 核对，默认模板状态取自同一主仓库修订。具体发行版本的插件和注册状态可能不同。
