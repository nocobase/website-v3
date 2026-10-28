---
title: 核心包与工具包索引
description: 按职责查找 NocoBase Core 的运行时、基础库、数据库方言和开发工具。
---

本页用于从功能找到包名和公开源码。它是包索引，不是每个应用都需要安装的依赖清单；应用实际依赖以 `package.json` 和锁文件为准。插件清单见[插件索引](plugins.md)，常用接口见 [API 参考](api.md)。

## 怎样使用这个索引

- 在应用中优先使用模板已经接入的运行时和服务。
- 导入包根入口或 `package.json` 中声明的公开子路径，不引用依赖的 `src/`、`dist/` 私有文件。
- 服务端库进入服务端代码；客户端只能使用声明支持浏览器的入口。
- 插件提供运行时扩展，UI Registry 提供安装到使用方的可编辑源码，两者分别管理依赖和更新。

## 应用运行时

| 包 | 用途 |
| --- | --- |
| [`@nocobase/app-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client) | 客户端应用、路由、服务与 React 扩展 |
| [`@nocobase/app-server`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server) | 服务端应用、HTTP、配置与资源接入 |
| [`@nocobase/app-cli`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli) | 应用命令，以及开发和构建工具 |
| [`@nocobase/app-websocket`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket) | WebSocket 契约与 Node 服务端适配 |

## 核心基础库

| 包 | 用途 |
| --- | --- |
| [`@nocobase/api-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client) | HTTP 请求、流式响应与远程 Repository |
| [`@nocobase/authorization`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/authorization) | 授权、权限集与数据范围 |
| [`@nocobase/caching`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching) | 缓存接口与适配 |
| [`@nocobase/config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/config) | 配置源、解析器与配置合并 |
| [`@nocobase/db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db) | 数据模型、查询、迁移、事务与数据库扩展 |
| [`@nocobase/drive`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive) | 文件存储与存储驱动 |
| [`@nocobase/i18n`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/i18n) | 前后端多语言运行机制 |
| [`@nocobase/jobs`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs) | 后台任务与周期调度 |
| [`@nocobase/lifecycle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle) | 记录状态、流转与提交后的业务效果 |
| [`@nocobase/logging`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging) | 日志接口、格式与输出 |
| [`@nocobase/mailer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/mailer) | SMTP、Resend 等邮件发送基础能力 |
| [`@nocobase/queue`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue) | 队列、生产者与消费者 |
| [`@nocobase/realtime`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime) | 实时消息、客户端订阅与服务端主题授权 |
| [`@nocobase/repository-input`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input) | 可在浏览器和服务端使用的查询输入契约与构造器 |
| [`@nocobase/secrets`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/secrets) | 版本化密钥与敏感数据加密 |
| [`@nocobase/service-provider`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider) | 服务容器、Token、依赖注入与生命周期 |
| [`@nocobase/session`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session) | 会话与会话存储 |
| [`@nocobase/snowflake`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake) | Snowflake ID 生成 |
| [`@nocobase/document-extractor`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/document-extractor) | 隔离执行的文档文本提取 |
| [`@nocobase/markdown-mermaid`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/markdown-mermaid) | 在 React Markdown 中渲染 Mermaid 图表 |

## 数据库方言

| 包 | 用途 |
| --- | --- |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-sqlite) | SQLite |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-postgres) | PostgreSQL |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql) | MySQL 与 MariaDB |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mssql) | Microsoft SQL Server |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-oracle) | Oracle Database |

商业方言包括 `@nocobase/db-dameng`、`@nocobase/db-kingbase` 和 `@nocobase/db-oceanbase`。连接方式、数据库模式与版本核对见[数据库支持与版本兼容](compatibility.md)。

## Agent 与远程命令配套包

| 包 | 用途 |
| --- | --- |
| [`@nocobase/acp-bridge`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/acp-bridge) | 通过 ACP 连接本地编码 Agent |
| [`@nocobase/agent-protocol`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/agent-protocol) | 应用、Runner 与远程 CLI 的通信协议 |
| [`@nocobase/agent-runner`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/agent-runner) | 连接应用并领取、执行 Agent 任务 |
| [`@nocobase/app-cli-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli-client) | 登录应用并调用应用公开的远程业务命令 |
| [`@nocobase/cli-envelope`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/cli-envelope) | CLI JSON 输出契约与 Node 版本检查 |

## 开发与测试工具

| 包 | 用途 |
| --- | --- |
| [`@nocobase/app-skills`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-skills) | 应用开发、升级、部署与插件开发 Skills |
| [`@nocobase/app-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-testing) | 应用与插件的测试辅助工具 |
| [`@nocobase/db-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testing) | 隔离数据库环境与可跨方言运行的测试辅助工具 |
| [`@nocobase/db-testkit`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testkit) | 数据库方言共用的集成测试契约 |
| [`@nocobase/dev-config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/dev-config) | TypeScript、ESLint、Vitest、Vite 等共享配置 |
| [`@nocobase/create-app`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-app) | 创建应用的脚手架 |
| [`@nocobase/create-plugin`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-plugin) | 创建插件的脚手架 |

## 部署与托管工具

| 包 | 用途 |
| --- | --- |
| [`@nocobase/app-installer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-installer) | 从部署归档安装、升级与回滚应用 |
| [`@nocobase/app-host`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host) | 应用运行托管 |
| [`@nocobase/app-host-docker`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host-docker) | App Host 的 Docker 托管后端 |

## 安装与版本

使用项目锁文件复现依赖；升级时同时检查模板、运行时、插件的 peer dependencies 和数据库方言。各包独立编号，版本号不要求相同，不能根据包版本的主版本号判断它属于 NocoBase 2 还是 3。

创建项目使用 `pnpm create @nocobase/app@beta`，创建插件使用 `pnpm create @nocobase/plugin@beta`；它们对应的实现包分别是 `@nocobase/create-app` 与 `@nocobase/create-plugin`。应用内命令见[命令行参考](cli.md)。

## 核对范围

包名、位置与职责按 [Core 源码修订 `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages) 核对于 2026-10-27。这里不把某个 beta 版本描述为永久兼容基线，安装后的公开入口与类型声明决定可用接口。
