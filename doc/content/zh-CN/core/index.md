---
title: NocoBase Core
description: 创建 NocoBase Core 应用，并按开发、扩展、部署和维护任务查找文档。
---

NocoBase Core 是 AI 开发和运行业务系统的开源应用底座。权限、流程、文件等基础能力现成可用，Agent 在统一架构上只开发企业自己的业务。

从[默认应用模板](https://github.com/nocobase/nocobase/tree/v3-develop/packages/templates/app-template-default)创建项目后，你会得到一个可以运行、修改和部署的应用。项目包含基础能力和配套的 Agent 开发指引。你可以让 Agent 在已有能力上开发业务页面、数据和规则，也可以自行编写代码。

## 开始使用

1. [创建应用](getting-started/create-app.md)：准备环境，使用 Agent 或命令行创建项目，启动并登录。
2. [搭建第一个应用](tutorials/build-your-first-app.md)：和 Agent 一起添加任务管理功能，试用结果并了解关键代码。

需要查找页面、接口、数据和测试的位置时，阅读[项目结构](getting-started/project-structure.md)。

## 开发业务功能

- [和 Agent 一起开发](developing-apps/develop-with-an-agent.md)：描述需求、确认业务规则、检查结果，并维护项目约定。
- [开发应用](developing-apps/overview.md)：按需要查阅页面、接口、业务服务、数据库、配置和测试的开发方法。
- [使用插件](using-plugins/overview.md)：查找已有能力，按插件指南完成配置和业务接入，例如为业务增加权限、附件或通知。

## 扩展与理解 Core

- [开发插件](extension-development/when-to-write-a-plugin.md)：需要独立维护或供多个应用复用时，了解如何把功能组织成插件。
- [框架](framework/overview.md)：需要理解运行机制时，查阅应用运行时、插件接入、服务容器和基础服务。

## 部署与维护

- [选择部署方式](deployment/choose-a-deployment-method.md)：将应用部署到自己的运行环境，准备配置和持久化数据。
- [发布应用新版本](deployment/publish-app-release.md)：完成验证和构建，交付业务更新。
- [升级 NocoBase Core](developing-apps/upgrade-nocobase-core.md)：更新基础能力和模板，在保留业务定制的同时检查兼容性。

## 查阅参考

查找具体用法时，使用[命令行参考](reference/cli.md)、[配置项参考](reference/configuration.md)和 [API 参考](reference/api.md)。环境与数据库要求见[数据库支持与版本兼容](reference/compatibility.md)，遇到问题时先查看[常见问题](reference/faq.md)。
