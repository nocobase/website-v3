---
title: 使用 PM2 部署（app-installer）
description: 用 app-installer 安装和更新生产应用，由 PM2 托管进程，并保留独立的运行配置和数据。
---

本文以任务应用为例说明部署流程，同样适用于你自己的 NocoBase Core 应用。请先按 [选择部署方式](../deployment/choose-a-deployment-method.md) 确认目标环境；部署自己的项目时，把示例中的应用名称、路径和业务验收项替换为实际内容。

本篇把任务应用独立部署到自己的生产服务器上，由 PM2 托管应用进程。`@nocobase/app-installer` 负责解压发布包、生成配置、执行迁移、启动 PM2 进程并检查健康状态，之后的应用升级也通过它完成。

部署前请确认应用已经通过测试；任务示例的测试步骤见 [搭建第一个应用](build-your-first-app.md)。下文以单实例、SQLite、Linux x64/glibc、Node.js 24 为例，应用路径为 `/tasks`。使用其他数据库时，需要先在源码项目中安装相应的驱动，再重新构建。

## 部署前准备

开发机上保留源码、Node.js 以及项目要求的 pnpm。服务器需要 Node.js 24、全局安装的 pm2（4.3 或以上版本）、tar，以及一个可写的部署目录。本篇的命令使用 Bash。

在服务器上检查：

```bash
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
command -v tar
```

如果没有 pm2，请先由服务器的维护者执行 `npm install -g pm2` 安装。部署归属于一个固定的服务账号，之后的管理也使用这个账号。请管理员提前为这个账号准备一个可写的空目录；如果没有 `/srv` 的写权限，本机演练时可以改用 `$HOME/tasks`，并同步替换后面所有的 `--dir`。

本篇的示例目录为 `/srv/nocobase/tasks`，监听地址为 `127.0.0.1:13000`。正式的访问地址 `https://tasks.example.com/tasks/` 由服务器上的反向代理提供；请准备好对应的域名和 HTTPS，并保留转发的路径和 WebSocket 升级头。只在本机演练时，可以把 origin 换成 `http://127.0.0.1:13000`。请先确认端口没有被其他应用占用；部署多个应用时，分别使用不同的目录、端口和 pm2 进程名。

运行 `npx` 的机器需要能访问 npm registry。如果服务器无法联网，可以在开发机上使用 `deploy --ssh`，由工具传输安装器和部署包，服务器不需要访问 npm。

## 使用 Agent

在应用的源码目录中，向 Agent 提供明确的目标：

```text
请使用 app-installer，把当前任务应用首次部署到下面的服务器。

服务器：<我的 SSH 服务器别名>
安装目录：/srv/nocobase/tasks，使用新目录和新的 SQLite 数据库
服务器环境：Linux x64/glibc，Node.js 24
应用在服务器上监听：127.0.0.1:13000
用户访问地址：https://tasks.example.com/tasks/

请按项目部署指引先检查目标和运行条件，准备好应用再安装。
只操作这个教程应用，不导入开发数据，不添加示例任务。
设置管理员登录信息，用安全方式读取我提供的密码，不在输出或代码里暴露密码和密钥。

部署后实际检查登录、任务操作和只读成员的权限。
重启这个应用，确认之前创建的任务和权限仍然保留。
完成后告诉我访问地址、验证结果，以及还有哪些环境配置需要我处理。
```

请把占位值替换为实际的目标。Agent 可以在开发机上执行 `deploy --ssh`，服务器上不需要安装 Agent、源码或项目依赖。工具会通过 SSH 传输安装器和应用包，但服务器仍然需要事先具备 Node.js、pm2 和 tar。

## 不使用 Agent

### 1. 在开发机构建

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

构建完成后会得到 `storage/exports/dist.tar.gz`。可以执行 `sha256sum storage/exports/dist.tar.gz` 记录这次发布包的摘要。target 与 Node 的主版本都必须与服务器一致；ARM 或 musl 环境请使用相应的 target。包内已经包含生产依赖，服务器上不需要为这个包再运行 `pnpm install`。

### 2. 选择本机安装或 SSH 部署

两种方式使用同一个部署包，任选其一即可。

**A. 在服务器上操作**

