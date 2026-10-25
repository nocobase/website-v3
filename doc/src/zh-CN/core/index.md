---
title: NocoBase Core
description: 创建应用，认识项目结构，并通过一个任务应用逐步学习开发。
---

从一个可运行的项目开始，用 NocoBase Core 开发自己的业务应用。你可以和 Coding Agent 一起完成，也可以按步骤手动编写。

## 开始使用

1. [Core 是什么](getting-started/what-is-core.md)：了解 Core、模板、插件和应用的关系。
2. [创建应用](getting-started/create-app.md)：创建应用，启动并登录。
3. [项目结构](getting-started/project-structure.md)：找到页面、接口、数据库和测试的位置。
4. [搭建第一个应用](tutorials/build-your-first-feature.md)：使用 Agent 或手动实现完整的团队任务应用，完成测试后选择部署方式。

## 开发应用

按主题查阅应用开发的约定和用法；需要运行示例时，再准备对应的数据与接口。

- [应用开发概览](developing-apps/overview.md)：理解应用、模板与插件，以及页面到数据库的完整路径。
- [和 Agent 一起开发](developing-apps/develop-with-an-agent.md)：描述需求、使用项目指引并验证结果。
- [数据模型与迁移](developing-apps/data-models-and-migrations.md)：设计字段、关系与约束，保留旧数据。
- [查询与操作数据](developing-apps/querying-data.md)：使用 Repository、分页、关联、事务与 Query。
- [业务服务与 HTTP 接口](developing-apps/apis-and-services.md)：组织服务、校验输入、接入权限并声明 API。
- [页面、路由与导航](developing-apps/pages-routes-and-navigation.md)：注册页面与菜单，组织子路由和访问条件。
- [UI 组件与交互](developing-apps/pages-and-interactions.md)：处理列表、表单、弹窗和操作反馈。
- [应用配置与系统设置](developing-apps/configuration-and-settings.md)：区分运行配置和业务设置，接入管理页面。
- [多语言与主题](developing-apps/localization-and-themes.md)：组织文案、语言资源和统一的主题样式。
- [管理插件](developing-apps/manage-plugins.md)：使用已有能力，管理注册、更新、移除与扩展。
- [测试与验收](developing-apps/testing-and-acceptance.md)：选择测试层次，验证真实数据、权限和用户流程。

## 部署与运维

- [选择部署方式](deployment/choose-a-deployment-method.md)：比较运行方式，准备配置、数据和恢复方案。
- [使用 Docker 部署](tutorials/deploy-with-docker.md)：构建镜像，用容器和持久化挂载运行应用。
- [使用 app-installer 部署](tutorials/deploy-with-app-installer.md)：管理服务器安装、进程和应用更新。
- [部署到 Studio](tutorials/deploy-to-studio.md)：通过 Studio 管理应用、环境和发布。
- [升级 NocoBase Core](developing-apps/upgrade-nocobase-core.md)：使用 Agent 或手动合并新模板，验证兼容性并发布升级后的应用。
- [发布应用新版本](deployment/publish-app-release.md)：重新构建并部署，了解三种部署方式更新时的差别。
