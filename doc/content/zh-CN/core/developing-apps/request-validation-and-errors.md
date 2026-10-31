---
title: 请求校验与错误处理
description: 接入请求校验，区分字段错误、业务失败和未知异常，并用订单接口验证响应与数据行为。
---

订单接口示例提供查询、新建和修改操作：请求参数先经过校验，业务服务再检查客户是否可用、订单是否允许修改。失败时返回统一错误，客户端可以定位字段或提示业务原因。[示例源码与运行](#示例源码与运行)在文末。

示例使用 `@nocobase/app-server` `3.0.0-beta.4` 和 Zod `4.6.5`，通过命令行发送真实 HTTP 请求，无需管理页面。下文的 `pnpm request` 是示例自带的请求脚本，会自动以演示账号登录；运行前先完成文末的安装与初始化。

## 在路由中接入请求校验

从 `@nocobase/app-server/router` 导入 `apiValidator()`，把 schema 放在处理函数前面。处理函数只使用对应的 `c.req.valid('query' | 'param' | 'json')`；其中的值已经过类型转换、默认值和规则校验。

下面摘自 `server/routes/orders.ts` 的 `defineApiRoutes()` 工厂。`router` 已安装认证与授权上下文中间件；`requireOrderAction()` 是示例定义的操作权限检查，`service` 从应用容器取得，schema 从同目录的 `schemas.ts` 导入。

```ts
import {
  apiValidator,
  apiErrorResponse,
  apiErrorResponses,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';

router.post(
  '/orders',
  requireOrderAction('create'),
  describeRoute({
    tags: ['Orders'],
    summary: 'Create an order',
    operationId: 'ordersCreateOrder',
    responses: {
      '201': dataResponse(Order),
      '400': apiErrorResponse(400, 'The customer is unavailable (CUSTOMER_UNAVAILABLE).'),
      ...apiErrorResponses,
    },
  }),
  apiValidator('json', CreateOrderInput),
  async (c) => c.json({
    data: await service.create(c.get('orderPolicies'), c.req.valid('json')),
  }, 201),
);
```

认证和操作权限检查先于输入校验，所有检查都在写入之前。`apiValidator()` 不负责检查登录、权限或数据库记录是否存在；这些机制不能互相代替。权限配置见[认证、权限与数据范围](authentication-and-permissions.md)。

路由声明还要加入 `server/routes/index.ts`，由应用运行时加载：

```ts
import orders from './orders.js';
export default [orders];
```

在已有应用中保留其他路由声明再追加。路由路径写 `/orders`，不包含 `/api` 或应用部署前缀，完整接入方式见[路由与 HTTP 接口](apis-and-services.md)。

```sh
pnpm request POST orders '{"customerId":"11111111-1111-4111-8111-111111111111","reference":"  SO-2000  ","items":[{"name":"Keyboard","quantity":2}]}'
```

新建成功返回 HTTP `201` 和 `{ data }`，`data.reference` 为去除首尾空格后的 `SO-2000`，`data.id` 是服务端生成的订单 ID。保存这个 ID 可用于后续修改；重复执行会新建另一张订单。

查看源码：[路由及权限中间件](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/orders.ts)、[注册入口](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/index.ts)。

## 定义输入规则

### 查询参数的转换与默认值

查询参数是字符串。用 `z.coerce.number()` 转换后，再限制整数和范围；默认值只处理未提供的参数。

```ts
import { z } from 'zod';

export const ListOrdersQuery = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

列表路由使用 `apiValidator('query', ListOrdersQuery)`，服务接收 `c.req.valid('query')`，其中 `page`、`pageSize` 都是数字。

```sh
pnpm request GET 'orders?page=1&pageSize=1'
pnpm request GET 'orders?page=0'
```

第一条返回一条订单及 `meta.page: 1`、`meta.pageSize: 1`、`meta.total`；第二条返回 `400 INVALID_INPUT`，字段为 `page`。不提供分页参数时使用第 1 页、每页 20 条。

### 路径参数的格式

```ts
export const OrderParams = z.object({ id: z.uuid() });
```

详情与修改路由使用 `apiValidator('param', OrderParams)`，通过 `c.req.valid('param').id` 读取 ID。

```sh
pnpm request GET orders/not-a-uuid
pnpm request GET orders/99999999-9999-4999-8999-999999999999
```

第一条在格式校验阶段返回 `400 INVALID_INPUT`；第二条是合法 UUID，但示例中没有这张订单，返回 `404 ORDER_NOT_FOUND`。UUID 是本例订单和客户的 ID 约定，不应直接套用到应用用户等其他标识。

### 请求体的必填字段、空值与额外字段

JSON 请求体用 `z.strictObject()` 明确允许写入的字段。客户端不能借提交整个表单对象修改服务端维护的 `id`、`status` 等字段。查询和路径参数使用 `z.object()`；本例没有要求它们拒绝额外参数。

```ts
const OrderItemInput = z.strictObject({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(1000),
});
export const CreateOrderInput = z.strictObject({
  customerId: z.uuid(),
  reference: z.string().trim().min(1).max(120),
  items: z.array(OrderItemInput).min(1).max(20),
  note: z.string().trim().max(500).nullable().optional(),
});
export const UpdateOrderInput = CreateOrderInput.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Provide at least one field to update.' },
);
```

创建时，`customerId`、`reference` 和 `items` 必填；修改时只提供要改变的字段，但不能提交空对象。JSON 中的 `quantity` 必须是数字，不接受字符串 `"2"`。名称和订单编号先去除首尾空格，纯空格不算有效输入。

修改备注时，省略 `note` 保持原值，`note: null` 清空，空字符串则保存为空字符串。`optional()` 允许省略，`nullable()` 允许显式传入 `null`，两者含义不同。

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"reference":"SO-1001-A"}'
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"note":null}'
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"status":"confirmed"}'
```

