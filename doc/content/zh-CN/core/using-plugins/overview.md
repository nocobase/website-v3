---
title: 插件使用概览
description: 按功能查找 NocoBase 插件，了解各插件的用途、配置方法和使用入口。
---

NocoBase 提供用户、认证、权限、文件、通知、Agents 等插件，可用于构建应用中的常见功能。本章介绍各个插件的用途、配置方法，以及如何在应用中使用它们提供的页面、组件、接口、服务或 Skills。

可以根据下面的功能找到需要的插件。安装、注册、更新和移除等通用操作，参阅[管理插件](../developing-apps/manage-plugins.md)。

## 按功能查找插件

本章介绍 21 个插件，相关功能按主题分组，其余插件提供独立入口。各插件按提供的能力、使用场景与示例、重要原理与实现、AI 开发的约束与验证四章介绍。

| 功能 | 使用文档 | 主要用途 |
| --- | --- | --- |
| 用户与认证 | [用户管理](authentication/users.md)、[身份认证](authentication/sign-in.md)、[API 密钥](authentication/api-keys.md) | 管理用户、登录应用及认证 API 请求 |
| 权限与数据访问 | [权限管理](authorization/permissions.md)、[默认数据范围](authorization/default-access.md)、[共享规则](authorization/sharing-rules.md)、[限制规则](authorization/restriction-rules.md) | 控制操作权限和记录访问范围 |
| 数据库浏览 | [数据库浏览](data-and-files/database-explorer.md) | 查看数据库连接、表和字段 |
| 文件 | [文件](data-and-files/file-management.md) | 上传、存储和访问文件 |
| 通知 | [通知](notifications/notification.md)、[通知渠道](notifications/providers.md)、[站内信](notifications/in-app.md)、[浏览器推送](notifications/web-push.md) | 配置通知渠道、投递通知并接入收件箱与浏览器推送 |
| 邮件 | [邮件](notifications/mail.md) | 发送邮件、同步邮箱及扩展邮件服务 |
| Agents | [Agents](agents-and-knowledge/agents.md) | 配置模型 API，或接入机器上的 Agent，使用对话与任务执行能力 |
| 知识库 | [知识库](agents-and-knowledge/knowledge.md) | 管理文档空间、版本、搜索与变更审阅 |
| 审批（商业） | [审批（商业）](collaboration/approval.md) | 配置审批策略并处理审批结果 |
| 定时任务 | [定时任务](automation/scheduler.md) | 声明计划任务，查看执行记录和管理启停 |
| 模板打印 | [模板打印](automation/template-print.md) | 使用 Skills 实现 DOCX、PDF 模板打印 |
| 多语言 | [多语言](application-support/i18n.md) | 接入多语言能力和应用语言切换 |
| 应用底座 | [应用底座](application-support/foundation.md) | 查看应用使用的 Core 能力与运行信息 |

## 接入前确认

先检查应用实际注册的插件和对应版本，再按各篇文档接入。包已安装不等于已启用；部分插件还需要在应用配置中组合工厂，或由应用声明业务数据、页面和权限。

各篇中的 `/client`、`/server` 等表示该插件包的公开导出。页面和 HTTP 路径相对于应用挂载位置；例如应用位于 `/main` 时，`/api/users` 的实际地址是 `/main/api/users`。接口的完整输入、响应及权限要求，以运行应用的 `/api/swagger/docs` 或 `/api/swagger` 为准。

## 阅读插件使用文档

每个插件文档统一按四章组织：

1. **提供的能力**：解决什么问题，提供哪些页面、组件、接口、服务或 Skills，哪些部分由应用负责。
2. **使用场景与示例**：具体业务需求、交给 Coding Agent 的开发提示词、使用步骤与完成标志。
3. **重要原理与实现**：解释示例的接入位置、代码和配置变化、界面变化，以及关键机制。
4. **AI 开发的约束与验证**：列出该插件特有的开发边界、易错点和验收要求。

开发提示词用于当前应用目录中的 Coding Agent。先让它阅读项目 `AGENTS.md`、应用规则和当前安装版本随包提供的相关 Skills；没有开发 Skill 的能力以公开接口、类型与文档为准。第四章讨论 AI 帮助开发者使用插件时的约束，不要求插件本身具有 AI 功能。通用协作方法与检查流程见[使用 Agent 开发](../developing-apps/develop-with-an-agent.md)和[测试与验收](../developing-apps/testing-and-acceptance.md)。

各插件提供的能力不同。例如，模板打印只提供实现指导；用户管理提供管理接口和邀请页，用户管理页面由应用接入；知识库和应用底座则提供可注册的页面。每篇会说明页面、数据和业务逻辑分别由谁负责。

## 示例版本与验证范围

提示词描述预期行为，不代表安装一个插件就已经实现该功能。交付时报告实际修改、执行过的检查和未验证项；邮件投递、真实设备推送、模型调用等需要相应环境才能验证。

本章按 2026-10-28 核对的源码整理，主仓库基线为 [`015404ecd`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins)，审批另按商业插件公开契约核对。[Agents](agents-and-knowledge/agents.md)另有独立应用的实测基线、截图与下载源码。具体安装版本可能存在差异；文中的验证步骤用于检查你的应用，不表示所有插件集成都已经在本次文档整理中运行测试。

## 相关文档

- [管理插件](../developing-apps/manage-plugins.md)：安装、注册、更新和移除插件。
- [插件索引](../reference/plugins.md)：查询完整包名、来源及默认模板包含情况。
- [开发插件](../extension-development/when-to-write-a-plugin.md)：需要提供自己的插件时，了解适用场景和开发入口。
