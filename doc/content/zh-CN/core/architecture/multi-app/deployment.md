---
title: 部署与运维
description: 在普通应用部署流程上配置多应用托管环境，分别发布主子应用并保留平台状态。
---

Main 和子应用沿用[普通应用的部署方式](../../deployment/choose-a-deployment-method.md)。服务器准备、配置初始化、进程管理及版本更新见 [Docker 部署](../../tutorials/deploy-with-docker.md)或 [PM2 部署](../../tutorials/deploy-with-app-installer.md)，本篇补充多应用的部署分工与托管要求。

## 选择部署方式与准备环境

| 部署对象 | 部署方式 |
| --- | --- |
| Main | 按普通应用部署；需要托管实例时，额外配置 Releases 与 App Host |
| 托管子应用 | 发布部署归档，由 App Host 创建和管理实例 |
| 独立子应用 | 按普通应用部署，再登记平台入口 |

三者分别发布。更新 Main 不会发布子应用，发布子应用版本也不会自动升级实例。构建环境需要具备[商业包下载权限](overview.md#使用前提)，含商业依赖的制品保存在受控存储中。

## 构建部署归档

构建方法和目标平台参数见[构建部署包](../../tutorials/deploy-with-app-installer.md#构建部署包)。在多应用工作区中，需要分别选择应用：

| 应用 | 从工作区根目录执行 | 输出归档 |
| --- | --- | --- |
| Main | `pnpm build --tar` | `storage/exports/dist.tar.gz` |
| 默认 Sub | `pnpm --dir=apps/sub build --tar` | `apps/sub/storage/exports/dist.tar.gz` |

按目标运行环境补充构建参数。独立仓库的子应用在自己的目录中构建，不需要放入 Main 的源码树。

使用模板的 Dockerfile 从源码构建时，以工作区根目录作为上下文，Main 设置 `APP_DIR=.`，Sub 设置 `APP_DIR=apps/sub`。商业下载凭据通过 BuildKit 的 `npmrc` secret 提供，不复制到镜像中；其余镜像构建和部署步骤沿用 Docker 指南。

## 部署主应用

按所选 Docker 或 PM2 指南部署 Main，再配置托管环境：

- 显式启用 Releases 与 App Host，设置部署环境和实例公开地址规则。
- 反向代理除 Main 路径外，还需转发托管实例的路径，并支持 WebSocket。Host 内部控制端口不对外暴露。
- 使用平台统一登录时，配置[可信 HTTPS 与客户端回调](single-sign-on.md#为子应用接入统一登录)。普通部署指南中的 HTTP 示例不能直接用于平台 SSO。

模板本地辅助命令默认使用 Main 端口 `13230` 和 Host 端口 `13231`；生产监听地址与端口按部署环境设置。启动 Main 后，创建一个实例确认托管环境可用。

生产进程使用 Docker 或 PM2 管理，不依赖源码中的 `pnpm demo`。本地体验的配置和初始化命令见[快速开始](quickstart.md)。

## 发布托管子应用

将子应用归档[发布为模板版本](management.md#创建模板并发布版本)，再创建实例或升级指定实例。每个实例使用自己的配置、持久数据和登录客户端，客户端密钥不写入共用归档。

发布、创建和升级是明确的管理操作，不放在 Main 的普通启动过程中。操作完成后检查实例的实际版本和运行状态，再[授予访问资格](single-sign-on.md#授予应用访问资格)。

## 独立部署子应用

独立子应用完全沿用普通 Docker 或 PM2 部署流程，运行后按[接入独立应用](external-apps.md)登记入口和可选的统一登录。

后续更新按[发布应用新版本](../../deployment/publish-app-release.md)执行。平台停用入口或修改成员资格，不会停止、升级或删除这个独立部署。

## 配置持久化与恢复运行

除普通应用的数据库、附件、配置和密钥外，Main 的托管环境还需保留以下内容。路径相对于 Main 的应用根目录，实际以配置为准：

| 内容 | 示例路径 |
| --- | --- |
| 上传的部署制品 | `storage/artifacts/` |
| Releases 状态 | `storage/releases/` |
| Host 实例代码 | `storage/host/revisions/<appId>/<checksum>/` |
| Host 实例数据与私有配置 | `storage/host/volumes/<appId>/` |

升级 Main 或重建容器时，不能将实例数据目录当作缓存清理。应用进程的停止和恢复沿用部署指南；平台恢复运行后，还需核对实例版本、成员关系和原有启停状态，不重新初始化实例。

更换平台域名或挂载路径时，还需处理已保存的环境地址、客户端回调、独立入口和[身份绑定](migration.md#保留用户身份与业务权限)，不是只修改 Main 的访问地址。

## 备份与恢复数据

数据库、文件和配置的备份方法见 [Docker 的备份步骤](../../tutorials/deploy-with-docker.md#检查版本变更并备份)或 [PM2 的备份范围](../../tutorials/deploy-with-app-installer.md#确认备份范围)。

多应用还需将 Main 的应用目录、身份数据、部署状态、制品与相关实例的数据纳入恢复方案，保证恢复后它们相互对应。不要假定只备份 Main 的数据库，或安装器自动备份一次，就覆盖了所有子应用与外部存储。

恢复平台后核对每个实例的版本、访问资格和启停状态。实例的归档与恢复归档不是数据备份与恢复；独立接入应用的备份仍由其部署负责人管理。

## 常见问题排查

| 多应用相关现象 | 检查位置 |
| --- | --- |
| Main 可访问，托管实例不可访问 | Host 环境、实例路径的代理规则，以及[部署操作结果](management.md#处理失败或未完成的操作) |
| 发布版本后实例仍运行旧版 | 是否已对该实例发起并完成[升级操作](management.md#升级指定实例) |
| 平台登录失败或工作台没有入口 | [登录配置、成员资格与实例状态](single-sign-on.md) |
| 停用外部入口后原网站仍可访问 | [独立接入的停用边界](external-apps.md#停用或更换应用入口) |

进程启动、端口、文件权限和容器健康检查等通用问题，见 [Docker 常见问题](../../tutorials/deploy-with-docker.md#常见问题)或 [PM2 常见问题](../../tutorials/deploy-with-app-installer.md#常见问题)。
