---
title: "站内信"
description: "向用户投递站内信，接入收件箱、未读数和实时刷新。"
---

## 提供的能力

`@nocobase/app-plugin-notification-in-app` 提供 `in-app` 通知渠道和当前用户的收件箱，支持未读数、标记已读／未读、全部已读和删除消息。

插件提供用户收件箱和投递渠道；顶栏入口和页面由应用组合。

## 使用场景与示例

### 示例：顶栏的消息入口

在应用现有的 QueryClientProvider 中，用 `useInboxUnreadCount()` 展示未读数，用 `useInboxItems()` 加载消息，用 `useInboxActions()` 标记已读，并用 `useInboxRefresh()` 响应实时变化、重新连接和窗口重新获得焦点。操作失败时要处理并显示错误；实时事件只用来触发重新读取，HTTP 返回的状态才是最终依据。

消息的点击目标可以是 `{ type: 'route', path: '/orders/123' }`，这时的路径不包含 `/main` 等部署前缀，Router 会自动补上。外部地址则使用 `{ type: 'url', url: 'https://example.com/...' }`。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用站内信插件，为应用顶栏接入未读数和收件箱。
复用公开的收件箱组件或 hooks，支持分页、已读操作、实时刷新和错误提示。
订单消息使用真实用户 ID，内部目标使用不含部署前缀的 route path。
用两个用户验证消息隔离、未读数变化、重连恢复和退出后的拒绝访问。
```

**完成的标志**：消息只出现在接收者的收件箱中，阅读后未读数正确变化，重新打开后状态仍然保持。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| 通知渠道配置 | 把 `inbox` 配置为 `in-app` 类型 | 业务通知可以投递到收件箱 |
| 页头和收件箱页面 | 在已有的查询上下文中接入组件或 Hooks | 用户看到未读数、消息列表和阅读操作 |
| 业务消息与链接 | 保存接收者和应用内的 route target | 点击消息进入正确的业务页面 |

### 接入与配置

需要投递通知时，在通知插件的 Server 入口之后注册站内信，执行数据库迁移，并配置：

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

Client 插件只加载语言资源，不会自动注册生产环境的收件箱页面。应用可以用 `/client` 导出的 `NotificationInAppProvider` 和 `NotificationInAppInbox` 组合页面，也可以用 `/client/inbox` 中的 Hooks 自行实现。

### 发送与阅读

通过 [通知服务](notification.md) 发送 `messages.inbox`，指定 `to`、`title` 和 `body`。`to` 是真实的用户 ID，或非空的用户 ID 数组；它不是邮箱，也不会自动使用当前用户。

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/notificationInApp/messages` |
| 未读数 | `GET /api/notificationInApp/messages/unreadCount` |
| 全部已读 | `POST /api/notificationInApp/messages/markAllRead` |
| 标记单条 | `POST /api/notificationInApp/messages/:id/markRead` 或 `/markUnread` |
| 删除单条 | `DELETE /api/notificationInApp/messages/:id` |

这些接口都以当前登录的用户为准，不接受指定任意的收件人身份；读取别人的消息时，会表现为消息不存在。列表通过 `pageToken` 翻页，可以用 `unreadOnly=true` 只看未读消息。

## AI 开发的约束与验证

### 本插件的开发约束

- 接口使用当前的登录身份；不能新增一个接收任意 `userId`、且不受保护的查询接口。
- 实时事件只用来触发刷新，操作结果以 HTTP 返回为准；操作失败时，不要一直保留错误的已读状态。
- 验证分页、重复刷新、跨用户访问消息以及退出登录；应用内的路径不能重复拼接 `/main`。

### 使用边界

即使没有通知插件的 Server 入口，收件箱的存储和接口也可以使用，但这时不会注册通知渠道，因此无法据此完成通知投递。收件箱消息只在应用中展示，并不等于操作系统的推送；用户离开页面后的浏览器通知，见 [浏览器推送](web-push.md)。

请验证用户隔离、未读数、分页以及退出登录后的访问。每个接收者独立投递、独立重试；接收者不存在时，对应的投递会失败。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app)。
