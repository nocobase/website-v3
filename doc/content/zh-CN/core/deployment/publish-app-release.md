---
title: 更新与恢复
description: 与 Agent 确认更新、备份和停机，验证已有数据，并按恢复边界回滚应用或恢复数据。
---

## 告诉 Agent 更新目标与现有部署信息

<a id="使用-agent"></a>

提供目标提交、原服务器、Docker Compose 项目及目录或 app-installer 安装目录，以及当前版本、数据库和文件位置。

```prompt
请把 <目标提交> 发布到 <现有服务器和部署目录>，继续使用 <Docker 或 app-installer>，保留现有数据、配置和密钥。先检查变更、备份和停机要求，给我更新及恢复方案，等我确认后执行。
```

应用发布不等于框架升级。涉及框架依赖时，先在开发环境完成[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)及兼容性验证。

## 确认变更、备份与停机安排

确认代码、配置、迁移与必需种子的变更，保留旧产物和摘要。已执行迁移属于历史，不应改写；校验值异常先查明原因，不盲目 repair 或清空数据库。

确定停写时段、可接受的数据恢复点、备份位置和恢复负责人。数据库、文件、配置与稳定密钥必须形成可配套恢复的一组；外部数据库用对应数据库工具备份，文件及对象存储单独保存。

app-installer 更新在停应用后备份配置声明的 SQLite 数据库及相关日志文件、`config.yml` 和 `app.env`，不备份上传文件，也不自动备份外部数据库。`--backup-done` 仅声明外部备份已完成。

## 让 Agent 执行更新

让 Agent 先检查配置、迁移 dry-run 和历史校验值，再按确认的停机方案执行。Docker 使用新镜像标签并保留原挂载；app-installer 对原安装目录执行 upgrade，远程仍用 deploy。

安装器预检遇到更新会返回 `CONFIRMATION_REQUIRED`，此时旧服务仍运行；确认计划后才加安装器的 `--yes`。同一包返回 `success-noop`。不要重新生成配置、密钥或把更新当作新安装。

## 验证新功能与原有数据

核对运行版本及健康状态，从原访问地址登录。用更新前记录的 ID 检查旧数据、文件和权限，执行本次新功能；涉及结构变更时核对旧记录与新字段。

在演练环境重启或重建后重复检查。让 Agent 报告源码提交、包或镜像摘要、迁移结果及实际操作结果。

## 更新失败后评估恢复方案

先停止新增业务写入，保留错误、日志和当前状态。确认正在运行的版本、迁移是否已提交、是否仍有安装器 pending 操作，以及备份是否完整。

安装器在失败后尝试切回原版本，不能保证回退成功；若仍有 pending 或健康失败，先排查再重试。按当前数据与旧程序是否兼容，选择修复新版本、仅回滚程序或恢复配套备份，并确认备份后写入的取舍。

## 回滚应用与恢复数据

Docker 切回旧镜像不撤销迁移和业务写入。**安装器快照回滚**以返回计划为准：app-installer 可能恢复升级前的 SQLite 快照，然后切换 release 并启动应用。它不会同时恢复文件、配置与外部数据库。即使加 `--no-restore` 也会启动应用，不能用它离线选择代码版本。

**整套备份恢复**需要先封闭外部访问，停止应用和其他写入者。在独立恢复目录中先解压与选定恢复点匹配的发布包，再在两个应用均停止的状态下，恢复同一组数据库、上传文件、配置及稳定密钥。调整目录路径，离线检查配置与迁移计划后，只启动恢复后的应用。人工恢复选定数据库后不要再执行安装器 rollback，以免覆盖恢复点或提前启动服务。

开放访问前验证登录、选定记录、权限、上传文件内容、配置和写入。先在隔离副本演练并确认后续写入的取舍，外部数据库与对象存储也要保持恢复点一致。

## 手动更新与恢复参考

<a id="不使用-agent"></a>

