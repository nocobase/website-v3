---
title: 升级与备份
description: 备份 Studio 的数据库、配置和文件；升级到新版本，出了问题回滚；运行环境和命令行怎样更新。
---

## 备份

Studio 的数据都在部署目录里，要备份的有四样：

| 备份什么 | 说明 |
| --- | --- |
| 数据库 | PostgreSQL 的数据。用 `pg_dump -Fc` 导出，或者停机后备份 `postgres` 目录 |
| `.env` | 加密密钥 `STUDIO_SECRET_KEY` 等。丢了它，保存的 Git 凭据、API 密钥都无法解密 |
| `config.yml` | Studio 的配置，包括推送私钥（如果写在这里） |
| `storage` 目录 | 上传的文件、日志、技能文件等 |

例如每天导出一次数据库：

```bash
cd studio
docker compose exec -T postgres pg_dump -U studio -Fc studio > backup/studio-$(date +%F).dump
```

备份里有加密密钥，请按保管密码的方式存放。

部署出来的业务应用，它们的数据库要另外备份，见 [部署环境](environments.md)。

## 从备份恢复

1. 停止 Studio：`docker compose stop studio`。
2. 放回 `.env`、`config.yml` 和 `storage` 目录。
3. 恢复数据库，例如：

   ```bash
   docker compose exec -T postgres pg_restore -U studio -d studio --clean --if-exists < backup/studio-2026-10-25.dump
   ```

4. 启动 Studio：`docker compose start studio`，确认能登录、项目和任务都在。

恢复时 `.env` 里的加密密钥必须和备份时一致，否则保存的凭据无法解密，所有人都要重新登录。

## 升级

1. 先备份。
2. 把 `docker-compose.yml` 里的镜像版本号改成新的。
3. 拉取并重启：

   ```bash
   docker compose pull
   docker compose up -d
   ```

4. 等 `docker compose ps` 显示 `healthy`，登录确认。

数据库迁移在启动时自动执行。可用的版本见 [镜像的版本页面](https://pkg-v3.nocobase.com/-/images/nocobase/studio)。

> [!WARNING] 回滚要连同数据库一起
> 新版本启动时已经升级了数据库，只把镜像版本号改回去，旧版本可能读不了新的数据库。要回滚，先恢复升级前的数据库备份，再用旧版本启动。

## 运行环境和命令行的更新

先升级 Studio，运行环境和命令行会跟着更新：

- **执行机**：在没有 Agent 运行时自动更新到 Studio 提供的版本。要立即更新，在那台机器上运行 `nocobase-runner update`。版本太旧、协议不兼容的执行机，在「Agent 管理 › 运行环境」里会标出需要升级。
- **nb-studio**：运行 `nb-studio update`，更新到 Studio 提供的版本，已安装的技能会一起更新。Studio 有新版本时，`nb-studio` 也会提示。
