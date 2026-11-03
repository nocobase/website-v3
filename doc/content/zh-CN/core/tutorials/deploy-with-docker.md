---
title: 使用 Docker 部署
description: 创建应用并构建 Docker 镜像，在服务器配置持久化存储，通过 Docker Compose 首次部署应用和部署新版本。
---

## 部署前准备

以下直接通过 IP 和 HTTP 访问的示例仅用于可信网络中的部署验证。通过公网或不可信网络访问时，先配置域名、HTTPS 和反向代理，再登录管理员账号。

开发机需要 Node.js 24 或更高版本、pnpm 11 和 Docker；服务器需要 Docker 和支持 `--wait` 的 Docker Compose 插件。以下命令使用 Bash，以 Linux x64、SQLite、单实例部署为例。使用其他数据库时，先在应用中安装对应驱动，再构建镜像，并在服务器填写数据库连接配置。

在开发机和服务器分别检查 Docker，服务器还需检查 Compose：

```bash
docker version
docker context show
docker compose version
```

下文使用 `my-app` 作为应用和 Compose 项目名，服务器端口为 `13000`。部署多个应用时，分别使用独立的项目名、部署目录和端口。挂载目录必须位于 Docker 服务实际运行的服务器上。

## 使用 Agent

在应用源码目录中使用开发 Agent；还没有应用时，先[创建应用并进入目录](#创建应用并进入目录)。Agent 部署和手动执行是两种方式，选择一种即可。

先让 Agent 能连接目标服务器，并准备好 Docker 操作权限。使用镜像仓库时，提前配置仓库登录。密码和访问凭据通过安全方式提供，不写进提示词。应用自带的 `AGENTS.md` 和 `nocobase-deployment` Skill 提供与项目版本对应的部署指引。

### 首次部署

将下面的服务器、目录和访问地址替换为自己的环境。数据库可以使用新的 SQLite，也可以填写实际的外部数据库连接要求；镜像传输选择镜像仓库或文件传输。

```text
请把当前应用用 Docker 部署到我的服务器，这是首次部署。

服务器：<SSH 用户和地址>
部署目录：<服务器上的绝对路径>
访问地址：<包含应用路径的完整 URL>
数据库：新建 SQLite 数据库，不导入开发数据或示例数据
镜像传输：导出镜像文件后通过 SSH 传到服务器

请配置管理员登录，并把配置和业务数据保存在服务器上，重建容器后仍能继续使用。
部署后检查登录和一项主要业务操作，再重建容器确认数据没有丢失，告诉我访问地址和检查结果。
```

使用镜像仓库时，将传输要求换成“通过 `<镜像仓库地址>` 推送和拉取镜像”。使用域名和 HTTPS 时，说明已有的代理配置或需要完成的配置。服务器架构、可用端口和 Docker 环境可由 Agent 检查。

完成后按[访问和持久化验证](#验证访问和数据持久化)检查结果。Agent 无法连接服务器时，只能准备配置和命令，实际部署仍需在服务器执行。

### 部署新版本

在已更新并通过测试的应用源码目录中使用以下提示词。明确允许停机的时间；版本检查、备份和切换都在原部署环境进行。

```text
请将当前项目的新版本部署到服务器，替换已运行的版本。

服务器：<SSH 用户和地址>
原部署目录：<服务器上的绝对路径>
Compose 项目名：<原项目名>
新镜像标签：<例如 my-app:2>
允许停机时间：<维护时间段>

沿用现有的镜像传输方式、访问地址、配置、密钥和业务数据，不重新初始化。
先检查版本变化并完成备份，再更新应用。部署后检查原有数据、用户权限和新功能，告诉我结果；如果部署失败，请说明能否恢复，以及是否会影响数据。
```

确认 Agent 已完成[版本检查与备份](#检查版本变更并备份)，并按[新版本验证](#启动新版本并验证)核对结果。回退前仍需确认数据库兼容性，不能把切回旧镜像当作数据恢复。

## 手动部署

### 创建应用并进入目录

在开发机执行：

```bash
pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

已有应用直接进入源码目录。构建前确认应用已通过自身的测试，并保留项目自带的 `Dockerfile`、`Dockerfile.dockerignore`、`config.example.yml` 和锁文件。旧项目缺少 Docker 文件时，从匹配版本的应用模板补齐。

### 构建 Docker 镜像

在应用根目录执行：

```bash
docker build --platform linux/amd64 -t my-app:1 .
```

Dockerfile 会安装依赖并构建应用，无需提前执行 `pnpm build`。ARM64 服务器将平台改为 `linux/arm64`。

镜像包含代码和生产依赖，不包含开发环境的配置、数据库和上传文件。`Dockerfile.dockerignore` 排除本地配置和数据，必须与 Dockerfile 一起保留。运行配置在服务器单独准备。

### 传输镜像：镜像仓库或镜像文件

选择一种方式；构建和运行在同一台 Docker 服务器时可跳过。

**通过镜像仓库**

将 `registry.example.com/team` 替换为自己的仓库地址。开发机执行：

```bash
docker tag my-app:1 registry.example.com/team/my-app:1
docker login registry.example.com
docker push registry.example.com/team/my-app:1
```

服务器执行：

```bash
docker login registry.example.com
docker pull registry.example.com/team/my-app:1
docker tag registry.example.com/team/my-app:1 my-app:1
```

最后一条命令添加本地标签，后面的命令统一使用 `my-app:1`。也可以直接使用完整仓库名称，同时替换后续命令和 Compose 中的镜像名。

**通过镜像文件**

开发机执行，将 `deploy@server` 替换为服务器的 SSH 用户和地址：

```bash
docker save -o my-app-1.tar my-app:1
scp my-app-1.tar deploy@server:/tmp/my-app-1.tar
```

服务器执行：

```bash
docker load -i /tmp/my-app-1.tar
```

`docker save` 保存的是镜像，不是业务数据备份。

### 创建服务器部署目录

后续命令全部在服务器执行。首次部署使用新目录：

```bash
mkdir -p "$HOME/my-app-deploy/storage"
cd "$HOME/my-app-deploy"
sudo chown 1000:1000 . storage
```

模板容器使用 UID `1000` 的 `node` 用户。初始化配置时需要写入部署目录，运行时需要写入 `storage/`。这里仅调整新建部署目录和 storage 的属主，不递归修改其他文件。

### 初始化配置并设置管理员密码

用镜像中的 CLI 在当前目录生成 `config.yml`：

```bash
docker run --rm \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config init \
  --dialect sqlite \
  --config /config/config.yml
```

设置初始管理员密码：

```bash
read -r -s -p 'Initial admin password: ' MY_APP_ADMIN_PASSWORD
export MY_APP_ADMIN_PASSWORD

docker run --rm \
  -e MY_APP_ADMIN_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=MY_APP_ADMIN_PASSWORD

unset MY_APP_ADMIN_PASSWORD
```

模板默认管理员用户名为 `nocobase`。初始管理员配置只在用户表为空时生效，不用于重置已有账号的密码。

保留生成的 `config.yml`，其中的应用密钥需要与数据库配套备份并限制访问。重启和部署新版本时不重新初始化配置。镜像中的运行环境没有 pnpm，管理命令使用 `node dist/cli/index.js`。

### 创建 Docker Compose 文件

在部署目录创建 `docker-compose.yml`。目录属主已交给容器用户，以下通过 `sudo tee` 写入文件：

```bash
sudo tee docker-compose.yml > /dev/null <<'YAML'
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '13000:13000'
    environment:
      APP_BASE_PATH: /main
      APP_PUBLIC_ORIGIN: http://YOUR_SERVER_IP:13000
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
YAML
```

使用 `sudo vi docker-compose.yml` 将 `YOUR_SERVER_IP` 替换为实际服务器 IP。目录结构为：

```text
my-app-deploy/
├── docker-compose.yml
├── config.yml
└── storage/
```

配置以只读方式挂载，数据库和上传文件保存在可写的 `storage/` 中。`create_host_path: false` 让缺失的配置文件或存储目录直接报错，避免意外创建空目录。`APP_SAMPLE_DATA: 'false'` 关闭首次安装时的可选示例数据。

`APP_PUBLIC_ORIGIN` 是用户访问的协议、主机和端口，不包含应用路径；路径由 `APP_BASE_PATH` 指定。这里直接开放服务器的 `13000` 端口，需要在防火墙或安全组允许访问。

使用正式域名和 HTTPS 时，将 origin 改为实际地址，例如 `https://apps.example.com`，并配置反向代理转发 `/main/`、保留 Host 和协议头、传递 Cookie 及支持 WebSocket。代理在同一宿主机上时，可将端口映射改为 `127.0.0.1:13000:13000`，只允许本机代理连接。

### 检查配置并启动应用

在部署目录执行：

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app up -d --wait --wait-timeout 180
```

前两条命令检查 Compose 配置、应用配置和数据库连接；不执行数据库迁移。默认配置会在应用启动时执行迁移和基础数据初始化。如果应用关闭了自动迁移或自动种子，需要按应用的部署规则先单独执行。

查看状态和日志：

```bash
docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

`--wait` 等待镜像的健康检查通过。超时或 unhealthy 时，先检查日志中的数据库连接、权限和迁移错误。

### 验证访问和数据持久化

替换实际服务器 IP 后检查健康接口：

```bash
curl --fail http://YOUR_SERVER_IP:13000/main/api/healthz
```

确认返回 `ok: true`，再打开 `http://YOUR_SERVER_IP:13000/main/`，使用 `nocobase` 和设置的密码登录。使用反向代理时，通过真实域名验证访问。

检查页面刷新、管理员和普通用户权限，并完成一项业务操作，例如创建并查询一条记录。应用使用文件存储时，验证上传和下载。随后重建容器：

```bash
docker compose -p my-app up -d \
  --force-recreate \
  --wait \
  --wait-timeout 180
```

重新登录，确认同一条记录、文件和权限仍然保留；应用使用定时任务时，也要确认任务继续运行。健康检查通过不能代替这些业务验证。

## 手动部署新版本

### 构建并传输新镜像

在开发机更新并验证应用代码后，在源码目录构建新标签的镜像：

```bash
docker build --platform linux/amd64 -t my-app:2 .
```

按[镜像传输步骤](#传输镜像镜像仓库或镜像文件)将新镜像传到服务器，把命令中的标签 `1` 和文件名 `my-app-1.tar` 分别换为 `2` 和 `my-app-2.tar`。使用仓库传输时，同样添加本地标签 `my-app:2`。

### 检查版本变更并备份

先阅读新版本的迁移、配置变更和升级说明。部署新版本时沿用原部署目录、配置、密钥和数据，不执行 `config init`。

下面的停机备份适用于数据库和本地文件都保存在 `storage/` 的 SQLite 部署。外部数据库和对象存储需要使用相应的备份方式，并与配置、文件保持一致的恢复时间点。

在服务器执行：

```bash
cd "$HOME/my-app-deploy"
docker compose -p my-app stop

mkdir -p "$HOME/my-app-backups"
chmod 700 "$HOME/my-app-backups"

sudo tar -czf \
  "$HOME/my-app-backups/my-app-$(date +%Y%m%d-%H%M%S).tar.gz" \
  config.yml storage docker-compose.yml
```

确认备份成功并检查归档包含配置、storage 和 Compose 文件，再继续部署。保留旧镜像，并确认备份的恢复方法。

### 更新镜像标签并检查迁移

用 `sudo vi docker-compose.yml` 将 `image: my-app:1` 改为 `image: my-app:2`，保留原来的挂载路径。若新版本需要新增配置，在原 `config.yml` 上调整并保持容器用户可读。

使用新镜像检查：

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

数据库命令检查默认连接；使用多个数据库的应用需要检查其他相关连接。确认待执行的迁移和种子符合预期。若报告历史迁移校验值变化，按目标版本的升级说明处理，不直接去掉 `--dry-run` 执行修复。

### 启动新版本并验证

```bash
docker compose -p my-app up -d --wait --wait-timeout 180

docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

默认配置会在启动时应用新增迁移。通过原访问地址登录，检查旧记录、文件、权限、新功能和后台任务。保留部署新版本前的备份和旧镜像，直到确认新版本可用。

### 回退时的数据处理

将镜像标签改回旧版本只会更换代码，不会撤销数据库迁移或部署新版本后的业务写入。先确认旧版本与当前数据库兼容，再决定是否仅切换镜像。

需要恢复备份时，先停止应用，再配套恢复部署新版本前的数据库、文件、配置和镜像版本。恢复到部署新版本前备份会失去备份之后的业务写入，不能与无损回退混为一谈。

## 停止和启动应用

在原部署目录执行：

```bash
cd "$HOME/my-app-deploy"

# Stop and remove the containers; keep host configuration and data.
docker compose -p my-app down

# Start again with the same configuration and data.
docker compose -p my-app up -d --wait --wait-timeout 180
```

修改配置文件或 Compose 环境变量后，重建容器以重新加载配置和挂载：

```bash
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

单独执行 `docker restart` 不会应用新的容器环境变量；配置工具替换文件后，旧容器的单文件挂载也可能仍指向旧文件。

## 常见问题

| 现象 | 处理方法 |
| --- | --- |
| 配置文件或挂载目录不存在 | 核对服务器上的部署目录，确认已生成 `config.yml` 并创建 `storage/`。 |
| `permission denied` / `EACCES` | 确保容器 UID 1000 可读取配置并写入 storage；初始化配置还需要部署目录可写。 |
| 宿主机端口被占用 | 修改 `ports` 左侧的宿主机端口；直接访问该端口时，同步修改 `APP_PUBLIC_ORIGIN`。 |
| 容器 unhealthy 或等待超时 | 查看 `ps` 和 `logs`，检查数据库、迁移、文件权限和应用路径。 |
| 容器 healthy，但其他电脑无法访问 | 检查服务器 IP、端口映射、防火墙和安全组；使用域名时检查代理、DNS 和 HTTPS。 |
| 登录后跳转地址不正确 | 核对 `APP_PUBLIC_ORIGIN` 和 `APP_BASE_PATH` 是否与实际访问地址一致，再重建容器。 |
