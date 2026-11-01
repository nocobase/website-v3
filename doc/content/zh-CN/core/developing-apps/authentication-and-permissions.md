---
title: 认证、权限与数据范围
description: 为应用接口接入登录认证、声明业务操作，并用 Repository 策略限制可访问的记录和字段。
---

Customer Access 示例中，销售可以维护自己负责的客户，并为自己的订单更换客户；只读销售只能查看。接口使用真实的认证、授权和数据库，页面沿用默认模板的 shadcn 组件与用户、角色管理。完整源码和启动步骤见[示例源码与运行](#示例源码与运行)。

## 认证、操作权限与数据范围的职责

认证确认调用者的身份，操作权限决定能否执行业务操作，数据策略决定这次操作能访问哪些记录、读写哪些字段。

| 检查 | 本例的接入方式 | 拒绝时的结果 |
| --- | --- | --- |
| 身份认证 | `authenticationToken` 的 `required()` | 未登录返回 `401` |
| 操作权限 | 请求授权上下文的 `authorize()` | 无操作权限返回 `403` |
| 记录与字段范围 | 把决策中的 `RepositoryPolicy` 绑定到 Repository | 范围外记录不可访问，未声明的字段不可读写 |

页面权限和按钮可见性帮助用户找到可用功能。接口仍需独立执行上述检查；隐藏按钮不能阻止直接请求。

## 在接口中接入认证

### 要求登录与获取当前用户

默认模板已经注册认证插件。在应用路由中解析 `authenticationToken`，将 `auth.required()` 挂载到业务路径，然后从 `c.get('auth')` 取得已验证的会话。本例创建客户时，用会话的用户 ID 写入 `ownerId`，不接受客户端指定所有者。

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';

const auth = app.container.resolve(authenticationToken);
// 在 required() 之后的请求处理器中：
const ownerId = c.get('auth')!.user.id;
```

未登录请求 `GET /api/customers` 返回 `401`；登录后还需要取得查看客户的操作权限。本例使用默认登录页面和会话，不另行签发 Token。登录方式和会话配置在 `server/config/auth.ts`，不是业务接口的职责。

查看源码：[业务路由][routes]、[认证配置][auth-config]。

### 挂载认证与授权中间件

路由工厂接收应用实例。`authz.middleware()` 在认证之后，为当前请求建立授权上下文；`AuthEnv & AuthorizationEnv` 为 Hono 的上下文变量提供类型。

```ts
import { Hono } from 'hono';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';

const router = new Hono<AuthEnv & AuthorizationEnv>();
const authz = app.container.resolve(authorizationToken);
for (const path of ['/customers', '/customers/*', '/orders', '/orders/*']) {
  router.use(path, auth.required(), authz.middleware());
}
```

这里只列认证相关代码，完整路由还限制请求体大小、校验输入并声明 API 文档。中间件仅覆盖本模块的路径，避免影响登录等其他入口。每个请求使用自己的授权上下文，不把用户或决策保存在模块变量中。`describeRoute()` 的 `security` 只描述接口，不会代替认证中间件。

查看源码：[路由及注册入口][routes]。路由类型与注册方式见 [HTTP 路由与接口](apis-and-services.md)。

## 声明业务操作

### 定义数据访问能力与字段范围

`defineDatabasePermission()` 声明操作需要的数据库能力，`defineCompositeResource()` 将这些能力组合成用户可以授权的业务操作。定义本身不注册能力，也不授予用户权限。

```ts
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';

const customers = defineDatabasePermission((p) =>
  p.collection('accessCustomers')
    .read(['id', 'name', 'email', 'notes', 'ownerId']),
);

// 摘录自 accessResource，省略标题与其他操作。
const resource = defineCompositeResource('customerAccess', (r) =>
  r.action('editCustomer', (a) =>
    a.grant('customers', customers.update(['name', 'email', 'notes'])),
  ),
);
```

`read()` 限制返回字段，`create()` 和 `update()` 限制写入字段。`internalNote` 没有进入读取声明，`ownerId` 没有进入更新声明。销售读取客户时看不到内部备注，也不能通过修改请求更换负责人。

字段能力由开发者定义；管理员在权限编辑器中选择业务操作及记录范围，不编辑任意数据库字段。本例还声明 `viewCustomers`、`createCustomer`、`viewOrders` 和 `assignCustomer`，每个操作都能独立授权。

查看源码：[完整权限声明][permissions]。以只读销售登录 Customers，只能查看列表，不显示新建和编辑入口。

![只读销售查看自己负责的客户，没有新建和编辑操作](/assets/core/developing-apps/authentication-and-permissions/customers-readonly.png)

### 组合多个集合的权限

为订单更换客户时，必须同时有权修改订单和选择目标客户。`assignCustomer` 在一个操作中声明两组数据能力：

```ts
const orders = defineDatabasePermission((p) =>
  p.collection('accessOrders').read(['id', 'number', 'customerId', 'ownerId']),
);

// 在同一个 customerAccess 资源中：
.action('assignCustomer', (a) =>
  a.grant('orders', orders.update(['customerId']))
    .grant('customers', customers),
)
```

`orders` 和 `customers` 是供角色配置选择范围的键；授权结果 `conditions.database` 则以集合名 `accessOrders`、`accessCustomers` 为键。不要把二者混用，也不要拿 `viewCustomers` 的结果代替 `assignCustomer` 中的客户范围。

在 Orders 的行菜单选择 **Change customer**，候选列表调用受 `assignCustomer` 保护的 `/api/orders/customerOptions`。它按该操作的客户范围分页查询，不从普通客户列表拼出候选项。

查看源码：[权限声明][permissions]、[关联选择页面][assignment]。

### 注册业务操作与权限编辑器入口

在 Provider 的 `boot()` 中注册集合、资源和权限分组，再把 Provider 加入 `server/providers/index.ts`。本例的 `CustomerAccessProvider` 还注册业务服务和“我负责的记录”策略。

```ts
const authz = this.app.container.resolve(authorizationToken);
authz.database.collections.add({ name: 'accessCustomers', title: title('customers') });
authz.database.collections.add({ name: 'accessOrders', title: title('orders') });
const resource = authz.compositeResources.define(accessResource);
authz.ui.sections.add({
  name: 'customer-access', title: title('title'), parent: 'business',
});
authz.ui.place(resource, { section: 'customer-access' });
```

`title()` 是示例自己的翻译辅助函数。集合必须显式注册；数据库中存在表，并不代表它已经参与授权。

前端还需在 `client/pages/settings/permission-workspace.ts` 的 `business` 数组中选入这些操作：

```ts
{
  type: 'composite',
  id: 'customerAccess',
  actions: ['viewCustomers', 'createCustomer', 'editCustomer', 'viewOrders', 'assignCustomer'],
  scopeTitles: {
    accessCustomers: { key: 'access.customers' },
    accessOrders: { key: 'access.orders' },
  },
  hiddenActionScopes: { createCustomer: ['customers'] },
}
```

创建操作的字段和所有者由接口控制，编辑器不显示没有意义的新记录范围选择器。`hiddenActionScopes` 仅影响显示，不更改已存储的授权。还要在 `client/routes.ts` 注册模板已准备好的 `settingsRoutes`，管理员才能打开用户与角色管理。

查看源码：[Provider][provider]、[权限编辑器配置][workspace]、[页面注册][client-routes]。完成后，角色编辑页应出现 Customer Access 的五个业务操作，Change customer 下有订单和客户两个范围。

## 在接口中检查操作权限

### 获取授权决策

业务接口使用当前请求的 `authz` 检查具体操作：

```ts
const decision = await c.get('authz').authorize({
  resource: { type: 'composite', id: 'customerAccess' },
  action: 'assignCustomer',
});
const database = decision.conditions?.database;
```

`authorize()` 返回完整决策，包括 `permit`、`deny` 或带条件的 `conditional`。带条件的允许需要继续落实到数据库策略，不能只看用户是否登录或决策是否不是 `deny` 就直接操作数据库。`can()` 用于功能可见性，不能提供查询和写入所需的数据策略。

查看源码：[authorizeAccess()][authorize]。只授予查看客户权限的用户，直接调用更换客户接口仍返回 `403`。

### 处理拒绝与缺失的数据策略

示例的 `authorizeAccess()` 根据操作检查所需集合。下面摘录关联操作的检查逻辑：

```ts
if (
  decision.effect === 'deny' ||
  !database?.accessOrders?.read ||
  !database?.accessCustomers?.read
) {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'CUSTOMER_ACCESS_DENIED',
    domain: 'customer-access',
    message: 'This operation is not allowed.',
  });
}
```

`ApiError` 从 `@nocobase/app-server/router` 导入。检查通过后，仍要把订单与客户各自的策略传给服务；Repository 继续检查实际读写能力和范围。缺少策略时不退回无策略查询，也不补上“全部记录”。

本例在输入校验之前检查操作权限，写入接口还接入模板的幂等提交机制。权限撤销后的新请求，包括重试旧请求，都必须重新通过授权。完整处理见[业务路由][routes]；输入和错误格式见[请求校验与错误处理](request-validation-and-errors.md)。

## 将权限策略用于数据访问

### 限制查询结果与总数

本例通过 `defineRecordAccess()` 定义“我负责的记录”。它比较记录的 `ownerId` 与可信的当前用户 ID：

```ts
import { defineRecordAccess } from '@nocobase/authorization/core';
import { buildFilter } from '@nocobase/repository-input';

