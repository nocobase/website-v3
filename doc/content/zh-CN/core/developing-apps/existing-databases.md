---
title: 接入已有数据库
description: 以 external 连接读取已有结构，补充元数据与关联，并验证命名映射和访问权限。
---

如果数据库结构由 CRM、ERP 等其他系统维护，应用可以通过 `schemaManagement: 'external'` 接入。框架读取已有结构，再叠加应用维护的元数据；不通过这个连接运行迁移、Seed 或 Builder DDL。

`external` 是结构管理边界，不是只读权限开关。实际记录能否读写仍取决于数据库账号和应用授权。本篇按 Examples 模板的 `externalCrm` 组织配置与文件。

## 确认已有结构

先由数据库维护方确认目标表、字段、主键和业务含义。本例假设已有以下物理对象：

- `crm_customers`：`id`、`display_name`、`email`。
- `crm_orders`：`id`、`order_no`、`customer_id`，其中 `customer_id` 对应客户的 `id`。

这些表必须已存在，元数据文件不能创建它们。示例模板的 `ExternalCrmProvider` 只用于准备本地 SQLite 演示库；接入真实系统时，不把这个准备步骤当作标准建表流程。

## 配置 external 连接

把下面的连接项合并到 `server/config/database.ts` 工厂的 `connections` 中，保留现有连接：

```ts
externalCrm: {
  dialect: 'sqlite',
  filename: paths.storage('external-crm.sqlite'),
  schemaManagement: 'external',
  naming: { underscored: true, tablePrefix: 'crm_' },
},
```

`paths` 来自已有配置工厂。本地示例使用 SQLite 文件；实际接入按目标数据库安装方言包，改为正确的连接参数。不要把凭据写入仓库，沿用应用的环境配置。

`tablePrefix: 'crm_'` 和 `underscored: true` 使 `crm_orders` 对应逻辑集合 `orders`，`customer_id` 对应逻辑字段 `customerId`。元数据及 Repository 使用这些逻辑名，先检查映射结果再编写查询。

## 补充元数据

应用运行时默认为 external 连接读取 `database/<连接名>/metadata/`，因此本例无需另外声明 metadata store。独立使用 `@nocobase/db` 的脚本需要显式配置，区别见[连接、配置与数据库方言](../framework/database/connections.md)。

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

标题和字段说明补充数据库结构无法表达的信息；`customer` 关联说明现有字段怎样连接到客户集合，不会创建列、外键或修复历史数据。`foreignKey` 和 `targetKey` 必须与真实结构及命名映射相符。

这些手写 JSON 是源码，应提交到仓库。不要把自动生成的 `collections/<集合名>/metadata.json` 当成这个目录的输入，也不要靠修改生成文件保存配置。

## 刷新 Collection 信息

```bash
pnpm nocobase collections generate --connection externalCrm
pnpm nocobase collections generate --connection externalCrm --check
```

生成结果位于 `database/externalCrm/collections/`，反映物理结构和补充元数据合成的模型。修改元数据后重新生成，检查逻辑集合名、字段和关联。运行中的进程还应重新加载应用，不能假设改 JSON 会自动刷新所有缓存。

外部系统变更结构后，同样需要重新检查和验证。缺少字段应联系结构维护方处理，不能通过给 external 连接添加应用迁移来修复。

## 在业务服务中查询

下面函数使用已经授权的策略，要求策略允许订单字段及 `customer` 关联中选择的客户字段：

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

只想提供只读访问时，同时限制数据库账号与应用开放操作。`include()` 不授予关联读取权限；若订单和客户需要分别使用不同业务操作的范围，分别绑定策略查询，见[查询与操作数据](querying-data.md)。

如果需要 HTTP 接口，可按[HTTP 路由与接口](apis-and-services.md)声明 Repository 数据接口，并明确 `connection: 'externalCrm'`、允许的操作及权限策略。增加连接或元数据本身不会自动开放 API。

## 验证

确认逻辑名称与物理名称对应、字段和关联实际可查；测试空关联与外部记录删除后的结果；用真实账号验证写入是否按预期被拒绝。还应确认 Builder DDL 被框架拒绝，并且应用没有向该连接执行迁移或 Seed。不要通过底层客户端绕过结构管理限制。

SQLite 演示只说明接入流程；上线前用目标数据库验证类型、主键、权限和结构变化。多个连接之间的事务范围见[多数据库连接](multiple-databases.md)。
