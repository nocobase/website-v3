---
title: "数据库浏览"
description: "查看应用的数据库连接、Collection 定义和物理结构。"
---

## 提供的能力

`@nocobase/app-plugin-database-explorer` 用于查看应用已配置的数据库连接、Collection、字段以及物理表结构，适合在开发和排查数据模型问题时使用。它不提供建表、改表或编辑业务记录的操作。

插件提供查询 API 和客户端，结构浏览页面由应用组合。

## 使用场景与示例

### 示例：检查订单表的字段

1. 在应用接入的数据库浏览页中，选择订单所在的连接。
2. 找到订单 Collection，检查字段、关联以及定义中的警告。
3. 查看物理结构，确认数据库的列和索引是否符合预期。
4. 如果需要变更，回到应用的 [数据库迁移](../../framework/database/migrations.md) 中处理；不要把浏览页当作迁移编辑器。

列表使用 `pageToken` 翻页。自行实现搜索时，应明确是搜索当前页还是完整列表；`DatabaseExplorerClient.allCollections()` 可以遍历所有页，达到遍历上限时会返回 `truncated` 标记。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用数据库浏览插件，为管理员增加数据库结构查看页。
复用 DatabaseExplorerClient 和 DATABASE_EXPLORER_ACCESS，展示连接、Collection 和按需加载的物理结构。
支持分页并提示遍历截断，不增加建表、改表或记录编辑功能。
验证无权用户、不可达连接、缺失 Collection，以及页面和 API 的一致授权。
```

**完成的标志**：获得授权的管理员能够查看逻辑结构和物理结构，无权用户不能直接调用查询接口。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| `client/routes.ts` 与浏览页面 | 组合连接、Collection 和物理结构的查询 | 新增一个按需展开的结构浏览入口 |
| 页面的授权声明 | 复用 `DATABASE_EXPLORER_ACCESS` | 菜单与 API 使用同一个访问条件 |
| 分页和错误状态 | 处理 `pageToken`、`truncated` 和查询失败 | 不会把不完整的列表或失败展示成完整结果 |

### 接入与入口

在身份认证和权限管理之后注册 Client 和 Server 插件。插件提供 `DatabaseExplorerClient` 和查询接口，但不自带数据库浏览页面，页面由应用使用这些能力接入。插件没有额外的业务表，不需要迁移。

页面和 API 使用同一个权限 `page:database-explorer/access`。客户端可以复用公开的 `DATABASE_EXPLORER_ACCESS`，避免出现菜单可见、却无法调用接口的情况。

### 浏览数据库结构

| 查询内容 | 接口 |
| --- | --- |
| 已配置的连接 | `GET /api/databaseExplorer/connections` |
| 连接中的 Collection | `GET /api/databaseExplorer/connections/:connection/collections` |
| Collection 的定义与字段 | `GET /api/databaseExplorer/connections/:connection/collections/:collection` |
| 物理列、索引和约束 | 在上面 Collection 的地址后追加 `/physicalSchema` |

连接列表展示名称、方言、是否为默认连接以及管理模式等结构信息，但不会返回连接密码、主机或数据库文件路径。逻辑定义和物理结构分开查询，按需打开物理详情即可。

## AI 开发的约束与验证

### 本插件的开发约束

- 保留“结构只读”这一能力边界，修改表结构仍然通过迁移完成。
- 展示连接摘要时，不要额外读取并暴露主机、密码或数据库文件路径。
- 为跨页查找、遍历上限和访问被拒绝增加验证，不要把第一页当作全部的 Collection。

### 使用边界

插件自身没有写接口；不过，首次读取 managed 连接中的 Collection 时，数据库框架可能会初始化内部的元数据表和缓存版本表，但不会因此修改业务表或业务记录。external 连接则使用目录中的元数据。

检查管理员和无权限账号的访问，以及连接不可达、Collection 无效和分页的行为。具体的错误字段以运行中应用的 API 文档为准。

相关文档：[连接与数据库方言](../../framework/database/connections.md)、[权限管理](../authorization/permissions.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-database-explorer)。
