---
title: Realtime messages and topic subscriptions
---

`@nocobase/realtime` delivers business invalidations to subscribed pages. Applications normally share `realtimeServiceToken` from `@nocobase/app-server/realtime`; components reuse the client runtime's connection.

## Declare topics

This standalone example demonstrates declaration, publication and cleanup. In an application, declare topics in Provider `boot()` and let the host manage connections:

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

A `user` audience targets the named user. Subscription identity comes from authentication on the connection; clients cannot choose a user audience. `public` topics allow shared subscriptions and can require sign-in with `authenticated: true`. Sign-in alone does not grant access to every business record.

Use `defineTopicFamily()` and `authorize()` for resource-scoped subscriptions, sharing the HTTP access policy. Authorization runs at subscription and delivery, so revoked access cannot persist through an old subscription. Declare topics before use; unknown topics are rejected.

## Refresh pages

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

`refresh` reads current state through an authorized API and returns its Promise. The hook schedules reads after subscription readiness and changes, coalesces bursts, and cleans up on unmount. Disable inactive pages with `enabled: false` or a null topic. Do not create a connection per component.

Use `useRealtimeTopic()` for raw events and subscription state. A low-level `watch()` becomes `subscribed` only after acknowledgement; `onReady` runs again after reconnect acknowledgement. An open WebSocket does not prove a particular topic is subscribed.

## Delivery boundaries

Events are transient invalidations with no reconnect replay. Include only enough information to refresh. Keep authoritative state in the database and API. A publication receipt does not acknowledge browser delivery; publication failure cannot undo a business transaction that already committed.

The default `inMemory` broker is local to one service instance. Multiple processes need Redis Pub/Sub with a shared namespace. Matching namespaces do not connect memory brokers. Never skip publication based on local subscriber counts: another instance may have subscribers.

Payloads must be finite, acyclic JSON data; connections, functions and `Date` objects cannot be sent directly. Reconnect and clear previous-account caches after sign-in, sign-out or identity changes. See [WebSocket](websocket.md) for transport integration.

## Interfaces and implementation

- [Realtime contracts and hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime/README.md)
- [Host WebSocket integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
