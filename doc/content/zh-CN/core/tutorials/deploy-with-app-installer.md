---
title: 使用 PM2 部署（app-installer）
description: 构建应用部署包，上传到服务器后使用 app-installer 安装应用，由 PM2 管理运行并部署新版本。
---

`app-installer` 将部署包安装到服务器，由 PM2 管理应用进程，并负责后续的版本切换、备份和回退。应用源码保留在开发机，服务器上的运行配置和业务数据独立于发布版本保存。

## 部署前准备


以下直接通过 IP 和 HTTP 访问的示例仅用于可信网络中的部署验证。通过公网或不可信网络访问时，先配置域名、HTTPS 和反向代理，再登录管理员账号。
开发机需要 Node.js 24、pnpm 11。服务器需要 Node.js 24、全局安装的 PM2 4.3 或以上版本。以下命令使用 Bash，以 Linux x64/glibc、SQLite、单实例为例。其他数据库需要在应用源码中安装对应驱动后重新构建，并在安装时填写连接配置。

示例使用应用名 `my-app`、SSH 目标 `deploy@server`、安装目录 `/srv/nocobase/my-app`、PM2 进程名 `nocobase-my-app`、端口 `13000` 和应用路径 `/main`。替换为自己的目标；多个应用使用独立的目录、端口和进程名。

命令使用 `@nocobase/app-installer@beta`，沿用服务器已有的 npm registry 配置，全部在服务器执行。服务器需要能从配置的 registry 获取安装器。已有部署如需固定安装器版本，可将 `@beta` 替换为指定版本。开发机负责构建、打包和上传部署包。

## 使用 Agent