const ownedRecords = defineRecordAccess('customerAccess.owned', (r) =>
  r.title(title('owned'))
    .collections('accessCustomers', 'accessOrders')
    .resolver(({ principal }) =>
      principal.type === 'user'
        ? buildFilter((f) => f.string('ownerId').eq(principal.id))
        : false,
    ),
);
// 在 Provider.boot() 中注册：
authz.recordAccess.define(ownedRecords);
```

角色选择这个策略后，授权服务将其转换为 Repository 策略。列表和总数都通过同一策略查询，搜索条件也保持一致：

```ts
const repository = connection.repository('accessCustomers').withPolicy(policy);
const filter = (f) => f.string('name').includes(q, { mode: 'insensitive' });
const data = await repository.findMany({ filter, limit: pageSize, offset: (page - 1) * pageSize });
const total = await repository.count({ filter });
```

片段省略类型和排序，完整实现见[列表服务][service]与[范围声明][permissions]。示例为 Alice、Bob 分别准备记录时，两人各自只能看到自己的客户；分页总数不包含另一人的记录。不能先读取全部数据，再在前端过滤。

![销售查看自己负责的客户，列表支持搜索和分页](/assets/core/developing-apps/authentication-and-permissions/customers.png)

### 限制创建和更新的字段

创建客户时，接口只接受 `name`、`email` 和 `notes`；服务生成 ID，并写入认证用户的 `ownerId`：

```ts
const result = await transaction.repository('accessCustomers')
  .withPolicy(policy)
  .createOne({ values: { ...values, id: randomUUID(), ownerId } });
