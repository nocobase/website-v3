---
title: 插件使用概览
description: 按功能查找 NocoBase 插件，了解各插件的用途、配置方法和使用入口。
---

NocoBase 提供用户、认证、权限、文件、通知、Agents 等插件，可用于构建应用中的常见功能。本章介绍各个插件的用途、配置方法，以及如何在应用中使用它们提供的页面、组件、接口、服务或 Skills。

可以根据下面的功能分类找到需要的插件。安装、注册、更新和移除等通用操作，参阅[管理插件](../developing-apps/manage-plugins.md)。

## 按功能查找插件

本章按八类功能整理 26 个插件，包括主仓库的 24 个插件和 2 个商业插件。点击插件名称可查看索引中的用途、包名和默认模板包含情况；各插件的使用指南将逐步补充。

| 功能分类 | 包含插件 | 主要用途 |
| --- | --- | --- |
| 用户与认证 | [用户管理](../reference/plugins.md#plugin-users)、[身份认证](../reference/plugins.md#plugin-authentication)、[API 密钥](../reference/plugins.md#plugin-api-keys) | 管理用户、登录应用及认证 API 请求 |
| 权限与数据访问 | [权限管理](../reference/plugins.md#plugin-authorization)、[默认数据范围](../reference/plugins.md#plugin-authz-default-access)、[共享规则](../reference/plugins.md#plugin-authz-sharing-rules)、[限制规则](../reference/plugins.md#plugin-authz-restriction-rules) | 控制操作权限和记录访问范围 |
| 数据与文件 | [数据库浏览](../reference/plugins.md#plugin-database-explorer)、[文件管理](../reference/plugins.md#plugin-file) | 查看数据库结构、上传和访问文件 |
| 消息与通知 | [通知](../reference/plugins.md#plugin-notification)、[通知渠道](../reference/plugins.md#plugin-notification-providers)、[站内信](../reference/plugins.md#plugin-notification-in-app)、[浏览器推送](../reference/plugins.md#plugin-notification-web-push)、[邮件](../reference/plugins.md#plugin-mail) | 发送消息、接收通知和处理邮件 |
| Agents 与知识 | [Agents](../reference/plugins.md#plugin-agents)、[Agent 会话](../reference/plugins.md#plugin-agent-sessions)、[知识库](../reference/plugins.md#plugin-knowledge) | 使用 Agent、管理编码会话和维护知识文档 |
| 业务协作 | [项目管理](../reference/plugins.md#plugin-projects)、[审批（商业）](../reference/plugins.md#plugin-approval)、[任务中心（商业）](../reference/plugins.md#plugin-task-center) | 组织项目事项、处理审批与个人待办 |
| 自动化与输出 | [定时任务](../reference/plugins.md#plugin-scheduler)、[模板打印](../reference/plugins.md#plugin-template-print) | 定时执行工作、生成文档与打印结果 |
| 应用支持 | [多语言](../reference/plugins.md#plugin-i18n)、[应用底座](../reference/plugins.md#plugin-foundation)、[发布管理](../reference/plugins.md#plugin-releases)、[演示模式](../reference/plugins.md#plugin-demo-mode) | 切换语言、查看运行信息、管理发布和提供演示环境 |

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
