---
title: 使用 Docker 部署
description: 用应用自带的 Dockerfile 构建镜像，把应用独立部署到生产环境，并通过 Compose 持久化配置和应用数据。
---

本文以任务应用为例说明部署流程，同样适用于你自己的 NocoBase Core 应用。请先按 [选择部署方式](../deployment/choose-a-deployment-method.md) 确认目标环境；部署自己的项目时，把示例中的应用名称、路径和业务验收项替换为实际内容。

本篇用应用自带的 `Dockerfile` 构建任务应用的镜像，再在自己的生产服务器上用 Docker Compose 启动。镜像中保存代码和生产依赖，服务器上的独立目录保存配置、数据库和上传的文件。

部署前请确认应用已经通过测试；任务示例的测试步骤见 [搭建第一个应用](build-your-first-app.md)。下文以 Linux x64、单实例 SQLite 为例，使用模板提供的 Node.js 24 Debian 镜像。服务器上需要安装 Docker 和 Compose 插件。

## 部署前准备

在构建镜像的开发机和运行容器的服务器上，分别确认 Docker 可以使用；服务器上的 Docker Compose 插件还需要支持下文用到的 `--wait` 参数：

```bash
docker version
docker compose version
docker context show
```

本篇的 shell 命令使用 Bash。后面挂载的目录必须位于实际运行 Docker 服务的服务器上；使用远程 Docker context 时，不要把开发机上的本地目录误当成服务器上的目录。

为这个应用准备新的目录和空闲的端口，并使用独立的 Compose 项目名。下文示例统一使用 `tasks-app`；在同一台服务器上部署多个应用时，请分别更换项目名、目录和宿主机端口。

## 使用 Agent

在应用的源码目录中，向 Agent 提出下面的需求，并把服务器、目录和访问地址替换为你的实际值：

```text
请使用 Docker，把当前任务应用首次部署到下面的环境。

服务器：<我的 Docker 服务器>
服务器平台：linux/amd64
部署目录：<服务器上的绝对路径>/tasks-docker
数据库：新的 SQLite 数据库，不导入开发数据或示例任务
服务器本地监听地址：127.0.0.1:13000
用户访问地址：https://tasks.example.com/tasks/

请按项目的 Docker 部署指引准备应用并启动，只操作这个教程应用。
配置、密码和业务数据需要独立保留，不放进镜像；重建容器后不能丢失。
设置管理员登录信息，妥善保存应用密钥，不在代码或报告中暴露它们。
如果需要的配置或存储位置缺失，请说明问题，不要悄悄用空数据继续运行。

检查登录、任务操作和只读权限，再重建这个应用的容器，确认原来的数据和权限仍然保留。
完成后告诉我访问地址、验证结果，以及域名或 HTTPS 等尚未完成的配置。
```

Agent 应先核对目标服务器、目录和已有的数据，再开始执行。域名、HTTPS 和反向代理需要在目标环境中配置；如果只是在本机演练，把 origin 换成 `http://127.0.0.1:13000`。

## 不使用 Agent

### 1. 在开发机构建镜像

本篇先构建 `dist`，再把它装入镜像。在应用根目录执行：

```bash
pnpm build --target linux-x64 --node-version 24

docker build --platform linux/amd64 \
  --build-arg DIST=prebuilt \
  -t tasks-app:1 .
```

Docker 使用的是项目中的 `dist/` 目录，不读取 `dist.tar.gz`。如果还需要一个供 app-installer 使用的部署包，可以给上面的构建命令加上 `--tar`。

这里的 `linux-x64` 对应镜像平台 `linux/amd64`，两者都使用 glibc；ARM64 服务器需要同时改为 `linux-arm64` 和 `linux/arm64`。Node 的主版本也必须与 Dockerfile 保持一致。

请保留项目自带的 `Dockerfile.dockerignore`，避免把本地配置、数据库或开发依赖带进构建上下文。`DIST=prebuilt` 会检查 `dist` 的平台、Node 主版本和可重定位标记；目标不匹配时，应修正构建参数。

如果构建镜像和运行容器的不是同一台机器，可以通过自己的镜像仓库传输，也可以导出后复制到服务器：

```bash
# Development machine
docker save -o tasks-app-1.tar tasks-app:1
scp tasks-app-1.tar deploy@server:/tmp/tasks-app-1.tar
```

在服务器上加载复制过来的镜像：

```bash
docker load -i /tmp/tasks-app-1.tar
```

可以在导出前和加载后分别执行 `docker image inspect tasks-app:1 --format '{{.Id}}'`，核对镜像的标识是否一致。`docker save` 导出的是镜像，而不是应用数据的备份。

后面的命令都在 Docker 服务器上执行。如果就在本机演练，可以跳过导出和加载。

### 2. 准备持久化目录

```bash
mkdir -p "$HOME/tasks-docker/config" "$HOME/tasks-docker/storage"
cd "$HOME/tasks-docker"
```

请确认这是为本次应用新建的目录。模板中的容器以 `node` 用户运行，UID 为 `1000`，挂载的目录需要允许它写入。在 Linux 上，如果目录属于其他用户，请由管理员只调整这两个新目录的属主，例如 `sudo chown 1000:1000 config storage`。

用镜像中的 CLI 生成配置：

```bash
docker run --rm \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  tasks-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
```

首次启动之前，设置管理员密码：

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

docker run --rm \
  -e TASK_INITIAL_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  tasks-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD

