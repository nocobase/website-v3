---
title: 框架功能概览
description: 按需了解应用与插件共用的运行时、业务服务、数据访问和运行支持机制。
---

框架功能介绍应用开发和插件开发共用的机制。第一次使用时可以先完成[创建应用](../getting-started/create-app.md)和[第一个功能](../tutorials/build-your-first-feature.md)，遇到具体问题后再查阅相应主题。

## 应用、插件与框架

- **开发应用**围绕当前业务组织页面、接口、数据与测试，说明代码如何接入应用。
- **开发插件**围绕独立扩展组织入口、资源、公开契约与交付，说明应用如何消费插件。
- **框架功能**解释两者共用的机制、使用方式和边界，例如依赖注入、数据库事务与任务执行。

同一项机制在框架功能中集中介绍，应用和插件的开发指南通过实际案例展示接入过程。包名和方法签名属于参考资料，不需要先按 `node_modules/` 中的每个包学习一遍。

## 前后端的业务服务

客户端和服务端都可以定义业务服务，并通过 ServiceProvider 接入各自的服务容器。前后端实例彼此独立；跨端的数据交互通过 API 等通信方式完成。

React Provider 用于组件树中的上下文；ServiceProvider 用于服务注册与生命周期。业务逻辑、服务注册和界面状态应分别明确职责。完整的前后端示例见 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md)。

## 数据库是独立专题

数据库专题围绕 `@nocobase/db` 及相关包展开，覆盖连接与方言、数据结构、Repository、过滤与关联查询、事务、迁移和初始数据。查询输入与构造器放在同一专题中介绍。

需要先完成一个业务场景时，可以从[数据模型与迁移](../developing-apps/data-models-and-migrations.md)和[查询与操作数据](../developing-apps/querying-data.md)入手。插件携带数据资源的方式见[插件数据库与迁移](../extension-development/database-and-migrations.md)。

## 区分框架机制和插件提供的功能

- 文件存储与驱动属于框架机制；文件仓库、上传与访问的业务接入属于文件插件。
- 后台任务、周期调度与队列属于框架机制；任务配置、管理和执行记录属于定时任务插件。
- 邮件发送基础能力属于框架机制；邮件插件的发送与邮箱同步属于插件接入。
- 授权与数据范围的机制属于框架；具体权限管理与规则插件的使用属于插件接入。

需要把已有功能接入业务时，从[使用插件](../using-plugins/overview.md)开始；需要理解或扩展底层机制时，按本栏目的主题查阅。

## 按问题查阅

| 想了解的机制 | 入口 |
| --- | --- |
| 应用如何组装并启动 | [客户端](runtime/client.md)、[服务端](runtime/server.md)、[CLI](runtime/cli.md)、[启动与生命周期](runtime/lifecycle.md) |
| 插件如何扩展运行时 | [插件加载](runtime/plugins.md)、[React Provider](runtime/react-providers.md) |
| 前后端如何组织服务 | [服务容器](services/container.md)、[Token](services/tokens.md)、[客户端服务](services/client-services.md)、[服务端服务](services/server-services.md) |
| 如何声明和调用接口 | [路由](http/routes.md)、[中间件](http/middleware.md)、[校验与响应](http/validation.md)、[Repository 数据接口](http/repository-routes.md)、[API Client](http/api-client.md) |
| 如何建模、查询和更新数据 | [数据库概览](database/overview.md)，包含十二个专题 |
| 如何处理会话、授权和密钥 | [会话](security/sessions.md)、[授权与数据范围](security/authorization.md)、[敏感数据加密](security/secrets.md) |
| 如何安排后台处理 | [Jobs](background/jobs.md)、[周期调度](background/scheduling.md)、[队列](background/queues.md) |
| 如何组织记录状态 | [记录状态与流转](record-lifecycle.md) |
| 如何保存文件和发送邮件 | [文件存储](file-storage.md)、[邮件发送](email.md) |
| 如何通知页面数据变化 | [实时主题](realtime/topics.md)、[WebSocket](realtime/websocket.md) |
| 如何配置和支持运行 | [配置](support/configuration.md)、[多语言](support/localization.md)、[缓存](support/caching.md)、[日志](support/logging.md)、[ID](support/ids.md) |
| 如何处理文档内容 | [文本提取](content/document-extraction.md)、[Markdown 与 Mermaid](content/markdown-mermaid.md) |

## 示例的使用方式

框架示例聚焦单个机制，应用接入仍需注册对应运行时贡献和 Provider。标明“独立使用”的示例自行创建、关闭资源；在应用与插件中应优先复用宿主服务。只声明接口或表结构的片段不代表完成了认证、权限和页面接入。

每篇末尾链接对应版本的公开契约或实现，便于核对已安装包的差异。可运行的完整开发流程见应用与插件指南；参数速查见 [API 参考](../reference/api.md)。
