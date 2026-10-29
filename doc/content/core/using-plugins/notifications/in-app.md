---
title: "In-app notifications"
description: "Deliver in-app messages and integrate an inbox, unread counts and refresh."
---

`@nocobase/app-plugin-notification-in-app` provides the `in-app` channel and a user-owned inbox with unread counts, read/unread actions, mark-all-read and deletion.

## Integration

For notification delivery, register its Server plugin after Notifications, apply migrations and configure:

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

The Client plugin loads locales without registering an inbox page. Compose `NotificationInAppProvider` and `NotificationInAppInbox` from `/client`, or build a custom UI with `/client/inbox` hooks.

## Send and read

Send `messages.inbox` through [Notifications](notification.md), supplying `to`, `title` and `body`. Recipients are real user IDs or a nonempty array of IDs, not emails or an inferred current user.

| Operation | Endpoint |
| --- | --- |
| List | `GET /api/notificationInApp/messages` |
| Unread count | `GET /api/notificationInApp/messages/unreadCount` |
| Mark all read | `POST /api/notificationInApp/messages/markAllRead` |
| Mark one | `POST /api/notificationInApp/messages/:id/markRead` or `/markUnread` |
| Delete one | `DELETE /api/notificationInApp/messages/:id` |

Every request uses the signed-in user's identity. Another user's message is reported as missing. Follow `pageToken` and optionally filter with `unreadOnly=true`.

## Example: a header inbox

Inside the application's QueryClientProvider, use `useInboxUnreadCount()`, `useInboxItems()`, `useInboxActions()` and `useInboxRefresh()`. Handle failed mutations. Realtime events, reconnection and window focus trigger refresh; HTTP remains authoritative.

A target such as `{ type: 'route', path: '/orders/123' }` omits the deployment prefix; the Router adds it. External links use `{ type: 'url', url: 'https://example.com/...' }`.

## Boundaries

Inbox storage and APIs can run without the notification Server plugin, but no delivery channel is registered in that case. An in-app message is not an operating-system notification; use [Web push](web-push.md) for that.

Verify user isolation, unread counts, pagination and access after sign-out. Recipients have separate delivery/retry outcomes; nonexistent users fail recipient validation.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app).