unset TASK_INITIAL_PASSWORD
```

请保存好生成的 `config/config.yml`。其中的密钥需要与数据库一起备份，备份文件应限制访问。不要在每次重启时重新生成配置。初始管理员的设置只在用户表为空、首次初始化时生效。

### 3. 创建 Compose 文件

在部署目录中创建 `compose.yml`：

```yaml
services:
  app:
    image: tasks-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /tasks
      APP_PUBLIC_ORIGIN: https://tasks.example.com
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config/config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
```

`APP_PUBLIC_ORIGIN` 不包含应用路径，路径由 `APP_BASE_PATH` 指定。容器内监听 `0.0.0.0:13000`，宿主机只在回环地址上开放端口；域名、HTTPS、路径转发和 WebSocket 由服务器上的反向代理负责。首次演练使用本机 origin 时，直接访问 `http://127.0.0.1:13000/tasks/`。

这里使用长格式的挂载声明，并设置 `create_host_path: false`：配置或数据目录不存在时会直接报错，而不会自动创建一个错误的空目录。`config.yml` 在运行的容器中是只读的；SQLite、上传的文件和其他需要持久化的内容，都位于可写的 `storage` 挂载中。

### 4. 检查配置并启动

```bash
docker compose -p tasks-app config --quiet

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p tasks-app up -d --wait --wait-timeout 180

docker compose -p tasks-app ps
docker compose -p tasks-app logs --tail=80 app
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

`--wait` 会等待镜像中的健康检查通过，避免在容器刚启动时就去访问。如果等待超时或报告 unhealthy，请先查看 `ps` 和 `logs` 的输出，不要反复创建容器。`config check --connect` 用于在启动前检查配置和数据库连接，真正的应用迁移和基础数据初始化在启动时执行。

确认健康检查接口返回 `ok: true`、base path 为 `/tasks`，并且日志中没有迁移或数据库连接失败的信息，再通过实际的访问地址登录。使用初始管理员的用户名（模板默认为 `nocobase`）和刚才设置的密码。当前的入门示例会通过必需的 Seed 初始化任务角色；开发环境中的团队用户、角色分配和任务不会随镜像复制过来。

配置好反向代理后，还要从实际的访问网络打开 `https://tasks.example.com/tasks/`，验证登录、页面刷新和任务操作。容器状态为 healthy，只能证明容器内的应用正常，并不能替你验证域名、HTTPS 或代理的配置。

### 5. 验证容器重建后数据保留

先新建一条任务，把它标记为完成，然后刷新页面。接着重建这个 Compose 项目的容器：

```bash
docker compose -p tasks-app up -d --force-recreate --wait --wait-timeout 180
```

命令成功后，重新打开任务页面，确认同一条任务及其完成状态仍然存在，管理员仍可以用原来的密码登录。再按 [搭建第一个应用](build-your-first-app.md) 中的权限说明配置一个普通的只读用户，确认这个用户能查看任务，但不能新建或完成任务。

需要停止演练环境时，在同一个部署目录中执行 `docker compose -p tasks-app down`，并保留宿主机上的 `config` 和 `storage` 目录。再次执行上面的 `up` 命令，就会继续使用原有的数据；不要重新运行 `config init`。

## 部署新版本

业务功能修改并验证之后，按前面的构建步骤生成新的镜像，使用新的标签（例如 `tasks-app:2`），并传到目标服务器。更新流程的概览见 [发布应用新版本](../deployment/publish-app-release.md)。

在原来的部署目录中备份数据库、文件和配置，修改 Compose 中的 `image`，保留原来的挂载路径和密钥。然后用新镜像检查配置、迁移和历史校验值：

```bash
docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

这些命令只做检查，不会启动第二个应用服务。确认不需要修复校验值、迁移适用于已有的数据，并且已经完成备份之后，执行 `docker compose -p tasks-app up -d --wait --wait-timeout 180`。启动时会执行新增的迁移；随后核对旧的任务、角色以及新功能。切换回旧镜像只会更换代码，并不会撤销数据库迁移或业务写入。

与 Agent 一起执行时，提供原来的 Compose 目录、项目名和新镜像的标签，要求它沿用原有的配置和数据，先检查更新计划，再在授权的范围内替换容器；不要重新初始化配置。

修改运行配置之后，同样要在原部署目录中重建容器：

```bash
docker compose -p tasks-app up -d --force-recreate --wait --wait-timeout 180
```

配置工具可能通过替换文件的方式保存内容，而使用单文件 bind mount 的旧容器可能仍然指向旧的文件；重建容器会重新挂载配置。修改 Compose 中的环境变量也需要重新创建容器，单独执行 `docker restart` 不会应用新的容器环境。

## 遇到问题时

| 现象 | 下一步 |
| --- | --- |
| `bind source path does not exist` | 核对当前的部署目录，先生成配置文件并创建 storage，确认这些文件位于 Docker 服务器上。 |
| `permission denied` / `EACCES` | 核对挂载目录和配置文件的属主与权限，确保容器中的 UID 1000 可以读取配置并写入 storage。 |
| 宿主机端口已被占用 | 更换 Compose `ports` 中冒号左侧的宿主机端口；如果直接通过这个端口访问，还要同时更新 origin。 |
| 容器 unhealthy 或等待超时 | 查看该 Compose 项目的日志，检查数据库、迁移和启动错误，再核对 base path。 |

本篇已经验证：预构建镜像、同一台机器上的 `save/load`、配置初始化、自定义管理员密码、Compose 健康等待、任务与权限测试，以及容器重建后同一条任务和配置仍然保留；挂载源缺失时会直接失败。实际演练使用的是本机回环地址，尚未验证跨服务器复制、正式域名与 HTTPS、跨版本升级或回滚。

本篇的部署实操记录和截图来自此前的演练，不能视为当前 `1.0.0-beta.81` npm 示例已经重新完成了部署验证。