前两条成功：先保留备注，再清空备注。第三条包含不允许写入的字段，返回 `400 INVALID_INPUT`，订单状态不变。请求脚本会设置 `Content-Type: application/json`；使用其他 HTTP 工具时也要正确设置。

以上规则的完整源码：[输入与响应 schemas](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/schemas.ts)。

## 识别校验失败

### 标准错误响应与字段路径

向订单明细提交数量 `0`：

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"items":[{"name":"Keyboard","quantity":0}]}'
```

响应中的关键字段如下，省略了面向开发者的说明文本和本次请求的 ID：

```json
{
  "error": {
    "code": 400,
    "status": "INVALID_ARGUMENT",
    "reason": "INVALID_INPUT",
    "domain": "app",
    "fieldViolations": [
      { "field": "items.0.quantity", "reason": "too_small" }
    ]
  }
}
```

`code` 是数字 HTTP 状态码，`status` 是标准错误分类，`reason` 是当前错误原因，`domain` 标明原因的定义方。每条 `fieldViolations` 还包含说明文本 `description`；字段级 `reason` 来自校验器，例如 Zod 的 `too_small`。

字段路径按点连接，数组下标也使用点：`items.0.quantity`。额外字段或空修改对象等问题可能属于整个对象，`field` 为空字符串。客户端应将这类问题显示为表单整体提示，不能假定每条错误都能定位到一个输入框。

### JSON 解析失败

JSON 本身语法错误时，还没进入 schema 校验。例如 `pnpm demo` 用原始请求体 `{` 发送创建请求，在本例锁定版本中得到 `400`、`status: INVALID_ARGUMENT`、`reason: HTTP_400`。

因此，不要把所有 `400` 都当作 `INVALID_INPUT`，也不要假设所有失败都包含 `fieldViolations`。正常请求脚本通过 `JSON.stringify()` 编码，语法损坏的请求由演示脚本单独构造。

查看源码：[HTTP 演示](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/demo.ts)、[校验与解析失败测试](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts)。

## 处理业务错误与未知异常

### 资源不存在与关联字段无效

合法的 UUID 不代表记录存在。请求 URL 指向的订单不存在时返回 `404 NOT_FOUND`；请求体中指定的客户不可用时返回 `400 INVALID_ARGUMENT`，并标记 `customerId`。

下面是 `toOrderApiError()` 对客户错误的转换分支：

```ts
if (error instanceof CustomerUnavailableError) {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'CUSTOMER_UNAVAILABLE',
    domain: 'orders',
    message: error.message,
    fieldViolations: [{
      field: 'customerId',
      reason: 'CUSTOMER_UNAVAILABLE',
      description: 'Choose an available customer.',
    }],
    cause: error,
  });
}
```

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"customerId":"99999999-9999-4999-8999-999999999999","note":"Must not be saved"}'
```

