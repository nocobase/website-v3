---
title: 认识 NocoBase Core
description: Core 是 AI 开发和运行业务系统的开源应用底座。基础能力现成可用，项目结构和写法统一，Agent 只开发你自己的业务。
---

用 Core 创建的应用，一开始就能启动和登录，用户、角色和权限都已就绪。接下来你向 Agent 描述业务，例如“记录供应商和采购订单，订单提交后通知采购经理，供应商资料只有采购部能改”。Agent 只写供应商表、订单表、相关页面和这两条规则；登录、角色与数据范围、通知的发送和投递，直接用 Core 现成的。

## 基础能力现成可用

权限、数据范围、文件、通知、后台任务这类模块，即使交给 AI 从零写，也要处理大量边界情况，之后还要一直维护。Core 提供现成的实现，由 NocoBase 持续维护和升级。Agent 只写业务部分，你要检查的代码也少得多。

| 类别 | 包括 | 文档 |
| --- | --- | --- |
| 用户与权限 | 登录与会话、用户管理、API 密钥；页面和操作的授权，默认数据范围、共享规则、限制规则 | [身份认证](../using-plugins/authentication/sign-in.md)、[权限管理](../using-plugins/authorization/permissions.md) |
| 数据与文件 | 数据表、字段、关联和迁移，支持 SQLite、PostgreSQL、MySQL 等数据库；数据库浏览；文件上传、存储和访问 | [数据库](../framework/database/overview.md)、[文件](../using-plugins/data-and-files/file-management.md) |
| 流程与任务 | 记录生命周期（状态与流转在代码里声明）、定时任务、后台任务与队列；审批（商业版） | [定时任务](../using-plugins/automation/scheduler.md)、[后台任务](../framework/background/jobs.md)、[审批](../using-plugins/collaboration/approval.md) |
| 消息 | 通知与投递日志、站内信、邮件和群机器人渠道、浏览器推送；邮箱收发与同步 | [通知](../using-plugins/notifications/notification.md)、[邮件](../using-plugins/notifications/mail.md) |
| AI 与 Agent | 在应用里按权限处理业务的业务 Agent；供人和 Agent 使用的知识库 | [Agents](../using-plugins/agents-and-knowledge/agents.md)、[知识库](../using-plugins/agents-and-knowledge/knowledge.md) |
| 界面与运行 | UI 组件库、多语言、缓存、日志、实时通信 | [组件与交互](../developing-apps/pages-and-interactions.md)、[多语言](../using-plugins/application-support/i18n.md) |

这些能力有两种形式。**插件**（`@nocobase/app-plugin-*`）注册进应用后生效，可能带来页面、组件、技能或命令；**基础库**（例如数据库 `@nocobase/db`、记录生命周期 `@nocobase/lifecycle`）由应用直接引用。默认模板已经装好常用插件，其余的用 `pnpm nocobase plugin register` 注册。应用运行后，打开「系统设置 › 应用底座」可以看到它实际用到了哪些能力。完整清单见[插件索引](../reference/plugins.md)和[核心包与工具包索引](../reference/packages.md)。

## 统一的项目结构和写法

换一个人、一个模型，甚至开一个新会话，AI 都可能换一种写法，同一个系统里渐渐出现好几种风格。Core 的应用从同一个模板开始，每类代码都有固定位置：

```text
my-app/
├── AGENTS.md      # Agent 的开发指引入口
├── .agents/       # 项目规则和技能
├── client/        # 页面和交互
├── server/        # 接口和业务服务
├── database/      # 迁移和初始数据
├── tests/         # 测试
├── packages/      # 本地插件和共享包（可选）
├── config.yml     # 当前环境的配置，不进代码仓库
└── package.json   # Core 的包和插件依赖
```

`AGENTS.md` 和技能写明业务代码放在哪里、哪些直接用现成能力、迁移和权限怎么写。技能随 Core 的包发布，安装依赖时同步到 `.agents/skills/`，内容和已安装的版本配套。Claude Code、Codex 等编码工具读到的是同一套写法，换人、换模型也不变。各目录的详细说明见[项目结构](project-structure.md)。

## 怎样开发

在应用目录里打开 Claude Code、Codex 等编码工具，和 Agent 一起开发：

1. 说明业务需求、谁来用、怎样算完成。
2. Agent 按项目指引和技能编写迁移、接口、页面、权限和测试，并运行测试。
3. 你在浏览器里试用。不满意就接着描述，直到符合预期。
4. 提交代码，按团队的流程评审，再部署。

方法和检查要点见[和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)。不用 Agent 也可以：框架、组件和命令行是同一套，两种方式可以在一个项目里混用。[创建应用](create-app.md)介绍了两种创建方式；[搭建第一个应用](../tutorials/build-your-first-app.md)带你用 Agent 完成第一个功能，并了解生成的代码。

应用上线后，用户、角色和数据范围由管理员在「系统设置」里调整；页面、数据表和业务规则的变化都通过代码完成，测试通过后重新部署。NocoBase 发布新版本时，对照新模板合并变化，见[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)。

## 开源，归你所有

- **开源免费。** Core 可以直接用于生产。
- **私有部署。** 代码在你自己的仓库里，应用和数据在你自己的服务器上，可以用 Docker 或 PM2 部署，见[选择部署方式](../deployment/choose-a-deployment-method.md)。
- **不绑定厂商。** 编码工具和模型自由选择，Claude Code、Codex 等都可以。

## Core、Studio 和 Solution

只用 Core，就能开发和上线完整的业务应用，学习这部分文档也只需要 Core。

- 团队同时推进多个项目和大量任务时，可以用 **NocoBase Studio**（商业版）统一调度 Agent 团队，组织评审和验收。见 [Studio 是什么](../../studio/intro/what-is-studio.md)。
- 想从现成的业务应用开始，可以用 **NocoBase Solution**，例如 NocoCRM、NocoITAM。它们同样建在 Core 上，可以直接使用，也可以继续定制。

怎样选择，见[只用 Core，还是用 Studio](../../start/what-is-nocobase.md#只用-core还是用-studio)。

## 开始

需要 Node.js 24 或更高版本和 pnpm 11；Windows 用户在 WSL 中操作。和 Agent 一起开发时，还需要一个支持技能的编码工具。

1. [创建应用](create-app.md)：创建项目，启动并登录。
2. [项目结构](project-structure.md)：了解每类代码放在哪里。
3. [搭建第一个应用](../tutorials/build-your-first-app.md)：用 Agent 加入任务管理功能，再了解数据、接口和页面的关键代码。
