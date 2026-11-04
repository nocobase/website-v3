---
title: 配置项
description: 查询 Studio 配置字段、环境变量、存储与邮件设置。
---

Studio 的配置写在部署目录的 `config.yml` 里，挂载到容器的 `/app/config.yml`。模板从镜像里取出：

```bash
export STUDIO_IMAGE='<交付的镜像名称与版本>'
docker run --rm --entrypoint cat "$STUDIO_IMAGE" /app/config.example.yml > config.yml
```

以下配置合并到镜像提供的模板中，不要重复添加同名顶层节点。示例中的密码和访问密钥需要替换，配置文件应限制读取权限。

环境变量只覆盖应用已声明支持的字段。Docker Compose 的 `.env` 还需要通过 `environment` 或 `env_file` 传入容器；`config.yml` 不会展开 `${NAME}`。改完配置后，运行 `docker compose up -d --force-recreate studio`，确保挂载文件的改动也被重新读取。

## 文件上传与产物存储

| 内容 | 配置 | 默认位置 |
| --- | --- | --- |
| 上传的附件等文件 | `drive.default` 选择 `drive.disks` 中的磁盘 | `/app/storage` |
| CI 或 Agent 上传的发布产物 | `releases.artifact` | `/app/storage/releases/artifacts` |

本地存储可直接使用，但必须持久化 `/app/storage`。把默认文件磁盘改成对象存储，不会自动改变产物存储。

文件存储支持 `fs`、`s3` 和 `oss`。驱动参数、发布产物配置和迁移说明，见[文件与产物存储](storage.md)。

## 邀请与密码重置邮件

邀请和密码重置共用 `mailers.default` 指定的服务。在 `mailers` 中配置发件信息，支持 `provider: smtp` 和 `provider: resend`。密码重置还需要启用密码登录、设置 `auth.passwordReset.enabled: true` 和正确的 `APP_PUBLIC_ORIGIN`。

配置示例和发送检查，见[邀请邮件](../admin/notifications.md#邀请邮件)。

## 环境变量

| 环境变量 | 说明 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | 浏览器访问 Studio 用的地址，不带路径，例如 `https://studio.example.com`。代码托管平台的回调、邮件里的链接、推送都用它 |
| `SECRETS_KEYS` | 加密密钥，格式 `1:<密钥>`，用 `openssl rand -hex 32` 生成。加密保存的凭据和 API 密钥都靠它，登录会话也由它派生 |
| `INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_PASSWORD` | 第一个管理员，只在第一次启动、还没有任何账号时创建；之后修改不会改变已有的账号 |
| `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`、`DB_SSL` | 数据库连接 |
| `WEB_PUSH_PRIVATE_KEY` | 推送私钥，见 [通知与推送](../admin/notifications.md) |
| `MAILERS_DEFAULT` | 默认发件服务名称，例如 `system` |
| `MAILERS_SYSTEM_PROVIDER` | `mailers.system.provider`，可选 `smtp` 或 `resend` |
| `MAILERS_SYSTEM_HOST`、`MAILERS_SYSTEM_PORT`、`MAILERS_SYSTEM_SECURE` | SMTP 主机、端口（整数）和 TLS 开关（`true` 或 `false`） |
| `MAILERS_SYSTEM_USER`、`MAILERS_SYSTEM_PASSWORD` | SMTP 用户名和密码 |
| `MAILERS_SYSTEM_API_KEY` | Resend API 密钥 |
| `MAILERS_SYSTEM_FROM`、`MAILERS_SYSTEM_REPLY_TO` | 发件地址和回复地址 |
| `MAILERS_SYSTEM_ENABLED` | 启用或停用发件服务（`true` 或 `false`） |
| `API_BODY_LIMIT`、`API_TIMEOUT` | 接口请求体的大小上限、处理超时 |

Studio 的访问路径是 `/main`，例如 `https://studio.example.com/main/`。添加运行环境、登录 `nb-studio` 时用的都是这个带 `/main` 的完整地址。

> [!WARNING] 加密密钥
> 部署后不要再改 `SECRETS_KEYS`：改了，所有人都会被退出登录；丢了，保存的凭据都无法解密。要换密钥，把新密钥以更高的版本号放在最前面（`2:<新密钥>,1:<旧密钥>`），重新加密后再去掉旧的。

## config.yml 的主要设置

| 设置 | 说明 |
| --- | --- |
| `i18n.defaultLocale` | 界面语言，设为团队使用的语言，例如 `zh-CN`；不设置时是英文 |
| `auth.emailAndPassword.disableSignUp` | 设为 `true`，关闭自助注册，成员只能通过邀请加入。模板里没有这一项，请自己加上 |
| `mailers` | SMTP 或 Resend 发件服务；`default` 指定共用的服务名称 |
| `auth.passwordReset.enabled` | 启用找回密码，需要启用密码登录、配置发件服务和对外访问地址 |
| `auth.email.mailer` | 密码重置使用的服务名称，默认使用 `mailers.default` |
| `users.invitations.mailer` | 邀请邮件使用的服务名称，默认使用 `mailers.default` |
| `notification.channels` | 站内通道使用 `type: in-app`。邮件通道使用 `type: email`，可用 `mailer` 指定服务，否则使用 `mailers.default`。通道需单独配置，设置 `mailers` 不会自动创建通道 |
| `push` | 推送通知：`privateKey`、`contact` |
| `database` | 数据库连接，环境变量会覆盖它 |
| `users.initialAdmin` | 第一个管理员，环境变量会覆盖它 |
| `secrets.keys` | 加密密钥，环境变量 `SECRETS_KEYS` 会覆盖它 |
| `logging` | 日志级别、日志文件的保留天数和大小 |
| `studio.git.apiBaseUrls` | 自己部署的 GitHub Enterprise 或 GitLab，接口地址不是默认位置时填写 |
| `studio.agents.queuedExpiryHours` | 工作排队多少小时没有运行环境领取就失败，默认 24；设为 0 一直等待 |
| `agents.runs.retentionDays` | 已结束的运行保留过程记录和提示词的天数，默认 14 |
| `drive` | 附件等文件的存储，默认本地 `storage`，也支持 S3 和 OSS |
| `releases.artifact` | 发布产物存储；独立于默认文件磁盘，需要单独设置 |
| `studio.testing.enabled` | 显示质量管理菜单，也可以使用 `STUDIO_TESTING_ENABLED=true` |

## 部署多个实例

只运行一个 Studio 实例时，不需要 Redis。部署多个实例时，`realtime`（实时消息）和 `jobs`（定时任务）都要改用 Redis，各实例共用同一个命名空间。Redis 要开启持久化，并设置 `maxmemory-policy noeviction`，否则定时任务可能丢失。

## 发布管理

| 设置 | 说明 |
| --- | --- |
| `releases.docker` | 打开 Docker 运行方式：`enabled: true`，以及 Docker 应用的入口地址和端口。见 [托管环境](../admin/environments.md) |
| `releases.host.launchPrefix` | 让运行预览的进程使用另一个系统用户，读不到 Studio 的配置 |
| `studio.releases.previewPublicUrl` | 预览用单独的域名，例如 `https://studio-preview.example.com/{appId}/`，不和 Studio 共用一个地址 |
| `studio.releases.previewEnvironment` | 设为 `false` 时，安装后不自动创建预览环境 |

正式使用时，建议让预览用单独的域名，并让运行预览的进程使用另一个系统用户：预览里运行的是还没合并的代码，不应该能读到 Studio 的配置和密钥。
