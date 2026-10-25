---
title: 插件目录
nav: 插件目录总览
description: NocoBase 3 的全部插件，以及最常用的基础库：每个做什么、开源还是商业、默认模板里有没有。点进去看它提供了什么、在应用里是什么样子、怎样让 Agent 使用。
---

插件是什么、怎样进入应用，见 [插件怎样工作](../intro/how-plugins-work.md)。想按业务需求查，从 [能力总览](../capabilities/index.md) 进入更快。

## 怎样读这张表

- **版本范围**：<span class="tag">开源</span> 在 NocoBase 开源仓库里；<span class="tag pro">商业版</span> 需要相应授权。
- **默认模板**：用默认模板新建的应用里，<span class="tag ok">已启用</span> 表示已经登记在插件清单里；<span class="tag">已安装，未注册</span> 表示包已经在依赖里，需要时注册即可；— 表示需要安装。
- 每个插件页的“档案”由脚本从代码生成，版本号对应 2026-10-23 的 `v3-develop` 分支。

## 用户与权限

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [认证](authentication.md) | 登录、注册、找回密码和会话，基于 Better Auth；企业统一身份（OIDC）、社交登录、双因素认证等通过配置接入。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [用户](users.md) | 用户管理的接口和页面组件：账号、启用与停用、重置密码、邀请链接、个人偏好、分配角色。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [API keys](api-keys.md) | 用 API Key 访问应用的接口，供脚本、外部系统和命令行使用。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [权限](authorization.md) | 页面、操作和数据范围的授权（权限集，界面上叫角色），服务端和浏览器端的权限检查。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [默认数据范围](authz-default-access.md) | 给已有操作权限的人一个共同的数据范围。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [共享规则](authz-sharing-rules.md) | 把指定记录共享给指定的人或角色。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [限制规则](authz-restriction-rules.md) | 在已有授权上进一步收窄范围，例如金额上限。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |

## 数据与文件

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [数据库](db.md)（基础库） | 数据表、查询、迁移和数据库连接；SQLite、PostgreSQL、MySQL、SQL Server、Oracle。 | <span class="tag">开源</span>；达梦、人大金仓、OceanBase <span class="tag pro">商业版</span> | 已包含 SQLite |
| [数据库浏览](database-explorer.md) | 只读浏览数据库连接、数据表和字段的接口，供应用做自己的页面。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [文件](file.md) | 上传、存储、预览和下载，文件和业务记录关联。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [模板打印](template-print.md) | 只有技能：教 Agent 在应用里实现按 Office 模板生成文档。 | <span class="tag">开源</span> | 已安装（只有技能） |

## 流程

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [记录生命周期](lifecycle.md)（基础库） | 记录的状态和流转在代码里声明；NocoBase 3 的流程都建在它上面。 | <span class="tag">开源</span> | 已包含 |
| [定时任务](scheduler.md) | 在代码里定义定时任务，记录每次执行；管理员可以查看记录、启用或停用。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [审批](approval.md) | 多级、会签、或签、按票数通过、加签、转交、退回，冻结送审内容。 | <span class="tag pro">商业版</span> | — |
| [任务中心](task-center.md) | 汇总各业务来源的个人待办，自带「任务中心」页面。审批插件依赖它。 | <span class="tag pro">商业版</span> | — |

## 消息

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [通知](notification.md) | 通知的发送、存储、投递和日志。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [站内信](notification-in-app.md) | 站内信渠道和收件箱接口，模板的「收件箱」使用它。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [通知渠道](notification-providers.md) | SMTP、Resend 邮件，飞书、钉钉群机器人。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [Web Push](notification-web-push.md) | 浏览器推送通知。 | <span class="tag">开源</span> | — |
| [邮件](mail.md) | 关联个人邮箱，同步、阅读、回复和发送邮件，往来邮件与业务记录关联。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |

## AI 与 Agent

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [Agents](agents.md) | 业务 Agent：Agent 定义、模型服务、运行和对话，以及运行 Agent 的 Runner。 | <span class="tag">开源</span> | <span class="tag">已安装，未注册</span> |
| [Agent 会话](agent-sessions.md) | 在浏览器里和成员自己电脑上的编码工具对话，对话和它创建的工作保存在应用里。 | <span class="tag">开源</span> | — |
| [知识库](knowledge.md) | 带版本的 Markdown 文档，搜索、修改建议与审核，供人和业务 Agent 使用。 | <span class="tag">开源</span> | <span class="tag">已安装，未注册</span> |

## 界面与运维

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [多语言](i18n.md) | 语言切换，服务端返回的文字跟着切换。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |
| [应用底座](foundation.md) | 「应用底座」页面：应用用到了哪些 Core 能力、由哪些包提供。 | <span class="tag">开源</span> | <span class="tag ok">已启用</span> |

## 研发协作

Studio 的项目、任务和发布建在这两个插件上。

| 插件 | 做什么 | 版本范围 | 默认模板 |
| --- | --- | --- | --- |
| [项目](projects.md) | 项目、任务和协作：状态、优先级、成员、计划和进展。 | <span class="tag">开源</span> | — |
| [发布](releases.md) | 应用、版本、环境和部署，部署方式由可替换的驱动实现。 | <span class="tag">开源</span> | — |

## 自带页面的插件

大多数插件不带页面。带页面的是这几个，注册后页面出现在应用里：

| 插件 | 页面 |
| --- | --- |
| 应用底座 | 「系统设置 › 应用底座」 |
| Agents | Agent、运行环境、技能、用量、模型 |
| Agent 会话 | Agent 会话 |
| 知识库 | 知识库 |
| 项目 | 项目、任务、计划 |
| 发布 | 应用与部署、环境 |
| 用户 | 邀请链接页 |
| 任务中心 <span class="tag pro">商业版</span> | 任务中心 |

登录、「用户管理」「角色与权限」「默认数据范围」「收件箱」这些页面不属于插件，是默认模板写好的应用页面，用的是插件的接口和 UI 组件。

## 基础库、UI 组件库和开发工具

- [基础库](libraries.md)：后台任务、队列、实时更新、存储、密钥、缓存、日志、多语言运行时等。
- [UI 组件库](ui-library.md)：40 多个组件和区块，安装时复制进应用源码。
- [开发工具](tools.md)：创建应用、创建插件、命令行、测试工具、部署安装器、模板。

用过 NocoBase 2 的插件，想知道在 3 里对应什么，见 [从 NocoBase 2 来](../../start/from-v2.md#2-的功能在-3-里对应什么)。
