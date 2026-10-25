---
title: 数据建模
status: 待编写
description: 业务对象、字段和关联怎样定义和变更，支持哪些数据库，怎样接入已有的数据库。
---

> [!PENDING] 本页待编写
> 下面是计划包含的内容。

## 计划包含

- 四层分工：数据表和迁移由 Agent 写，`pnpm nocobase db apply` 执行；管理员不在界面上建表
- 在哪里看当前的数据模型（`database/<连接>/collections/`），「应用底座」里的数据表清单
- 支持的数据库：SQLite、PostgreSQL、MySQL、SQL Server、Oracle；商业版的达梦、人大金仓、OceanBase
- 从 SQLite 换到 PostgreSQL：原有数据不会自动迁移
- 接入已有的外部数据库：只读还是读写，凭据放在服务器配置里
- 初始数据和示例数据
- 数据库浏览接口
- 怎样提需求，怎样检查结果
- 与 NocoBase 2 数据源管理的对应

## 由哪些包提供

[数据库](../plugins/db.md)、[数据库浏览](../plugins/database-explorer.md)

## 现有页面的去向

| 现有页面 | 处理 |
| --- | --- |
| 数据源 › 概览、使用说明 | 并入本组 |