在应用源码目录中使用开发 Agent；还没有应用时，先[创建应用并进入目录](#创建应用并进入目录)。提前准备服务器访问权限，通过安全方式提供密码和凭据，不写进提示词。应用自己的部署 Skill 提供与项目版本对应的指引。

### 首次部署

替换目标信息后使用：

```text
请在开发机构建、打包并上传当前应用，再在服务器运行 app-installer 完成首次安装，由 PM2 管理运行。

服务器：<SSH 用户和地址>
安装目录：<服务器上的绝对路径>
访问地址：<包含应用路径的完整 URL>
数据库：新建 SQLite 数据库，不导入开发数据或示例数据

请设置管理员登录信息，保留独立的配置和业务数据。
部署后检查登录和一项主要业务操作，再重启应用确认数据仍然保留。
告诉我访问地址、检查结果，以及开机自动启动是否配置完成。
```

### 部署新版本

在已更新并通过测试的应用源码目录中使用：

```text
请在开发机构建、打包并上传当前项目的新版本，再在原服务器运行 app-installer 完成更新。

服务器：<SSH 用户和地址>
原安装目录：<服务器上的绝对路径>
允许停机时间：<维护时间段>

保留原来的访问地址、配置、密钥、数据库和上传文件，不重新初始化。
先检查版本变化和备份范围，再部署新版本。
完成后确认原有数据、用户权限和新功能正常；如果失败，说明恢复结果及对数据的影响。
```

Agent 按相同分工执行：在开发机构建、打包并上传，然后连接服务器，在服务器上运行 app-installer 和 PM2 命令。Agent 与手动执行选择一种即可，两种方式都需要完成后面的访问和持久化验证。

## 手动部署

**开发机终端**负责构建、打包和上传部署包；**服务器终端**负责安装、部署新版本、状态检查、回退和 PM2 管理。建议分别保留两个终端；所有 `@nocobase/app-installer` 命令均在服务器终端执行。

每组命令前标明执行位置。设置密码变量、运行安装命令和清除变量必须在同一个终端中完成。命令中的绝对路径不要求先 `cd` 到安装目录；`storage/exports/dist.tar.gz` 是相对路径，必须在开发机的应用源码目录中使用。

### 创建应用并进入目录

```bash title="开发机 · 应用父目录"
pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

已有应用直接进入源码目录，构建前确认项目测试通过。

### 构建部署包

```bash title="开发机 · 应用源码目录 my-app/"
pnpm build --target linux-x64 --node-version 24 --tar
```

产物为 `storage/exports/dist.tar.gz`，包含 `dist/`、生产依赖和配置模板，不包含开发数据库、密钥和上传文件。服务器不需要为这个包再执行 `pnpm install`。

构建目标的架构、libc 和 Node 主版本需要匹配服务器。ARM64/glibc 使用 `linux-arm64`；Alpine 等 musl 环境使用相应的 musl target。

### 准备服务器

以运行应用的服务账号登录服务器：

```bash title="开发机 · 任意目录"
ssh deploy@server
```

检查运行环境：

```bash title="服务器 · 原服务账号，任意目录"
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
```

未安装 PM2 时，在服务器全局安装：

```bash title="服务器 · 原服务账号，任意目录"
npm install -g pm2
```

由管理员为当前服务账号准备新的空目录：

```bash title="服务器 · 原服务账号，任意目录"
sudo mkdir -p /srv/nocobase/my-app
sudo chown "$(id -u):$(id -g)" /srv/nocobase/my-app
```

后续安装、状态查询和 PM2 管理均使用同一服务账号。安装目标必须是新的或空的目录，不要清空已有部署来安装。

### 在服务器本机安装

先从开发机上传部署包，再切换到服务器终端安装：

```bash title="开发机 · 应用源码目录 my-app/"
scp storage/exports/dist.tar.gz deploy@server:/tmp/my-app.tar.gz
```

在服务器设置密码变量，再执行安装。将 `YOUR_SERVER_IP` 替换为实际服务器 IP：

```bash title="服务器 · 原服务账号，任意目录"
read -r -s -p 'Initial admin password: ' MY_APP_ADMIN_PASSWORD
export MY_APP_ADMIN_PASSWORD
```

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta install /srv/nocobase/my-app \
  --archive /tmp/my-app.tar.gz \
  --origin http://YOUR_SERVER_IP:13000 \
  --base-path /main \
  --host 0.0.0.0 \
  --port 13000 \
  --name nocobase-my-app \
  --dialect sqlite \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=MY_APP_ADMIN_PASSWORD \
  --json
```

```bash title="服务器 · 原服务账号，任意目录"
unset MY_APP_ADMIN_PASSWORD
```

安装器会解压部署包、初始化配置、执行迁移和种子、注册 PM2 进程并启动应用。初始管理员密码只在用户表为空时生效，不用于重置已有账号。

`--set-from-env` 从服务器当前终端读取密码变量；不要把密码直接写进 `--set`。

### 配置访问地址

上述示例直接监听服务器的 `13000` 端口，需要在防火墙或安全组允许访问。`--origin` 不包含路径，`--base-path` 单独设置应用路径，最终访问地址为 `http://YOUR_SERVER_IP:13000/main/`。

使用域名、HTTPS 和同机反向代理时，将首次安装命令中的参数替换为：

```text
--origin https://apps.example.com
--base-path /main
--host 127.0.0.1
--port 13000
```

代理需要转发 `/main/`、保留 Host 和协议头、传递 Cookie，并支持 WebSocket。安装器不自动配置域名和 HTTPS。

### 检查安装结果

返回 JSON 中的 `ok: true` 表示命令成功；`result.started: true` 表示应用通过启动健康检查；`result.url` 是应用入口。使用 `result.initialAdmin.username` 和设置的密码登录。

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/my-app --json
```

确认 `result.health.ok` 为 `true`、`result.process.status` 为 `online`、`result.node.matches` 为 `true`、`result.pending` 为 `null`。在服务器检查健康接口：

```bash title="服务器 · 原服务账号，任意目录"
curl --fail http://127.0.0.1:13000/main/api/healthz
```

返回 `ok: true` 后，在浏览器登录，检查页面刷新和用户权限。使用正式域名时，通过真实域名验证。无法访问时，先在服务器查询 status，再检查 DNS、代理及网络。

### 配置开机启动并验证持久化

```bash title="服务器 · 原服务账号，任意目录"
pm2 startup
```

执行它打印的系统配置命令，再保存进程列表：

```bash title="服务器 · 原服务账号，任意目录"
pm2 save
```

安装目录大致如下：

```text
/srv/nocobase/my-app/
├── installer.json
├── app.env
├── config.yml
├── storage/
├── logs/
├── backups/
├── current -> releases/<release>/app
└── releases/
```

配置和数据保存在 release 之外。创建一条业务记录，应用支持文件时再上传一个文件，然后在服务器重启：

```bash title="服务器 · 原服务账号，任意目录"
pm2 restart nocobase-my-app
```

重新登录，确认原记录、文件和权限仍然保留，定时任务继续运行。服务器开机恢复与应用重启是不同的验证，需要在适合重启服务器的时间单独检查。

## 手动部署新版本

### 构建新部署包

```bash title="开发机 · 应用源码目录 my-app/"
pnpm build --target linux-x64 --node-version 24 --tar
```

构建会覆盖 `storage/exports/dist.tar.gz`，需要留存的旧包先另存。先阅读目标版本的迁移和配置变更说明。

### 查看当前状态和部署计划

先在开发机上传新包：

```bash title="开发机 · 应用源码目录 my-app/"
scp storage/exports/dist.tar.gz deploy@server:/tmp/my-app-new.tar.gz
```

再在服务器执行：

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/my-app --json
```

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/my-app \
  --archive /tmp/my-app-new.tar.gz --json
```

部署新版本使用服务器上的 `upgrade` 命令，不再传 `--origin`、`--host`、`--port`、`--name`、`--set` 等首次安装参数，原配置继续使用。

需要更新时，预检返回 `CONFIRMATION_REQUIRED`，说明停机、备份和迁移影响；此时尚未切换，旧版仍在运行。同一个部署包重复执行可返回 `success-noop`。应用版本号相同但重新构建的包，也可以成为新的 release。

### 确认备份范围

安装器停机后自动备份配置中可识别的 SQLite 数据库、`config.yml` 和 `app.env`。上传文件、外部数据库和对象存储需要另行备份；`--backup-done` 只确认外部数据库备份已完成，不会执行备份或恢复。

当前版本会检查配置、待执行迁移及历史迁移和种子的校验值。如果返回 `CHECKSUM_REPAIR_REQUIRED`，先逐项核对变化及版本说明；普通 `--yes` 不会授权修复。确认合理后，才在同一命令中添加返回计划对应的 `--repair-checksums <token>`。工具会先备份，再执行获批的修复和迁移；不要提前手动修复来绕过预检。

### 确认后执行部署

确认计划、备份和停机时间后，在服务器执行：

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/my-app \
  --archive /tmp/my-app-new.tar.gz --yes --json
```

安装器停止应用、备份、执行迁移、切换版本并启动检查。原配置、密钥和数据继续保留，不重新执行 `install` 或 `config init`。

开头的 `npx --yes` 仅确认获取安装器；命令末尾的 `--yes` 才确认执行本次更新。外部数据库需要先完成备份，再在所选命令中增加 `--backup-done`。

### 验证新版本

重新执行同一目标的 `status`，确认新 release 和健康状态，再通过原地址登录，检查旧记录、上传文件、用户权限、新功能及后台任务。

记录源码版本与包摘要，保留旧部署包和备份。安装器默认保留三个 release，可通过 `--keep` 调整；被清理的 release 不能再直接回退到。

## 更新失败与回退

先保留错误和日志，执行同一目标的 `status`，确认当前运行版本和 `pending`。安装器可能已自动恢复旧版；退出码 `3` 表示更新失败后已回退，`4` 表示回退也失败、应用停机。结合 JSON 的错误和恢复建议判断，不要重新初始化。

在服务器查看回退计划：

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/my-app --json
```

确认数据影响后执行：

```bash title="服务器 · 原服务账号，任意目录"
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/my-app --yes --json
```

先运行不带末尾 `--yes` 的命令，确认后才执行第二条。执行过迁移或校验值修复的更新，回退时可能恢复原 SQLite 备份，丢失备份后的业务写入。外部数据库和上传文件需要各自的恢复流程。只有确认旧版兼容当前数据库，才考虑 `--no-restore`。

执行中断后，先在服务器查询 `status`，检查进程和 `pending`。确认状态后按返回的恢复建议处理，不要立即重复部署。

## 日常管理

以下命令在服务器上以原服务账号执行：

```bash title="服务器 · 原服务账号，任意目录"
# Process status
pm2 status nocobase-my-app

# Logs; press Ctrl+C to stop following
pm2 logs nocobase-my-app --lines 100

# Restart
pm2 restart nocobase-my-app

# Stop
pm2 stop nocobase-my-app

# Resume
pm2 restart nocobase-my-app
```

修改访问 origin、监听地址或端口时，编辑安装目录中的 `app.env`，确认端口可用并同步调整代理，再重启对应进程、查询 status 和验证实际访问地址。不要手工覆盖 `current` 或修改已安装 release 中的构建文件。

## 常见问题

| 现象 | 下一步 |
| --- | --- |
| `PORT_IN_USE` | 为本应用选择空闲端口，并同步修改 origin；不要停止无关进程。 |
| `DRIVER_MISSING` | 在应用源码中添加目标数据库驱动，重新构建部署包。 |
| `START_FAILED` | 查看错误返回的日志路径和安装目录 `logs/`，检查配置、数据库和启动错误。 |
| 状态正常但无法访问 | 检查监听地址、端口、防火墙、DNS 和代理；确认使用包含应用路径的入口地址。 |

排查时保留 JSON 的 `error.code`、`error.message` 和 `error.suggestions`，不要输出含密钥的配置文件。