```

在 Customers 点击 **New customer**，填写名称和邮箱后保存，新记录应出现在当前用户的列表中。

![创建客户时不提供负责人或内部备注字段](/assets/core/developing-apps/authentication-and-permissions/customer-create.png)

更新时，同样使用策略约束查找与写入：

```ts
await this.get(policy, id, transaction);
const result = await transaction.repository('accessCustomers')
  .withPolicy(policy)
  .updateOne({ filter: { id }, values: { ...values } });
```

`values` 是已经校验的业务输入。严格的输入结构会拒绝额外的 `ownerId`、`internalNote` 等字段，Repository 策略则在数据访问层再次约束写入能力。没有必要向浏览器暴露内部备注来决定是否隐藏它。

打开客户行菜单的 **Edit customer**，修改备注并保存，刷新后应保留新值。编辑表单通过 `editCustomer` 操作重新读取记录，不使用列表中的旧数据代替编辑授权。

查看源码：[创建与更新服务][service]、[客户表单][customer-form]。

![客户编辑表单只允许修改名称、邮箱和备注](/assets/core/developing-apps/authentication-and-permissions/customer-edit.png)

### 检查关联记录的数据范围

更换客户的服务在同一事务中检查订单和目标客户，再写入 `customerId`：

```ts
const orders = transaction.repository('accessOrders').withPolicy(policies.orders);
await this.getOrder(policies.orders, id, transaction);
const customer = await transaction.repository('accessCustomers')
  .withPolicy(policies.customers)
  .findOne({ filter: { id: customerId } });
