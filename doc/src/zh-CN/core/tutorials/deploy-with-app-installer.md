---
title: 使用 app-installer 部署
description: 使用 app-installer 安装应用，由 pm2 托管，并保留独立的运行配置和数据。
---

本文以任务应用为例说明部署流程，也适用于自己的 NocoBase Core 应用。先按[选择部署方式](../deployment/choose-a-deployment-method.md)确认目标环境；部署自己的项目时，替换示例中的应用名称、路径和业务验收项。

这一篇把任务应用部署到自己的服务器。`@nocobase/app-installer` 负责解压发布包、生成配置、应用迁移、启动 pm2 进程和检查健康状态，之后也通过它升级应用。

部署前确认应用已通过测试；任务示例的测试步骤见[搭建第一个应用](build-your-first-feature.md)。以下使用单实例、SQLite、Linux x64/glibc、Node.js 24，应用路径为 `/tasks`。其他数据库需要在源码项目中安装相应驱动，再重新构建。

## 部署前准备

开发机保留源码、Node.js 和项目要求的 pnpm。服务器需要 Node.js 24、全局安装的 pm2 4.3 或以上版本、tar，以及可写的部署目录。本篇命令使用 Bash。

在服务器上检查：

```bash
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
command -v tar
```

没有 pm2 时，先由服务器维护者安装 `npm install -g pm2`。部署归属一个固定服务账号，后续管理也使用这个账号。提前由管理员给这个账号准备可写的空目录；如果没有 `/srv` 的写权限，本机演练可改用 `$HOME/tasks`，后续所有 `--dir` 一并替换。

本篇示例目录为 `/srv/nocobase/tasks`，监听地址为 `127.0.0.1:13000`。正式访问由服务器上的反向代理提供 `https://tasks.example.com/tasks/`；准备对应域名和 HTTPS，并保留转发路径及 WebSocket 升级头。只在本机演练时，可以把 origin 换成 `http://127.0.0.1:13000`。先确认端口未被其他应用占用；多应用使用不同目录、端口和 pm2 进程名。

`npx` 所在机器需要能访问 npm registry。若服务器不能联网，使用开发机上的 `deploy --ssh`，由工具传输安装器与部署包，服务器不需要访问 npm。

## 使用 Agent

在应用源码目录向 Agent 提供明确的目标：

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

把占位值替换为实际目标。Agent 可以在开发机执行 `deploy --ssh`；服务器无需安装 Agent、源码或项目依赖。工具会通过 SSH 传输安装器及应用包，服务器仍需事先具备 Node.js、pm2 和 tar。

## 不使用 Agent

### 1. 在开发机构建

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

得到 `storage/exports/dist.tar.gz`。可以执行 `sha256sum storage/exports/dist.tar.gz` 记录本次发布包摘要。target 与 Node 主版本必须匹配服务器；ARM 或 musl 环境使用对应 target。包内已经包含生产依赖，服务器不需要为这个 archive 再运行 `pnpm install`。

### 2. 选择本机安装或 SSH 部署

两种操作使用同一个部署包，选择其中一种。

**A. 已在服务器上操作**

