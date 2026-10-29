---
title: "浏览器推送"
description: "配置浏览器订阅、设备管理和 Web Push 通知。"
---

`@nocobase/app-plugin-notification-web-push` 将通知发送到已订阅的浏览器设备，提供 VAPID 配置、设备订阅、Service Worker 和可复用设备设置组件。投递与重试由[通知](notification.md)运行时负责。

## 接入与配置

1. 在身份认证、权限管理及通知之后注册 Server 插件，同时注册 Client 插件并执行迁移。
2. 将 `/server` 导出的 `pushConfig` 组合到应用配置的 `push` 下。
3. 配置持久的 `push.privateKey` / `WEB_PUSH_PRIVATE_KEY`、联系地址 `push.contact` / `WEB_PUSH_CONTACT`，并保留用于订阅加密的 `SECRETS_KEYS`。
4. 配置 `notification.channels.webPush: { type: 'web-push' }`。
5. 在已登录页面挂载 `/client` 导出的 `PushPreferences`，提供宿主 API、语言、提示和查询上下文。

生产环境需要 HTTPS；localhost 可用于开发。VAPID 私钥不能每次启动重新生成，换钥后浏览器需要重新订阅。Worker 位于应用挂载路径下的 `/push-worker.js`。

## 使用设备订阅

用户在设置组件中订阅当前设备，并可暂停、恢复、测试或删除订阅。应用需要自行提供安装 manifest；iOS/iPadOS 使用前需要将应用安装到主屏幕。

设备 API 位于 `/api/webPush`，包括 `/key`、`/subscriptions` 和 `/subscriptions/:id/test`。返回的是当前用户的设备摘要，不暴露订阅 endpoint 或加密密钥。登出时应用应调用公开的 `unsubscribeDevice(api, base, userId)`，失败时先处理解绑问题。

## 示例：订单提醒

服务端通过 `webPushServiceToken.subscriptions.forUser(userId)` 获取接收者设备，再用通知服务投递：

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

此处是 `notification.send()` 的消息片段，设备与用户 ID 来自实际查询。与站内信 route target 不同，Web Push 的 `url` 要包含应用公开挂载前缀，只允许应用内路径。

## 验证与边界

检查未授权、无订阅、暂停设备、订阅过期和实际设备收到推送的情况。测试接口返回排队结果，不等于浏览器已展示。404/410 的失效订阅会被移除；其他投递错误按通知运行时处理。

`dedupeKey` 用于替换同标签的可见通知，不能代替业务幂等。最终 payload 有大小限制，超限会拒绝而非截断。插件不提供离线缓存，也不决定前台提醒与系统推送之间的协调方式。

相关文档：[通知](notification.md)、[站内信](in-app.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push)。