先在开发机上复制部署包：

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks.tar.gz
```

再以部署用的服务账号登录服务器，执行安装：

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta install /srv/nocobase/tasks \
  --archive /tmp/tasks.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks \
  --host 127.0.0.1 \
  --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

**B. 在开发机上通过 SSH 部署**

请提前配置好 SSH 密钥登录，并通过可信的方式核对服务器的指纹。安装器使用非交互式连接，并严格检查主机密钥；请先在开发机上确认下面的命令可以直接执行：

```bash
ssh deploy@server 'node --version && command -v pm2 && command -v tar'
```

如果这些工具只有在交互式终端中才能使用，需要先修正这个账号在非交互式 SSH 下的 PATH。使用非默认的端口、密钥或配置文件时，分别添加 `--ssh-port`、`--ssh-identity`、`--ssh-config`；之后的 status 和更新命令也要带上相同的参数。

下面的命令在开发机上执行。`--archive` 指向开发机上的文件，`--dir` 是服务器上的绝对路径：

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server \
  --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks \
  --host 127.0.0.1 \
  --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

两种首次安装的命令，都要求目标目录是新的或空的。`--origin` 不包含 `/tasks`，应用路径由 `--base-path` 单独设置。默认只监听回环地址；如果打算直接通过服务器的 IP 和端口访问，需要明确设置 `--host 0.0.0.0`、对应的 origin，以及网络访问规则。

`--set-from-env` 从执行安装器的机器上读取环境变量；使用 SSH 方式时，值会通过加密连接传入，不需要在服务器上再 export 一次。初始密码只在新数据库中创建管理员时生效，不能用来重置已有的账号。

`npx --yes` 只是跳过下载工具时的提示，并不代表同意之后的升级或回滚。不要把密码写在 `--set` 中。

### 3. 检查安装结果

先确认返回的 JSON 中 `ok: true`、`status: "success"`。`result.started: true` 表示应用已经启动并通过了健康检查，`result.url` 是配置好的应用入口。使用 `result.initialAdmin.username` 和刚才设置的密码登录；使用了自定义密码时，`result.initialAdmin.defaultPassword` 应为 `false`。

在服务器上检查状态：

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json
```

从开发机检查远程安装时，在同一条命令中加上 `--ssh deploy@server`。检查 `result.health.ok`、`result.process.status`、`result.node.matches` 和 `result.pending`，预期分别为 `true`、`online`、`true` 和 `null`。

健康检查和对外访问要分开验证。在服务器上执行：

```bash
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

配置好反向代理之后，从开发机或实际访问的网络执行：

```bash
curl --fail https://tasks.example.com/tasks/api/healthz
```

两条命令都应返回 `ok: true`，并且应用的 base path 为 `/tasks`。最后在浏览器中打开 `https://tasks.example.com/tasks/`，检查登录、页面刷新和任务操作；本机演练时直接打开对应的回环地址即可。如果 SSH 方式返回 `result.remote.publicHealth: false`，说明开发机无法访问配置的公开地址，请检查 DNS、代理和网络，并先用 status 确认服务器上的应用状态。

服务器上的部署目录大致如下：

```text
/srv/nocobase/tasks/
├── installer.json
├── app.env
├── config.yml
├── storage/
├── logs/
├── backups/
├── current -> releases/<release>/app
└── releases/
    └── <release>/app/
        ├── config.example.yml
        └── dist/
```

配置和数据位于各个发布目录之外，由不同的版本共用。当前的入门示例通过必需的 Seed 初始化任务角色；开发环境中的任务、团队用户和角色分配不会随部署包复制过来，需要在部署后配置，或另外迁移。不要手工覆盖 `current`，也不要改写已安装的发布文件。

### 4. 验证进程托管与数据持久化

1. 在任务页面新建一条任务，把它标记为完成并刷新页面，确认状态得到保留。
2. 按 [搭建第一个应用](build-your-first-app.md) 中的权限说明配置一个普通的只读成员，验证这个成员可以查看、但不能修改。
3. 在服务器上以同一个服务账号执行 `pm2 restart nocobase-tasks`。如果安装时设置了 `--name`，请使用实际的进程名。
4. 再次打开应用，确认任务及其状态仍然保留。
5. 按照安装结果中的 `nextCommands` 配置开机自动恢复。安装器已经保存了 pm2 的进程列表；以同一个服务账号运行 `pm2 startup`，再执行它打印出的系统命令。使用 SSH 方式部署时，这些命令同样在服务器上执行。

应用进程的重启和服务器开机后的恢复，是两项不同的验证。配置 pm2 也不会自动替你配置域名、HTTPS 或反向代理。

## 部署新版本

业务功能修改并验证之后，在开发机上重新构建部署包，再发布到原来的安装目录。更新流程的概览见 [发布应用新版本](../deployment/publish-app-release.md)。

### 使用 Agent

在应用的源码目录中提供明确的目标：

```text
请把已经验证通过的新版任务应用，发布到原来的教程环境。

服务器：<我的 SSH 服务器别名>
已有安装目录：/srv/nocobase/tasks
继续使用 app-installer，保留现有数据库、配置、登录密钥和上传文件。

更新前先查看当前版本和已有任务，准备好备份并保留旧版本。
说明这次更新会怎样改变数据、是否需要停机，以及失败后怎样恢复。
如果发现以前执行过的数据变更被改写，先查明原因，不要直接修复或跳过检查。
不要把更新当作全新安装，不清空已有数据。

更新后检查旧任务的负责人、完成状态和只读权限仍然保留，新功能也能正常使用。
重启应用后再检查一次，只操作这个教程应用，并告诉我实际结果。
```

### 不使用 Agent

**1. 保存旧的部署包并重新构建。** `pnpm build --tar` 会重新生成 `storage/exports/dist.tar.gz`，需要留存的旧包请先复制到其他位置。然后在源码项目中执行：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**2. 检查更新计划。** 选择与原来的部署一致的操作方式。

