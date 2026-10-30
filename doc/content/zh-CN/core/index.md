---
title: NocoBase Core
description: 从创建应用开始，按开发任务查阅应用、插件、框架与部署文档。
---

NocoBase Core 提供应用开发的框架能力，插件提供可组合、可扩展的功能。你可以直接编写业务代码，也可以和 Coding Agent 一起，结合 Skills 与示例完成应用。

## 开始使用

1. [认识 NocoBase Core](getting-started/what-is-core.md)：了解 Core、模板、插件和应用的关系。
2. [创建应用](getting-started/create-app.md)：创建项目，启动并登录。
3. [项目结构](getting-started/project-structure.md)：找到页面、接口、数据库、本地包和测试的位置。
4. [搭建第一个应用](tutorials/build-your-first-app.md)：用 Agent 加入任务管理功能，并了解生成的代码。

## 开发应用

围绕项目中的 `client/`、`server/`、`database/`、`cli/`、`packages/` 和 `tests/` 组织业务实现。

- [应用开发概览](developing-apps/overview.md)：理解页面、接口、服务与数据库如何配合。
- [和 Agent 一起开发](developing-apps/develop-with-an-agent.md)：使用项目规则与 Skills，拆分需求并验证结果。
- [客户端页面与导航](developing-apps/pages-routes-and-navigation.md)、[组件与交互](developing-apps/pages-and-interactions.md)：实现页面和用户操作。
- [服务端接口与业务服务](developing-apps/apis-and-services.md)：组织业务逻辑、校验输入并接入权限。
- [建表与数据初始化](developing-apps/data-models-and-migrations.md)、[查询与操作数据](developing-apps/querying-data.md)：实现业务数据的保存和访问。
- [应用配置（config.yml）](developing-apps/configuration-and-settings.md)、[多语言](developing-apps/localization.md)、[主题与样式](developing-apps/themes-and-styles.md)、[测试与验收](developing-apps/testing-and-acceptance.md)：完成应用配置和交付检查。

## 使用插件

从已有能力开始，按插件说明完成安装、注册、配置和业务接入。插件提供的接口、服务、组件与 Skills，可以按业务需要组合使用。

- [插件使用概览](using-plugins/overview.md)：了解如何选择、接入和验证已有插件。
- [管理插件](developing-apps/manage-plugins.md)：管理客户端、服务端和 CLI 的插件入口。
- [插件索引](reference/plugins.md)：查询认证、用户、权限、文件、通知、Agents 等插件的用途和包名。

## 开发插件

将独立扩展组织成插件，定义公开入口与服务契约，接入应用并完成测试与交付。

- [什么时候写插件](extension-development/when-to-write-a-plugin.md)、[创建插件](extension-development/create-plugin.md)、[插件结构](extension-development/plugin-structure.md)：确定边界并准备工作区。
- [编写第一个插件](extension-development/write-your-first-plugin.md)：实现公告接口与页面，完成注册和应用验证。
- [页面与菜单](extension-development/pages-and-menus.md)、[路由与 HTTP 接口](extension-development/server-apis.md)：实现前后端扩展。
- [组件与样式](extension-development/frontend-components.md)：编写并接入 shadcn 组件，按需通过独立 UI Registry 包分发可编辑源码。
- [数据库资源与迁移](extension-development/database-and-migrations.md)、[命令行扩展](extension-development/extend-command-line.md)、[客户端多语言](extension-development/localization.md)：提供插件资源与命令。
- [测试与验证](extension-development/testing-and-verification.md)、[提供 Skills](extension-development/write-plugin-skills.md)、[构建与发布](extension-development/publish-plugin.md)：验证接入方式并交付公开能力。

## 框架

介绍应用与插件共同使用的运行机制和核心包。先通过业务示例完成接入，再按需查阅底层机制。

- [框架概览](framework/overview.md)：了解运行时、核心包与插件功能的关系。
- [运行时](framework/runtime/client.md)、[服务容器](framework/services/container.md)、[ServiceProvider](extension-development/service-provider.md)、[HTTP 与 API](framework/http/routes.md)：理解组装、扩展与调用机制。
- [数据库](framework/database/overview.md)：连接、建模、查询、事务与结构演进。
- [缓存](framework/support/caching.md)、[文件存储](framework/file-storage.md)、[日志](framework/support/logging.md)、[ID 生成](framework/support/ids.md)：复用宿主服务。
- [后台任务](framework/background/jobs.md)、[周期调度](framework/background/scheduling.md)、[消息队列](framework/background/queues.md)、[实时通信](framework/realtime/topics.md)：处理异步工作与页面更新。

## 部署与运维

Core 的部署文档面向独立运行的生产应用。Studio 的开发环境、预览与托管流程见 [Studio 文档](../studio/index.md)。

- [选择部署方式](deployment/choose-a-deployment-method.md)：准备配置、持久化数据和恢复方案。
- [发布应用新版本](deployment/publish-app-release.md)：验证、构建并更新应用版本。
- [使用 Docker 部署](tutorials/deploy-with-docker.md)、[使用 PM2 部署](tutorials/deploy-with-app-installer.md)：选择应用的运行方式，PM2 部署使用 app-installer 安装和更新。
- [升级 NocoBase Core](developing-apps/upgrade-nocobase-core.md)：合并模板变化并验证业务兼容性。

## 参考

按需查询接口、参数、目录与兼容性：

- [API 参考](reference/api.md)：常用公开入口、返回值与数据库专题声明。
- [命令行参考](reference/cli.md)、[配置项参考](reference/configuration.md)：开发与部署命令、配置覆盖顺序和环境变量。
- [项目目录与文件约定](reference/project-conventions.md)：应用、插件、UI 资产与生成文件的维护位置。
- [核心包与工具包索引](reference/packages.md)、[插件索引](reference/plugins.md)：按职责查找包名和默认模板包含情况。
- [数据库支持与版本兼容](reference/compatibility.md)、[常见问题](reference/faq.md)：核对运行环境、数据库差异与常见问题。
