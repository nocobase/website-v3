---
title: Core 是什么
description: Core 是开发和运行业务系统的开源底座，一组 npm 包。Agent 用它写出你的应用，权限、审批、文件、通知这些能力不用每次重写。
---

让 Agent 从零写一个业务系统，权限、审批、通知、操作记录每次都要重写一遍，结构各不相同，质量难以保证，升级和维护也没有统一的做法。

Core 把每个系统都需要的部分做好，交给 Agent 直接使用。Agent 只写你的业务：供应商档案、采购订单、审批规则、到货登记。底座随 NocoBase 的版本独立升级，业务代码不用跟着重写。

## Core 由什么组成

Core 是一组发布在 npm 上的包。用 Core 开发的应用依赖这些包，就像普通的项目依赖框架和库一样：

| 部分 | 是什么 | 例子 |
| --- | --- | --- |
| 模板 | 创建应用的起点，生成一份完整的代码仓库 | 默认模板、示例模板 |
| 运行时 | 应用的服务端和浏览器端框架 | `app-server`、`app-client` |
| 插件 | 注册进应用的功能包，带来服务端能力、页面、组件、技能或命令 | 认证、权限、文件、通知、定时任务；商业版的审批 |
| 基础库 | 应用直接使用的库，不需要注册 | 数据库、记录生命周期、后台任务、存储 |
| UI 组件库 | 业务组件和区块，安装时复制进应用源码，之后归应用所有 | 数据表格、流程管理、收件箱、审批进度 |
| 技能 | 随包发布、教 Agent 怎样用这个包的说明 | `nocobase-app-development`、每个插件各自的技能 |
| 命令行 | 管理配置、数据库、插件、技能的命令 | `pnpm nocobase config check`、`pnpm nocobase plugin register` |

开源仓库里有 23 个插件、约 30 个基础库和工具包，UI 组件库有 40 多个组件和区块。逐个介绍见 [插件目录](../plugins/index.md)。

## 人、Agent 和 Core 怎样分工

<figure class="map" aria-label="人说清需求和判断结果，Agent 写应用的代码，Core 提供底座">
<div class="row"><div class="box human"><b>你</b><span>说清要什么，回答 Agent 的提问，试用和验收；上线后在「系统设置」里管理用户、权限和流程参数</span></div></div>
<div class="down">需求</div>
<div class="row"><div class="box agent"><b>Agent</b><span>读 Core 的技能，注册需要的插件，写数据表、接口、页面和流程，跑测试</span></div></div>
<div class="down">写进你的代码仓库</div>
<div class="row c2"><div class="box brand"><b>你的应用</b><span>供应商、采购订单、审批规则、到货登记，以及「系统设置」里的管理页面</span></div><div class="box"><b>Core</b><span>登录、用户、权限检查、文件存储、通知发送、流程运行、定时执行、部署工具</span></div></div>
</figure>

以采购应用为例，哪些是现成的、哪些由 Agent 写：

| | 现成的（Core） | Agent 写的（你的应用） |
| --- | --- | --- |
| 登录和用户 | 账号、登录、找回密码、会话；模板备好的「用户管理」页面 | 是否开放注册、登录页的样子 |
| 权限 | 权限模型和检查；模板备好的「角色与权限」页面 | “采购员只看自己的订单”这样的规则 |
| 采购订单 | 数据库访问、迁移、流程运行时、处理历史 | 订单表、订单页面、从提交到到货的流程 |
| 审批 | 审批插件 <span class="tag pro">商业版</span>：多级、会签、加签、转交 | 谁来审批、金额多少需要财务审批 |
| 附件 | 上传、存储、预览 | 订单详情里的附件区，谁能上传 |
| 提醒 | 通知发送、站内信、定时执行 | 每天 9 点提醒审批人处理待审批订单 |

上线以后，管理员可以在应用里调整一部分：给人分配角色、调整数据范围、改审批人和金额阈值、暂停某个定时任务。流程的结构、页面的样子仍然是代码，要改就让 Agent 改，再重新部署。这几层的区别见 [核心概念](concepts.md#四层分工)。

## 应用归你所有

- **代码在你自己的仓库里。** 页面、接口、数据表、流程、管理页面都是应用的源码，可以评审、测试、按版本发布、回退。
- **底座和业务分开。** Agent 只通过插件公开的接口使用它们，不改插件的代码；从 UI 组件库复制进来的组件归应用所有，可以改。
- **底座独立升级。** 升级 NocoBase 时，Agent 对照新版模板合并变化，不会回退你的修改。
- **私有部署。** 应用部署在你自己的服务器上，模型和 Agent 由你选择。

## 13 类底座能力

Core 的能力分为 13 类。默认模板自带的「应用底座」页面也按这 13 类列出应用实际用到了哪些：

| 能力 | 提供什么 |
| --- | --- |
| [数据建模](../capabilities/data.md) | 数据表、字段、关联关系与迁移，多种数据库，外部数据库 |
| [文件管理](../capabilities/files.md) | 上传、存储、预览与附件 |
| [用户与组织](../capabilities/users.md) | 账号、登录、邀请、企业统一身份 |
| [权限控制](../capabilities/permissions.md) | 角色、数据范围、共享规则与限制规则 |
| [工作流与审批](../capabilities/workflows.md) | 记录生命周期、状态流转、审批与定时任务 |
| [AI 与 Agent](../capabilities/ai-agents.md) | 模型服务、业务 Agent 与 Runner |
| [知识库](../capabilities/knowledge.md) | 知识空间、文档与检索 |
| [邮件互通](../capabilities/mail.md) | 邮箱、同步与发信 |
| [消息通知](../capabilities/notifications.md) | 通知渠道、投递与站内信 |
| [外部集成](../capabilities/integrations.md) | API Key 与外部访问 |
| [界面与配置](../capabilities/interface.md) | 页面、导航、多语言与主题 |
| [操作审计](../capabilities/audit.md) | 敏感操作的记录 |
| [基础运维](../capabilities/operations.md) | 迁移、后台任务、队列与密钥 |

## 和 Studio、Solutions 的关系

- **只用 Core**：你在应用目录里打开 Claude Code、Codex 等编码工具，和 Agent 一起开发，测试、部署、备份由团队自己组织。
- **用 Studio**：Studio 把团队的 Agent 组成 Agent 团队，按同一套流程开发、检查、评审、验收和发布。Studio 新建项目用的就是 Core 的默认模板，开发出来的应用同样建在 Core 上。见 [Studio 是什么](../../studio/intro/what-is-studio.md)。
- **Solutions**：NocoCRM 等官方应用也建在 Core 上，可以直接部署使用，也可以让 Agent 按你的业务继续改。

## 开源与商业

Core 的绝大部分包开源。目前在商业版中提供的有审批、任务中心，以及达梦、人大金仓、OceanBase 的数据库支持。插件目录里每个插件都标明了版本范围，详见 [开源与商业](../../start/editions.md)。

下一篇 [一个应用怎样做出来](how-an-app-gets-built.md)，用采购应用把这些串起来。
