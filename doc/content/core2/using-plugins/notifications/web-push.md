---
title: "Web push"
description: "Configure browser subscriptions, device management and Web Push notifications."
---

## Capabilities

`@nocobase/app-plugin-notification-web-push` sends notifications to subscribed browser devices, providing VAPID configuration, device subscriptions, a Service Worker and a reusable device settings component. Delivery and retries are handled by the [Notifications](notification.md) runtime.

The plugin provides device management and push capabilities; the application also needs to provide a settings entry, an installation manifest and the logic that triggers business notifications.

## Scenarios and examples

### Example: order reminders

The server gets the recipient's devices through `webPushServiceToken.subscriptions.forUser(userId)`, then delivers through the notification service:

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

This is a fragment of a `notification.send()` message, with the device ID and user ID coming from the actual query. Unlike an in-app route target, the Web Push `url` must include the application's public mount prefix, and may only point to paths inside the application.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Web Push to add signed-in device preferences and order reminders. Reuse
PushPreferences, persist VAPID and encryption keys, and serve the worker under
the app prefix. Resolve devices per user, include the mount prefix in targets,
and handle unsubscribe failures on sign-out. Test subscription, pause, expiry,
denial and actual receipt on a test device; report unavailable environments.
```

**Done when**: a subscribed user's test device really receives the reminder and opens the correct order when clicked, and paused devices no longer receive pushes.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `push` configuration and notification channel | Combine `pushConfig`, persistent keys and the `web-push` channel | Browsers can get the public key and create subscriptions |
| Personal settings and the sign-out flow | Connect `PushPreferences` and `unsubscribeDevice` | Users can manage devices, and device binding is handled at sign-out |
| Building order messages | Use device summaries and a target URL that includes the mount prefix | System notifications can open orders in the application |

### Integration and configuration

1. Register the Server plugin after Authentication, Permission management and Notifications, register the Client plugin too, and run the migrations.
2. Combine `pushConfig` exported from `/server` under `push` in the application configuration.
3. Configure a persistent `push.privateKey` / `WEB_PUSH_PRIVATE_KEY` and a contact address `push.contact` / `WEB_PUSH_CONTACT`, and keep the `SECRETS_KEYS` used to encrypt subscriptions.
4. Configure `notification.channels.webPush: { type: 'web-push' }`.
5. Mount `PushPreferences` exported from `/client` on a page that requires sign-in, providing it with the host API, language, toast and query context.

Production needs HTTPS, while localhost works for development. The VAPID private key must not be regenerated on every start; after changing the key, browsers must subscribe again. The worker is at `/push-worker.js` under the application's mount path.

### Use device subscriptions

Users subscribe the current device in the settings component, and can later pause, resume, test or delete the subscription. The application must provide its own installation manifest; on iOS/iPadOS, the application must first be added to the home screen.

The device APIs are at `/api/webPush`, including `/key`, `/subscriptions` and `/subscriptions/:id/test`. They return summaries of the current user's devices and never expose a subscription's endpoint or encryption keys. At sign-out, the application should call the public `unsubscribeDevice(api, base, userId)`; if that fails, deal with the unbinding problem first.

## AI development constraints and verification

### Development constraints for this plugin

- Never generate a new VAPID key on each start, and never expose endpoints or encryption keys through the device APIs.
- URLs may only point inside the application and must include the mount prefix; `dedupeKey` only replaces visible notifications and cannot replace event idempotency.
- Test denied permissions, paused and expired devices, and confirm display on real devices; successful queuing does not mean the push was shown.

### Verification and limits

Check these cases: unauthorized, no subscription, a paused device, an expired subscription, and a real device receiving a push. The test API returns a queuing result, which does not mean the browser displayed the notification. Expired subscriptions that return 404/410 are removed; other delivery errors follow the notification runtime's rules.

`dedupeKey` replaces visible notifications with the same tag and cannot replace business idempotency. The final payload has a size limit; payloads over the limit are rejected rather than truncated. The plugin provides no offline cache and does not coordinate foreground reminders with system pushes.

Related documentation: [Notifications](notification.md), [In-app notifications](in-app.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push).
