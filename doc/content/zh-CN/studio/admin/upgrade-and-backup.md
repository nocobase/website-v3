---
title: 升级与备份
description: 备份并恢复 Studio 数据，升级服务端、执行机和 CLI。
---

## 备份

同时保存数据库、配置、加密密钥和文件。下面以[部署指南](../setup/install.md)中的 Compose 与 PostgreSQL 为例。

| 内容 | 保存什么 |
| --- | --- |
| 数据库 | PostgreSQL 导出或数据库服务提供的备份 |
| 配置 | `config.yml`、Compose 文件和 `.env` |
| 密钥 | `SECRETS_KEYS` 使用的密钥，以及推送私钥 |
| 文件 | `storage` 目录及对象存储中的文件、技能和制品 |

在部署目录执行：

```bash
mkdir -p backup
docker compose exec -T postgres pg_dump -U studio -Fc studio   > "backup/studio-$(date +%F).dump"
```

数据库用户名和名称按实际配置调整。备份期间暂停写入，或使用能保持数据库与文件一致的快照方案。业务应用的数据库需要另行备份。

## 恢复

1. 停止 Studio，保留当前数据副本。
2. 恢复同一备份时间点的配置、密钥、文件和数据库。
3. 使用备份对应的镜像版本启动。
4. 检查登录、项目任务、文件下载和 Git 连接。

将备份恢复到准备好的空数据库，例如：

```bash
docker compose exec -T postgres pg_restore -U studio -d studio   < backup/studio-backup.dump
```

已有数据的数据库应先按团队的恢复流程处理，避免把备份叠加到现有记录。安装示例中的 `STUDIO_SECRET_KEY` 会传入 `SECRETS_KEYS`，恢复时必须保留相同密钥。

## 升级 Studio

1. 完成备份，取得要升级的镜像版本。
2. 更新部署配置中的 `STUDIO_IMAGE`。
3. 拉取并重建 Studio 容器。

```bash
docker compose pull studio
docker compose up -d studio
docker compose ps
docker compose logs --tail=100 studio
```

数据库迁移随启动执行。确认服务健康，并检查登录、任务和运行环境。Studio 为商业版本，可[联系我们](https://www.nocobase.com/zh-CN/contact/)获取镜像。

回退到旧镜像前，确认数据库兼容；需要回滚迁移时，恢复升级前的数据库和文件备份，再启动对应旧版本。

## 更新执行机和 CLI

执行机可自动更新，也可在机器上运行：

```bash
nocobase-runner update
nb-studio update
```

`nb-studio update` 同步更新已安装的技能。版本不兼容时，运行环境页面会提示升级。
