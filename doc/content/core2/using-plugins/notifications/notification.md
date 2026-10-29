---
title: "Notifications"
description: "Send notifications through named channels, query delivery results and handle retries."
---

## Capabilities

`@nocobase/app-plugin-notification` is the runtime for notification delivery, handling message validation, persistence, queuing, idempotency, delivery status and a bounded number of retries. The actual sending methods come from plugins such as [Notification providers](providers.md), [In-app notifications](in-app.md) and [Web push](web-push.md).

The notification runtime coordinates delivery; recipients, when the business triggers a notification, and the actual channels are provided by the application and the channel plugins.

## Scenarios and examples

### Example: notify an order result through two channels

After the order operation succeeds, build an in-app message and an email message for the same event. The in-app message's `to` uses user IDs, while the email's `to` uses email addresses; finding the right recipients is the business code's job. Use a stable business event identifier as the `idempotencyKey`, so the same event is not submitted twice.

Each recipient has its own delivery record, and one channel failing does not mean everything failed. Retries reuse the original channel and provider. Business interfaces should distinguish "queued", "submitted" and "failed", and must not treat a channel accepting a message as the user having received or read it.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Notifications to send inbox and email messages after order approval succeeds.
Use named configured channels with complete messages; resolve user IDs and email
addresses separately. Use a business-event idempotency key, retain per-recipient
outcomes, and integrate protected logs. Test duplicate events, partial failure and
denied log access. Do not present queue acceptance as receipt.
```

**Done when**: deliveries for the same business event can be traced, failed channels and recipients can be identified, and repeated submissions do not cause unintended duplicate notifications.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Server channel configuration and Jobs | Register delivery channels and connect the executor | Notifications can be queued and handled by the matching channel |
| The order business service | Call `send` after the business succeeds, linking the event and recipients | The same event has traceable notification results |
| Log page and permissions | Query delivery records, distinguishing waiting, submitted and failed | Administrators can pinpoint the failure of an individual recipient |

### Integration and configuration

Register the Server plugin and the channel plugins you actually need, run the migrations and seed data, and make sure the application's Jobs executor can run. The Client plugin provides capabilities such as a log client but does not register a log page automatically.

In `notification.channels`, configure a channel name and its `type` for each purpose. For example, `system-email` is a channel name and `smtp` is an implementation type; the two are not interchangeable. The default template combines the configuration through `defineMailChannelsConfig` in `server/config/notification.ts`.

### Send a notification

Business code resolves `notificationServiceToken` from `/server` on the server, then calls `send()`. The example below assumes the in-app notifications plugin is registered and `inbox: { type: 'in-app' }` is configured:

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

`notification` is the resolved service, and the user and order IDs should come from the actual business. The keys of `messages` must be configured channel names, and every channel needs a complete message; the runtime does not convert one generic piece of content into each channel's format automatically.

## AI development constraints and verification

### Development constraints for this plugin

- Handle business success and notification delivery separately; keep a stable event identifier across retries, and never generate a new idempotency key on each retry.
- Each channel validates its own message structure; never use a user ID as an email address.
- Verify partial failures and log permissions; one-time credentials are sent through the transient path, which offers no durable retry or idempotency guarantee to rely on.

### Check delivery results and send sensitive messages

The log API is at `/api/notifications/logs` and requires the `page:notification.logs/access` permission. The application can connect a log interface and check delivery results by the notification identifier returned when sending. Do not expose an additional, unprotected general-purpose send API.

Send sensitive content such as one-time credentials and invitation tokens with `sendTransient({ channel, message })`: it tries only once and writes no notification snapshot, Jobs or retry state, and it has no durable idempotency guarantee. On a timeout, the submission result may be unknown, so the business decides on a safe way to recover.

Verify results for multiple recipients, duplicate events, channel failures and log permissions. Related documentation: [Notification providers](providers.md), [In-app notifications](in-app.md), [Web push](web-push.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification).
