---
title: "Notifications"
description: "Send notifications through named channels and inspect delivery outcomes."
---

## Capabilities

`@nocobase/app-plugin-notification` validates, persists and queues messages, handles idempotency and bounded retries, and records delivery outcomes. [Notification providers](providers.md), [In-app notifications](in-app.md) and [Web push](web-push.md) supply delivery implementations.

The runtime coordinates delivery; the application and channel plugins supply recipients, business triggers and transports.

## Scenarios and examples

### Example: notify through two channels

After a successful order operation, prepare inbox and email messages. Inbox recipients are user IDs; email recipients are email addresses, resolved by business code. Use a stable business-event identifier as `idempotencyKey`.

Recipients have independent deliveries. One failure does not imply all failed, and retries retain the original channel/provider. Provider acceptance is not proof of receipt or reading.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
After an order is approved, send an in-app message and an email to the intended recipients using the configured channels.
Processing the same approval event again should not duplicate notifications. A failure on one channel must not be reported as complete success.
Authorized managers should see each recipient's delivery result, distinguishing queued, submitted and failed messages. Queued does not mean received.
Use test recipients to check duplicate events, partial delivery failures and access to delivery logs.
```

**Done when**: Deliveries are traceable to an event, failures are identified per channel and recipient, and duplicate submissions do not cause unintended repeated notices.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Server channels and Jobs | Register delivery types and executor | Queue work for the configured channels |
| Order business service | Send after business success with event and recipient identifiers | Trace notifications back to the event |
| Log UI and authorization | Read delivery records and distinct states | Administrators can inspect recipient-specific failures |

### Integration

Register the Server plugin and required channel plugins, apply migrations and seeds, and ensure the host Jobs executor runs. The Client plugin supplies log integration without automatically registering a page.

Each `notification.channels` entry has a name and a `type`: `system-email` can name an `smtp` channel. The default template composes this through `defineMailChannelsConfig` in `server/config/notification.ts`.

### Send a message

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

## AI development constraints and verification

### Plugin-specific development constraints

- Handle business success and delivery separately. Keep event identifiers stable across retries instead of generating new idempotency keys.
- Validate each channel payload; user IDs are not email addresses.
- Test partial failures and log access. Transient credential delivery has no durable retry or idempotency guarantee.

### Logs and sensitive messages

`/api/notifications/logs` requires `page:notification.logs/access`. Build a protected log page and inspect the notification identifier returned by sending. Do not expose an unprotected generic send endpoint.

Use `sendTransient({ channel, message })` for one-time credentials. It attempts delivery once without notification snapshots, Jobs, durable idempotency or retries. A timeout can mean an unknown submission outcome; the business flow owns recovery.

Verify recipient outcomes, duplicate events, channel failures and log access. Related: [Notification providers](providers.md), [In-app notifications](in-app.md), [Web push](web-push.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification).