请求返回 `400 CUSTOMER_UNAVAILABLE`，原客户和备注都保留。服务先按本次操作的 Repository 策略查询客户，再写订单。操作权限拒绝返回 `403`，且发生在格式校验和存在性检查之前；不能把权限拒绝一律转换为“记录不存在”。

### 业务状态不允许操作

已确认订单不可修改，这是业务前提不满足，使用 `FAILED_PRECONDITION`，对应 HTTP `400`：

```ts
if (error instanceof OrderLockedError) {
  return new ApiError({
    status: 'FAILED_PRECONDITION',
    reason: 'ORDER_LOCKED',
    domain: 'orders',
    message: error.message,
    cause: error,
  });
}
```

```sh
pnpm request PATCH orders/33333333-3333-4333-8333-333333333333 '{"note":null}'
```

返回 `400 ORDER_LOCKED`，已确认订单的备注不变。并发版本冲突属于 `ABORTED`（409），重复创建属于 `ALREADY_EXISTS`（409）；不要因为业务上有“冲突”就统一使用 409。本例没有订单确认入口，已确认状态由初始化数据提供。

### 复用 Repository 错误处理

Repository 的可识别错误已有框架映射，直接向外传播即可。例如 `WRITE_FORBIDDEN` 返回 403，`RECORD_NOT_FOUND` 返回 404，`VERSION_CONFLICT` 返回 409；`reason` 保留 Repository 错误码，`domain` 为 `app`。

无需转换业务错误的独立路由可安装：

```ts
import { Hono } from 'hono';
import { apiErrorHandler } from '@nocobase/app-server/router';

const router = new Hono();
router.onError(apiErrorHandler);
```

示例测试向真实 Repository 传入禁止更新的策略，订单路由返回 `403 WRITE_FORBIDDEN`，记录保持不变。另一个独立 Hono 测试更新不存在的记录，得到 `404 RECORD_NOT_FOUND`。执行入口：

```sh
pnpm test -t 'Repository errors'
```

### 转换自定义业务异常

业务服务抛出 `OrderMissingError`、`CustomerUnavailableError`、`OrderLockedError`，路由负责转换为 HTTP 错误；服务无需依赖 Hono 上下文。

```ts
router.onError((error, c) => apiErrorHandler(toOrderApiError(error), c));
```

`toOrderApiError()` 只处理这三种业务异常，最后返回未识别的原始错误。`apiErrorHandler()` 渲染已知错误，把未知异常继续抛给外层应用；完整应用再生成 `500 INTERNAL / INTERNAL_ERROR`，响应不包含堆栈或内部原因。不要把所有异常包装成 400，也不要将失败返回为 200。

只使用裸 Hono 测试路由时，没有完整应用的 500 兜底。示例通过完整应用注入一次更新异常来验证该行为，执行 `pnpm test -t 'unexpected failures'`；正常运行的服务没有用于触发崩溃的接口。

查看源码：[业务服务](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/orders/service.ts)、[业务错误转换](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/errors.ts)、[Repository 与未知异常测试](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts)。

## 声明成功与错误响应

`describeRoute()` 的 `responses` 描述接口文档。列表使用 `listResponse(Order, OrderListMeta)`，单条结果使用 `dataResponse(Order)`。例如修改路由声明：

```ts
responses: {
  '200': dataResponse(Order),
  '400': apiErrorResponse(
    400,
    'The customer is unavailable (CUSTOMER_UNAVAILABLE), or the order is confirmed (ORDER_LOCKED).',
  ),
  '404': apiErrorResponse(404),
  ...apiErrorResponses,
}
```

使用 `apiValidator()` 的路由会自动补充校验失败的 400 声明；上面的显式 400 用于补充业务失败原因。`apiErrorResponses` 只有 401、403、500，适合同时检查认证和权限的接口。公开接口应按实际行为选择错误声明，而不是照搬这组状态。

运行 `pnpm request GET swagger`，可在生成文档中找到 `ordersListOrders`、`ordersCreateOrder`、`ordersUpdateOrder` 等操作。列表含分页参数和自动生成的校验失败声明，修改接口还含客户不可用、订单已确认的说明。

这些辅助函数不会设置实际 HTTP 状态、校验运行时输出或删除敏感字段。处理函数仍需返回正确状态；服务中的 `toOrderView()` 显式选择公开字段，列表记录与总数使用相同权限策略。响应 schema 使用 `z.ZodType<OrderView>` 与服务返回类型对齐，但类型检查不能代替运行时行为验证。

