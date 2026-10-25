---
title: 配置项
description: Studio 的 config.yml 和环境变量：访问地址、加密密钥、初始管理员、数据库、语言和登录、邮件和推送、多实例、发布管理、日志。
---

Studio 的配置写在部署目录的 `config.yml` 里，挂载到容器的 `/app/config.yml`。模板从镜像里取出：

```bash
docker run --rm --entrypoint cat pkg-v3.nocobase.com/nocobase/studio:<版本号> /app/config.example.yml > config.yml
```

一部分配置也可以用环境变量提供，环境变量优先。密码和密钥建议用环境变量，写在权限为 600 的 `.env` 里，不写进 `config.yml`。改了配置后，重启 Studio 生效：`docker compose up -d`。

## 环境变量

| 环境变量 | 说明 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | 浏览器访问 Studio 用的地址，不带路径，例如 `https://studio.example.com`。代码托管平台的回调、邮件里的链接、推送都用它 |
| `SECRETS_KEYS` | 加密密钥，格式 `1:<密钥>`，用 `openssl rand -hex 32` 生成。加密保存的凭据和 API 密钥都靠它，登录会话也由它派生 |
| `INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_PASSWORD` | 第一个管理员，只在第一次启动、还没有任何账号时创建；之后修改不会改变已有的账号 |
| `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`、`DB_SSL` | 数据库连接 |
| `WEB_PUSH_PRIVATE_KEY` | 推送私钥，见 [通知与推送](../admin/notifications.md) |
| `SMTP_PASSWORD` | 邮件通道的 SMTP 密码 |
| `API_BODY_LIMIT`、`API_TIMEOUT` | 接口请求体的大小上限、处理超时 |

Studio 的访问路径是 `/main`，例如 `https://studio.example.com/main/`。添加运行环境、登录 `nb-studio` 时用的都是这个带 `/main` 的完整地址。

> [!WARNING] 加密密钥
> 部署后不要再改 `SECRETS_KEYS`：改了，所有人都会被退出登录；丢了，保存的凭据都无法解密。要换密钥，把新密钥以更高的版本号放在最前面（`2:<新密钥>,1:<旧密钥>`），重新加密后再去掉旧的。

## config.yml 的主要设置

| 设置 | 说明 |
| --- | --- |
| `i18n.defaultLocale` | 界面语言，设为团队使用的语言，例如 `zh-CN`；不设置时是英文 |
| `auth.emailAndPassword.disableSignUp` | 设为 `true`，关闭自助注册，成员只能通过邀请加入。模板里没有这一项，请自己加上 |
| `auth.passwordReset` | 找回密码。需要配置好邮件通道，`emailChannel` 指向它 |
| `notification.channels` | 提醒的通道：站内（`inbox`）、邮件（`system-email`，SMTP 或 Resend）等，见 [通知与推送](../admin/notifications.md) |
| `push` | 推送通知：`privateKey`、`contact` |
| `database` | 数据库连接，环境变量会覆盖它 |
| `users.initialAdmin` | 第一个管理员，环境变量会覆盖它 |
| `secrets.keys` | 加密密钥，环境变量 `SECRETS_KEYS` 会覆盖它 |
| `logging` | 日志级别、日志文件的保留天数和大小 |
| `studio.git.apiBaseUrls` | 自己部署的 GitHub Enterprise 或 GitLab，接口地址不是默认位置时填写 |
| `studio.agents.queuedExpiryHours` | 工作排队多少小时没有运行环境领取就失败，默认 24；设为 0 一直等待 |
| `agents.runs.retentionDays` | 已结束的运行保留过程记录和提示词的天数，默认 14 |
| `drive` | 文件存储，默认存在本地的 `storage` 目录；可以改用 S3 兼容的对象存储 |

## 部署多个实例

只运行一个 Studio 实例时，不需要 Redis。部署多个实例时，`realtime`（实时消息）和 `jobs`（定时任务）都要改用 Redis，各实例共用同一个命名空间。Redis 要开启持久化，并设置 `maxmemory-policy noeviction`，否则定时任务可能丢失。

## 发布管理

| 设置 | 说明 |
| --- | --- |
| `releases.docker` | 打开 Docker 运行方式：`enabled: true`，以及 Docker 应用的入口地址和端口。见 [部署环境](../admin/environments.md) |
| `releases.host.launchPrefix` | 让运行预览的进程使用另一个系统用户，读不到 Studio 的配置 |
| `studio.releases.previewPublicUrl` | 预览用单独的域名，例如 `https://studio-preview.example.com/{appId}/`，不和 Studio 共用一个地址 |
| `studio.releases.previewEnvironment` | 设为 `false` 时，安装后不自动创建预览环境 |

正式使用时，建议让预览用单独的域名，并让运行预览的进程使用另一个系统用户：预览里运行的是还没合并的代码，不应该能读到 Studio 的配置和密钥。
