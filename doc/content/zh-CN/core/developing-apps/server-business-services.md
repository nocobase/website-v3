---
title: 服务端服务
description: 定义和注册可复用的服务，在 HTTP、应用命令和后台任务中调用，并处理权限策略、事务与生命周期。
---

## 服务的职责

服务（Service）是封装可复用逻辑的类或对象，无需继承框架基类。例如，将订单确认和库存扣减放在订单服务中，HTTP 接口、应用命令和后台任务就能复用这些规则。简单查询或计算也可以保留为普通函数。

服务接收参数、执行业务操作并返回结果；调用入口负责认证、输入校验和响应格式；Provider 负责创建服务、注入依赖和管理资源。本例的服务通过参数取得当前用户的权限策略，不依赖 HTTP 请求上下文。

示例 `order-services` 是一个仅含服务端的订单应用：确认订单时扣减库存，并在提交后记录日志。它使用真实认证、权限策略、数据库事务和任务执行器。源码和准备步骤见[示例源码与运行](#示例源码与运行)。

## 定义服务

### 服务接口与实现

在 `server/orders/service.ts` 中声明调用方需要的能力，再由 `DefaultOrderService` 实现：

```ts
export interface OrderService {
  get(policy: RepositoryPolicy, orderId: string): Promise<OrderView>;
  confirm(policies: ConfirmationPolicies, orderId: string): Promise<OrderView>;
}
```

`get()` 读取一张可访问的订单，`confirm()` 确认订单并扣减库存。`RepositoryPolicy` 是数据库访问策略；`ConfirmationPolicies` 包含订单与商品各自的策略。两种方法都返回 `OrderView`，其中只有订单 ID、所有者、商品、数量和状态。完整类型与实现见[服务源码](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts)。

`server/orders/` 是示例的目录约定，也可以使用 `server/services/`。这两个目录都不会被自动扫描，实际接入由导入和 Provider 列表决定。

### 注入依赖与传入参数

数据库和提交后的处理函数通过构造函数注入，订单 ID 和当前调用的权限策略通过方法传入。下面摘录构造函数和读取方法，`view()` 的字段转换见完整源码：

```ts
export class DefaultOrderService implements OrderService {
  constructor(
    private readonly database: DatabaseManager,
    private readonly onConfirmed: (order: OrderView) => void | Promise<void>,
  ) {}

  async get(policy: RepositoryPolicy, orderId: string): Promise<OrderView> {
    const row = await this.database
      .repository('orders')
      .withPolicy(policy)
      .findOne({ filter: { id: orderId } });
    if (!row) throw new OrderError('ORDER_UNAVAILABLE');
    return view(row);
  }
  // confirm() and view() are included in the complete source.
}
```

同一个服务实例可以处理不同用户的请求，但每次调用使用各自的策略。运行示例后，以 Alice 读取自己的订单返回订单数据，读取 Bob 的订单则找不到可访问记录；对应验证在[服务集成测试](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts)。

## 注册服务

### 定义服务 Token

Token 是容器查找服务时使用的带类型标识。在 `server/providers/orders.ts` 中定义并导出它：

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { OrderService } from '../orders/service.js';

export const orderServiceToken = createServiceToken<OrderService>(
  'order-services/orders',
);
```

调用方导入同一个 Token。容器按对象身份匹配，重新调用 `createServiceToken()` 即使使用相同名称，也会得到另一个标识。

### 在 Provider 中注册服务

在同一文件中，通过 `register()` 将 Token 与服务的创建方式绑定。下面沿用上面的 `orderServiceToken`，省略权限初始化的 `boot()`；完整代码见 [OrdersProvider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/orders.ts)。

```ts
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { DefaultOrderService } from '../orders/service.js';

export default class OrdersProvider extends ServiceProvider<Application> {
  readonly name = 'order-services/orders';
  override register(): void {
    this.app.container.singleton(
      orderServiceToken,
      (resolver) =>
        new DefaultOrderService(
          resolver.resolve(databaseManagerToken),
          (order) =>
            resolver
              .resolve(loggingToken)
              .getLogger('orders')
              .info({ orderId: order.id }, 'Order confirmed'),
        ),
    );
  }
}
```

`singleton()` 注册同步创建函数，首次获取服务时才执行，之后在同一个应用容器中复用实例。函数通过 `resolver.resolve()` 获取数据库和日志依赖，再传给服务；这里的日志回调由服务在事务提交后调用。

异步初始化放在 Provider 的生命周期方法中，不在创建函数中返回 Promise。其他注册方式见[服务容器与依赖注入](../framework/services/container.md)。

### 将 Provider 接入应用

```ts
// server/providers/index.ts
import OrdersProvider from './orders.js';
import OrderJobsProvider from './order-jobs.js';

export default [OrdersProvider, OrderJobsProvider];
```

[server/runtime.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/runtime.ts) 把这个数组传给 `defineAppRuntime({ serviceProviders, ... })`，应用组装时再加载它。仅创建 Provider 文件不会注册服务。

在已有默认模板应用中，向原列表追加自己的 Provider。保留模板已有的 `SubmissionProvider` 等配置；示例是单独组装的服务端应用，其完整列表不能替换默认模板的列表。

## 调用服务

在应用已注册 Provider 后，通过应用容器获取服务。`server/routes/orders.ts` 导入同一个 Token，在 `defineApiRoutes()` 的回调中使用框架传入的 `app`：

```ts
import { orderServiceToken } from '../providers/orders.js';

// Inside the defineApiRoutes() callback.
const service = app.container.resolve(orderServiceToken);
```

同一个应用容器中的多次 `resolve()` 返回同一个订单服务实例。命令或独立工作进程会创建自己的应用与服务实例。

未注册的 Token、重复注册和循环依赖都会报错。单例创建函数抛错后，后续获取仍会抛出该错误，不会自动重试创建。

### 从 HTTP 接口调用

路由先完成认证、授权和输入校验，再调用服务。以下是[确认接口](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts)的处理部分；完整文件还包含 `auth.required()`、`authz.middleware()`、`apiValidator()` 与 API 文档声明：

```ts
const policies = await authorizeOrder(c.get('authz'), 'confirm');
return c.json({
  data: await service.confirm(policies, c.req.valid('param').id),
});
```

在运行中的示例上执行 `pnpm demo`，会登录普通用户并请求 `POST /main/api/orders/:id/confirm`。自己的订单确认成功后返回 `200` 和 `data.status: "confirmed"`；只读用户得到 `403`，访问其他人的订单得到 `404`。请求与预期响应见[演示脚本](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/demo.ts)。路由声明方式见[HTTP 路由与接口](apis-and-services.md)。

### 从应用命令调用

命令通过 `AppCommand.withApp()` 使用应用，并在回调内显式启动所需生命周期。[确认命令](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/commands/orders/confirm.ts)的核心调用如下，错误转换见完整源码：

```ts
const result = await this.withApp(async ({ app }) => {
  await app.start();
  return confirmFromCommand(app, args.actorId, args.orderId);
});
```

`withApp()` 负责创建应用并在结束时清理，不会自动启动 Provider。本例的授权能力在 `boot()` 声明，因此先调用 `app.start()`，再由 `confirmFromCommand()` 检查执行用户、获取权限并调用服务：

```ts
const policies = await authorizeOrder(
  await actorContext(app, actorId),
  'confirm',
);
return app.container.resolve(orderServiceToken).confirm(policies, orderId);
```

在示例目录执行 `pnpm confirm <actorId> <orderId> --json`，成功时返回 `ok: true` 和 `result.status: "confirmed"`。参数取自准备步骤生成的 `storage/demo.json`。本地操作人员显式选择已有用户，[调用适配器](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/confirm.ts)检查账户并重新取得权限，不使用管理员身份绕过范围。命令规范见[应用命令](application-commands.md)。

### 从后台任务调用

任务的 payload 只携带 JSON 数据。不要放入数据库连接、服务对象或整个请求上下文；执行器会根据 payload 创建新任务实例。服务依赖可以由 Provider 通过闭包接入：

```ts
import { Job } from '@nocobase/jobs';
import type { Application } from '@nocobase/app-server/application';
import type { OrderService } from './service.js';
import { authorizeOrder } from './permissions.js';
import { actorContext } from './actor.js';
export function createConfirmOrderJob(app: Application, service: OrderService) {
  return class ConfirmOrderJob extends Job<{
    orderId: string;
    actorId: string;
  }> {
    static readonly jobName = 'orders.confirm';
    async execute(): Promise<void> {
      const context = await actorContext(app, this.payload.actorId);
      const policies = await authorizeOrder(context, 'confirm');
      await service.confirm(policies, this.payload.orderId);
    }
  };
}
```

[任务 Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts)在 `start()` 中获取服务，传入这个工厂：

```ts
const ConfirmOrderJob = createConfirmOrderJob(
  this.app,
  this.app.container.resolve(orderServiceToken),
);
this.executor = this.app.container
  .resolve(jobExecutorServiceToken)
  .getJobExecutor('order-services');
this.executor.registerJob(ConfirmOrderJob);
await this.executor.setup();
```

先注册任务类，再启动执行器。上面的片段省略了 Provider 的导入和投递入口，完整文件中 `jobExecutorServiceToken` 来自 `@nocobase/app-server/jobs`。任务实现见 [job.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/job.ts)。

HTTP 投递入口只从已认证上下文取 `actorId`，任务执行时再次检查账户与权限。示例只使用直接分配给用户的角色；如果业务依赖团队等成员关系，还需在非 HTTP 入口解析可信的成员身份。

`pnpm demo` 也会调用 `POST /main/api/orders/:id/confirmAsync`，得到 `202` 和 `jobId`，随后查询订单直到状态变为 `confirmed`。受理回执不代表任务已完成。更多执行器配置见[后台任务与定时执行](background-tasks.md)。

## 管理生命周期

### 初始化与启动

| 阶段 | 示例中的用途 |
| --- | --- |
| `register()` | 注册订单服务的创建函数 |
| `boot()` | 声明业务操作和数据范围 |
| `start()` | 注册 Job 类并启动执行器，发布可用的投递入口 |
| `ready()` | 需要等待所有 Provider 完成启动后的工作；本例无需覆盖 |
| `shutdown()` | 关闭本 Provider 使用的执行器 |

框架按阶段运行 Provider，而非让一个 Provider 执行完所有阶段后再处理下一个。`boot()` 开始时其他 Provider 已完成注册，但不代表它们都已完成初始化。关闭按 Provider 的相反顺序进行。详细约定见 [ServiceProvider](../extension-development/service-provider.md)。

### 隔离请求状态与释放资源

单例可以共享应用级依赖，但不要在字段中保存当前用户、权限策略、请求参数或事务连接。示例通过参数传递这些状态；同一个服务处理 Alice 和 Bob 时，数据范围仍各自独立。

[任务 Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts)保存自己使用的执行器，并在关闭时等待它结束：

```ts
override async shutdown(): Promise<void> {
  await this.executor?.shutdown();
}
```

停止 HTTP 服务或应用命令执行结束时，Provider 会等待执行器关闭。只释放由当前 Provider 管理的资源；应用数据库由其自身的 Provider 管理，订单服务不应关闭它。

## 处理权限、事务与错误

### 传入权限策略

示例声明 `orders.read` 和 `orders.confirm` 两个操作。确认需要读取与更新订单、读取与更新库存，两类数据分别产生策略。[authorizeOrder()](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/permissions.ts)从可信授权结果取得策略，服务再通过 `withPolicy()` 绑定到相应 Repository：

```ts
// Inside the service's transaction callback.
const orders = connection.repository('orders').withPolicy(policies.orders);
const products = connection.repository('products').withPolicy(policies.products);
```

`orders.owned` 数据范围使用当前用户 ID 过滤 `ownerId`；Alice 和 Bob 分别只能操作自己的订单。Robin 只有读取操作。角色及演示数据由[准备脚本](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/fixtures.ts)创建，不给所有已登录用户统一赋予业务权限。

不能接收客户端提交的 `RepositoryPolicy`，也不能用订单策略代替商品策略。重新取得 Repository 时不会自动继承已有策略，包括事务回调内的 Repository。权限声明与授权机制见[认证、权限与数据范围](authentication-and-permissions.md)。

### 管理事务与提交后操作

将需要共同成功或回滚的操作放在服务方法的同一个事务中。下面摘录 `DefaultOrderService.confirm()` 的事务边界，省略订单读取、状态检查和库存更新；这些步骤的完整实现见[服务源码](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts)。

```ts
return this.database.transaction(async (connection) => {
  const orders = connection.repository('orders').withPolicy(policies.orders);
  const products = connection.repository('products').withPolicy(policies.products);

  // ... Read the order, check its state and update it together with stock.
  const result = { ...order, status: 'confirmed' };
  connection.afterCommit(() => this.onConfirmed(result));
  return result;
});
```

读取订单、更新状态和扣减库存都使用事务回调里的连接。库存不足时抛错，前面的订单状态更新也会回滚。不要在回调中混用从外部数据库取得的 Repository。

示例通过条件更新检查订单仍为 `draft`、库存仍等于刚读到的值，防止并发写入覆盖。已确认的订单直接返回，不再次扣库存；冲突后需重新读取状态再决定是否重试。事务和并发控制见[事务与数据一致性](transactions-and-consistency.md)。

在示例中，99 件商品的订单确认失败后仍是 `draft`，库存也保持不变；[集成测试](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts)还检查了两个确认请求重叠时不会重复扣库存。

`afterCommit()` 回调在最外层事务提交后执行，事务回滚时丢弃。在事务内注册的回调完成后，`transaction()` 才返回。示例通过它调用注入的日志回调，记录 `Order confirmed`。

回调失败不能撤销已提交的数据，也不会因此让事务 Promise 失败。错误交给 `onTransactionCallbackError`，未配置时产生警告。回调执行时原事务已结束，后续数据库写入应使用根连接或新事务。嵌套与回调规则见[事务机制](../framework/database/transactions.md)。

运行 `pnpm test -t post-commit` 可复现回调抛错：订单仍然确认成功，再次确认也不会重放回调。需要可靠投递时，应将待投递记录与业务变更一起持久化，并实现重试与恢复；`afterCommit()` 本身不提供这一保证。

### 返回结果与处理业务错误

服务成功时返回 `OrderView`，失败时抛出业务错误，不在服务内设置 HTTP 状态。示例的 `OrderError` 为调用方提供稳定的错误代码：

```ts
export class OrderError extends Error {
  constructor(
    public readonly code:
      'ORDER_UNAVAILABLE' | 'OUT_OF_STOCK' | 'ORDER_CONFLICT',
  ) {
    super(code);
  }
}
```

HTTP 入口把 `ORDER_UNAVAILABLE` 转换为 404，把库存不足和状态冲突转换为 409；命令入口转换为 `CommandError`；后台任务让执行器记录失败。Repository 的其他异常继续向外抛出。错误定义见[服务源码](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts)，响应转换见[路由源码](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts)。

## 示例源码与运行

### 安装与启动

[完整示例与 README](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/README.md)提供文件对应关系和详细操作。示例要求 Node.js 24、pnpm 11.7.0，并锁定已发布的依赖；其中 `@nocobase/app-server` 为 `3.0.0-beta.4`，`@nocobase/db` 为 `1.0.0-beta.23`，`@nocobase/service-provider` 为 `0.0.2-beta.2`。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 89d899c436563335529aba9b75fbc12b5dc0db34
cd apps/order-services
pnpm install --frozen-lockfile
pnpm setup
pnpm start
```

`pnpm setup` 生成本地配置、普通用户和演示订单，凭据与订单 ID 写入未纳入 Git 的 `storage/demo.json`。已有配置和演示数据不会被覆盖。默认请求地址为 `http://localhost:13210/main/api`；改用其他主机时，为服务端与演示脚本设置相同的 `APP_PUBLIC_ORIGIN`。

示例采用 SQLite 和 memory 任务适配器，它们是已验证的本地配置，不是使用服务的通用前提。其他数据库、Redis 执行器和外部消息投递未在此示例中验证。

### 操作与验证

在另一个终端进入 `apps/order-services`，运行接口与后台任务演示：

```sh
pnpm demo
```

脚本登录演示用户，依次输出确认成功、重复确认、库存不足、越权访问和后台任务的响应。最后一次查询应显示后台任务的订单状态为 `confirmed`。首次成功确认时，服务端日志会记录 `Order confirmed`；重复确认不再扣库存或重复记录该日志。

memory 任务适配器按单进程使用。先停止 HTTP 服务，再用 `storage/demo.json` 中的 `buyer.id` 和 `orders.cli` 分别替换以下参数：

```sh
pnpm confirm <actorId> <orderId> --json
```

成功时返回 `ok: true` 和 `result.status: "confirmed"`。换成 `reader.id` 与 `orders.reader` 则会被拒绝，命令以非零状态退出。

运行静态检查、集成测试和编译：

```sh
pnpm typecheck
pnpm test
pnpm build
```

[集成测试](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts)使用真实应用与隔离数据库，验证重复及并发确认、事务回滚、用户数据隔离、命令与后台任务调用，以及执行任务时撤销权限或禁用账户后的拒绝行为。提交后回调失败的测试会产生警告，同时确认订单已保存且回调不会重放。

`pnpm build` 编译这个服务端示例，不生成部署归档。示例没有浏览器页面，执行入口与结果均通过接口、命令及日志观察。
