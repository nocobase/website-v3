---
title: "In-app notifications"
description: "Deliver in-app messages to users, and connect the inbox, unread counts and live refresh."
---

## Capabilities

`@nocobase/app-plugin-notification-in-app` provides the `in-app` notification channel and the current user's inbox, with unread counts, marking messages read or unread, marking all as read, and deleting messages.

The plugin provides the user inbox and the delivery channel; the header entry and pages are composed by the application.

## Scenarios and examples

### Example: a message entry in the header

Inside the application's existing QueryClientProvider, show the unread count with `useInboxUnreadCount()`, load messages with `useInboxItems()`, mark messages read with `useInboxActions()`, and use `useInboxRefresh()` to respond to live changes, reconnection and the window regaining focus. Handle and show errors when an action fails; live events only trigger a new read, and the status returned over HTTP is what counts.

A message's click target can be `{ type: 'route', path: '/orders/123' }`, in which case the path omits deployment prefixes such as `/main` and the Router adds them. External addresses use `{ type: 'url', url: 'https://example.com/...' }`.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use In-app Notifications to add a header unread count and inbox. Reuse public
components or hooks for pagination, read actions, realtime refresh and errors.
Address order messages to actual user IDs and use app-relative route targets.
Test two-user isolation, unread changes, reconnect refresh and denial after sign-out.
```

**Done when**: messages appear only in their recipient's inbox, the unread count changes correctly after reading, and the state persists after reopening.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Notification channel configuration | Configure `inbox` as the `in-app` type | Business notifications can be delivered to the inbox |
| Header and inbox page | Connect components or Hooks inside the existing query context | Users see the unread count, message list and reading actions |
| Business messages and links | Store recipients and in-app route targets | Clicking a message opens the right business page |

### Integration and configuration

When notifications need to be delivered, register in-app notifications after the notifications plugin's Server entry, run the database migrations, and configure:

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

The Client plugin only loads language resources and does not register a production inbox page automatically. The application can compose a page from `NotificationInAppProvider` and `NotificationInAppInbox` exported from `/client`, or build its own with the Hooks in `/client/inbox`.

### Send and read

Send `messages.inbox` through the [notification service](notification.md), specifying `to`, `title` and `body`. `to` is a real user ID or a non-empty array of user IDs; it is not an email address and never defaults to the current user.

| Operation | API |
| --- | --- |
| List | `GET /api/notificationInApp/messages` |
| Unread count | `GET /api/notificationInApp/messages/unreadCount` |
| Mark all as read | `POST /api/notificationInApp/messages/markAllRead` |
| Mark one message | `POST /api/notificationInApp/messages/:id/markRead` or `/markUnread` |
| Delete one message | `DELETE /api/notificationInApp/messages/:id` |

All of these APIs act for the currently signed-in user and accept no arbitrary recipient identity; reading someone else's message behaves as if it does not exist. The list pages through `pageToken`, and `unreadOnly=true` shows only unread messages.

## AI development constraints and verification

### Development constraints for this plugin

- The APIs use the current sign-in identity; never add an unprotected query API that accepts an arbitrary `userId`.
- Live events only trigger refreshes, and action results follow what HTTP returns; when an action fails, do not keep showing a wrong read state.
- Verify pagination, repeated refreshes, cross-user access to messages and sign-out; in-app paths must not have `/main` prepended twice.

### Limits of use

The inbox storage and APIs work even without the notifications plugin's Server entry, but in that case no notification channel is registered, so notifications cannot be delivered through it. Inbox messages are shown only within the application and are not operating system push notifications; for browser notifications after users leave the page, see [Web push](web-push.md).

Verify user isolation, unread counts, pagination and access after sign-out. Each recipient is delivered and retried independently; when a recipient does not exist, that delivery fails.

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app).
