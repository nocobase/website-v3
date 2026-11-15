---
title: 配置项
description: 查询 Studio 的 config.yml 字段、上传限制和环境变量。
---

Studio 的配置保存在部署目录的 `config.yml`，容器读取挂载后的 `/app/config.yml`。从交付镜像提取模板的方法见[部署 Studio](../setup/install.md)。

## 使用 config.yml

将配置合并到已有节点，不要重复添加同名键。密码、密钥直接填写在对应字段，并限制文件读取权限。修改后重新创建 Studio 容器：

```bash
docker compose up -d --force-recreate studio
```

## 应用地址与界面

| 字段 | 说明 |
| --- | --- |
| `app.publicOrigin` | 浏览器访问地址，不带路径，例如 `https://studio.example.com`；回调、邮件链接和推送使用此地址 |
| `app.sampleData` | 首次安装时是否加载示例数据；空白部署设为 `false` |
| `client.app.title` | 界面显示的应用名称；`client` 下的值会公开给浏览器，不要放密码或密钥 |
| `i18n.defaultLocale` | 默认界面语言；未设置时使用英文，例如可设为 `zh-CN` |

Studio 默认访问路径为 `/main`。连接运行环境和 CLI 时，使用 `https://studio.example.com/main/` 这样的完整地址。

## 数据库

| 字段 | 说明 |
| --- | --- |
| `database.default` | 默认连接名称，通常为 `main` |
| `database.connections.main.dialect` | 数据库类型；模板默认 `sqlite`，部署示例使用 `postgres` |
| `database.connections.main` | 在连接内填写 `host`、`port`、`database`、`username`、`password`；TLS 使用 `ssl` |
| `database.connections.main.schemaManagement` | Studio 数据库使用 `managed` |
| `database.connections.main.migrations.autoRun` | 设为 `true`，启动时执行数据库迁移 |
| `database.connections.main.seeds.autoRun` | 设为 `true`，启动时执行初始化数据任务 |

PostgreSQL 的完整示例见[部署 Studio](../setup/install.md)。连接已有数据库时，使用实际的主机、端口和账号。

