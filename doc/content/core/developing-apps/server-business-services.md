---
title: Server-side services
description: Define and register reusable services, call them from HTTP, application commands and jobs, and manage policies, transactions and lifecycle.
---

## Service responsibilities

A service is a class or object that encapsulates reusable logic. It does not need to extend a framework base class. For example, an order service lets HTTP endpoints, application commands and background jobs share order confirmation and stock deduction rules. Simple queries or calculations can also remain ordinary functions.

Services accept inputs, perform business operations and return results. Entry points handle authentication, input validation and response formats. Providers construct services, supply dependencies and manage resources. In this example, the service receives the current user's permission policies as arguments without depending on an HTTP request context.

The `order-services` example is a headless order application. Confirmation deducts stock and logs the result after commit. It uses real authentication, authorization policies, database transactions and a job executor. See [Example source and running the app](#example-source-and-running-the-app) for setup.

## Define a service

### Service interface and implementation

Declare the capabilities callers need in `server/orders/service.ts`, then implement them in `DefaultOrderService`:

```ts
export interface OrderService {
  get(policy: RepositoryPolicy, orderId: string): Promise<OrderView>;
  confirm(policies: ConfirmationPolicies, orderId: string): Promise<OrderView>;
}
```

`get()` reads an accessible order; `confirm()` confirms it and deducts stock. `RepositoryPolicy` is a database access policy. `ConfirmationPolicies` contains separate policies for orders and products. Both methods return `OrderView`, which contains only the order ID, owner, product, quantity and status. See the [service source](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) for the full types and implementation.

`server/orders/` is the example's directory convention; `server/services/` is another option. Neither directory is scanned automatically. Imports and the Provider list determine what is loaded.

### Inject dependencies and pass arguments

Inject the database and post-commit handler through the constructor. Pass the order ID and the current call's policy into methods. This excerpt shows the constructor and read method; the complete source includes the `view()` field conversion:

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

One instance can handle requests from different users, with each call applying its own policy. In the running example, Alice can read her own order but cannot find Bob's order through her policy. The [service integration tests](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) check this behavior.

## Register the service

### Define a service Token

A Token is a typed identifier the container uses to look up a service. Define and export it in `server/providers/orders.ts`:

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { OrderService } from '../orders/service.js';

export const orderServiceToken = createServiceToken<OrderService>(
  'order-services/orders',
);
```

Callers import the same Token. The container matches object identity: calling `createServiceToken()` again with the same name still produces a different identifier.

### Register the service in a Provider

In the same file, bind the Token to a service factory in `register()`. This excerpt uses the `orderServiceToken` declared above and omits authorization initialization in `boot()`. See [OrdersProvider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/orders.ts) for the complete file.

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

`singleton()` registers a synchronous factory. It runs when the service is first resolved, and later calls reuse that instance within the application container. The factory uses `resolver.resolve()` to obtain database and logging dependencies, then supplies them to the service. The service invokes the logging callback after its transaction commits.

Put asynchronous initialization in Provider lifecycle methods instead of returning a Promise from the factory. See [Service container and dependency injection](../framework/services/container.md) for other registration options.

### Connect the Provider to the application

```ts
// server/providers/index.ts
import OrdersProvider from './orders.js';
import OrderJobsProvider from './order-jobs.js';

export default [OrdersProvider, OrderJobsProvider];
```

[server/runtime.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/runtime.ts) passes this array to `defineAppRuntime({ serviceProviders, ... })`; application assembly then loads it. Creating a Provider file alone does not register a service.

In an existing Default template application, append Providers to its original list. Preserve `SubmissionProvider` and other template configuration. This example assembles a separate server application; its complete list must not replace the Default template's list.

## Call the service

After the application has registered its Providers, resolve the service from the application container. In `server/routes/orders.ts`, import the same Token and use the `app` supplied to the `defineApiRoutes()` callback:

```ts
import { orderServiceToken } from '../providers/orders.js';

// Inside the defineApiRoutes() callback.
const service = app.container.resolve(orderServiceToken);
```

Repeated `resolve()` calls within one application container return the same order service instance. Commands and separate worker processes create their own applications and service instances.

Missing Tokens, duplicate registrations and circular dependencies throw errors. A failed singleton factory stays failed: later resolutions throw the same error instead of retrying construction.

### From an HTTP endpoint

Authenticate, authorize and validate inputs before calling the service. This is the handler portion of the [confirmation endpoint](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts). The complete file also includes `auth.required()`, `authz.middleware()`, `apiValidator()` and API documentation declarations:

```ts
const policies = await authorizeOrder(c.get('authz'), 'confirm');
return c.json({
  data: await service.confirm(policies, c.req.valid('param').id),
});
```

Run `pnpm demo` against the running example. It signs in ordinary users and calls `POST /main/api/orders/:id/confirm`. Confirming an owned order returns `200` with `data.status: "confirmed"`. A read-only user gets `403`; accessing another user's order gets `404`. See the [demo script](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/demo.ts) for requests and expected responses, and [HTTP routes and APIs](apis-and-services.md) for route declarations.

### From an application command

Use `AppCommand.withApp()` and explicitly start the lifecycle the command needs. This is the core call in the [confirmation command](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/commands/orders/confirm.ts); see the complete source for error mapping:

```ts
const result = await this.withApp(async ({ app }) => {
  await app.start();
  return confirmFromCommand(app, args.actorId, args.orderId);
});
```

`withApp()` creates the application and cleans it up when finished; it does not start Providers automatically. This example declares authorization capabilities in `boot()`, so it calls `app.start()` first. The `confirmFromCommand()` helper then checks the selected user, obtains permission policies and calls the service:

```ts
const policies = await authorizeOrder(
  await actorContext(app, actorId),
  'confirm',
);
return app.container.resolve(orderServiceToken).confirm(policies, orderId);
```

Run `pnpm confirm <actorId> <orderId> --json` from the example directory. A successful result has `ok: true` and `result.status: "confirmed"`. Take the IDs from `storage/demo.json`, generated during setup. A local operator explicitly selects an existing user; the [command adapter](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/confirm.ts) checks that account and obtains fresh authorization rather than bypassing its scope as an administrator. See [Application commands](application-commands.md).

### From a background job

A job payload contains only JSON data. Keep database connections, service objects and request contexts out of it. The executor reconstructs a fresh instance from that payload. A Provider can supply service dependencies through a closure:

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

The [job Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts) resolves the service in `start()` and passes it to the factory:

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

Register the job class before starting the executor. This excerpt omits the Provider's imports and submission entry; the complete file imports `jobExecutorServiceToken` from `@nocobase/app-server/jobs`. See [job.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/job.ts) for the job implementation.

The HTTP submission endpoint takes `actorId` only from the authenticated context, and execution checks the account and permissions again. This example assigns roles directly to users; if your business depends on team memberships, resolve those trusted memberships in non-HTTP entry points too.

`pnpm demo` also calls `POST /main/api/orders/:id/confirmAsync`, receives `202` with a `jobId`, and polls the order until its status becomes `confirmed`. Acceptance is not completion. See [Background jobs and scheduled execution](background-tasks.md) for executor configuration.

## Manage the lifecycle

### Initialization and startup

| Phase | Use in the example |
| --- | --- |
| `register()` | Bind the order service factory |
| `boot()` | Declare business actions and record scopes |
| `start()` | Register the Job class, start its executor and expose the submission entry |
| `ready()` | Work requiring all Providers to have started; no override is needed here |
| `shutdown()` | Close the executor used by this Provider |

The framework runs Providers by phase, rather than completing every phase for one Provider before moving to the next. When `boot()` begins, all Providers have registered, but they have not necessarily all initialized. Shutdown visits Providers in reverse order. See [ServiceProvider](../extension-development/service-provider.md).

### Isolate request state and release resources

A singleton can share application dependencies, but should not store the current user, policies, request inputs or transaction connections in fields. This example passes request state as arguments, so Alice and Bob retain separate scopes when using the same service.

The [job Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts) retains its executor and awaits its shutdown:

```ts
override async shutdown(): Promise<void> {
  await this.executor?.shutdown();
}
```

When the HTTP server stops or an application command finishes, the Provider waits for its executor to close. Release only resources managed by the current Provider. The application database has its own Provider; the order service should not close it.

## Handle permissions, transactions and errors

### Pass permission policies

The example declares `orders.read` and `orders.confirm`. Confirmation needs order reads and updates plus stock reads and updates, with a separate policy for each collection. [authorizeOrder()](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/permissions.ts) obtains policies from a trusted authorization decision. The service then binds each policy to its Repository with `withPolicy()`:

```ts
// Inside the service's transaction callback.
const orders = connection.repository('orders').withPolicy(policies.orders);
const products = connection.repository('products').withPolicy(policies.products);
```

The `orders.owned` record scope filters `ownerId` by the current user. Alice and Bob can each act on their own orders; Robin has only the read action. The [setup helper](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/fixtures.ts) creates roles and sample data without granting business access to all authenticated users.

Never accept a client-submitted `RepositoryPolicy` or use an order policy for products. A newly obtained Repository does not inherit an existing policy, including within a transaction callback. See [Authentication, permissions and data scopes](authentication-and-permissions.md) for permission declarations and authorization.

### Manage transactions and post-commit work

Put operations that must succeed or roll back together in one transaction within the service method. This excerpt shows the transaction boundary in `DefaultOrderService.confirm()`. It omits the order read, state checks and stock update; see the [service source](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) for those steps.

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

The order read, status update and stock deduction all use the transaction callback's connection. Insufficient stock throws, rolling back the earlier order update too. Do not mix Repositories obtained from the outer database into the callback.

The example uses conditional updates to check that the order is still `draft` and stock still matches the value just read, preventing concurrent writes from overwriting each other. An already confirmed order returns without another deduction. After a conflict, reread the state before deciding whether to retry. See [Transactions and data consistency](transactions-and-consistency.md).

The example's 99-unit order remains `draft` after confirmation fails, with stock unchanged. The [integration tests](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) also check that overlapping confirmations do not deduct twice.

The `afterCommit()` callback runs after the outermost transaction commits and is discarded on rollback. For callbacks registered inside a transaction, `transaction()` returns after they finish. The example uses it to invoke the injected logging callback, which writes `Order confirmed`.

A callback failure cannot undo committed data or make the transaction Promise reject. Errors go to `onTransactionCallbackError`, or become warnings when no handler is configured. The transaction connection has finished by then; subsequent writes need the root connection or a new transaction. See [Transaction mechanics](../framework/database/transactions.md) for nesting and callback semantics.

Run `pnpm test -t post-commit` to reproduce a callback throwing. The order still commits, and repeating confirmation does not replay the callback. Reliable delivery requires persisting pending deliveries alongside business changes and providing retry and recovery. `afterCommit()` does not provide that guarantee itself.

### Return results and handle business errors

The service returns `OrderView` on success and throws business errors on failure, without setting HTTP statuses. The example's `OrderError` provides stable error codes for callers:

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

The HTTP entry maps `ORDER_UNAVAILABLE` to 404 and insufficient stock or state conflicts to 409. Commands map these errors to `CommandError`; jobs let the executor record a failure. Other Repository exceptions propagate. See the [error definitions](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) and [HTTP mapping](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts).

## Example source and running the app

### Install and start

The [complete example and README](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/README.md) contain the source map and detailed walkthrough. Use Node.js 24 and pnpm 11.7.0. Published dependencies are locked, including `@nocobase/app-server` `3.0.0-beta.4`, `@nocobase/db` `1.0.0-beta.23`, and `@nocobase/service-provider` `0.0.2-beta.2`.

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 89d899c436563335529aba9b75fbc12b5dc0db34
cd apps/order-services
pnpm install --frozen-lockfile
pnpm setup
pnpm start
```

`pnpm setup` generates local configuration, ordinary users and sample orders. Credentials and order IDs go in the Git-ignored `storage/demo.json`. Existing configuration and demo data are preserved. The default API address is `http://localhost:13210/main/api`. Set the same `APP_PUBLIC_ORIGIN` for the server and demo script when using another host.

SQLite and the memory job adapter are the verified local configuration, not general requirements for using services. Other databases, Redis executors and external delivery have not been verified in this example.

### Run and verify

From a second terminal in `apps/order-services`, run the HTTP and background job demo:

```sh
pnpm demo
```

The script signs in demo users and prints responses for successful and repeated confirmation, insufficient stock, unauthorized access and background execution. Its final query should show the background job's order as `confirmed`. Each first successful confirmation writes `Order confirmed` in the server log. Repeating confirmation does not deduct stock or write that log again.

Use the memory job adapter in one process. Stop the HTTP server first, then replace the arguments below with `buyer.id` and `orders.cli` from `storage/demo.json`:

```sh
pnpm confirm <actorId> <orderId> --json
```

Success returns `ok: true` and `result.status: "confirmed"`. Using `reader.id` and `orders.reader` instead is denied with a nonzero exit status.

Run static checks, integration tests and compilation:

```sh
pnpm typecheck
pnpm test
pnpm build
```

The [integration tests](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) use the real application with isolated databases. They check repeated and overlapping confirmations, transaction rollback, user data isolation, command and job execution, and rejection when a job's user has lost permissions or been disabled. The post-commit failure test emits a warning while verifying that the order remains committed and the callback is not replayed.

`pnpm build` compiles this server example rather than creating a deployment archive. There is no browser page; observe behavior through endpoints, commands and logs.
