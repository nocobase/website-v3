---
title: 数据库
status: 待补充正文
description: 基础库。数据表、字段、关联、查询、事务和迁移，以及各种数据库的方言。应用的数据模型都建在它上面。
---

> [!PENDING] 正文待编写
> 档案来自 NocoBase 仓库 `v3-develop` 分支（2026-10-23）；商业方言来自 `nocobase3-pro` 的 `develop` 分支。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/db`，方言 `@nocobase/db-sqlite`、`db-postgres`、`db-mysql`、`db-mssql`、`db-oracle` |
| 版本 | 1.0.0-beta.22（方言 0.1.0-beta.5 / 0.1.0-beta.6） |
| 版本范围 | <span class="tag">开源</span>；`db-dameng`（达梦）、`db-kingbase`（人大金仓）、`db-oceanbase` <span class="tag pro">商业版</span> |
| 默认模板 | 已包含 `@nocobase/db` 和 SQLite 方言；其他方言按需安装 |
| 类型 | 基础库，直接使用，不需要注册 |
| 命令 | `pnpm nocobase db apply`、`db rollback`、`db redo`、`db reset`、`db repair`、`db unlock`、`db sample`、`collections doctor` |
| 技能 | `nocobase-db` |
| 所属能力 | [数据建模](../capabilities/data.md) |

## 计划包含

- 数据表、字段和关联在代码里怎样定义，读者在哪里看到当前的数据模型（`database/<连接>/collections/`）
- 迁移：按顺序执行，执行过的不再修改；怎样回滚
- 切换数据库：从 SQLite 换到 PostgreSQL，原有数据不会自动迁移
- 第二个数据库连接：接入外部数据库，只读或读写
- 各数据库的版本要求和差异
- 商业版的达梦、人大金仓、OceanBase：授权和发布状态（待确认）
- 与 NocoBase 2 数据源管理的对应
- 开发参考