if (!customer) {
  throw new ApiError({
    status: 'INVALID_ARGUMENT', reason: 'CUSTOMER_UNAVAILABLE',
    domain: 'customer-access', message: 'The selected customer is unavailable.',
  });
}
await orders.updateOne({ filter: { id }, values: { customerId } });
```

本例通过受保护的业务操作修改关联 ID，未开放通用的订单写接口。事务由路由的 `executeIdempotentMutation()` 提供，服务的查询和写入都使用该事务连接。重新取得 Repository 时必须重新绑定策略；事务不会自动继承外部 Repository 的策略。

订单不存在和订单不在范围内都返回 `404`。目标客户不存在和目标客户不可选择都返回 `400 CUSTOMER_UNAVAILABLE`，失败时保留原关联。候选列表只是方便选择，服务端会在保存时再次检查目标。

查看源码：[关联服务][service]、[事务接入][routes]。多集合事务与服务复用见[服务端服务](server-business-services.md)。

![为订单选择允许访问的客户，保存时同时检查两边的数据范围](/assets/core/developing-apps/authentication-and-permissions/order-customer.png)

## 配置角色与页面访问

### 分配业务操作和数据范围

首次初始化创建两个可编辑角色：**Sales representative** 包含五项业务操作，**Read-only sales** 只包含查看客户和查看订单。两者默认都使用 **Records I own**，但不会自动分配给任何普通用户。

管理员打开 **System settings → Permission management → Roles and permissions**，编辑角色的业务操作和范围，再在 **Users** 中将角色分配给明确的用户。对 Change customer，应分别检查订单与客户范围。不要把这些业务权限写入所有已登录用户继承的 `member` 角色。

初始化代码通过 `definePermissionSet()` 复用业务资源声明。例如，查看客户的范围这样选择：

```ts
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { selection } from '@nocobase/authorization/core';

const role = definePermissionSet('customer-reader')
  .title(title('reader'))
  .grant(accessResource.reference().grant({
    viewCustomers: { customers: selection.recordAccess('customerAccess.owned') },
  }))
  .build();
```

这是声明片段；[角色 seed][roles]包含页面授权、其他操作和实际持久化。Seed 仅初始化一次，之后管理员保存的配置不会在重启时被覆盖。已有数据库不会因为修改 seed 而自动更新角色。

![角色编辑器分别配置业务操作与记录范围](/assets/core/developing-apps/authentication-and-permissions/permissions.png)

### 区分页面权限与接口权限

客户页面单独声明页面授权；子路由继承同一页面权限：

```ts
{
  name: 'accessCustomers',
  path: '/customers',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'customerAccess.customers' }, action: 'access' },
  componentLoader: () => import('./pages/access/list.js'),
}
```

按钮通过 `useCan()` 检查业务操作，等待中或检查失败时不显示可用入口：

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';

const { can } = useCan({
  resource: { type: 'composite', id: 'customerAccess' },
  action: 'createCustomer',
});
```

