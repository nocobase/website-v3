---
title: 部署 Studio
description: 用一条命令在自己的电脑上安装 Studio 试用，或使用 Docker Compose 手动部署供团队使用。
---

## 一键安装

一键安装会在你的电脑上准备：

- Studio 社区版和 PostgreSQL，由 Docker Compose 运行在 `~/.nocobase-studio/`
- Gitea，本地 Git 服务
- 把这台电脑接入为[个人运行环境](../join/personal-runtime.md)，安装执行机和命令行工具 `nb-studio`
- **My first project**，仓库里有一个 NocoBase 3 应用
- 与 Agent 的对话和一个建议的首个任务

### 开始前

- macOS、Linux，或 Windows 上的 WSL 加 Docker Desktop
- Docker，带 Compose v2，并已启动
- Node.js 24、Git 和 curl
- 至少一个已安装并登录的编码工具：Claude Code、Codex、OpenCode 或 Pi

### 运行安装命令

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang zh-CN --mirror registry.cn-shanghai.aliyuncs.com --npm-registry https://registry.npmmirror.com/
```

完成后，安装程序会输出要打开的地址和登录账号。

### 打开 Studio

打开输出的地址，用 `admin@nocobase.com` 和 `admin123` 登录，然后在「个人设置 › 账号与安全」修改密码。

Gitea 也可以用同一邮箱和初始密码登录。

**完成的标志**：首个对话中显示 Agent 的计划和带「开始」按钮的建议任务。

### 修改配置

| `~/.nocobase-studio/` 中的文件 | 内容 | 修改后运行 |
| --- | --- | --- |
| `config/config.yml` | Studio 的配置，如数据库、[邮件](#邀请与密码重置邮件)和[文件存储](#文件与产物上传) | `docker compose -f ~/.nocobase-studio/compose.yml restart studio` |
| `.env` | 镜像、端口、语言、初始管理员、`SECRETS_KEYS` 和 `POSTGRES_PASSWORD` | `docker compose -f ~/.nocobase-studio/compose.yml up -d` |

再次运行安装程序不会覆盖你的修改。`.env` 中的设置优先于 `config.yml` 中的同名配置。请保留 `SECRETS_KEYS`，没有它 Studio 无法解密已保存的凭据。

### 安装选项

| 选项 | 作用 |
| --- | --- |
| `--lang <语言>` | 安装程序和 Studio 的语言：`en-US`（默认）、`zh-CN`、`zh-TW`、`ja-JP`、`ko-KR`、`es-ES`、`fr-FR`、`de-DE`、`pt-BR`、`ru-RU`、`id-ID` 或 `vi-VN` |
| `--mirror <镜像仓库>` | 从该镜像仓库而不是 Docker Hub 拉取镜像，中国大陆可用 `registry.cn-shanghai.aliyuncs.com` |
| `--npm-registry <地址>` | 从该源安装首个项目的 npm 包，例如 `https://registry.npmmirror.com/` |
| `--dry-run` | 只显示将要执行的操作，不做修改 |
| `--uninstall` | 移除容器、执行机和 `nb-studio`，保留数据 |
| `--purge` | 与 `--uninstall` 一起使用，同时删除 `~/.nocobase-studio/` |
| `-h`、`--help` | 显示用法 |

### 升级、停止和卸载

升级时，再次运行安装命令。设置会保留；镜像有变化时，会先把 `data/` 备份到 `backups/`。

停止和启动：

```bash
docker compose -f ~/.nocobase-studio/compose.yml down
docker compose -f ~/.nocobase-studio/compose.yml up -d
```

卸载并保留数据：

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --uninstall
```

加上 `--purge` 会同时删除数据。

## 手动部署

以下步骤使用社区版（CE）镜像，无需 License Key。其他版本的获取方式见[选择版本](index.md#选择版本)。

使用 Docker Compose 部署单个 Studio 实例，数据库以 PostgreSQL 为例。已有数据库可以直接接入，配置项见[配置参考](../reference/config.md)。

### 准备环境

- 一台装有 Docker 和 Docker Compose 的服务器。镜像支持 Linux amd64 和 arm64。
- 部署服务器可访问镜像仓库。离线安装时，先用 `docker load -i <镜像包>` 导入镜像。
- 一个固定的访问地址。团队使用时配置域名和 HTTPS；本机试用可以先用 `http://localhost:13000`。

编码工具安装在[运行环境](shared-runtimes.md)上，后续再接入。单实例不需要 Redis。团队使用前，还需要准备文件与产物存储，以及邀请和密码重置邮件。

### 准备配置文件

从社区版镜像提取配置模板。

