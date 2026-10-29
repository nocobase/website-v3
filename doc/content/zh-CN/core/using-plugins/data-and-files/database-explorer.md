---
title: "数据库浏览"
description: "查看应用数据库连接、Collection 定义和物理结构。"
---

`@nocobase/app-plugin-database-explorer` 用于查看应用已配置的数据库连接、Collection、字段及物理表结构，适合开发和排查数据模型问题。它不提供建表、改表或编辑业务记录的操作。

## 接入与入口

在身份认证和权限管理之后注册 Client、Server 插件。插件提供 `DatabaseExplorerClient` 和查询接口，不自带数据库浏览页面；应用负责用这些能力接入页面。无需额外的插件业务表迁移。

页面和 API 使用同一个 `page:database-explorer/access` 权限。客户端可复用公开的 `DATABASE_EXPLORER_ACCESS`，避免菜单可见却无法调用接口。

## 浏览数据库结构

| 查询 | 接口 |
| --- | --- |
| 已配置的连接 | `GET /api/databaseExplorer/connections` |
| 连接内的 Collection | `GET /api/databaseExplorer/connections/:connection/collections` |
| Collection 定义与字段 | `GET /api/databaseExplorer/connections/:connection/collections/:collection` |
| 物理列、索引及约束 | 上述 Collection 地址追加 `/physicalSchema` |

连接列表展示名称、方言、默认连接和管理模式等结构信息，不返回连接密码、主机或数据库文件路径。逻辑定义与物理结构分开查询，按需打开物理详情即可。

## 示例：检查订单表字段

1. 在应用接入的数据库浏览页选择订单所在连接。
2. 找到订单 Collection，检查字段、关联和定义中的警告。
3. 查看物理结构，确认数据库列与索引是否符合预期。
4. 若需要变更，回到应用的[数据库迁移](../../framework/database/migrations.md)处理；不要把浏览页当作迁移编辑器。

列表使用 `pageToken` 翻页。自行实现搜索时，应明确搜索当前页还是完整列表；`DatabaseExplorerClient.allCollections()` 可遍历所有页，达到遍历上限时会返回 `truncated` 标记。

## 使用边界

插件自身没有写接口，但首次读取 managed 连接的 Collection 时，数据库框架可能初始化内部元数据及缓存版本表；不会因此修改业务表或业务记录。external 连接使用目录中的元数据。

检查管理员和无权限账号的访问，以及不可达连接、无效 Collection 和分页行为。具体错误字段以运行应用的 API 文档为准。

相关文档：[数据库连接](../../framework/database/connections.md)、[权限管理](../authorization/permissions.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-database-explorer)。
