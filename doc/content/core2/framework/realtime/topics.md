---
title: Realtime messages and topic subscriptions
description: Push business changes to subscribed pages with @nocobase/realtime, and learn how to declare and authorize topics, how to connect page refreshes, and the boundaries of message delivery.
---

`@nocobase/realtime` pushes business changes to the pages that subscribe to them. Applications usually reuse `realtimeServiceToken` from `@nocobase/app-server/realtime`, and components reuse the connection already present in the client runtime.

## Integrating with applications and plugins

In the `boot()` of a server Provider, pass in `app.container` and declare the topics this module is responsible for:

```ts
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { ServiceResolver } from '@nocobase/service-provider';

export function registerOrderInbox(container: ServiceResolver) {
  const realtime = container.resolve(realtimeServiceToken);
  return realtime.defineTopic<{ changed: true }, 'user'>(
    'orders:inbox',
    { audience: 'user' },
  );
}
```

Keep the returned topic handle, and call `inbox.publishFor(userId, { changed: true })` after the business change commits. `userId` comes from a notification target the server has already confirmed; never trust an arbitrary user ID carried by the request. When the Provider shuts down, call `inbox.close()` to release the topics it declared; the host is responsible for starting and closing the shared service and transport connections.

Applications and plugins integrate the same way, and topic names must avoid collisions. The frontend subscribes from pages or components and does not need to create server topics again.

## Declaring topics

The standalone example below shows declaring, publishing and releasing a topic. In an application, put the declaration in the Provider's `boot()` and let the host's service manage connections:

```ts
import { createRealtimeService } from '@nocobase/realtime/server';

const realtime = createRealtimeService({ namespace: 'orders-demo' });
const inbox = realtime.defineTopic<{ changed: true }, 'user'>(
  'orders:inbox',
  { audience: 'user' },
);
await realtime.setup();
try {
  await inbox.publishFor('user-1', { changed: true });
} finally {
  inbox.close();
  await realtime.close();
}
```

`audience: 'user'` delivers only to the specified user; the subscriber's identity is determined by the authentication result on the connection, and clients cannot choose the user themselves. `public` topics allow shared subscriptions and can require sign-in with `authenticated: true`, but being signed in does not mean being allowed to see every business record.

Resource-level subscriptions use `defineTopicFamily()` and `authorize()`, reusing the access policy of the HTTP endpoints. Authorization is checked both at subscription and at delivery, so once a permission is revoked, an old subscription can no longer be used to keep reading data. Topics must be declared first; unknown topics are rejected.

## Refreshing pages

```tsx
import { useRealtimeRefresh } from '@nocobase/app-client';

export function OrderUpdates({
  refresh,
}: {
  refresh: (signal: AbortSignal) => Promise<void>;
}) {
  useRealtimeRefresh('orders:inbox', refresh, { delayMs: 100 });
  return null;
}
```

`refresh` should read the current data through an API with permission checks and return a Promise. The hook schedules a refresh after the subscription succeeds and whenever a change arrives, merges bursts of events, and cleans up when the component unmounts. For hidden or unselected pages, set `enabled: false` or use an empty topic; do not create a connection for every component.

When you need to handle raw messages or the subscription state, use `useRealtimeTopic()`. The lower-level `watch()` enters the `subscribed` state only after receiving the subscription acknowledgement, and each acknowledgement after a reconnect triggers `onReady`. A connected WebSocket does not mean a particular topic has been subscribed successfully.

## Boundaries of delivery

Events are temporary invalidation notices, and events missed while disconnected are not resent. Put only the minimum information needed for a refresh in messages; the authoritative state stays in the database and APIs. A publication receipt does not mean the browser received the message, and a publication failure after a transaction commits cannot undo business data that has already been committed.

The default `inMemory` broker only propagates within the current service instance; for multi-process deployments, use Redis Pub/Sub with a shared namespace. Using the same namespace alone does not connect several in-memory brokers. Do not decide whether to publish based on the number of subscribers in the current process, because other instances may have subscribers.

Messages must be finite JSON data without circular references; connections, functions, `Date` objects and the like cannot be passed directly. After sign-in, sign-out or an identity switch, reconnect and clear the previous account's caches. For the transport layer, see [WebSocket protocols and adapters](websocket.md).

## Interfaces and implementation

- [Realtime contracts and hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime/README.md)
- [Host WebSocket integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/realtime/types.ts)
