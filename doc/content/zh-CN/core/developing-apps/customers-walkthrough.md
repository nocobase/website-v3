---
title: 一个功能的完整代码
metaDescription: 从数据表到页面，读一遍客户管理示例的代码，看 Core 的约定落在哪些文件里，用来审查 Agent 的改动或自己写类似的功能。
---

这里以[开发第一个功能](../getting-started/build-your-first-app.md)里的客户管理为例，从数据表到页面读一遍一个功能的完整代码，看 Core 的约定具体落在哪些文件里：表怎样建，接口怎样检查权限，页面怎样保存数据。审查 Agent 的改动，或者自己写一个类似的功能，都可以拿它对照。

这里读的是示例应用 [docs-examples-v3/apps/customers](https://github.com/nocobase/docs-examples-v3/tree/__CUSTOMERS_COMMIT__/apps/customers) 的代码，你的 Agent 写出的文件名可能不同，结构基本一致。代码按数据从下往上排：数据表、服务端、页面，然后是权限和测试。各层放在哪个目录，见[应用的代码结构](app-structure.md)。

文件名链接到完整文件；标为片段的代码省略了导入和部分逻辑。

## 数据表

只新增一张业务表 `customers`。用户、登录和角色使用内置能力，不另建用户表或权限系统。

| 字段 | 用途 |
| --- | --- |
| `id` | 客户 ID |
| `name` | 必填的客户名称，去掉首尾空格后最多 120 个字符 |
| `contact` | 联系方式，最多 200 个字符 |
| `notes` | 备注，最多 2,000 个字符 |
| `status` | `lead`（潜在）、`following`（跟进中）、`won`（已成交） |
| `ownerId` | 负责销售的用户 ID，可以为空 |
| `nextFollowUpDate` | 下次跟进日期，`YYYY-MM-DD` 格式，可以为空 |
| `createdAt`、`updatedAt` | 创建和更新时间 |

在 [database/main/migrations/202610290101_create_customers.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/database/main/migrations/202610290101_create_customers.ts) 中声明字段和索引：

<details>
<summary>展开完整迁移</summary>

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610290101_create_customers',
  async up({ builder }) {
    await builder.createCollection('customers', (c) => {
      c.string('id', { length: 36, primaryKey: true, nullable: false });
      c.string('name', { length: 120, nullable: false });
      c.string('contact', { length: 200, nullable: false, defaultValue: '' });
      c.text('notes', { nullable: false, defaultValue: '' });
      c.string('status', { length: 16, nullable: false, defaultValue: 'lead' });
      c.string('ownerId', { length: 255, nullable: true });
      c.string('nextFollowUpDate', { length: 10, nullable: true });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.index(['ownerId', 'status']);
      c.index('nextFollowUpDate');
      c.index('updatedAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('customers');
  },
});
```

</details>

迁移只负责表结构，字段的业务校验在服务端完成。负责销售通过用户服务检查，不直接读写认证插件的内部表。执行迁移时先预览，再应用：

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections doctor
```

执行后，`database/main/collections/customers/` 下会生成表结构快照，不要手工修改。示例客户是运行时数据，不放进初始化种子。迁移和种子的写法见[建表与数据初始化](data-models-and-migrations.md)。

## 服务端

请求先通过认证和授权，接口校验输入，再把业务处理交给服务。

### 输入校验

[server/customers/schemas.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/server/customers/schemas.ts) 把新建、编辑和更新状态分成三种输入，编辑客户资料时不会顺带改掉状态：

<details>
<summary>展开输入校验（片段）</summary>

```ts
export const customerStatus = z.enum(['lead', 'following', 'won']);
export const customerDetails = z.strictObject({
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().max(200).default(''),
  notes: z.string().trim().max(2000).default(''),
  ownerId: z.string().min(1).max(255).nullable().default(null),
  nextFollowUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.valueOf()) &&
        date.toISOString().slice(0, 10) === value
      );
    })
    .nullable()
    .default(null),
});
export const createCustomer = customerDetails.extend({
  status: customerStatus.default('lead'),
});
export const editCustomer = customerDetails.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const followUpCustomer = z.strictObject({
  status: customerStatus,
  expectedUpdatedAt: z.iso.datetime(),
});
```

</details>

### 业务服务

[server/customers/service.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/server/customers/service.ts) 的 `CustomerService` 负责查询和读写客户，所有读写都通过带权限策略的 Repository。新建客户时，`validateOwner` 通过用户服务拒绝不存在或已停用的负责销售：

```ts
async create(policy: RepositoryPolicy, input: CustomerInput) {
  await this.validateOwner(input.ownerId);
  const now = new Date();
  const result = await this.db
    .repository('customers')
    .withPolicy(policy)
    .createOne({
      values: { ...input, id: randomUUID(), createdAt: now, updatedAt: now },
    });
  return rowSchema.parse(result.record);
}
```

同一个服务还提供列表、详情、编辑、更新状态和删除。列表在数据库中完成筛选、排序和分页，并返回总数。编辑、更新状态和删除都要带上读取时的 `expectedUpdatedAt`，客户已被别人修改时返回 `409`，不会悄悄覆盖别人的修改。

服务在 [server/providers/customers.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/server/providers/customers.ts) 中注册，并加入 `server/providers/index.ts`。`SubmissionProvider` 是模板自带的，负责下文的重复提交保护：

```ts
import CustomersProvider from './customers.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  CustomersProvider,
];

export default serviceProviders;
```

想了解服务怎样组织和注册，见[服务端业务服务](server-business-services.md)。

### HTTP 接口

[server/routes/customers.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/server/routes/customers.ts) 在客户路由上统一安装认证和授权中间件。`gate` 按这次的操作取得权限策略，没有权限时直接拒绝。列表接口如下（片段）：

```ts
customers.use('*', auth.required(), authz.middleware());
const gate =
  (action: CustomerAction): MiddlewareHandler<Env> =>
  async (c, next) => {
    c.set('customerPolicy', await service.policy(c.get('authz'), action));
    await next();
  };
customers.get(
  '/',
  gate('read'),
  describeRoute({
    tags: ['Customers'],
    operationId: 'listCustomers',
    summary: 'List accessible customers',
    responses: {
      '200': listResponse(customerSchema, meta),
      ...apiErrorResponses,
    },
  }),
  apiValidator('query', listCustomers),
  async (c) =>
    c.json(
      await service.list(
        c.get('customerPolicy'),
        c.req.valid('query'),
        c.get('authz'),
      ),
    ),
);
```

`describeRoute` 声明接口文档，`apiValidator` 校验请求。成功时返回 `{ data }`，失败时返回标准的 `ApiError`。

写操作（新建、编辑、更新状态和删除）还要求请求带上 `Idempotency-Key`。接口通过 `executeIdempotentMutation` 把客户的写入和一份操作回执放在同一个事务里：网络中断后重试同一个请求，不会重复创建客户。新建接口（片段）：

```ts
customers.post(
  '/',
  gate('create'),
  describeRoute({
    tags: ['Customers'],
    operationId: 'createCustomer',
    summary: 'Create a customer',
    responses: { '201': dataResponse(customerSchema), ...errors },
  }),
  apiValidator('header', z.object({ 'idempotency-key': z.string() })),
  apiValidator('json', createCustomer),
  async (c) => {
    return c.json(await mutation(c, 'create', c.req.valid('json')), 201);
  },
);
```

`mutation` 是同一文件里的辅助函数，在回执事务中调用 `CustomerService`。客户路由加入 `server/routes/index.ts` 后才会生效：

```ts
import { customerRoutes } from './customers.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [customerRoutes];

export default routes;
```

登录后，在应用的 `/api/swagger/docs`（例如 `/main/api/swagger/docs`）可以查看 Customers 接口。接口的更多写法见[路由与 HTTP 接口](apis-and-services.md)和[请求校验与错误处理](request-validation-and-errors.md)。

## 页面

页面包括客户列表、详情抽屉和新建、编辑弹窗，沿用模板的布局、表格、表单和反馈组件。

### 路由和侧边栏

在 [client/routes.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/routes.ts) 中注册客户页面。`navigation` 生成侧边栏入口，`authz` 声明页面访问权限。详情和弹窗也有自己的地址，刷新、后退或直接打开链接时可以恢复：

<details>
<summary>展开客户路由（片段）</summary>

```ts
{
  name: 'customers',
  path: '/customers',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'customers' }, action: 'access' },
  navigation: { title: 'customers.title', icon: Building2, order: 10 },
  componentLoader: () => import('./pages/customers/index.js'),
  children: [
    {
      name: 'customerCreate',
      path: 'new',
      componentLoader: () => import('./pages/customers/form.js'),
    },
    {
      name: 'customerEdit',
      path: 'edit/:customerId',
      componentLoader: () => import('./pages/customers/form.js'),
    },
    {
      name: 'customerDetail',
      path: ':customerId',
      componentLoader: () => import('./pages/customers/detail.js'),
      children: [
        {
          name: 'customerDetailEdit',
          path: 'edit',
          componentLoader: () => import('./pages/customers/form.js'),
        },
      ],
    },
  ],
}
```

</details>

页面路由的更多写法见[页面、路由与导航](pages-routes-and-navigation.md)。

### 列表

[client/pages/customers/index.tsx](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/pages/customers/index.tsx) 把搜索、状态、排序和页码保存在 URL 里，用 `useApiClient` 请求列表接口，再把结果交给模板的 `DataTable`（片段）：

```tsx
<DataTable
  columns={columns}
  data={result.data}
  getRowId={(row) => row.id}
  manualPagination
  rowCount={result.meta.total}
  paginationState={pagination}
  pageSizeOptions={[10, 20, 50]}
  manualSorting
  sortingState={sorting}
  loading={loading}
  emptyMessage={empty}
/>
```

完整文件里，`onPaginationChange` 和 `onSortingChange` 把新的页码和排序写回 URL，触发新的查询。页面还区分了首次为空、筛选无结果、加载中和加载失败几种状态；客户名称用 `RecordLink` 打开详情。

### 表单和保存

[client/pages/customers/form.tsx](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/pages/customers/form.tsx) 用同一个表单处理新建和编辑。新建时提交初始状态，编辑时只提交客户资料和读取时的版本。保存通过 `useSubmission` 发出，它为这次提交生成 `Idempotency-Key`；结果不确定时保留原来的输入和键，重试时沿用同一个键（片段，省略了提交前的字段校验）：

```ts
const values = {
  name: fields.name.trim(),
  contact: fields.contact.trim(),
  notes: fields.notes.trim(),
  ownerId: fields.owner?.id ?? null,
  nextFollowUpDate: fields.nextFollowUpDate,
  ...(creating
    ? { status: fields.status }
    : { expectedUpdatedAt: version }),
};
const saved = await submission.run(values, async (key, signal, snapshot) =>
  api.request<{ data: Customer }>({
    path: creating ? 'customers' : `customers/${customerId}`,
    method: creating ? 'POST' : 'PATCH',
    json: snapshot,
    headers: { 'Idempotency-Key': key },
    signal,
  }),
);
```

表单在提交时校验，错误显示在对应字段旁；保存失败保留输入，保存中不能重复提交或关闭。负责销售已失效时，把接口返回的错误放回负责销售字段。

![新建客户的表单，填写名称、联系方式、备注、负责销售和下次跟进日期。](/assets/core/tutorials/customers/customer-create.png)

负责销售的选择框在 [owner-picker.tsx](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/pages/customers/owner-picker.tsx)，详情抽屉在 [detail.tsx](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/pages/customers/detail.tsx)。编辑、更新状态和删除集中在 [customer-actions.tsx](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/pages/customers/customer-actions.tsx)，删除前要求确认。组件和交互的更多写法见[UI 组件与交互](pages-and-interactions.md)和[数据请求与状态管理](data-requests-and-state.md)。

### 文案

客户管理的界面文案集中在 [client/locales/customers.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/client/locales/customers.ts)，每种语言一份，再加入对应语言的资源。组件里只使用翻译键（片段）：

```ts
// client/locales/en-US.ts
import { customersEn } from './customers.js';
const enUS = { ...systemEnUS, customers: customersEn, ...fileUi };

// client/locales/zh-CN.ts
import { customersZh } from './customers.js';
const zhCN: AppResource = { ...systemZhCN, customers: customersZh, ...fileUi };
```

`system/` 里是模板自己的文案，升级模板时可以整体替换，应用的文案不要写进去。详见[多语言](localization.md)。

## 权限

页面入口和数据操作分别授权。服务端检查每一次请求和它能处理的数据范围，隐藏按钮只是界面上的处理。

### 声明操作和数据范围

[server/customers/permissions.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/server/customers/permissions.ts) 声明五种客户操作：查看、新建、编辑、更新状态和删除，以及“我负责的客户”这个数据范围。编辑只能改客户资料，更新状态只能改 `status`，所以可以只给销售更新状态的权限：

<details>
<summary>展开权限声明</summary>

```ts
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { buildFilter } from '@nocobase/repository-input';
import metadata from '../../package.json' with { type: 'json' };
import type { CustomerRow } from './schemas.js';
export const label = (key: string) => ({
  ns: metadata.name,
  key: `customers.${key}`,
});
const fields = [
  'id',
  'name',
  'contact',
  'notes',
  'status',
  'ownerId',
  'nextFollowUpDate',
  'createdAt',
  'updatedAt',
] as const;
const data = defineDatabasePermission((p) =>
  p.collection<CustomerRow>('customers').title(label('title')).read(fields),
);
export const ownedCustomers = defineRecordAccess('customers.owned', (access) =>
  access
    .title(label('ownedScope'))
    .collections('customers')
    .resolver(({ principal }) =>
      principal.type === 'user'
        ? buildFilter((f) => f.string('ownerId').eq(principal.id))
        : false,
    ),
);
export const customerPermissions = defineCompositeResource('customers', (r) =>
  r
    .title(label('title'))
    .action('read', (a) =>
      a.title(label('readPermission')).grant('customers', data),
    )
    .action('create', (a) =>
      a
        .title(label('createPermission'))
        .grant('customers', data.create(fields)),
    )
    .action('edit', (a) =>
      a
        .title(label('editPermission'))
        .grant(
          'customers',
          data.update([
            'name',
            'contact',
            'notes',
            'ownerId',
            'nextFollowUpDate',
            'updatedAt',
          ]),
        ),
    )
    .action('followUp', (a) =>
      a
        .title(label('followUpPermission'))
        .grant('customers', data.update(['status', 'updatedAt'])),
    )
    .action('delete', (a) =>
      a.title(label('deletePermission')).grant('customers', data.delete()),
    ),
);
export type CustomerAction = 'read' | 'create' | 'edit' | 'followUp' | 'delete';
```

</details>

`CustomersProvider` 启动时把这些声明登记到授权服务，权限管理页面里就会出现“客户”这一组（片段）：

```ts
override async boot() {
  const authz = this.app.container.resolve(authorizationToken);
  authz.database.collections.add({
    name: 'customers',
    title: label('title'),
  });
  authz.recordAccess.define(ownedCustomers);
  authz.ui.sections.add({
    name: 'customers',
    parent: 'business',
    title: label('title'),
  });
  authz.ui.place(authz.compositeResources.define(customerPermissions), {
    section: 'customers',
  });
  // 随后注册 CustomerService，见完整文件
}
```

### 在服务中使用权限策略

接口的 `gate` 调用下面的方法取得这次操作的策略，服务的每次读写都带上它（`withPolicy(policy)`）。所以销售即使拿到别人客户的 ID，也读不到、改不了：

```ts
async policy(
  authz: AuthorizationContext,
  action: CustomerAction,
): Promise<RepositoryPolicy> {
  const decision = await authz.authorize({
    resource: { type: 'composite', id: 'customers' },
    action,
  });
  const policy = decision.conditions?.database?.customers;
  if (decision.effect === 'deny' || !policy)
    throw customerError('PERMISSION_DENIED', 'CUSTOMER_ACTION_DENIED');
  return policy;
}
```

### 初始化角色

用一次性的种子初始化三个角色，管理员之后可以在权限管理里修改。种子只在角色不存在时创建，不会在每次启动时覆盖管理员的调整，也不会把客户权限自动授予所有登录用户：

| 角色 | 初始权限 |
| --- | --- |
| Sales manager（销售主管） | 全部客户的查看、新建、编辑、更新状态和删除 |
| Sales rep（销售） | 查看自己负责的客户，更新它们的状态 |
| Customer viewer（客户只读） | 查看全部客户，不能修改 |

<details>
<summary>展开角色种子</summary>

```ts
import metadata from '../../../package.json' with { type: 'json' };
import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

// Keep installation data self-contained: the migration loader runs native ESM.
const customerRoles = [
  {
    key: 'sales-manager',
    title: 'managerRole',
    actions: ['read', 'create', 'edit', 'followUp', 'delete'],
    scope: 'allRecords',
  },
  {
    key: 'sales-rep',
    title: 'repRole',
    actions: ['read', 'followUp'],
    scope: 'customers.owned',
  },
  {
    key: 'customer-viewer',
    title: 'viewerRole',
    actions: ['read'],
    scope: 'allRecords',
  },
].map(({ key, title, actions, scope }) =>
  definePermissionSet(key)
    .title({ ns: metadata.name, key: `customers.${title}` })
    .grant({
      resource: { type: 'page', id: 'customers' },
      actions: [{ action: 'access' }],
    })
    .grant({
      resource: { type: 'composite', id: 'customers' },
      actions: actions.map((action) => ({
        action,
        policy: { type: 'composite', scopes: { customers: scope } },
      })),
    })
    .build(),
);
export default defineSeed({
  name: '202610290102_customer_roles',
  transaction: true,
  async run({ query }) {
    for (const role of customerRoles) {
      const existing = await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', role.key)
        .executeTakeFirst();
      if (existing) continue;
      const now = new Date();
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: role.key,
          key: role.key,
          title: encodeAuthorizationTitle(role.title),
          grants: JSON.stringify(role.grants),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
```

</details>

完整文件见 [database/main/seeds/202610290102_customer_roles.ts](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/database/main/seeds/202610290102_customer_roles.ts)。

### 启用用户和角色管理

模板已经准备好用户管理和权限管理页面，但新应用里没有注册。在 `client/routes.ts` 中加入它们，再把客户操作加入权限编辑器（片段）：

```ts
// client/routes.ts
import systemSettingsRoutes from './pages/settings/routes.js';
const routes = [appRoutes, systemSettingsRoutes];

// client/pages/settings/permission-workspace.ts 中的业务条目
{
  type: 'composite',
  id: 'customers',
  actions: ['read', 'create', 'edit', 'followUp', 'delete'],
  hiddenActionScopes: { create: ['customers'] },
}
```

之后在 **System settings → Users** 中把角色分配给具体的用户。不要把业务角色授予所有登录用户，也不要扩大默认的 `Member` 角色。需要调整操作和数据范围时，在权限管理中编辑对应的角色。

![权限管理中的三种客户角色。](/assets/core/tutorials/customers/roles.png)

身份、操作授权和数据范围的完整说明见[认证、权限与数据范围](authentication-and-permissions.md)。

## 测试

测试放在 `tests/` 里，沿用项目已有的测试配置，用真实的应用和隔离的测试数据库验证业务行为。示例有下面这些测试，完整代码见 [tests 目录](https://github.com/nocobase/docs-examples-v3/tree/__CUSTOMERS_COMMIT__/apps/customers/tests)：

```tree
tests/
├── database/
│   └── customers-migration.test.ts              # 建表、回退和重新执行
├── server/
│   ├── customers.test.ts                        # 增删改查、校验、筛选分页和权限
│   └── authorization-assignment-safety.test.ts  # 不会自动向所有用户授予业务角色
├── client/
│   ├── customers.test.tsx                       # 表单校验、保存反馈和只读限制
│   ├── client-routes.test.ts                    # 页面路由和访问权限的注册
│   └── page-permission-titles.test.ts           # 每种语言都有权限名称
└── playwright/
    └── customers.test.ts                        # 不同角色在浏览器里的完整操作
```

在应用目录运行数据库、服务端和客户端测试，不需要先启动应用：

```bash
pnpm test
```

浏览器测试要对一个单独启动的测试应用运行。第一次先安装 Chromium，再指定应用地址：

```bash
pnpm exec playwright install chromium
TUTORIAL_ORIGIN=http://127.0.0.1:13000 pnpm exec playwright test tests/playwright/customers.test.ts
```

测试默认用 `nocobase` / `admin123` 登录，可以用 `TUTORIAL_USERNAME`、`TUTORIAL_PASSWORD` 换成别的管理员账号。测试会创建四个测试账号（`crme2ealice` 等），结束后保留，用完在用户管理里删除。不要对生产环境运行。想了解测试怎样组织，见[测试与验收](testing-and-acceptance.md)。

## 运行完整示例

在一个新目录运行示例，不要覆盖自己的项目。需要 Node.js 24 和 pnpm 11.7：

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout __CUSTOMERS_COMMIT__
cd apps/customers
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set i18n.defaultLocale=en-US
pnpm nocobase config check
pnpm dev
```

打开终端输出的完整 `Local:` 地址，用初始管理员登录，在用户管理中添加测试用户并分配客户角色。示例不带配置、数据库和截图里的示例数据，新安装的客户列表是空的。[示例的 README](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/README.MD) 列出了文件对照和测试命令，[实操记录](https://github.com/nocobase/docs-examples-v3/blob/__CUSTOMERS_COMMIT__/apps/customers/docs/walkthrough.md) 写明了已经验证和尚未验证的范围。

## 下一步

- [建表与数据初始化](data-models-and-migrations.md)、[路由与 HTTP 接口](apis-and-services.md)、[页面、路由与导航](pages-routes-and-navigation.md)、[认证、权限与数据范围](authentication-and-permissions.md)：每一层的完整写法。
- [选择部署方式](../deployment/choose-a-deployment-method.md)：把应用部署到服务器。