在源码目录保留旧包后重新构建：
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**Docker**：用新标签构建镜像并传输到服务器。备份完成后，在原 Compose 目录把 `image` 改为新标签。先运行下面前三个检查命令，确认变更后再执行最后一条启动命令：
```bash
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db apply --dry-run --json
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db repair --dry-run --json
docker compose -p my-app up -d --wait --wait-timeout 180
```

回滚时把 `image` 改回保留的旧标签；仅在旧程序兼容当前数据库时启动。需要数据恢复时，先 `docker compose -p my-app stop app`，恢复配套备份到原挂载路径及权限后，再用匹配镜像 `up -d --wait`。

**PM2**：把新包复制为服务器 `/tmp/my-app-new.tar.gz`，以同一服务账号先预检，再在备份及停机获确认后执行：
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --json
# After reviewing the plan and completing backups:
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --yes --json
```

SSH 路线改为 `deploy --ssh deploy@server --dir /srv/nocobase/my-app --archive <本地新包路径>`，不要重复首次安装的 origin、port、name 或 `--set` 等参数。

**安装器快照回滚**：仅在其恢复点符合目标，且现有文件与配置仍兼容该数据时使用；否则选择整套备份恢复。先封闭外部访问。检查目标 release、SQLite 恢复及后续写入损失后再执行；确认命令会启动应用：
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --json
# After accepting the recovery point and any loss of later writes:
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --yes --json
```

**整套备份恢复**：beta.10 没有离线 rollback 参数。使用独立目录和匹配的发布包，不在人工恢复数据之后切换安装器管理的 release。

1. 封闭外部访问，执行 `pm2 stop nocobase-my-app`，停止使用同一数据库或存储的其他应用、后台任务等写入者。
2. 为服务账号准备新的恢复目录，先解压匹配发布包，再恢复选定备份中的 `config.yml`、`app.env` 和完整 `storage/`。外部存储使用自身工具恢复到同一时间点，全程保持两个应用停止。
3. 将恢复的 `app.env` 中 `APP_CONFIG_FILE`、`APP_STORAGE_DIR` 指向恢复目录；核对其他绝对路径及环境覆盖，保留备份的密钥和业务配置。演练使用独立回环端口。
4. 在恢复目录检查配置及下面两项数据库 dry-run，发现非预期迁移或校验变化时先解决版本匹配问题，不执行迁移来强行兼容备份。确认一致后才执行 PM2 启动命令。

匹配发布包和选定备份是两个文件。原服务停止后，以服务账号准备新目录：
```bash
mkdir /srv/nocobase/my-app-recovery
tar -xzf /tmp/my-app-matching.tar.gz -C /srv/nocobase/my-app-recovery
tar -xzf /safe/backup/my-app-selected.tar.gz -C /srv/nocobase/my-app-recovery
```

按上面的要求调整恢复的 `app.env` 路径及环境覆盖后，进入恢复目录检查，再启动：
```bash
cd /srv/nocobase/my-app-recovery
node --env-file=./app.env dist/cli/index.js config check --connect
node --env-file=./app.env dist/cli/index.js db apply --dry-run --json
node --env-file=./app.env dist/cli/index.js db repair --dry-run --json
pm2 start node --name nocobase-my-app-recovery --interpreter none \
  --cwd /srv/nocobase/my-app-recovery --kill-timeout 60000 -- \
  --env-file=/srv/nocobase/my-app-recovery/app.env ./dist/server/standalone.js
```

此恢复目录是手动部署目录，不是 app-installer 安装目录。核对健康、原生登录、记录、上传元数据与下载内容、配置和权限后再开放访问；后续若要恢复安装器托管，另行安排迁移。不要改动旧目录的 `current` 或 pending 状态。备份操作见[日常维护与排错](maintenance-and-troubleshooting.md)。

> [!NOTE]
> 本机 SQLite 验证覆盖新增测试迁移、安装器回滚、启动失败恢复，以及记录、原生上传文件与配置的整套恢复。框架升级、外部数据库与对象存储仍需单独演练恢复。
