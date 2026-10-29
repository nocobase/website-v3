---
title: "浏览器推送"
description: "配置浏览器订阅、设备管理和 Web Push 通知。"
---

## 提供的能力

`@nocobase/app-plugin-notification-web-push` 把通知发送到已经订阅的浏览器设备，提供 VAPID 配置、设备订阅、Service Worker 和可复用的设备设置组件。投递和重试由 [通知](notification.md) 的运行时负责。

插件提供设备管理和推送能力；应用还需要提供设置入口、安装用的 manifest，以及触发业务通知的逻辑。

## 使用场景与示例

### 示例：订单提醒

服务端通过 `webPushServiceToken.subscriptions.forUser(userId)` 获取接收者的设备，再通过通知服务投递：

```ts
messages: {
  webPush: {
    to: [{ id: deviceId, userId }],
    title: '订单待处理',
    body: '请查看订单详情。',
    url: '/main/orders/123',
    dedupeKey: 'order:123:pending',
  },
}
```

这是 `notification.send()` 消息中的一个片段，设备 ID 和用户 ID 来自实际的查询。与站内信的 route target 不同，Web Push 的 `url` 需要包含应用公开的挂载前缀，并且只允许指向应用内的路径。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用浏览器推送插件，为已登录用户增加设备订阅设置和订单提醒。
复用 PushPreferences，持久保存 VAPID 与订阅加密密钥，配置应用前缀下的 Worker。
按用户查询设备，消息 URL 包含公开挂载前缀；登出时处理设备解绑失败。
用测试设备验证订阅、暂停、过期、权限拒绝和实际收到通知，报告未具备的设备环境。
```

**完成的标志**：已订阅用户的测试设备确实收到了提醒，点击后进入正确的订单；暂停的设备不再收到推送。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| `push` 配置与通知渠道 | 组合 `pushConfig`、持久密钥和 `web-push` 渠道 | 浏览器可以获取公钥并建立订阅 |
| 个人设置与退出登录流程 | 接入 `PushPreferences` 和 `unsubscribeDevice` | 用户可以管理设备，退出登录时处理设备绑定 |
| 订单消息的构造 | 使用设备摘要和包含挂载前缀的目标 URL | 系统通知可以打开应用内的订单 |

### 接入与配置

1. 在身份认证、权限管理和通知之后注册 Server 插件，同时注册 Client 插件，并执行迁移。
2. 把 `/server` 导出的 `pushConfig` 组合到应用配置的 `push` 下。
3. 配置持久的 `push.privateKey` / `WEB_PUSH_PRIVATE_KEY`、联系地址 `push.contact` / `WEB_PUSH_CONTACT`，并保留用于订阅加密的 `SECRETS_KEYS`。
4. 配置 `notification.channels.webPush: { type: 'web-push' }`。
5. 在需要登录的页面中挂载 `/client` 导出的 `PushPreferences`，并为它提供宿主 API、语言、提示和查询上下文。

生产环境需要 HTTPS，开发时可以使用 localhost。VAPID 私钥不能在每次启动时重新生成；更换密钥后，浏览器需要重新订阅。Worker 位于应用挂载路径下的 `/push-worker.js`。

### 使用设备订阅

用户在设置组件中订阅当前设备，之后可以暂停、恢复、测试或删除订阅。应用需要自行提供安装用的 manifest；在 iOS/iPadOS 上，需要先把应用添加到主屏幕才能使用。

设备 API 位于 `/api/webPush`，包括 `/key`、`/subscriptions` 和 `/subscriptions/:id/test`。它们返回的是当前用户的设备摘要，不会暴露订阅的 endpoint 或加密密钥。退出登录时，应用应调用公开的 `unsubscribeDevice(api, base, userId)`；如果调用失败，先处理解除绑定的问题。

## AI 开发的约束与验证

### 本插件的开发约束

- 不能在每次启动时生成新的 VAPID 密钥，也不能在设备 API 中暴露 endpoint 和加密密钥。
- URL 只能指向应用内部，并且要包含挂载前缀；`dedupeKey` 只用于替换可见的通知，不能代替事件的幂等。
- 测试权限被拒绝、暂停和已失效的设备，并在真实设备上确认通知的展示；排队成功不代表推送已经展示。

### 验证与边界

请检查以下情况：未授权、没有订阅、设备已暂停、订阅已过期，以及真实设备收到推送。测试接口返回的是排队结果，不等于浏览器已经展示了通知。返回 404/410 的失效订阅会被移除；其他投递错误按通知运行时的规则处理。

`dedupeKey` 用于替换带有相同标签的可见通知，不能代替业务上的幂等。最终的 payload 有大小限制，超出限制时会被拒绝，而不是被截断。插件不提供离线缓存，也不负责协调前台提醒与系统推送之间的关系。

相关文档：[通知](notification.md)、[站内信](in-app.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push)。
