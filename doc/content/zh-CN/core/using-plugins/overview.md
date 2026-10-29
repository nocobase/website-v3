---
title: 插件使用概览
description: 按功能查找 NocoBase 插件，了解各插件的用途、配置方法和使用入口。
---

NocoBase 提供用户、认证、权限、文件、通知、Agents 等插件，可用于构建应用中的常见功能。本章介绍各个插件的用途、配置方法，以及如何在应用中使用它们提供的页面、组件、接口、服务或 Skills。

可以根据下面的功能找到需要的插件。安装、注册、更新和移除等通用操作，参阅[管理插件](../developing-apps/manage-plugins.md)。

## 按功能查找插件

本章介绍 22 个插件，相关功能按主题分组，其余插件提供独立入口。点击插件名称可进入对应的使用文档；尚未完成的页面会显示待编写提示。

| 功能 | 使用文档 | 主要用途 |
| --- | --- | --- |
| 用户与认证 | [用户管理](authentication/users.md)、[身份认证](authentication/sign-in.md)、[API 密钥](authentication/api-keys.md) | 管理用户、登录应用及认证 API 请求 |
| 权限与数据访问 | [权限管理](authorization/permissions.md)、[默认数据范围](authorization/default-access.md)、[共享规则](authorization/sharing-rules.md)、[限制规则](authorization/restriction-rules.md) | 控制操作权限和记录访问范围 |
| 数据库浏览 | [数据库浏览](data-and-files/database-explorer.md) | 查看数据库连接、表和字段 |
| 文件 | [文件](data-and-files/file-management.md) | 上传、存储和访问文件 |
| 通知 | [通知](notifications/notification.md)、[通知渠道](notifications/providers.md)、[站内信](notifications/in-app.md)、[浏览器推送](notifications/web-push.md) | 配置通知渠道、投递通知并接入收件箱与浏览器推送 |
| 邮件 | [邮件](notifications/mail.md) | 发送邮件、同步邮箱及扩展邮件服务 |
| Agents 与知识 | [Agents](agents-and-knowledge/agents.md)、[Agent 会话](agents-and-knowledge/agent-sessions.md)、[知识库](agents-and-knowledge/knowledge.md) | 使用 Agent、管理编码会话和维护知识文档 |
| 审批（商业） | [审批（商业）](collaboration/approval.md) | 配置审批策略并处理审批结果 |
| 定时任务 | [定时任务](automation/scheduler.md) | 声明计划任务，查看执行记录和管理启停 |
| 模板打印 | [模板打印](automation/template-print.md) | 使用 Skills 实现 DOCX、PDF 模板打印 |
| 多语言 | [多语言](application-support/i18n.md) | 接入多语言能力和应用语言切换 |
| 应用底座 | [应用底座](application-support/foundation.md) | 查看应用使用的 Core 能力与运行信息 |

## 阅读插件使用文档

使用某个插件时，重点了解以下内容：

- **功能与适用场景**：插件解决什么问题，提供哪些能力。
- **接入与配置**：需要哪些依赖、运行时注册和配置。
- **使用方法**：如何使用插件提供的界面、组件、接口、服务或 Skills。
- **使用示例**：如何将插件用于具体业务。
- **扩展与常见问题**：支持哪些定制方式，以及如何处理使用中的常见问题。

各插件提供的能力不同。例如，模板打印主要提供实现 DOCX、PDF 模板打印的 Skills，使用时应结合这些指引完成应用中的打印功能；用户管理等插件则提供可接入的接口和页面。

## 相关文档

- [管理插件](../developing-apps/manage-plugins.md)：安装、注册、更新和移除插件。
- [插件索引](../reference/plugins.md)：查询完整包名、来源及默认模板包含情况。
- [开发插件](../extension-development/when-to-write-a-plugin.md)：需要提供自己的插件时，了解适用场景和开发入口。
