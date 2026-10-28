---
title: 安装 Studio
description: Studio 部署在企业自己的服务器上。用 Docker Compose 在一台 Linux 服务器上部署 Studio 和它的 PostgreSQL 数据库，做完就可以用初始管理员登录。
---

## 准备

| 准备什么 | 要求 |
| --- | --- |
| 服务器 | Linux，装有 Docker 和 Docker Compose。镜像支持 amd64 和 arm64 |
| NocoBase Pro token | 登录私有镜像源 `pkg-v3.nocobase.com` 用 |
| 域名和 HTTPS | 正式使用时，用 Caddy 或 Nginx 把域名反向代理到 Studio。代码托管平台的回调、浏览器推送、邮件里的链接，都需要 HTTPS 和固定的地址 |
| 网络 | 能访问 `pkg-v3.nocobase.com`，以及和 token 一起提供给你的镜像层下载地址；能拉取 PostgreSQL 镜像 |
| 按需 | SMTP 邮箱，用于邀请成员、找回密码和邮件通知；对象存储；Redis，只有部署多个实例时才需要 |

## 登录镜像源

用户名填 `nocobase`，密码是你的 token。通过标准输入传入 token，它就不会留在命令历史里：

```bash
echo "<YOUR_TOKEN>" | docker login pkg-v3.nocobase.com -u nocobase --password-stdin
```

看到 `Login Succeeded` 就登录成功了。