查看源码：[路由响应声明](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/orders.ts)、[响应 schemas](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/schemas.ts)。

## 读取错误信息与定位请求

`ApiClientError.status` 是数字 HTTP 状态码；`reason`、`domain` 和 `requestId` 可以直接读取。字段错误保留在 `payload.error.fieldViolations`，读取前检查响应结构。下面摘自演示脚本的错误摘要函数：

```ts
import { ApiClientError } from '@nocobase/api-client';
import { z } from 'zod';

const ErrorDetails = z.object({
  error: z.object({
    fieldViolations: z.array(z.object({
      field: z.string(),
      description: z.string(),
      reason: z.string().optional(),
    })).optional(),
  }),
});

export function errorSummary(error: unknown) {
  if (!(error instanceof ApiClientError)) throw error;
  const details = ErrorDetails.safeParse(error.payload);
  return {
    status: error.status,
    reason: error.reason,
    domain: error.domain,
    requestId: error.requestId,
    fields: details.success
      ? (details.data.error.fieldViolations ?? []).map(({ field, reason }) => ({ field, reason }))
      : [],
  };
}
```

执行 `pnpm demo`，无效数量会打印 `status: 400`、`reason: INVALID_INPUT` 和 `fields` 中的 `items.0.quantity`。网络异常没有服务端错误响应，不应强行当作 `ApiClientError`；这里将其他异常继续抛出。

页面按 `domain` 和 `reason` 映射本地化文案，不解析或直接显示面向开发者的 `message`、字段 `description`。需要表单错误提示与请求状态管理时，见[数据请求与状态管理](data-requests-and-state.md)。

排查问题时保存 `requestId`，对照服务端请求日志。完整应用在 `x-request-id` 响应头和错误体中返回同一 ID；API Client 优先读取响应头。本例启用了请求日志，文件位于 `storage/logs/`。

查看源码：[错误摘要](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/client-errors.ts)、[客户端调用](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/demo.ts)。

## 验证失败时的数据行为

```sh
pnpm demo
pnpm test
```

HTTP 演示检查合法请求、分页越界、无效 ID、嵌套字段错误、额外字段、缺少客户、订单不存在和已确认订单修改，并在拒绝后重新读取订单。集成测试进一步读取数据库，对比失败前后的记录，还检查：

- 未登录请求返回 401；只读账号即使提交非法字段或不存在的 ID，也先收到 403。
- 空对象、纯空格、超长字符串和错误 JSON 类型被拒绝，没有创建或修改订单。
- 省略备注保留原值，显式 `null` 确实写入数据库。
- Repository 错误保留标准分类；未知异常返回不泄露内部信息的 500。
- OpenAPI 的输入和错误声明与接口行为对应。

HTTP 错误响应本身不会撤销已经提交的操作。本例在写入前完成校验和业务检查，写入使用数据库事务；涉及多步写入时，还需确保它们处于正确的事务边界。事务机制见[事务](../framework/database/transactions.md)。

测试使用独立数据库，不会重置演示数据。Repository 拒绝和未知异常通过测试内注入条件复现，范围见[示例测试](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts)。

## 示例源码与运行

源码：[request-validation](https://github.com/nocobase/docs-examples-v3/tree/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation)。使用 Node.js 24、pnpm 11.7.0，依赖版本由 lockfile 固定。这是独立的服务端应用，不需要先搭建其他章节的历史项目。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 12e46abf29509039d988bab437de0aad8931f93e
cd apps/request-validation
pnpm install --frozen-lockfile
pnpm setup
pnpm start
```

初始化会生成本地配置、账号和演示数据。另开终端进入同一应用目录，执行 `pnpm demo` 或前面的 `pnpm request` 命令。请求脚本从 `storage/demo.json` 读取演示账号，无需复制密码。只读账号可以通过 `DEMO_ROLE=reader pnpm request ...` 选择。

服务监听端口 13220，接口前缀为 `/main/api`。使用其他主机地址时，在初始化、启动和请求命令中设置相同的 `APP_PUBLIC_ORIGIN`。示例采用 SQLite；校验与错误机制本身不依赖 SQLite，其他数据库配置未在本例中验证。

完整配置、演示数据、检查命令与验证范围见 [README](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/README.md)。
