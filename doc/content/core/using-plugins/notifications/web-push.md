---
title: "Web push"
description: "Configure browser subscriptions, device preferences and Web Push delivery."
---

`@nocobase/app-plugin-notification-web-push` adds browser-device delivery, VAPID configuration, subscriptions, a Service Worker and reusable preferences. [Notifications](notification.md) owns delivery and retries.

## Integration

1. Register the Server plugin after Authentication, Authorization and Notifications, register Client and apply migrations.
2. Compose `pushConfig` from `/server` under the application's `push` configuration.
3. Set persistent `push.privateKey` / `WEB_PUSH_PRIVATE_KEY`, `push.contact` / `WEB_PUSH_CONTACT`, and subscription-encryption `SECRETS_KEYS`.
4. Configure `notification.channels.webPush: { type: 'web-push' }`.
5. Mount `PushPreferences` from `/client` inside an authenticated page with host API, locale, toast and query contexts.

Use HTTPS in production; localhost supports development. Regenerating the VAPID key requires browsers to resubscribe. The worker is served at `/push-worker.js` below the application mount.

## Device preferences

Users subscribe, pause, resume, test and remove devices. The application supplies its installation manifest; iOS/iPadOS requires home-screen installation.

`/api/webPush` exposes `/key`, `/subscriptions` and `/subscriptions/:id/test`. Responses contain owned device summaries without subscription endpoints or keys. Integrate `unsubscribeDevice(api, base, userId)` into sign-out and handle failure before completing sign-out.

## Example: an order reminder

Resolve devices with `webPushServiceToken.subscriptions.forUser(userId)` and send a notification message:

```ts
messages: {
  webPush: {
    to: [{ id: deviceId, userId }],
    title: 'Order needs attention',
    body: 'Open the order for details.',
    url: '/main/orders/123',
    dedupeKey: 'order:123:pending',
  },
}
```

This is a fragment of `notification.send()`, using real device and user IDs. Unlike an inbox route target, the push `url` includes the public application prefix and must stay inside it.

## Verification and boundaries

Test missing permissions, absent or paused subscriptions, expired devices and actual browser receipt. A queued test is not proof of display. HTTP 404/410 removes invalid subscriptions; other outcomes follow notification retry rules.

`dedupeKey` replaces visible notifications with the same tag; it does not replace business idempotency. Oversized payloads are rejected. The plugin supplies no offline cache or application-specific foreground reminder coordination.

Related: [Notifications](notification.md), [In-app notifications](in-app.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push).
