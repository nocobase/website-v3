---
title: 安装 Studio
status: 待改写
description: 用 Docker Compose 在一台 Linux 服务器上部署 Studio。
---

## 准备

- 一台 Linux 服务器，装有 Docker 和 Docker Compose，能访问镜像仓库、npm 和你的 Git 托管平台。
- 一个解析到这台服务器的域名，下文用 `studio.example.com` 代替。
- NocoBase 提供的镜像仓库账号。

想让 Claude Code 或 Codex 替你部署，跳到 [让 Agent 部署](#让-agent-部署)。

## 部署

1. 登录镜像仓库，建好部署目录：

   ```bash
   docker login pkg-v3.nocobase.com
   sudo mkdir -p /opt/studio/storage && cd /opt/studio
   sudo chown 1000:1000 storage   # 容器以 UID 1000 运行，要能写这个目录
   ```

2. 从镜像里取出配置模板，保存为 `config.yml`。不需要修改，下一步的环境变量会覆盖其中的密钥、管理员账号、对外地址和语言。

   ```bash
   docker run --rm pkg-v3.nocobase.com/nocobase/studio:latest cat /app/config.example.yml > config.yml
   ```

3. 生成 `.env`，把域名换成你自己的：

   ```bash
   cat > .env <<EOF
   APP_PUBLIC_ORIGIN=https://studio.example.com
   APP_DEFAULT_LOCALE=zh-CN
   SECRETS_KEYS=1:$(openssl rand -hex 32)
   INITIAL_ADMIN_USERNAME=admin
   INITIAL_ADMIN_EMAIL=admin@example.com
   INITIAL_ADMIN_PASSWORD=$(openssl rand -hex 12)
   EOF
   chmod 600 .env
   ```

4. 新建 `compose.yaml`：

   ```yaml
   services:
     studio:
       image: pkg-v3.nocobase.com/nocobase/studio:latest
       restart: unless-stopped
       env_file: .env
       ports:
         - "127.0.0.1:13000:13000"
       volumes:
         - ./config.yml:/app/config.yml
         - ./storage:/app/storage
   ```

5. 启动，等 `STATUS` 一栏变成 `healthy`：

   ```bash
   docker compose up -d
   docker compose ps
   ```

6. 配置 HTTPS：用反向代理把域名转到 `127.0.0.1:13000`，WebSocket 也要转发。用 Caddy 时，在 `Caddyfile` 里加上：

   ```text
   studio.example.com {
       reverse_proxy 127.0.0.1:13000
   }
   ```

   用 Nginx 时，为 `/main/ws` 加上 `Upgrade` 和 `Connection` 请求头。

> [!WARNING] 保管好 SECRETS_KEYS
> 已保存的 Git 凭据、API 密钥都用它加密。丢了它，这些凭据无法再解密；换掉它，所有人会被退出登录。把 `.env` 和数据一起备份。

## 检查

打开 `https://studio.example.com/main/`，用 `.env` 里的管理员账号登录。

地址里的 `/main` 不能省。之后添加运行环境、登录 `nb-studio` 时填写的 Studio 地址，都是这个带 `/main` 的完整地址。

登录后，接着 [连接 Git](git.md)。

## 让 Agent 部署

把下面的提示词交给 Claude Code 或 Codex，替换服务器地址和域名。

```prompt
请通过 SSH 登录 <服务器地址>，用 Docker Compose 部署 NocoBase Studio，访问地址是 https://studio.example.com/main/。

- 镜像：pkg-v3.nocobase.com/nocobase/studio:latest，镜像仓库的账号我单独提供。
- 容器监听 13000 端口。配置文件挂载到 /app/config.yml，内容从镜像里的 /app/config.example.yml 复制；数据目录 /app/storage 挂载到宿主机，目录归属 UID 1000。
- 环境变量：APP_PUBLIC_ORIGIN=https://studio.example.com、APP_DEFAULT_LOCALE=zh-CN、SECRETS_KEYS=1:<用 openssl rand -hex 32 生成>，以及 INITIAL_ADMIN_USERNAME、INITIAL_ADMIN_EMAIL 和随机生成的 INITIAL_ADMIN_PASSWORD。写进权限为 600 的 .env 文件，不要出现在命令历史和日志里。
- 先检查服务器上已有的容器、Docker 网络和反向代理，不要影响其他服务。已有反向代理就接入它，没有就用 Caddy 提供 HTTPS。WebSocket 也要转发。

完成后确认：容器状态为 healthy，https://studio.example.com/main/ 能打开并用管理员账号登录，重启容器后数据还在。告诉我部署目录在哪里，管理员密码和 SECRETS_KEYS 存在哪里。
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | 浏览器访问 Studio 用的地址，不带路径。Git 托管平台的回调和各种链接都用它。 |
| `SECRETS_KEYS` | 主密钥，格式为 `1:<密钥>`。不设置时，`config.yml` 里模板自带的占位密钥会被拒绝，Studio 无法启动。 |
| `APP_DEFAULT_LOCALE` | 默认语言。设为 `zh-CN`，界面和预置标签都是中文。 |
| `INITIAL_ADMIN_USERNAME`<br>`INITIAL_ADMIN_EMAIL`<br>`INITIAL_ADMIN_PASSWORD` | 第一个管理员。只在第一次启动、还没有用户时创建，之后修改不会改变已有账号。 |
| `APP_BASE_PATH` | 访问路径，默认 `/main`。 |

## 数据与备份

Studio 的数据都在 `/opt/studio/storage` 里，包括数据库文件 `database.sqlite`。连同 `config.yml` 和 `.env`，整个 `/opt/studio` 就是要备份的全部内容：

```bash
cd /opt/studio
docker compose stop
sudo tar czf /backup/studio-$(date +%F).tar.gz .
docker compose start
```

备份里有 `.env`，也就有主密钥，请按保管密码的方式存放。

## 使用 PostgreSQL

Studio 默认使用 SQLite。要改用 PostgreSQL，在第一次启动前把连接信息加进 `.env`：

```bash
DB_DIALECT=postgres
DB_HOST=db.internal
DB_PORT=5432
DB_DATABASE=studio
DB_USERNAME=studio
DB_PASSWORD=<数据库密码>
```

启动之后再切换，已有的数据不会迁移过去。用 PostgreSQL 时，数据库要另外备份。

## 升级

先备份，再拉取新镜像并重启。数据库迁移在启动时自动执行。

```bash
cd /opt/studio
docker compose pull
docker compose up -d
```

## 常见问题

**打开域名看不到登录页。** 地址要带上 `/main/`，例如 `https://studio.example.com/main/`。

**容器起不来或反复重启。** 运行 `docker compose logs studio` 看原因，常见的有：`.env` 里没有 `SECRETS_KEYS`，或者格式不是 `1:<密钥>`；`storage` 目录的属主不是 UID 1000；启动前没有先取出 `config.yml`，Docker 建了一个同名目录，删掉它，重做第 2 步。
