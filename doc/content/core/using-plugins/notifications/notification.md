---
title: "Notifications"
description: "Send notifications through named channels and inspect delivery outcomes."
---

`@nocobase/app-plugin-notification` validates, persists and queues messages, handles idempotency and bounded retries, and records delivery outcomes. [Notification providers](providers.md), [In-app notifications](in-app.md) and [Web push](web-push.md) supply delivery implementations.

## Integration

Register the Server plugin and required channel plugins, apply migrations and seeds, and ensure the host Jobs executor runs. The Client plugin supplies log integration without automatically registering a page.

Each `notification.channels` entry has a name and a `type`: `system-email` can name an `smtp` channel. The default template composes this through `defineMailChannelsConfig` in `server/config/notification.ts`.

## Send a message

Resolve `notificationServiceToken` from `/server` in trusted business code. With the in-app plugin registered and `inbox: { type: 'in-app' }` configured:

```ts
await notification.send({
  idempotencyKey: 'order:123:approved',
  source: { type: 'order', referenceId: '123' },
  messages: {
    inbox: {
      to: 'user-123',
      title: 'Order approved',
      body: 'The order is ready for processing.',
      target: { type: 'route', path: '/orders/123' },
    },
  },
});
```

Here `notification` is the resolved service; use real business IDs. Each `messages` key is a configured channel name with its own complete message. There is no automatic universal-message conversion.

## Example: notify through two channels

After a successful order operation, prepare inbox and email messages. Inbox recipients are user IDs; email recipients are email addresses, resolved by business code. Use a stable business-event identifier as `idempotencyKey`.

Recipients have independent deliveries. One failure does not imply all failed, and retries retain the original channel/provider. Provider acceptance is not proof of receipt or reading.

## Logs and sensitive messages

`/api/notifications/logs` requires `page:notification.logs/access`. Build a protected log page and inspect the notification identifier returned by sending. Do not expose an unprotected generic send endpoint.

Use `sendTransient({ channel, message })` for one-time credentials. It attempts delivery once without notification snapshots, Jobs, durable idempotency or retries. A timeout can mean an unknown submission outcome; the business flow owns recovery.

Verify recipient outcomes, duplicate events, channel failures and log access. Related: [Notification providers](providers.md), [In-app notifications](in-app.md), [Web push](web-push.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification).
