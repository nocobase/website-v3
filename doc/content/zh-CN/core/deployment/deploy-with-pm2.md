---
title: 使用 PM2 部署
description: 让 Agent 通过 app-installer 安装应用，验证 PM2 托管、访问及重启后的数据。
---

## 准备应用与服务器

<a id="部署前准备"></a>

开发机准备已测试的源码、锁文件和 pnpm；服务器准备 Node.js 24、PATH 中可用的 PM2 4.3 及以上版本、tar，以及固定服务账号可写的新安装目录。安装与后续管理使用同一账号。

确认系统、CPU 和 libc 与构建目标匹配，数据库驱动已装入应用。提供空闲端口、访问地址、数据库和文件存储方案。反向代理及 HTTPS 由服务器环境配置。

执行 npx 的机器需要 registry 访问；SSH 部署会传输安装器和部署包，目标服务器不需要源码、Agent 或联网安装依赖。

## 告诉 Agent 部署需求

<a id="使用-agent"></a>

在应用源码目录提供目标：

```prompt
请用 app-installer 将当前应用首次部署到 <SSH 服务器> 的 <新安装目录>，由 PM2 托管，通过 <URL> 访问。使用新的数据库并保留独立配置和文件存储。先说明运行配置和部署方案，等我确认后安装。
```

通过安全渠道提供管理员密码与数据库凭据。需要迁入旧数据时，说明备份和恢复目标。

## 确认安装目录与运行配置

核对服务器、服务账号、新目录、唯一 PM2 名称、端口、Node 版本、产物摘要和数据位置。`--origin` 不含应用路径，`--base-path` 单独指定路径；默认监听回环地址，由代理对外提供访问。

SSH 使用非交互登录与严格主机密钥检查。提前确认服务器指纹以及该账号的非交互 PATH 能找到 Node、PM2 和 tar。

## 让 Agent 使用 app-installer 部署

让 Agent 构建匹配目标的 archive，传输后核对摘要，再由安装器在新目录安装、初始化配置及迁移、启动 PM2 并检查健康。本文固定安装器 beta.10，不要求顺带升级应用模板。

`config.yml`、`app.env`、`storage/`、日志和备份位于版本目录之外，`current` 指向运行版本。后续更新使用原安装目录，不能再次按首次安装处理。

## 验证访问与进程托管

检查安装结果 `ok: true`、`result.started: true`，并通过 status 核对 `result.health.ok`、`result.process.status`、`result.node.matches` 和 `result.pending`，预期为 `true`、`online`、`true`、`null`。

从实际访问 URL 登录并完成业务读写及权限检查，记录一条数据和文件；商品业务步骤见[示例说明](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish)。重启本应用的 PM2 进程后，再验证同一记录、文件和权限。

安装器保存进程列表，主机开机恢复仍需服务账号按返回的 `nextCommands` 配置 `pm2 startup` 及打印的系统命令，并在可停机环境验证重启主机。SSH 返回 `result.remote.publicHealth: false` 时，排查公开地址的 DNS、代理和网络。

## 手动部署参考

<a id="不使用-agent"></a>
<a id="1-在开发机构建"></a>
<a id="2-选择本机安装或-ssh-部署"></a>
<a id="3-检查安装结果"></a>
<a id="4-验证托管与持久化"></a>
<a id="使用-agent-1"></a>
<a id="不使用-agent-1"></a>

以下为 Bash、Linux x64/glibc、Node.js 24 和 SQLite 示例。服务器先检查 `node --version`、`command -v pm2`、`command -v tar`；PM2 由维护者准备。开发机在应用目录构建：
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

得到 `storage/exports/dist.tar.gz`，含运行依赖。复制到服务器 `/tmp/my-app.tar.gz` 后，以服务账号安装到新目录；无 `/srv` 权限时替换为账号自己的可写目录：
```bash
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
npx --yes @nocobase/app-installer@0.1.0-beta.10 install /srv/nocobase/my-app \
  --archive /tmp/my-app.tar.gz --origin http://127.0.0.1:13000 \
  --base-path /shop --host 127.0.0.1 --port 13000 --name nocobase-my-app \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=APP_INITIAL_PASSWORD --json
unset APP_INITIAL_PASSWORD
```

初始管理员设置只在空用户表生效。检查 JSON 返回的用户名，自定义密码应使 `result.initialAdmin.defaultPassword` 为 `false`。安装后检查与重启：
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 status --dir /srv/nocobase/my-app --json
curl --fail http://127.0.0.1:13000/shop/api/healthz
pm2 restart nocobase-my-app
```

从开发机通过 SSH 安装时，将上面 `install /srv/nocobase/my-app` 换成 `deploy --ssh deploy@server --dir /srv/nocobase/my-app`，并把 `--archive` 换为本地包路径。先用 `ssh deploy@server 'node --version && command -v pm2 && command -v tar'` 检查环境。自定义连接使用 `--ssh-port`、`--ssh-identity` 或 `--ssh-config`；后续 status 同样保留连接参数。

`--set-from-env` 在执行安装器的机器读取变量，通过 SSH 加密传输。`npx --yes` 只确认获取工具；安装器自己的 `--yes` 才确认更新或回滚计划。

后续操作见[更新与恢复](publish-app-release.md)及[日常维护与排错](maintenance-and-troubleshooting.md)。

<a id="部署新版本"></a>
<a id="更新失败与回退"></a>

[更新与恢复](publish-app-release.md)

<a id="遇到问题时"></a>

[日常维护与排错](maintenance-and-troubleshooting.md)

> [!NOTE]
> beta.85 示例已在本机 Node.js 24、PM2 6.0.14、安装器 beta.10 和 SQLite 环境验证安装、原生登录、业务写入及重启持久化。SSH、公开代理与 HTTPS、主机开机恢复尚未验证。
