---
title: 配置项
description: Studio 的 config.yml 和环境变量：访问地址、加密密钥、初始管理员、数据库、语言和登录、邮件和推送、多实例、发布管理、日志。
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

| 用途 | 发件配置 | 密码环境变量 |
| --- | --- | --- |
| 邀请成员 | `notification.channels.system-email`，使用 `type: smtp` | `SMTP_PASSWORD` |
| 重置密码 | `auth.email`，使用 `provider: smtp` | `AUTH_EMAIL_PASSWORD` |

`auth.passwordReset.emailChannel` 是旧的兼容字段。新配置使用 `auth.email`，邀请邮件继续使用通知通道。

两者可以使用同一个 SMTP 账号，但需要分别配置。密码重置还需要 `auth.passwordReset.enabled: true` 和正确的 `APP_PUBLIC_ORIGIN`。

完整示例、Compose 环境变量传入方式和旧配置迁移，见[通知与邮件](../admin/notifications.md#邀请邮件)。邀请成员前确认邀请邮件可达，并用测试账号验证「忘记密码」。

## 环境变量

| 环境变量 | 说明 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | 浏览器访问 Studio 用的地址，不带路径，例如 `https://studio.example.com`。代码托管平台的回调、邮件里的链接、推送都用它 |
| `SECRETS_KEYS` | 加密密钥，格式 `1:<密钥>`，用 `openssl rand -hex 32` 生成。加密保存的凭据和 API 密钥都靠它，登录会话也由它派生 |
| `INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_PASSWORD` | 第一个管理员，只在第一次启动、还没有任何账号时创建；之后修改不会改变已有的账号 |
| `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`、`DB_SSL` | 数据库连接 |
| `WEB_PUSH_PRIVATE_KEY` | 推送私钥，见 [通知与推送](../admin/notifications.md) |
| `SMTP_PASSWORD`、`RESEND_API_KEY` | `system-email` 通知通道的密码或密钥，用于邀请邮件 |
| `AUTH_EMAIL_PASSWORD`、`AUTH_EMAIL_API_KEY` | 独立身份验证邮件的密码或密钥，用于密码重置 |
| `AUTH_EMAIL_PROVIDER`、`AUTH_EMAIL_HOST`、`AUTH_EMAIL_PORT`、`AUTH_EMAIL_SECURE`、`AUTH_EMAIL_USER`、`AUTH_EMAIL_FROM`、`AUTH_EMAIL_REPLY_TO` | 覆盖 `auth.email` 中对应的发件设置 |
| `API_BODY_LIMIT`、`API_TIMEOUT` | 接口请求体的大小上限、处理超时 |

Studio 的访问路径是 `/main`，例如 `https://studio.example.com/main/`。添加运行环境、登录 `nb-studio` 时用的都是这个带 `/main` 的完整地址。

> [!WARNING] 加密密钥
> 部署后不要再改 `SECRETS_KEYS`：改了，所有人都会被退出登录；丢了，保存的凭据都无法解密。要换密钥，把新密钥以更高的版本号放在最前面（`2:<新密钥>,1:<旧密钥>`），重新加密后再去掉旧的。

## config.yml 的主要设置

| 设置 | 说明 |
| --- | --- |
| `i18n.defaultLocale` | 界面语言，设为团队使用的语言，例如 `zh-CN`；不设置时是英文 |
| `auth.emailAndPassword.disableSignUp` | 设为 `true`，关闭自助注册，成员只能通过邀请加入。模板里没有这一项，请自己加上 |
| `auth.passwordReset.enabled` | 是否启用内置找回密码，需要有效的 `auth.email` 和对外访问地址 |
| `auth.email` | 密码重置的独立发件方式，使用 `provider: smtp` 或 `provider: resend` |
| `users.invitations.emailChannel` | 邀请邮件使用的通知通道，默认 `system-email` |
| `notification.channels` | 提醒的通道：站内（`inbox`）、邮件（`system-email`，SMTP 或 Resend）等，见 [通知与推送](../admin/notifications.md) |
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