只授予页面访问权限，接口仍返回 `403`；只授予业务操作，用户可以在其数据范围内调用接口，但不能因此打开页面。角色的多个授权来源可能同时生效，取消某个角色中的勾选不等于撤销其他角色的授权。

查看源码：[页面注册][client-routes]、[列表按钮][list]。前端路由机制见[页面、路由与导航](pages-routes-and-navigation.md)。

## 用普通用户验证权限

### 未登录、无权限与越界访问

使用独立的普通账号验证，避免管理员的无限制访问掩盖错误。为 Alice、Bob 分别准备客户与订单，给 Alice 分配 Sales representative，给 Bob 分配 Read-only sales。

| 操作 | 预期结果 |
| --- | --- |
| 未登录请求客户接口 | `401` |
| 无业务角色或只有页面权限 | 客户接口返回 `403` |
| 只读销售查看列表 | 只返回自己的记录和对应总数 |
| 只读销售直接请求创建、修改或更换客户 | `403` |
| 销售读取或更新另一个用户的客户 | 与不存在的记录一样返回 `404` |

[接口测试][tests]使用真实登录、权限服务和隔离的 SQLite 数据库，另有一项隔离测试检查授权结果缺失策略时是否拒绝执行。

### 字段限制、关联修改与权限撤销

- 客户响应中不应出现 `internalNote`；提交 `ownerId` 或 `internalNote` 应被拒绝，数据库原值不变。
- 更换到允许的客户应成功，并能再次读取确认；更换到其他用户的客户或不存在的客户，应返回相同错误并保留原关联。
- 分别清空更换客户操作的订单范围、客户范围，确认另一边允许不能补足缺失的范围。
- 撤销业务操作后重新请求，确认旧会话和幂等重试都不能继续使用已撤销的权限。

运行[接口测试][tests]和[浏览器测试][browser-tests]的方法见示例 README。

## 示例源码与运行

[Customer Access 完整源码][source]基于默认模板 `1.0.0-beta.85`，使用 Node.js 24 和 pnpm 11.7.0。锁文件固定本例依赖，包括认证插件 `2.0.0-beta.16`、授权插件 `1.0.0-beta.33` 和数据库包 `1.0.0-beta.24`。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 5c9b1dcae021f4e4ae94416e783e3e84a71a1781
cd apps/customer-access
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

首次启动前，在本地 `config.yml` 的 `users.initialAdmin` 中配置管理员账号。示例采用 SQLite，避免准备额外服务；它不是认证与授权功能的必要条件。其他数据库未在本例中验证。访问启动日志给出的完整应用地址，包含部署基础路径。

管理员通过 Users 创建普通用户并分配角色后，可在应用目录为指定用户添加演示记录：

```bash
pnpm nocobase app sample-customers --email alice@example.test --dry-run
pnpm nocobase app sample-customers --email alice@example.test
```

这里的邮箱替换为已创建用户的实际邮箱。命令只为该用户添加虚构客户和订单，不创建账号、不分配角色；数据会持久化，重复执行不会重复添加同名演示记录。再为第二个用户执行一次，就可以比较两人的访问范围。

具体配置、用法与源码映射、测试命令和已验证范围见 [README][readme]。

[source]: https://github.com/nocobase/docs-examples-v3/tree/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access
[routes]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/routes/customer-access.ts
[auth-config]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/config/auth.ts
[permissions]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/access/permissions.ts
[authorize]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/access/authorize.ts
[provider]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/providers/customer-access.ts
[service]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/providers/customer-access-service.ts
[workspace]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/settings/permission-workspace.ts
[client-routes]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/routes.ts
[assignment]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/assignment.tsx
[customer-form]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/customer-form.tsx
[roles]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/database/main/seeds/202610310001_customer_access_roles.ts
[list]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/list.tsx
[tests]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/tests/server/customer-access.test.ts
[browser-tests]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/tests/playwright/customer-access.test.ts
[readme]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/README.md