可用的版本号在 [镜像的版本页面](https://pkg-v3.nocobase.com/-/images/nocobase/studio) 查看，不需要登录。生产环境请写具体的版本号，例如 `1.0.0-beta.61`，部署结果才稳定、可以复现；`latest` 和 `beta` 会随新版本移动。下文用 `<版本号>` 代替。

## 部署

1. 新建部署目录，从镜像里取出配置文件模板。Studio 启动时必须有这个文件，否则会直接退出。

   ```bash
   mkdir studio && cd studio
   mkdir storage && sudo chown 1000:1000 storage   # 容器以 UID 1000 运行，要能写这个目录
   docker run --rm --entrypoint cat pkg-v3.nocobase.com/nocobase/studio:<版本号> /app/config.example.yml > config.yml
   ```

2. 编辑 `config.yml`，改两处。在文件开头加上界面语言，设为团队使用的语言，例如中文是 `zh-CN`：

   ```yaml
   i18n:
     defaultLocale: zh-CN
   ```

   在 `auth` 下的 `emailAndPassword` 里加上 `disableSignUp: true`，关闭自助注册，成员由管理员邀请加入：

   ```yaml
   auth:
     emailAndPassword:
       enabled: true
       autoSignIn: false
       disableSignUp: true
   ```

   不设置语言时，界面是英文；不关闭自助注册，登录页上任何人都能自己注册账号。

3. 生成 `.env`，里面是加密密钥、初始管理员的密码和数据库密码。把地址换成你的域名：

   ```bash
   cat > .env <<EOF
   STUDIO_SECRET_KEY=$(openssl rand -hex 32)
   INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=')
   DB_PASSWORD=$(openssl rand -hex 16)
   APP_PUBLIC_ORIGIN=https://studio.example.com
   EOF
   chmod 600 .env
   ```

4. 新建 `docker-compose.yml`：

   ```yaml
   services:
     studio:
       image: pkg-v3.nocobase.com/nocobase/studio:<版本号>
       restart: unless-stopped
       depends_on:
         postgres:
           condition: service_healthy
       ports:
         - "13000:13000"
       environment:
         # 对外访问的地址，用于登录回调和邮件里的链接
         APP_PUBLIC_ORIGIN: ${APP_PUBLIC_ORIGIN:-http://localhost:13000}
         # 加密密钥，部署后不要再改
         SECRETS_KEYS: 1:${STUDIO_SECRET_KEY:?set STUDIO_SECRET_KEY in .env}
         # 首次启动时创建的管理员
         INITIAL_ADMIN_USERNAME: nocobase
         INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL:-admin@nocobase.com}
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
         - ./postgres:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U studio -d studio"]
         interval: 5s
         timeout: 5s
         retries: 10
   ```

5. 启动：

   ```bash
   docker compose up -d
   docker compose ps
   ```

   `studio` 显示 `healthy` 就启动好了，通常在一分钟内。第一次启动会自动建表、写入初始数据。

> [!WARNING] 保管好加密密钥
> `.env` 里的 `STUDIO_SECRET_KEY` 用来加密已保存的 Git 凭据、API 密钥等。部署后不要再改：改了，所有人都会被退出登录；丢了，这些凭据都无法再解密。把 `.env` 和数据一起备份，按保管密码的方式存放。

## 登录

打开 `https://studio.example.com/main/`。还没有配置域名时，打开 `http://<服务器地址>:13000/main/`。

- 用户名：`nocobase`
- 密码：`.env` 里的 `INITIAL_ADMIN_PASSWORD`，用 `grep INITIAL_ADMIN_PASSWORD .env` 查看

登录后，在右上角的账户菜单里打开「个人设置 › 账号与安全」，修改密码。

地址里的 `/main` 不能省。之后添加运行环境、登录 `nb-studio` 时用的 Studio 地址，都是这个带 `/main` 的完整地址。

**完成的标志**：能用初始管理员登录，界面是团队使用的语言，登录页上没有「注册」。接着 [连接 Git](git.md)。

## 配置 HTTPS

用反向代理把域名转到 Studio 的 13000 端口，WebSocket 也要转发。用 Caddy 时，在 `Caddyfile` 里加上：

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

反向代理和 Studio 在同一台服务器上时，把 `docker-compose.yml` 里的端口改成 `"127.0.0.1:13000:13000"`，只让反向代理访问。确认 `.env` 里的 `APP_PUBLIC_ORIGIN` 是对外的 HTTPS 地址，再运行一次 `docker compose up -d`。

## 让 Agent 部署

也可以把下面的提示词交给 Claude Code 或 Codex，由它登录服务器部署。替换服务器地址、域名和版本号，token 单独提供给它：

```prompt
请通过 SSH 登录 <服务器地址>，用 Docker Compose 部署 NocoBase Studio 和 PostgreSQL，访问地址是 https://studio.example.com/main/。

- 镜像：pkg-v3.nocobase.com/nocobase/studio:<版本号>。先用我提供的 NocoBase Pro token 登录镜像源，用户名 nocobase，token 从标准输入传入。
- 配置文件从镜像里的 /app/config.example.yml 复制，挂载到 /app/config.yml。在其中把 i18n.defaultLocale 设为 <界面语言，例如 zh-CN>，并在 auth.emailAndPassword 下设置 disableSignUp: true。
- 数据目录 /app/storage 挂载到宿主机，目录归属 UID 1000。
- 加密密钥、初始管理员密码和数据库密码随机生成，写进权限为 600 的 .env，不要出现在命令历史和日志里。
- 先检查服务器上已有的容器、Docker 网络和反向代理，不要影响其他服务。已有反向代理就接入它，没有就用 Caddy 提供 HTTPS，WebSocket 也要转发。

完成后确认：studio 容器为 healthy，https://studio.example.com/main/ 能打开、用 nocobase 登录、界面语言正确、登录页没有注册入口，重启容器后数据还在。告诉我部署目录在哪里，管理员密码和加密密钥存在哪里。
```

## 升级与备份

升级时，先备份，再把 `docker-compose.yml` 里的版本号改成新的，然后：

```bash
docker compose pull
docker compose up -d
```

数据库迁移在启动时自动执行。回滚要先恢复升级前的数据库备份，再改回原来的版本号。先升级 Studio，执行机会在空闲时自动升级。

要备份的有：PostgreSQL 数据库（例如用 `pg_dump -Fc` 导出，或者停机后备份 `postgres` 目录）、`config.yml`、`.env` 和 `storage` 目录。见 [升级与备份](../admin/upgrade-and-backup.md)。

## 常见问题

**`docker login` 或 `docker pull` 提示 unauthorized。** token 不对，或者没有这个镜像的授权。确认复制的 token 完整、没有多余的空格，再重新登录。

**`docker pull` 提示 403，说版本发布于授权的更新期限之后。** 改用期限内的版本号，或者续费后再拉取。

**拉取 `postgres:16` 超时。** 服务器访问不了 Docker Hub。为 Docker 配置镜像加速，或者改用已有的 PostgreSQL：删掉 `docker-compose.yml` 里的 `postgres` 服务和 `depends_on`，把 `DB_HOST` 等改成它的连接信息。

**下载镜像层时卡住或超时。** 防火墙或代理没有放行镜像层的下载地址，这个地址和 token 一起提供给你。Docker 需要代理时，要给 Docker 服务本身配置代理，只在终端里设置 `HTTP_PROXY` 对 `docker pull` 不生效。

**打开地址看不到登录页。** 地址要带上 `/main/`。

**容器起不来或反复重启。** 运行 `docker compose logs studio` 看原因。常见的有：没有先取出 `config.yml`，Docker 建了一个同名的目录，删掉它，重做第 1 步；`storage` 目录的属主不是 UID 1000。
