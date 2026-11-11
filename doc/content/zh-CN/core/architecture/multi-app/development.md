---
title: 应用开发
description: 在多应用项目中选择开发位置，分别运行主子应用，并将子应用接入平台。
---

Main 和子应用都是普通的 NocoBase 3 应用。页面、API、数据库和测试沿用[应用开发](../../developing-apps/overview.md)的方式；这里只说明多个应用一起开发时的区别。

## 项目结构与开发位置

| 要开发的内容 | 工作目录 |
| --- | --- |
| 平台工作台和管理功能 | 项目根目录，即 Main |
| 默认子应用的业务功能 | `apps/sub/` |
| 独立仓库的子应用 | 该应用自己的根目录 |

每个应用内部采用相同的[项目结构](../../developing-apps/project-structure.md)。多应用工作区共享依赖安装和锁文件，但各应用分别拥有配置、数据库、存储和构建输出。

业务代码放在所属应用中，不通过相对路径导入另一应用的组件或服务。跨应用业务交互使用 API，由接收请求的应用检查权限。

## 配置并启动本地开发环境

配置方式见[应用配置](../../developing-apps/configuration-and-settings.md)。开发业务时可先使用本地账号；平台登录和托管实例的环境按[快速开始](quickstart.md)准备。

新建多应用项目可在根目录执行以下本地配置命令：

```bash
pnpm setup:local
pnpm --dir=apps/sub nocobase config init
pnpm --dir=apps/sub nocobase config set server.port=13232 app.publicOrigin=http://127.0.0.1:13232
```

Main 的辅助命令使用 HTTP 本地账号模式并关闭托管 Host，不要在需要保留的 HTTPS 配置上执行。默认使用 SQLite；其他数据库按[数据库配置](../../reference/database-configuration.md)为每个应用分别准备。首次运行前设置各应用管理员密码，分别执行配置检查：

```bash
pnpm nocobase config check
pnpm --dir=apps/sub nocobase config check
```

在两个终端中，从项目根目录分别启动：

```bash
# Main
APP_SERVER_PORT=13230 pnpm dev
```

```bash
# Sub
APP_SERVER_PORT=13232 APP_VITE_DEV_PORT=5174 pnpm --dir=apps/sub dev
```

使用各进程打印的 `Local:` 地址。修改 Sub 源码只更新本地开发进程，不会热更新平台中已部署的实例。

## 使用 Coding Agent 开发业务功能

在上表对应的应用目录中打开 Coding Agent，按[提出业务需求与持续迭代](../../../getting-started/develop-your-first-app.md#提出第一个业务需求)开发即可。修改 Main 与修改 Sub 的区别是工作目录，不是另一套开发流程。

各应用拥有自己的开发指引。需要重新同步时，在多应用项目根目录运行 `pnpm skills:sync`，同时更新 Main 和 Sub；独立仓库使用标准的 `pnpm nocobase skills sync`。指引文件的维护方式见[Agent 读取哪些指引](../../developing-apps/project-structure.md#agent-读取哪些指引)。

按[测试指南](../../developing-apps/testing-and-acceptance.md)验证修改的应用。涉及平台登录或跨应用调用时，再检查相关应用之间的集成行为。

## 开发新的子应用

按[普通应用的创建方式](../../../getting-started/develop-your-first-app.md#创建并启动应用)开发新子应用，可以保留独立仓库，不必迁入 Main 的工作区。

需要平台登录时，接入 `@nocobase/app-plugin-platform-sso`，并将平台访问角色映射到自己的业务权限，见[统一登录与访问授权](single-sign-on.md)。默认 `apps/sub/` 已完成接入，其试剂管理角色仅适用于该示例业务。

应用页面使用应用内路径和运行时 URL，不写死某个托管实例的路径。已有业务系统接入平台时，改走[从单应用迁移](migration.md)，保留原用户和数据。

## 构建并交付子应用

子应用独立构建和发布，Main 不需要导入它的源码。两种交付方式分别为：

| 方式 | 操作 |
| --- | --- |
| 平台托管 | [构建子应用归档](deployment.md#构建部署归档)，[发布模板版本](management.md#创建模板并发布版本)，再创建或升级指定实例 |
| 独立部署 | 按[普通应用部署方式](../../deployment/choose-a-deployment-method.md)部署，再[接入平台](external-apps.md) |

发布版本不会自动升级已有实例。框架依赖升级仍按[升级 NocoBase Core](../../developing-apps/upgrade-nocobase-core.md)处理，与平台中的实例版本发布分开。
