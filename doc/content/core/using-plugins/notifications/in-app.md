---
title: "In-app notifications"
description: "Deliver in-app messages and integrate an inbox, unread counts and refresh."
---

## Capabilities

`@nocobase/app-plugin-notification-in-app` provides the `in-app` channel and a user-owned inbox with unread counts, read/unread actions, mark-all-read and deletion.

The plugin provides inbox storage and delivery; the application composes navigation and pages.

## Scenarios and examples

### Example: a header inbox

Inside the application's QueryClientProvider, use `useInboxUnreadCount()`, `useInboxItems()`, `useInboxActions()` and `useInboxRefresh()`. Handle failed mutations. Realtime events, reconnection and window focus trigger refresh; HTTP remains authoritative.

A target such as `{ type: 'route', path: '/orders/123' }` omits the deployment prefix; the Router adds it. External links use `{ type: 'url', url: 'https://example.com/...' }`.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use In-app Notifications to add a header unread count and inbox. Reuse public
components or hooks for pagination, read actions, realtime refresh and errors.
Address order messages to actual user IDs and use app-relative route targets.
Test two-user isolation, unread changes, reconnect refresh and denial after sign-out.
```

**Done when**: Only the recipient sees the message; reading updates the count and persists after reopening.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Notification channel config | Configure an in-app inbox channel | Business notices can reach inbox storage |
| Header and inbox page | Integrate components or hooks under the existing query context | Show unread counts, messages and reading actions |
| Business messages and links | Set recipients and application-relative targets | Message clicks reach the intended page |

### Integration

For notification delivery, register its Server plugin after Notifications, apply migrations and configure:

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

The Client plugin loads locales without registering an inbox page. Compose `NotificationInAppProvider` and `NotificationInAppInbox` from `/client`, or build a custom UI with `/client/inbox` hooks.

### Send and read

Send `messages.inbox` through [Notifications](notification.md), supplying `to`, `title` and `body`. Recipients are real user IDs or a nonempty array of IDs, not emails or an inferred current user.

| Operation | Endpoint |
| --- | --- |
| List | `GET /api/notificationInApp/messages` |
| Unread count | `GET /api/notificationInApp/messages/unreadCount` |
| Mark all read | `POST /api/notificationInApp/messages/markAllRead` |
| Mark one | `POST /api/notificationInApp/messages/:id/markRead` or `/markUnread` |
| Delete one | `DELETE /api/notificationInApp/messages/:id` |

Every request uses the signed-in user's identity. Another user's message is reported as missing. Follow `pageToken` and optionally filter with `unreadOnly=true`.

## AI development constraints and verification

### Plugin-specific development constraints

- Use authenticated identity for inbox APIs; do not add an unprotected arbitrary-user query.
- Treat realtime events as refresh signals and HTTP as authoritative; do not retain incorrect read state after failure.
- Test pagination, repeated refresh, cross-user access and sign-out. Do not double-prefix internal routes with /main.

### Boundaries

Inbox storage and APIs can run without the notification Server plugin, but no delivery channel is registered in that case. An in-app message is not an operating-system notification; use [Web push](web-push.md) for that.

Verify user isolation, unread counts, pagination and access after sign-out. Recipients have separate delivery/retry outcomes; nonexistent users fail recipient validation.

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Continue developing your app](../../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app).