```bash
mkdir studio
cd studio
mkdir storage

docker run --rm --entrypoint cat registry.cn-shanghai.aliyuncs.com/nocobase/studio-ce:latest \
  /app/config.example.yml > config.yml
```

生成加密密钥：

```bash
openssl rand -hex 32
```

编辑 `config.yml`，将以下值合并到模板的对应节点。填写管理员账号、生成的加密密钥，以及数据库连接信息。保留模板中的其他设置，不要重复添加同名节点。

数据库配置以 PostgreSQL 为例。使用已有数据库时，填写 Studio 容器可访问的主机、端口、数据库名、用户名和密码。

使用下文的 [Compose 配置](#启动服务)新建数据库时，Studio 通过容器网络连接 PostgreSQL。`host: postgres` 对应 Compose 中的服务名，`port: 5432` 是数据库容器内的监听端口；数据库名、用户名和密码由你设置。

```yaml
app:
  publicOrigin: http://localhost:13000
  sampleData: false

users:
  initialAdmin:
    username: admin
    email: admin@example.com
    password: replace-with-admin-password

secrets:
  keys:
    - version: 1
      key: replace-with-generated-key

auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true

database:
  default: main
  connections:
    main:
      dialect: postgres
      host: postgres
      port: 5432
      database: replace-with-database-name
      username: replace-with-database-user
      password: replace-with-database-password
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

`app.publicOrigin` 填浏览器访问 Studio 的协议、域名和端口，末尾不带 `/main`。初始管理员只在空数据库首次启动时创建。中文界面可在 `config.yml` 中设置 `i18n.defaultLocale: zh-CN`。

> [!NOTE] 保留加密密钥
> `secrets.keys` 用于加密 Studio 保存的凭据。重启和升级时保留它，并与数据库一起备份。丢失密钥后，已保存的凭据无法解密。

### 文件与产物上传

本地存储可直接使用，后面的 Compose 配置会持久化 `/app/storage`。任务、评论和 Agent 会话的单个附件默认上限为 20 MiB。需要调大时，在 `config.yml` 中设置目标磁盘，例如改为 50 MiB：

```yaml
drive:
  disks:
    local:
      maxFileSizeMb: 50
```

`maxFileSizeMb` 必须是正整数。使用对象存储时，将它放到对应磁盘下。反向代理的请求大小限制也需相应调大，并为上传表单留出余量。

团队使用对象存储时，将下面的配置合并到 `config.yml`。这里以 Amazon S3 为例：

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      maxFileSizeMb: 50
      bucket: example-studio-files
      region: us-east-1
      supportsACL: false
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        secretAccessKey: replace-with-access-key-secret

releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

替换 bucket、地域和凭据，并将 bucket 设为私有。`drive.default` 用于上传的附件等文件；`releases.artifact` 用于 CI 或 Agent 上传的构建产物，必须单独设置。

对象存储不能替代整个 `storage` 目录，仍需保留下面的持久化挂载。本地文件、S3 兼容服务和 OSS 的配置，见[文件与产物存储](../reference/storage.md)。

### 邀请与密码重置邮件

邀请成员前先配置邮件。邀请和密码重置共用一套 SMTP 配置，将以下内容合并到 `config.yml` 的对应节点：

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
      pass: replace-with-smtp-password
    from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
```

保留 `users.initialAdmin`、`auth.emailAndPassword` 等设置。将 SMTP 主机、端口、账号和发件地址替换为邮件服务商提供并授权的值。

密码填写在 `mailers.system.auth.pass`。`app.publicOrigin` 应是成员能访问的 Studio 地址，邮件链接会用到它。

仅本机试用、暂不配置邮件时，保留 `auth.passwordReset.enabled: false`，邀请可先复制链接分享。Resend 配置和邮件发送检查，见[通知与推送](../admin/notifications.md#邀请邮件)。

### 启动服务

在同一目录创建 `docker-compose.yml`。将 `POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD` 分别填为 `config.yml` 中的数据库名、用户名和密码。

```yaml
services:
  studio:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/studio-ce:latest
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage

  postgres:
    image: postgres:16
    command: ["postgres", "-c", "jit=off"]
    restart: unless-stopped
    environment:
      POSTGRES_DB: replace-with-database-name
      POSTGRES_USER: replace-with-database-user
      POSTGRES_PASSWORD: replace-with-database-password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

建议为 Studio 使用的 PostgreSQL 关闭 JIT（即时编译）。[JIT 主要适合耗时较长、CPU 密集的查询](https://www.postgresql.org/docs/16/jit-decision.html)。Studio 日常操作以短查询为主，触发 JIT 时，编译开销可能超过收益，增加响应延迟。

上面的 `command` 已设置 `jit=off`。使用已有数据库时，以数据库所有者或管理员身份执行以下 SQL，将数据库名替换为实际值：

```sql
ALTER DATABASE "your_studio_database" SET jit = off;
```

该设置对新连接生效。若 Studio 已启动，重启 Studio 以重新建立连接。使用 Studio 的数据库账号重新连接后，执行 `SHOW jit;`，结果应为 `off`。

使用已有数据库时，移除 Compose 中的 `postgres` 服务、`studio.depends_on` 和 `postgres-data` 卷配置。

Studio 镜像默认读取 `/app/config.yml`，访问路径为 `/main`。上述环境变量用于初始化 PostgreSQL 容器；Studio 的配置都保存在 `config.yml`。

Studio 容器以 UID 1000 运行。启动前确保它能读取配置并写入存储目录，同时限制配置文件的读取权限：

```bash
sudo chown 1000:1000 config.yml storage
sudo chmod 600 config.yml
```

此配置只向本机开放 13000 端口。远程服务器通过下文的 HTTPS 地址访问；临时验证也可以使用 SSH 端口转发。

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
curl -fsS http://localhost:13000/main/api/healthz
```

首次启动会自动建表并创建管理员。等待 Studio 显示 `healthy`，健康检查返回 `"ok": true`。

### 首次登录

本机试用打开 `http://localhost:13000/main/`。团队使用时，按下文配置 HTTPS 地址。使用 `config.yml` 中 `users.initialAdmin` 的用户名和密码登录。

![使用初始管理员账号登录 Studio](https://static-docs.nocobase.com/studio-zh-login-20261111-normal-2x.webp)

初始管理员配置仅在首次安装时生效。以后修改密码，使用「个人设置 › 账号与安全」。

专业版和企业版使用交付的 License Key。管理员可在「设置 › 授权」查看授权状态和可用更新。初始化应用需要商业依赖时，在此配置对应的依赖访问凭据。

**完成的标志**：管理员可以登录，项目列表为空，登录页没有注册入口。后续连接执行机和 CLI 时，使用包含 `/main` 的完整地址。

![首次登录后的空白项目列表](https://static-docs.nocobase.com/studio-zh-ce-empty-projects-20261119-1348a767f8.webp)

团队使用前，再验证以下结果：

- 上传一个测试文件，刷新后能够下载。
- 用自己控制的测试邮箱接收邀请，邮件链接能打开 Studio。
- 用已有测试账号完成「忘记密码」，设置新密码后能够登录。

产物上传和预览启动，在项目的[检查与预览](ci.md)配置完成后验证。

接着[连接代码平台](git.md)。

### 团队访问（可选）

本机试用可以跳过这一步。团队使用时，将域名解析到服务器，并用反向代理提供 HTTPS。反向代理需要转发 WebSocket。

例如 Caddy 与 Studio 在同一台服务器上时：

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

将 `config.yml` 的 `app.publicOrigin` 改为实际访问地址：

```yaml
app:
  publicOrigin: https://studio.example.com
```

重新创建 Studio 容器，使配置生效：

```bash
docker compose up -d --force-recreate studio
```

## 排查启动问题

| 现象 | 检查方法 |
| --- | --- |
| 安装程序停止，并指出缺少某个工具 | 用输出的命令安装，再运行安装命令 |
| 安装程序提示运行环境没有检测到编码工具已登录 | 登录该工具。Claude Code 需把 shell 配置文件中的 `ANTHROPIC_*` 变量移到 `~/.claude/settings.json` 的 `env` 中。在「Agent 管理 › 运行环境」重新检测该工具，再运行安装命令 |
| 拉取镜像时提示无权访问 | 核对镜像仓库名和版本标签。使用专业版或企业版时，检查交付的仓库访问权限 |
| 镜像下载超时 | 检查 Docker 服务的代理设置，以及部署服务器到所选镜像仓库的网络连接。一键安装时使用 `--mirror` |
| 容器反复重启 | 运行 `docker compose logs --tail=100 studio`，检查数据库连接和配置错误。一键安装时加上 `-f ~/.nocobase-studio/compose.yml` |
| 提示配置文件不存在或无法读取 | 确认 `config.yml` 是从镜像提取的文件，不是 Docker 自动创建的目录 |
| 提示数据目录无写入权限 | 确认 `storage` 可由 UID 1000 写入 |
| 页面打不开或登录回调失败 | 检查 `/main/`、`app.publicOrigin` 和反向代理设置 |

后续维护见[升级与备份](../admin/upgrade-and-backup.md)。
