---
title: "站内信"
description: "投递用户站内信，接入收件箱、未读数和实时刷新。"
---

## 提供的能力

`@nocobase/app-plugin-notification-in-app` 提供 `in-app` 通知渠道及当前用户的收件箱，支持未读数、已读/未读、全部已读和删除消息。

插件提供用户收件箱和投递渠道，顶栏入口与页面由应用组合。

## 使用场景与示例

### 示例：顶栏消息入口

在应用现有的 QueryClientProvider 内，使用 `useInboxUnreadCount()` 展示未读数，使用 `useInboxItems()` 加载消息，使用 `useInboxActions()` 标记已读，并用 `useInboxRefresh()` 响应实时变化、重连和窗口聚焦。处理操作失败并显示错误；实时事件用于触发重新读取，HTTP 状态才是最终依据。

消息点击目标可以是 `{ type: 'route', path: '/orders/123' }`，此时路径不包含 `/main` 等部署前缀；Router 会补上。外部地址使用 `{ type: 'url', url: 'https://example.com/...' }`。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```text
请使用站内信插件，为应用顶栏接入未读数和收件箱。
复用公开的收件箱组件或 hooks，支持分页、已读操作、实时刷新和错误提示。
订单消息使用真实用户 ID，内部目标使用不含部署前缀的 route path。
用两个用户验证消息隔离、未读数变化、重连恢复和退出后的拒绝访问。
```

**完成标志**：消息只出现在接收者的收件箱，阅读后未读数正确变化，重新打开仍保持状态。

## 重要原理与实现

以下是实现本例时的接入位置与预期界面变化；它们是开发说明，具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| 通知渠道配置 | 配置 inbox 的 in-app 类型 | 业务通知可以投递到收件箱 |
| 页头和收件箱页面 | 在已有查询上下文接入组件或 hooks | 用户看到未读数、列表和阅读操作 |
| 业务消息与链接 | 保存接收者和应用内 route target | 点击消息进入正确业务页 |

### 接入与配置

需要通知投递时，在通知 Server 插件之后注册站内信，执行数据库迁移，并配置：

```yaml
notification:
  channels:
    inbox:
      type: in-app
```

Client 插件加载语言资源，不自动注册生产收件箱页面。应用可以使用 `/client` 导出的 `NotificationInAppProvider`、`NotificationInAppInbox` 组合页面，或用 `/client/inbox` 的 hooks 自行实现。

### 发送与阅读

通过[通知服务](notification.md)发送 `messages.inbox`，指定 `to`、`title`、`body`。`to` 是真实用户 ID 或非空用户 ID 数组，不是邮箱，也不会自动使用当前用户。

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/notificationInApp/messages` |
| 未读数 | `GET /api/notificationInApp/messages/unreadCount` |
| 全部已读 | `POST /api/notificationInApp/messages/markAllRead` |
| 标记单条 | `POST /api/notificationInApp/messages/:id/markRead` 或 `/markUnread` |
| 删除单条 | `DELETE /api/notificationInApp/messages/:id` |

接口以当前登录用户为准，不接受任意收件人身份；读取别人的消息表现为不存在。列表用 `pageToken` 翻页，可用 `unreadOnly=true` 过滤。

## AI 开发的约束与验证

### 本插件的开发约束

- 接口使用当前登录身份，不能新增接收任意 userId 的不受保护查询。
- 实时事件仅触发刷新，操作结果以 HTTP 为准；失败时不要永久保留错误的已读状态。
- 验证分页、重复刷新、跨用户消息访问与登出，内部路径不能重复拼接 /main。

### 使用边界

收件箱存储和接口可在没有通知 Server 插件时使用，但不会注册通知渠道，不能据此完成通知投递。收件箱消息只在应用中展示，不等于操作系统推送；离开页面后的浏览器通知见[浏览器推送](web-push.md)。

验证用户隔离、未读数、分页及登出后访问。每个接收者独立投递与重试；不存在的接收者会导致该投递失败。

上述检查是接入后的验收要求，不表示本文已完成运行验证。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skills 与通用检查流程见[持续开发应用](../../getting-started/develop-with-an-agent.md)和[测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-in-app)。
