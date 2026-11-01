---
title: 使用 Docker 部署
description: 让 Agent 构建并部署 Docker 应用，保留独立配置与数据，并验证容器重建后的持久化。
---

## 准备应用、服务器与访问地址

<a id="部署前准备"></a>

准备已通过测试的源码和目标提交。构建机需要 Docker；运行服务器需要 Docker 与支持 `--wait` 的 Compose 插件。确认 Docker context 指向哪台机器，挂载路径必须位于 daemon 所在服务器。

提供部署目录、CPU 架构、空闲端口及用户访问 URL。反向代理需要转发应用路径、Cookie 和 WebSocket，并保留 Host 与协议头。配置和 `storage` 独立于镜像保存，模板容器的 UID 1000 必须能读取配置、写入数据。

## 告诉 Agent 部署需求

<a id="使用-agent"></a>

在应用源码目录提出需求，替换占位内容：

```prompt
请用 Docker 把当前应用部署到 <服务器>，使用 <新部署目录>，用户从 <URL> 访问。首次使用新的数据库，不导入开发数据。配置和数据要独立保存，重建容器后仍能使用。先列出部署方案，等我确认后执行。
```

若要迁入已有数据，明确替换“新的数据库”，并提供备份及恢复目标。

## 确认部署方案

核对源码提交、镜像标签与目标架构、Node 主版本、部署目录、端口、数据库和挂载路径。确认管理员配置、密钥保存方式，以及域名、HTTPS 和代理由谁完成。

运行参数中 `APP_PUBLIC_ORIGIN` 只含协议和主机，应用路径由 `APP_BASE_PATH` 设置。确认所选存储均可持久化后再允许启动。

## 让 Agent 构建并部署应用

让 Agent 用应用自带的 `Dockerfile` 和 `Dockerfile.dockerignore` 构建镜像，或把匹配目标的 `dist/` 装入镜像。预构建模式会检查 Linux/glibc、架构、Node 主版本和可重定位标记。

首次生成配置并设置管理员密码；以后保留配置和稳定密钥。先检查 Compose、配置与数据库连接，再启动并等待健康检查。镜像需跨机传输时，核对传输前后的镜像 ID；导出镜像不包含业务数据。

## 验证访问与数据持久化

从实际 URL 登录，创建一条可识别记录，记录 ID；核对普通用户的读写边界。涉及文件时上传并下载文件。商品目录的具体业务操作见[示例说明](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish)。

要求 Agent 重建同一 Compose 项目的容器，重新登录并读取同一记录和文件。核对挂载位置及密钥未改变，确认代理下的刷新、接口和实时连接可用。后续变更按[更新与恢复](../deployment/publish-app-release.md)执行。

## 手动部署参考

<a id="不使用-agent"></a>
<a id="1-在开发机构建镜像"></a>
<a id="2-准备持久化目录"></a>
<a id="3-创建-compose-文件"></a>
<a id="4-检查配置并启动"></a>
<a id="5-验证容器重建后数据保留"></a>

以下 Bash 示例使用 Linux x64/glibc、Node.js 24、SQLite 和本机 `/shop` 地址。它们是示例配置；正式环境换成自己的地址和已安装驱动。先检查 `docker version`、`docker compose version` 与 `docker context show`。

在应用源码目录构建：
```bash
pnpm build --target linux-x64 --node-version 24
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app:1 .
```

也可直接 `docker build --platform linux/amd64 -t my-app:1 .` 从源码构建。ARM64 同时改用 `linux-arm64` 与 `linux/arm64`。跨机可使用镜像仓库，或 `docker save -o my-app-1.tar my-app:1`、复制后在服务器 `docker load -i my-app-1.tar`。

在服务器的新部署目录生成配置；先由目录管理员保证 `config` 和 `storage` 对 UID 1000 可写，仅调整本应用目录：
```bash
mkdir -p config storage
# Run in the new deployment directory on the Docker server.
docker run --rm --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
docker run --rm -e APP_INITIAL_PASSWORD -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config set --from-env users.initialAdmin.password=APP_INITIAL_PASSWORD
unset APP_INITIAL_PASSWORD
```

保存为 `compose.yml`：
```yaml
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /shop
      APP_PUBLIC_ORIGIN: http://127.0.0.1:13000
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

正式访问如 `https://apps.example.com/shop/` 时，将 origin 改为 `https://apps.example.com`，另行配置代理。长格式挂载拒绝不存在的源路径，避免误用空目录。

在该部署目录检查、启动及重建：
```bash
docker compose -p my-app config --quiet
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app up -d --wait --wait-timeout 180
curl --fail http://127.0.0.1:13000/shop/api/healthz
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

健康接口应返回 `ok: true` 及正确的 base path。首次管理员用户名默认为 `nocobase`；密码使用刚设置的值。重建前后按上节核对数据。结束演练用 `docker compose -p my-app down`，保留配置与数据目录。

配置变更、备份、日志和故障处理见[日常维护与排错](../deployment/maintenance-and-troubleshooting.md)。

<a id="部署新版本"></a>

[更新与恢复](../deployment/publish-app-release.md)

<a id="遇到问题时"></a>

[日常维护与排错](../deployment/maintenance-and-troubleshooting.md)

> [!NOTE]
> 这些 Docker 命令尚未完成运行验证。发布前在 Docker 主机演练镜像构建、容器重建和恢复。