先在开发机复制部署包：

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks.tar.gz
```

再以部署服务账号登录服务器，执行安装：

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

**B. 在开发机通过 SSH 部署**

提前配置好 SSH 密钥登录，并通过可信方式核对服务器指纹。安装器使用非交互连接且严格检查主机密钥；先在开发机确认下面的命令能直接执行：

```bash
ssh deploy@server 'node --version && command -v pm2 && command -v tar'
```

如果工具只在交互终端里可用，需要先修正这个账号的非交互 SSH PATH。使用非默认端口、密钥或配置文件时，分别添加 `--ssh-port`、`--ssh-identity`、`--ssh-config`；后续 status 和更新也保留相同参数。

以下命令在开发机执行。`--archive` 是开发机上的文件，`--dir` 是服务器上的绝对路径：

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

两条首次安装命令都要求目标目录是新的或空的。`--origin` 不包含 `/tasks`，`--base-path` 单独设置应用路径。默认只监听回环地址；如果选择直接通过服务器 IP 和端口访问，需要明确设置 `--host 0.0.0.0`、对应的 origin 及网络访问规则。

`--set-from-env` 从执行安装器的机器读取环境变量；SSH 路线通过加密连接传入，不需要在服务器再 export 一次。初始密码只在新数据库创建管理员时生效，不用于重置已有账号。

`npx --yes` 只跳过下载工具的提示，不代表同意未来的升级或回滚。不要把密码写进 `--set`。

### 3. 检查安装结果

先确认返回 JSON 的 `ok: true`、`status: "success"`。`result.started: true` 表示应用已启动并通过健康检查，`result.url` 是配置的应用入口。按 `result.initialAdmin.username` 和刚设置的密码登录；使用了自定义密码后，`result.initialAdmin.defaultPassword` 应为 `false`。

在服务器上检查状态：

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json
```

从开发机检查远程安装时，在同一条命令中增加 `--ssh deploy@server`。检查 `result.health.ok`、`result.process.status`、`result.node.matches` 以及 `result.pending`；预期分别为 `true`、`online`、`true`、`null`。

健康检查与对外访问分开验证。在服务器上执行：

```bash
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

配置好反向代理后，从开发机或实际访问网络执行：

```bash
curl --fail https://tasks.example.com/tasks/api/healthz
```

两者都应返回 `ok: true`，并且应用 base path 为 `/tasks`。最后在浏览器打开 `https://tasks.example.com/tasks/`，检查登录、页面刷新和任务操作。本机演练直接打开对应回环地址即可。SSH 返回的 `result.remote.publicHealth: false` 表示开发机无法访问配置的公开地址，应检查 DNS、代理及网络，先用 status 确认服务器上的应用状态。

服务器部署目录大致如下：

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

配置和数据位于发布目录之外，由不同版本共用。当前入门示例通过必需种子初始化任务角色；开发环境中的任务、团队用户和角色分配不会随包复制，需要在部署后配置或另行迁移。不要手工覆盖 `current` 或改写已安装的发布文件。

### 4. 验证托管与持久化

1. 在任务页新建一条任务，完成并刷新，确认状态保留。
2. 按[搭建第一个应用](build-your-first-feature.md)中的权限说明配置普通只读成员，验证可读、不可写。
3. 在服务器以同一服务账号执行 `pm2 restart nocobase-tasks`。如果安装时设置了 `--name`，使用实际进程名。
4. 再次打开应用，确认任务和状态保留。
5. 按安装结果的 `nextCommands` 配置开机恢复。安装器已经保存 pm2 进程列表；以同一服务账号运行 `pm2 startup`，再执行它打印的系统命令。SSH 部署时这些命令也在服务器上执行。

应用进程重启与服务器开机恢复是两项不同的验证。配置 pm2 不会自动替你配置域名、HTTPS 或反向代理。

## 部署新版本

业务功能修改并验证后，在开发机重新构建部署包，再发布到原来的安装目录。更新流程概览见[发布应用新版本](../deployment/publish-app-release.md)。

### 使用 Agent

在应用源码目录提供明确目标：

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

**1. 保存旧包并构建。** `pnpm build --tar` 会重新生成 `storage/exports/dist.tar.gz`，需要留存的旧包应先复制到其他位置。然后在源码项目执行：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**2. 检查更新计划。** 选择与原部署一致的操作方式。

在服务器上更新时，先从开发机复制新包：

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks-new.tar.gz
```

再以原部署账号在服务器执行：

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks --archive /tmp/tasks-new.tar.gz --json
```

如果从开发机通过 SSH 更新，使用本地包和远程安装目录：

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server \
  --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --json
