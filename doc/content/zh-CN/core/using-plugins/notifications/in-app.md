---
title: "站内信"
description: "投递用户站内信，接入收件箱、未读数和实时刷新。"
---

`@nocobase/app-plugin-notification-in-app` 提供 `in-app` 通知渠道及当前用户的收件箱，支持未读数、已读/未读、全部已读和删除消息。

## 接入与配置

需要通知投递时，在通知 Server 插件之后注册站内信，执行数据库迁移，并配置：

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

Client 插件加载语言资源，不自动注册生产收件箱页面。应用可以使用 `/client` 导出的 `NotificationInAppProvider`、`NotificationInAppInbox` 组合页面，或用 `/client/inbox` 的 hooks 自行实现。

## 发送与阅读

通过[通知服务](notification.md)发送 `messages.inbox`，指定 `to`、`title`、`body`。`to` 是真实用户 ID 或非空用户 ID 数组，不是邮箱，也不会自动使用当前用户。

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/notificationInApp/messages` |
| 未读数 | `GET /api/notificationInApp/messages/unreadCount` |
| 全部已读 | `POST /api/notificationInApp/messages/markAllRead` |
| 标记单条 | `POST /api/notificationInApp/messages/:id/markRead` 或 `/markUnread` |
| 删除单条 | `DELETE /api/notificationInApp/messages/:id` |

接口以当前登录用户为准，不接受任意收件人身份；读取别人的消息表现为不存在。列表用 `pageToken` 翻页，可用 `unreadOnly=true` 过滤。

## 示例：顶栏消息入口

在应用现有的 QueryClientProvider 内，使用 `useInboxUnreadCount()` 展示未读数，使用 `useInboxItems()` 加载消息，使用 `useInboxActions()` 标记已读，并用 `useInboxRefresh()` 响应实时变化、重连和窗口聚焦。处理操作失败并显示错误；实时事件用于触发重新读取，HTTP 状态才是最终依据。

消息点击目标可以是 `{ type: 'route', path: '/orders/123' }`，此时路径不包含 `/main` 等部署前缀；Router 会补上。外部地址使用 `{ type: 'url', url: 'https://example.com/...' }`。

## 使用边界

收件箱存储和接口可在没有通知 Server 插件时使用，但不会注册通知渠道，不能据此完成通知投递。收件箱消息只在应用中展示，不等于操作系统推送；离开页面后的浏览器通知见[浏览器推送](web-push.md)。

验证用户隔离、未读数、分页及登出后访问。每个接收者独立投递与重试；不存在的接收者会导致该投递失败。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app)。
