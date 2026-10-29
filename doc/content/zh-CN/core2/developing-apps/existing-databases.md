---
title: 接入已有数据库
description: 通过 external 连接读取已有结构，补充元数据与关联，并验证命名映射和访问权限。
---

如果数据库结构由 CRM、ERP 等其他系统维护，应用可以通过 `schemaManagement: 'external'` 接入它。框架读取已有的结构，再叠加应用维护的元数据；这个连接上不会运行迁移、Seed 或 Builder DDL。

`external` 划定的是结构管理的边界，并不是只读权限的开关。记录实际能否读写，仍取决于数据库账号和应用授权。本篇按 Examples 模板中 `externalCrm` 的方式组织配置和文件。

## 确认已有结构

先请数据库的维护方确认目标表、字段、主键及其业务含义。本例假设已有以下物理对象：

- `crm_customers`：`id`、`display_name`、`email`。
- `crm_orders`：`id`、`order_no`、`customer_id`，其中 `customer_id` 对应客户的 `id`。

这些表必须事先存在，元数据文件不能创建它们。示例模板中的 `ExternalCrmProvider` 只用于准备本地的 SQLite 演示库；接入真实系统时，不要把这个准备步骤当作标准的建表流程。

## 配置 external 连接

把下面的连接项合并到 `server/config/database.ts` 工厂函数的 `connections` 中，保留现有的连接：

```ts
externalCrm: {
  dialect: 'sqlite',
  filename: paths.storage('external-crm.sqlite'),
  schemaManagement: 'external',
  naming: { underscored: true, tablePrefix: 'crm_' },
},
```

`paths` 来自已有的配置工厂。本地示例使用 SQLite 文件；接入实际系统时，请安装目标数据库对应的方言包，并改为正确的连接参数。不要把凭据写进仓库，沿用应用现有的环境配置。

`tablePrefix: 'crm_'` 和 `underscored: true` 让 `crm_orders` 对应逻辑集合 `orders`，让 `customer_id` 对应逻辑字段 `customerId`。元数据和 Repository 都使用这些逻辑名，请先检查映射结果，再编写查询。

## 补充元数据

应用运行时默认为 external 连接读取 `database/<连接名>/metadata/`，因此本例不需要另外声明 metadata store。单独使用 `@nocobase/db` 的脚本则需要显式配置，区别见 [连接与数据库方言](../framework/database/connections.md)。

创建 `database/externalCrm/metadata/customers.json`：

```json
{
  "version": 1,
  "name": "customers",
  "title": "CRM customers",
  "fields": {
    "displayName": {
      "title": "Display name"
    },
    "email": {
      "title": "Email address"
    }
  }
}
```

再创建 `database/externalCrm/metadata/orders.json`：

```json
{
  "version": 1,
  "name": "orders",
  "title": "CRM orders",
  "fields": {
    "orderNo": {
      "title": "Order number"
    }
  },
  "relations": {
    "customer": {
      "type": "belongsTo",
      "target": "customers",
      "foreignKey": "customerId",
      "targetKey": "id",
      "title": "Customer"
    }
  }
}
```

标题和字段说明补充的是数据库结构无法表达的信息；`customer` 关联说明的是现有字段如何连接到客户集合，它不会创建列或外键，也不会修复历史数据。`foreignKey` 和 `targetKey` 必须与真实结构及命名映射相符。

这些手写的 JSON 属于源码，应提交到仓库。不要把自动生成的 `collections/<集合名>/metadata.json` 当作这个目录的输入，也不要靠修改生成文件来保存配置。

## 刷新 Collection 信息

```bash
pnpm nocobase collections generate --connection externalCrm
pnpm nocobase collections generate --connection externalCrm --check
```

生成结果位于 `database/externalCrm/collections/`，反映由物理结构和补充元数据合成的模型。修改元数据后需要重新生成，并检查逻辑集合名、字段和关联。正在运行的进程还需要重新加载应用，不能以为修改 JSON 后所有缓存都会自动刷新。

外部系统修改结构之后，同样需要重新检查和验证。缺少字段时，应联系结构的维护方处理，不能通过给 external 连接添加应用迁移来“修复”。

## 在业务服务中查询

下面的函数使用已经过授权的策略，要求该策略允许读取订单字段，以及 `customer` 关联中所选择的客户字段：

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function listCrmOrders(
  database: DatabaseManager,
  policy: RepositoryPolicy,
) {
  return database.connection('externalCrm').repository('orders')
    .withPolicy(policy)
    .findMany({
      select: (s) => s.fields('id', 'orderNo')
        .include('customer', (customer) => customer.fields('id', 'displayName')),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
}
```

如果只想提供只读访问，需要同时限制数据库账号和应用开放的操作。`include()` 并不授予关联的读取权限；如果订单和客户需要分别使用不同业务操作的范围，请分别绑定策略查询，见 [查询与操作数据](querying-data.md)。

如果需要 HTTP 接口，可以按 [路由与 HTTP 接口](apis-and-services.md) 声明 Repository 数据接口，并明确指定 `connection: 'externalCrm'`、允许的操作和权限策略。仅仅增加连接或元数据，并不会自动开放 API。

## 验证

需要确认：逻辑名称与物理名称的对应关系正确，字段和关联确实可以查询；测试关联为空以及外部记录被删除后的结果；用真实账号验证写入是否按预期被拒绝。还要确认 Builder DDL 会被框架拒绝，并且应用没有在这个连接上执行迁移或 Seed。不要通过底层客户端绕过结构管理的限制。

SQLite 演示只用于说明接入流程；上线之前，请在目标数据库上验证类型、主键、权限和结构变化。多个连接之间的事务范围见 [多数据库连接](multiple-databases.md)。