建议在 PostgreSQL 服务端关闭 JIT，配置方法见[启动服务](../setup/install.md#启动服务)。

## 管理员与登录

| 字段 | 说明 |
| --- | --- |
| `users.initialAdmin` | `username`、`email`、`password` 定义初始管理员；只在用户表为空时创建，修改配置不会重置已有账号 |
| `auth.emailAndPassword.enabled` | 启用密码登录 |
| `auth.emailAndPassword.disableSignUp` | 团队部署设为 `true`，关闭自助注册 |
| `auth.emailAndPassword.autoSignIn` | 注册后是否自动登录；部署示例设为 `false` |
| `auth.passwordReset.enabled` | 启用密码重置；同时需要发件服务和正确的 `app.publicOrigin` |
| `auth.session.storeSessionInDatabase` | 模板设为 `true`，在数据库中保存登录会话 |

## 加密密钥

| 字段 | 说明 |
| --- | --- |
| `secrets.keys` | 按顺序填写包含 `version` 和 `key` 的列表；首项用于新加密，其余密钥用于解密已有数据 |

用 `openssl rand -hex 32` 生成密钥。备份时保留整个 `secrets.keys` 列表；丢失密钥将无法解密已保存的凭据。更换当前密钥会使登录会话失效，旧数据重新加密前不要删除旧密钥。

## 文件存储与上传大小

| 字段 | 说明 |
| --- | --- |
| `drive.default` | 文件上传使用的磁盘名称，默认 `local` |
| `drive.disks.<name>` | 磁盘的驱动、位置和凭据；支持 `fs`、`s3` 和 `oss` |
| `drive.disks.<name>.maxFileSizeMb` | 该磁盘的单文件上传上限，单位 MiB，默认 `20`，必须为正整数 |

`maxFileSizeMb` 用于任务、评论和 Agent 会话附件，按实际写入的磁盘生效。修改后重启 Studio 并刷新页面。反向代理上限也需调大，并为 multipart 表单留出余量；配置了 `api.bodyLimit` 时，请求还需满足该限制。驱动示例见[文件与产物存储](storage.md)。

## API 请求限制

| 字段 | 说明 |
| --- | --- |
| `api.bodyLimit` | API 请求体大小上限，例如 `60mb`；默认不启用全局限制，路由仍可有自己的上限 |
| `api.timeout` | 处理超时，例如 `30s`；默认不启用，已开始的流式响应不会被截断 |
| `api.rateLimit` | 可选的 `max` 与 `window`，例如每 `1m` 最多 `600` 次；按进程和客户端连接地址计数 |

反向代理后的请求可能共用代理地址，设置 `api.rateLimit` 时应按这个共享额度估算。

## 邮件与通知

| 字段 | 说明 |
| --- | --- |
| `mailers.default` | 默认发件服务名称，例如 `system` |
| `mailers.<name>` | SMTP：`provider: smtp`、`host`、`port`、`secure`、`auth.user`、`auth.pass`、`from`；Resend：`provider: resend`、`apiKey`、`from` |
| `users.invitations.mailer` | 邀请邮件使用的服务，省略时使用 `mailers.default` |
| `auth.passwordReset.mailer` | 密码重置使用的服务，省略时使用 `mailers.default` |
| `notification.channels` | 站内通道使用 `type: in-app`；邮件通道使用 `type: email`，可用 `mailer` 选择服务；配置发件服务不会自动创建通知通道 |
| `push.privateKey`, `push.contact` | 推送私钥与联系地址；需要 HTTPS |

邀请和密码重置默认共用发件服务，密码重置还需启用 `auth.passwordReset.enabled`。SMTP、Resend 示例与发送检查见[通知与推送](../admin/notifications.md)。

## Agent 与运行记录

| 字段 | 说明 |
| --- | --- |
| `studio.agents.queuedExpiryHours` | 工作排队超时，默认 `24` 小时；`0` 表示一直等待 |
| `studio.agents.managerIdleMinutes` | 调度 Agent 空闲恢复阈值，默认 `15` 分钟；`0` 关闭恢复 |
| `studio.agents.managerIdleSweepMinutes` | 空闲检查间隔，默认 `5` 分钟，必须为正数 |
| `agents.runs.retentionDays` | 已结束运行的过程记录和提示词保留天数，默认 `14`；`0` 保留 |
| `agents.conversations.archivedRetentionDays` | 已归档会话的保留天数，默认 `30`；`0` 保留 |
| `agents.skills.disk` | 技能内容使用的磁盘，默认跟随 `drive.default` |

## Git 平台

| 字段 | 说明 |
| --- | --- |
| `studio.git.apiBaseUrls` | 按域名指定自建代码平台的 API 地址；默认地址适用时无需填写 |

Git 连接和授权在界面中配置，见[代码平台](../configure/git.md)。

## 预览与发布产物

| 字段 | 说明 |
| --- | --- |
| `releases.artifact` | 产物存储，默认 `/app/storage/releases/artifacts`；独立于 `drive.default` |
| `releases.maxArtifactSizeMB` | 单个发布产物的大小上限，默认 `256` MiB；不使用附件的 `maxFileSizeMb` |
| `releases.host.memoryBudget` | `targetRatio` 默认 `0.7`，`appMemoryMb` 默认 `320`，`reserveMb` 默认 `0`；按应用峰值和服务器资源调整 |
| `releases.host.maxActiveApps` | 可选的运行中应用数量上限；仍需满足内存检查 |
| `releases.host.launchPrefix` | 启动预览进程的命令前缀，可用于切换到不能读取 Studio 配置的系统用户 |
| `releases.docker` | `enabled: true` 启用 Docker 运行方式；配置固定的入口端口和反向代理 |
| `studio.releases.previewPublicUrl` | 预览的独立域名，例如 `https://studio-preview.example.com/{appId}/` |
| `studio.releases.previewEnvironment` | 设为 `false`，安装后不自动创建预览环境 |

预览建议使用独立域名，并让预览进程以不能读取 Studio 配置的系统用户运行。托管方式见[托管环境](../admin/environments.md)；生产部署由团队自行管理。

## 日志

| 字段 | 说明 |
| --- | --- |
| `logging.level` | 日志级别，模板为 `info` |
| `logging.file` | `enabled` 开关；模板中 `retentionDays: 7`、`maxFileSizeMB: 10`、`maxTotalSizeMB: 500` |
| `logging.loggers.request.file.name` | 请求日志文件名，模板为 `request` |
| `logging.console` | 控制台输出的 `enabled` 和 `pretty`；模板关闭格式化输出 |

## 环境变量

需要由部署平台注入配置时，可以使用应用已声明的环境变量；它们覆盖对应的 `config.yml` 字段。没有环境变量映射的字段继续写在文件中。

Compose 的 `.env` 用于替换 Compose 文件中的变量，不会自动传入 Studio。需要在 `services.studio.environment` 或 `env_file` 中声明。`config.yml` 中的 `${NAME}` 不会展开。

| 环境变量 | config.yml 字段或用途 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | `app.publicOrigin` |
| `APP_SAMPLE_DATA` | `app.sampleData` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `email` / `password` |
| `SECRETS_KEYS` | `secrets.keys` — `2:<new-key>,1:<old-key>` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` / `DB_FILENAME` | `database.connections.main.dialect` / `host` / `port` / `database` / `username` / `password` / `ssl` / `filename` |
| `MAILERS_DEFAULT` | `mailers.default` |
| `MAILERS_SYSTEM_PROVIDER` / `MAILERS_SYSTEM_HOST` / `MAILERS_SYSTEM_PORT` / `MAILERS_SYSTEM_SECURE` | `mailers.system.provider` / `host` / `port` / `secure` |
| `MAILERS_SYSTEM_USER` / `MAILERS_SYSTEM_PASSWORD` | `mailers.system.auth.user` / `auth.pass` |
| `MAILERS_SYSTEM_API_KEY` | `mailers.system.apiKey` |
| `MAILERS_SYSTEM_FROM` / `MAILERS_SYSTEM_REPLY_TO` / `MAILERS_SYSTEM_ENABLED` | `mailers.system.from` / `replyTo` / `enabled` |
| `WEB_PUSH_PRIVATE_KEY` | `push.privateKey` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `STUDIO_MANAGER_IDLE_MINUTES` / `STUDIO_MANAGER_IDLE_SWEEP_MINUTES` | `studio.agents.managerIdleMinutes` / `managerIdleSweepMinutes` |
| `RELEASES_HOST_ENABLED` | `releases.host.enabled` |
| `APP_CONFIG_FILE` | 启动时读取的配置文件路径；交付镜像默认 `/app/config.yml` |
| `APP_BASE_PATH` | 启动时的访问路径；交付镜像默认 `/main` |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` | 监听地址与端口；交付镜像默认 `0.0.0.0` / `13000` |