在服务器上更新时，先从开发机复制新的部署包：

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks-new.tar.gz
```

再以原来的部署账号在服务器上执行：

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks --archive /tmp/tasks-new.tar.gz --json
```

如果从开发机通过 SSH 更新，使用本地的部署包和远程的安装目录：

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server \
  --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --json
```

`deploy` 会根据目录中是否存在 `installer.json`，判断是首次安装还是更新。对于已有的安装，不要再传入 `--origin`、`--base-path`、`--host`、`--port`、`--name`、`--set` 等首次安装时的参数。重复部署同一个发布包会返回 `success-noop`。

有更新时，非交互式的预检会返回 `CONFIRMATION_REQUIRED`，以及关于停机、备份和迁移的说明，此时旧版本仍在运行。命令开头的 `npx --yes` 只是确认获取安装器，并不代表确认更新。

本例验证时使用的安装器版本是 `0.1.0-beta.9`，它会通过新版本的 CLI 检查配置、待执行的迁移以及历史校验值。截止日期示例的检查结果为 **1 个新增迁移、0 个校验值修复**。如果出现不符合预期的迁移或校验值变化，请先核对源码和版本说明，不要通过重置数据库或盲目修复来绕过检查。

**3. 确认后执行。** 检查过更新计划、备份和停机时间后，在所选的 `upgrade` 或 `deploy` 命令末尾加上安装器自己的 `--yes`。例如在服务器上执行：

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks \
  --archive /tmp/tasks-new.tar.gz --yes --json
```

安装器会停止应用，备份 SQLite、`config.yml` 和 `app.env`，执行迁移并切换 release，然后启动应用并检查健康状态。原有的配置、密钥和 `storage/` 会继续使用，不需要重新运行 `install` 或 `config init`。

自动备份不包含上传的文件，也不覆盖外部数据库；使用这些资源时，请另外备份。外部数据库所需的 `--backup-done` 只是确认你已经完成备份，并不会替你备份或恢复。

**4. 验证新旧数据。** 对同一个目标重新运行 `status`，确认新的 release 和健康状态，再用原来的地址登录。截止日期示例应满足：

- 旧任务的 ID、标题、负责人和完成状态都保留，截止日期显示为“未设置”。
- 新建任务时可以设置日期，刷新、完成或恢复之后日期仍然保留；不填日期也能新建。
- 原来的只读成员可以查看新的日期，但不能新建或完成任务。
- 在演练环境中重启同一个应用后，以上数据和权限仍然保留。

本次演练沿用了应用的版本号，用不同的构建时间区分 release；安装器支持同一版本重新构建后的更新。实际发布时，应记录对应的源码提交和部署包摘要，也可以递增你自己应用的版本号。

### 更新失败与回退

先保留错误结果和日志，通过 `status` 检查当前的 release、健康状态和未完成的操作；不要立即重新初始化或重复部署。

需要回退时，先查看回退计划：

```bash
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/tasks --json
```

本例执行过数据库迁移，默认的回滚会恢复升级前的 SQLite 备份，可能丢失升级之后新建的任务和其他写入。确认可以接受这个影响，并保存好需要保留的数据之后，才加上 `--yes` 执行。切换代码版本并不等于撤销迁移；外部数据库和上传的文件仍然需要各自的恢复流程。

## 遇到问题时

| 现象 | 下一步 |
| --- | --- |
| `PORT_IN_USE` | 确认这个端口属于哪个进程，为本应用选择一个空闲端口，并同时修改 origin；不要停止无关的应用。 |
| SSH 无法登录，或找不到 Node / pm2 | 先验证上文的非交互式 SSH 命令、主机指纹和 PATH，再重试。 |
| `START_FAILED` | 查看错误结果中给出的日志路径和部署目录下的 `logs/`，检查配置、数据库和启动错误。 |
| `REMOTE_STATE_UNKNOWN` | 远程操作可能仍在进行，先对同一个目标执行 status；不要立即重复部署。 |

请读取 JSON 中的 `error.code`、`error.message` 和 `error.suggestions`，不要只凭退出码猜测发生了什么，也不要把配置文件中的密钥贴进排查日志。

本篇使用 `@nocobase/app-installer@0.1.0-beta.9`，完成了在新目录中的本机安装，以及通过本机隔离的 SSH 端点进行的真实传输、安装和 status 检查。两种方式都验证了：自定义密码生效、默认密码被拒绝、任务与权限测试通过、重启后同一条记录仍然保留；另外还验证了端口冲突和重复部署时的行为。截止日期示例也验证了：在已有的 SQLite 数据库上执行新增迁移、旧任务与角色得到保留、配置不变，以及更新后重启。跨主机的网络、正式域名的代理、服务器开机恢复、失败恢复和发布回滚，未在本次演练中验证。

本篇的部署实操记录和截图来自此前的演练，不能视为当前 `1.0.0-beta.81` npm 示例已经重新完成了部署验证。
