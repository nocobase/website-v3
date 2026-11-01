---
title: 日常维护与排错
description: 通过 Agent 检查运行状态、调整配置和备份，并依据日志定位故障和验证修复。
---

## 让 Agent 检查应用运行状态

提供服务器、部署方式、应用目录及进程或 Compose 项目名，让 Agent 检查健康接口、进程重启次数、资源与磁盘、迁移及错误日志。首次排查可限定只读。

```prompt
请检查 <服务器和部署目录> 的应用为什么变慢，先不要修改。问题从 <时间> 开始，影响 <页面或操作>。请结合运行状态和日志说明原因及处理建议。
```

从实际访问网络与服务器本机分别检查，区分应用故障与代理、DNS、证书或网络问题。

## 修改配置与重启应用

告诉 Agent 要改的配置、目标环境和允许的重启时间。先保存原配置，检查环境变量是否覆盖文件；origin 不包含 base path。修改密钥可能影响登录和加密数据，按[配置参考](../reference/configuration.md)处理。

Docker 替换配置文件或修改环境变量后重建容器，单独 restart 不会应用新容器环境，单文件挂载也可能仍指向旧文件。PM2 安装的 `app.env` 与 `config.yml` 保留在安装根目录，用同一账号重启本应用；同步检查 PM2 中是否有遗留环境覆盖。重启后重新检查实际访问与业务操作。

## 备份数据与检查恢复能力

根据可接受的数据损失和停机时间确定备份频率。覆盖数据库、上传文件或对象存储、配置与稳定密钥；只复制镜像或发布包不够。保存版本、备份时间点、范围和摘要，将备份存放在受限且独立的位置。

SQLite 离线备份前停止本应用和其他写入者，保存数据库及 WAL/SHM 文件，避免复制仍在写入的文件。外部数据库使用其一致性备份工具；相关文件需要协调到同一恢复点。

让 Agent 在隔离目录和端口恢复备份，验证登录、记录、权限及文件，并记录恢复耗时。安装器的升级快照不能替代日常备份；恢复边界见[更新与恢复](publish-app-release.md)。

## 向 Agent 描述故障并提供线索

提供出现时间与时区、访问 URL、失败操作、报错或请求标识、影响范围及最近一次发布或配置变化。提供相关时段的脱敏日志，不提供密码、Cookie、密钥或完整配置。

```prompt
<时间和时区> 起，<访问地址> 的 <操作> 出现 <错误>，影响 <用户范围>。最近修改了 <变更>。请结合这些日志定位问题，先提出处理方案，暂不重置数据或重装。
```

## 确认处理方案与验证修复结果

确认原因依据、修改范围、停机与数据影响和恢复方法后，再让 Agent 执行。端口冲突应识别所属进程，不停止其他应用；迁移异常不靠重置数据库绕过。

按原失败操作复测，再检查登录、权限、已有数据和相关功能。服务需重启时验证数据保留；记录修复、实际结果和仍未确认的原因。

## 常用命令与日志位置参考

命令在原部署目录执行，替换项目名或进程名：
```bash
docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
pm2 describe nocobase-my-app
pm2 logs nocobase-my-app --lines 100 --nostream
npx --yes @nocobase/app-installer@0.1.0-beta.10 status --dir /srv/nocobase/my-app --json
```

| 位置或现象 | 怎么检查 |
| --- | --- |
| Docker 输出 | 使用 Compose logs；配置在宿主机 `config/config.yml`，持久化数据在 `storage/` |
| PM2 安装目录 | `app.env`、`config.yml`、`logs/`、`storage/`、`backups/`；PM2 的输出路径以 describe 为准 |
| 健康接口 | `curl --fail http://127.0.0.1:13000/shop/api/healthz`，应返回 `ok: true`；再检查公开 URL |
| bind source missing / EACCES | 确认路径在 Docker 服务器上，且 UID 1000 有所需权限 |
| START_FAILED / unhealthy | 查看启动、数据库和迁移错误；不要反复启动覆盖线索 |
| REMOTE_STATE_UNKNOWN | 先用相同 SSH 参数执行 status，确认远程操作是否仍在进行 |

Docker 配置变更后执行 `docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180`。PM2 用 `pm2 restart nocobase-my-app`。

以下离线备份示例仅覆盖默认本地配置与 storage，先准备 `/safe/backup` 并限制访问；外部存储另备份。在原 Docker 部署目录执行：
```bash
docker compose -p my-app stop app
tar -czf /safe/backup/my-app-before-update.tar.gz config storage compose.yml
docker compose -p my-app start app
```

PM2 应用则先 `pm2 stop nocobase-my-app`，在安装根目录执行 `tar -czf /safe/backup/my-app-before-update.tar.gz config.yml app.env storage`，完成后 `pm2 restart nocobase-my-app`。自定义数据库或文件目录必须一并纳入。备份有私密信息，不提交或附到公开报告中。