```

`deploy` 根据目录中是否存在 `installer.json` 选择首次安装或更新。已有安装不要再传 `--origin`、`--base-path`、`--host`、`--port`、`--name`、`--set` 等首次安装参数。同一发布包重复部署返回 `success-noop`。

有更新时，非交互预检返回 `CONFIRMATION_REQUIRED` 和停机、备份、迁移说明，旧版此时仍在运行。开头的 `npx --yes` 只确认获取安装器，不代表确认更新。

本例验证使用安装器 `0.1.0-beta.9`，会通过新版 CLI 检查配置、待执行迁移及历史校验值。截止日期示例的结果为 **1 个新增迁移、0 个校验值修复**。如果出现不符合预期的迁移或校验值变化，先核对源码和版本说明，不要通过重置数据库或盲目修复来绕过。

**3. 确认后执行。** 检查计划、备份和停机时间后，在所选的 `upgrade` 或 `deploy` 命令末尾增加安装器的 `--yes`。例如在服务器执行：

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks \
  --archive /tmp/tasks-new.tar.gz --yes --json
```

安装器停止应用，备份 SQLite、`config.yml` 和 `app.env`，执行迁移、切换 release，再启动并检查健康状态。原配置、密钥和 `storage/` 继续使用，不重新运行 `install` 或 `config init`。

自动备份不包含上传文件，也不覆盖外部数据库；使用这些资源时，应单独备份。外部数据库所需的 `--backup-done` 只是确认已备份，不会替你完成备份或恢复。

**4. 验证新旧数据。** 重新运行同一目标的 `status`，确认新 release 和健康状态，再用原地址登录。截止日期示例应满足：

- 旧任务的 ID、标题、负责人和完成状态保留，截止日期为“未设置”。
- 新建任务可以设置日期，刷新和完成／恢复后仍保留；不填日期仍能新建。
- 原只读成员可以查看新日期，但不能新建或完成任务。
- 在演练环境重启同一应用后，以上数据和权限仍然保留。

本次演练保留应用版本号，用不同构建时间区分 release；安装器支持同版本重新构建的更新。实际发布应记录对应源码提交和包摘要，也可以递增自己应用的版本号。

### 更新失败与回退

先保留错误结果和日志，通过 `status` 检查当前 release、健康状态及未完成操作，不要立即重新初始化或重复部署。

需要回退时，先查看计划：

```bash
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/tasks --json
```

本例执行了数据库迁移，默认回滚会恢复升级前的 SQLite 备份，可能丢失升级后的新任务和其他写入。确认可接受这一影响、保存需要保留的数据后，才加 `--yes` 执行。切换代码版本不等于撤销迁移；外部数据库和上传文件仍需各自的恢复流程。

## 遇到问题时

| 现象 | 下一步 |
| --- | --- |
| `PORT_IN_USE` | 确认端口属于哪个进程，为本应用选择空闲端口，同时修改 origin；不要停止无关应用。 |
| SSH 无法登录，或找不到 Node / pm2 | 先验证上面的非交互 SSH 命令、主机指纹和 PATH，再重试。 |
| `START_FAILED` | 查看错误返回的日志路径和部署目录 `logs/`，检查配置、数据库及启动错误。 |
| `REMOTE_STATE_UNKNOWN` | 远程操作可能仍在运行，先执行相同目标的 status；不要立即重复部署。 |

读取 JSON 的 `error.code`、`error.message` 和 `error.suggestions`；不要只凭退出码猜测发生了什么，也不要把配置文件中的密钥贴进排查日志。

本篇使用 `@nocobase/app-installer@0.1.0-beta.9` 完成新目录本机安装，以及本机隔离 SSH 端点上的真实传输、安装和 status 检查。两种方式均验证了自定义密码生效、默认密码被拒绝、任务与权限测试、重启后同一记录保留；另验证了端口冲突和重复部署行为。另外，截止日期示例已验证已有 SQLite 数据库上的新增迁移、旧任务与角色保留、配置不变及更新后重启。跨主机网络、正式域名代理、服务器开机恢复、失败恢复和发布回滚未在本次演练中验证。

本篇部署实操记录和截图来自此前的演练，不能视为当前 `1.0.0-beta.81` npm 示例已经重新完成部署验证。
