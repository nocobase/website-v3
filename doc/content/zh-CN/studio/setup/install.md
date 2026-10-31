---
title: 部署 Studio
description: 使用 Docker Compose 部署空白 Studio，配置持久化数据，并登录管理员账号。
---

Studio 是商业产品，请[联系我们](https://www.nocobase.com/zh-CN/contact/)获取镜像、版本信息和访问授权。

本文使用 Docker Compose 部署单个 Studio 实例，数据库以 PostgreSQL 为例。已有数据库可以直接接入，配置项见[配置参考](../reference/config.md)。

## 准备环境

- 一台装有 Docker 和 Docker Compose 的服务器。镜像支持 Linux amd64 和 arm64。
- 已获取的 Studio 镜像。服务器需要能访问交付说明中的镜像服务；离线交付的镜像包用 `docker load -i <镜像包>` 导入。
- 一个固定的访问地址。团队使用时配置域名和 HTTPS；本机试用可以先用 `http://localhost:13000`。

编码工具安装在[运行环境](shared-runtimes.md)上，后续再接入。单实例不需要 Redis。团队使用前，还需要准备文件与产物存储，以及邀请和密码重置邮件。

## 准备配置文件

按交付说明取得镜像，在终端中设置 `STUDIO_IMAGE`。值使用包含具体版本号的完整镜像名称。

```bash
export STUDIO_IMAGE='<交付的镜像名称与版本>'
mkdir studio
cd studio
mkdir storage
sudo chown 1000:1000 storage

docker run --rm --entrypoint cat "$STUDIO_IMAGE" \
  /app/config.example.yml > config.yml
```

Studio 容器以 UID 1000 运行，需要能写入 `storage` 目录。

编辑 `config.yml`，在对应位置设置界面语言，并关闭自助注册。保留模板里的其他配置，不要重复添加同名节点。

```yaml
i18n:
  defaultLocale: zh-CN

auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
```

生成 `.env`。下面的命令会生成加密密钥、初始管理员密码和数据库密码。

```bash
umask 077
cat > .env <<EOF
STUDIO_IMAGE=${STUDIO_IMAGE}
STUDIO_SECRET_KEY=$(openssl rand -hex 32)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=$(openssl rand -hex 18)
DB_PASSWORD=$(openssl rand -hex 24)
APP_PUBLIC_ORIGIN=http://localhost:13000
EOF
```

把管理员邮箱换成自己的邮箱。`APP_PUBLIC_ORIGIN` 填浏览器访问 Studio 的协议、域名和端口，末尾不带 `/main`。

> [!NOTE] 保留加密密钥
> `STUDIO_SECRET_KEY` 用于加密 Studio 保存的凭据。重启和升级时保留它，并与数据库一起备份。丢失密钥后，已保存的凭据无法解密。

## 文件与产物上传

本地存储可以直接使用，后面的 Compose 配置会持久化 `/app/storage`。团队使用对象存储时，将下面的配置加入 `config.yml`。下面以 Amazon S3 为例：

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
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

## 邀请与密码重置邮件

团队使用前配置这两种邮件。邀请使用通知通道；密码重置使用独立的 `auth.email`。下面以同一个 SMTP 账号为例，合并到 `config.yml` 的对应节点：

```yaml
users:
  invitations:
    emailChannel: system-email

notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: notifications@example.com
      from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: "Studio <notifications@example.com>"
```

保留前面已有的 `users.initialAdmin` 和 `auth.emailAndPassword` 等设置。替换 SMTP 主机、端口、账号和发件地址，确保发件地址已获服务商授权。

将密码填入 `.env`：

```dotenv
SMTP_PASSWORD=<邀请邮件的 SMTP 密码>
AUTH_EMAIL_PASSWORD=<密码重置邮件的 SMTP 密码>
```

在下面 Compose 文件的 `services.studio.environment` 中补上：

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

`.env` 必须通过 Compose 传入容器；不要在 `config.yml` 中写 `${SMTP_PASSWORD}`，它不会展开。两种邮件可以使用相同密码，但变量要分别传入。`APP_PUBLIC_ORIGIN` 应是成员能访问的 Studio 地址，邮件中的链接会用到它。

仅本机试用、暂不配置邮件时，保留 `auth.passwordReset.enabled: false`。邀请可以先复制链接分享。Resend 和旧邮件配置迁移，见[通知与推送](../admin/notifications.md#从旧配置迁移)。

## 启动服务

在同一目录创建 `docker-compose.yml`：

```yaml
services:
  studio:
    image: ${STUDIO_IMAGE:?set STUDIO_IMAGE in .env}
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    environment:
      APP_CONFIG_FILE: /app/config.yml
      APP_PUBLIC_ORIGIN: ${APP_PUBLIC_ORIGIN}
      APP_BASE_PATH: /main
      APP_SAMPLE_DATA: "false"
      SECRETS_KEYS: 1:${STUDIO_SECRET_KEY:?set STUDIO_SECRET_KEY in .env}
      INITIAL_ADMIN_USERNAME: ${INITIAL_ADMIN_USERNAME}
      INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL}
      INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD:?set INITIAL_ADMIN_PASSWORD in .env}
      DB_DIALECT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: studio
      DB_USERNAME: studio
      DB_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: studio
      POSTGRES_USER: studio
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U studio -d studio"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

此配置只向本机开放 13000 端口。远程服务器通过下文的 HTTPS 地址访问；临时验证也可以使用 SSH 端口转发。

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
curl -fsS http://localhost:13000/main/api/healthz
```

首次启动会自动建表并创建管理员。等待 Studio 显示 `healthy`，健康检查返回 `"ok": true`。

## 首次登录

本机试用打开 `http://localhost:13000/main/`。团队使用时，按下文配置 HTTPS 地址。使用 `.env` 中的 `INITIAL_ADMIN_USERNAME` 和 `INITIAL_ADMIN_PASSWORD` 登录。

![使用初始管理员账号登录 Studio](https://static-docs.nocobase.com/studio-zh-setup-login-full-1440x900-20261030.png)

初始管理员配置仅在首次安装时生效。以后修改密码，使用「个人设置 › 账号与安全」。

**完成的标志**：管理员可以登录，项目列表为空，登录页没有注册入口。后续连接执行机和 CLI 时，使用包含 `/main` 的完整地址。

![首次登录后的空白项目列表](https://static-docs.nocobase.com/studio-zh-setup-empty-projects-full-1440x900-20261030.png)

团队使用前，再验证以下结果：

- 上传一个测试文件，刷新后能够下载。
- 用自己控制的测试邮箱接收邀请，邮件链接能打开 Studio。
- 用已有测试账号完成「忘记密码」，设置新密码后能够登录。

产物上传和预览启动，在项目的[检查与预览](ci.md)配置完成后验证。

接着[连接代码平台](git.md)。

## 团队访问（可选）

本机试用可以跳过这一步。团队使用时，将域名解析到服务器，并用反向代理提供 HTTPS。反向代理需要转发 WebSocket。

例如 Caddy 与 Studio 在同一台服务器上时：

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

将 `.env` 中的地址改为 `APP_PUBLIC_ORIGIN=https://studio.example.com`，然后重新创建容器：

```bash
docker compose up -d
```

## 排查启动问题

| 现象 | 检查方法 |
| --- | --- |
| 镜像拉取提示无权访问 | 核对交付的版本和访问授权；无法确认时联系我们 |
| 镜像下载超时 | 检查 Docker 服务的代理和网络，放行交付说明中的下载地址 |
| 容器反复重启 | 运行 `docker compose logs --tail=100 studio`，检查数据库连接和配置错误 |
| 提示配置文件不存在或无法读取 | 确认 `config.yml` 是从镜像提取的文件，不是 Docker 自动创建的目录 |
| 提示数据目录无写入权限 | 确认 `storage` 可由 UID 1000 写入 |
| 页面打不开或登录回调失败 | 检查 `/main/`、`APP_PUBLIC_ORIGIN` 和反向代理设置 |

后续维护见[升级与备份](../admin/upgrade-and-backup.md)。
