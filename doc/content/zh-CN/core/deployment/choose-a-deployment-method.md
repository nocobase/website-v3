---
title: 部署概览
description: 准备部署条件，与 Agent 选择 Docker 或 PM2，确认数据计划并验收部署结果。
---

## 部署前需要准备什么

<a id="部署前准备什么"></a>

准备已通过测试的应用源码、锁文件和要发布的提交。Agent 需要读取应用的 `AGENTS.md` 和同步后的 `nocobase-deployment` Skill；在应用目录安装依赖会同步 Skills，缺失时执行 `pnpm nocobase skills sync`。

提供服务器访问权限、操作系统与 CPU、可写目录、空闲端口和用户访问地址。域名、HTTPS、反向代理以及数据库和文件存储账号需要提前落实。密码通过安全输入或环境变量提供，不写进提示词和仓库。

以下指南使用模板 beta.85 的[商品目录示例](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md)说明命令，示例选择 Linux x64/glibc、Node.js 24、单实例 SQLite；自己的应用按实际驱动和平台构建。

## 让 Agent 帮你选择部署方式

<a id="如何选择"></a>

在应用源码目录告诉 Agent 现有环境和运维习惯：

```prompt
把这个应用部署到我的服务器。服务器是 <系统和 CPU>，访问地址是 <URL>，目前使用 <已有的容器或进程管理方式>。请比较 Docker 和 PM2 的维护要求，先给我推荐方案及需要补充的条件。
```

| 方式 | 需要管理什么 | 操作指南 |
| --- | --- | --- |
| Docker | 镜像、Compose、配置及数据挂载 | [使用 Docker 部署](../tutorials/deploy-with-docker.md) |
| PM2 | Node.js、服务账号和进程；app-installer 管理安装与更新 | [使用 PM2 部署](../tutorials/deploy-with-app-installer.md) |

## 明确部署目标与数据保留要求

<a id="首次部署与发布新版本"></a>

确认是首次安装、更新还是迁移，写明唯一的服务器、应用目录和目标版本。首次使用空数据库与迁入已有数据是不同操作。

构建产物携带代码、依赖、迁移和必需初始化逻辑，不携带开发数据库、上传文件、用户配置的角色或运行密钥。决定数据库与文件的保存位置、要迁入的数据、备份时间点和允许丢失的数据范围。更新沿用现有数据和密钥，不重新初始化。

## 部署完成后需要确认什么

<a id="发布后检查与恢复"></a>

从实际访问地址检查登录、页面刷新、静态资源和主要业务读写；普通用户的权限应符合预期。使用文件或 WebSocket 的功能也要实际操作。

重启进程或重建容器后，核对同一条记录、文件和权限。让 Agent 提供版本及产物摘要、数据位置、验证结果和未完成事项。健康检查通过后仍需完成这些操作。

后续发布见[更新与恢复](publish-app-release.md)，运行检查见[日常维护与排错](maintenance-and-troubleshooting.md)。框架依赖变更先在开发环境完成[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)，再发布应用。
