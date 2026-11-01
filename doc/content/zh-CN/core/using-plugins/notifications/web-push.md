---
title: "浏览器推送"
description: "配置浏览器订阅、设备管理和 Web Push 通知。"
---

## 提供的能力

`@nocobase/app-plugin-notification-web-push` 将通知发送到已订阅的浏览器设备，提供 VAPID 配置、设备订阅、Service Worker 和可复用设备设置组件。投递与重试由[通知](notification.md)运行时负责。

插件提供设备与推送能力；应用还需提供设置入口、安装 manifest 和业务通知触发逻辑。

## 使用场景与示例

### 示例：订单提醒

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

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```text
请使用浏览器推送插件，为已登录用户增加设备订阅设置和订单提醒。
复用 PushPreferences，持久保存 VAPID 与订阅加密密钥，配置应用前缀下的 Worker。
按用户查询设备，消息 URL 包含公开挂载前缀；登出时处理设备解绑失败。
用测试设备验证订阅、暂停、过期、权限拒绝和实际收到通知，报告未具备的设备环境。
```

**完成标志**：订阅用户的测试设备实际收到提醒，点击进入正确订单，暂停设备不再接收。

## 重要原理与实现

以下是实现本例时的接入位置与预期界面变化；它们是开发说明，具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| push 配置与通知渠道 | 组合 pushConfig、持久密钥和 web-push 渠道 | 浏览器可以获取公钥并建立订阅 |
| 个人设置与退出流程 | 接入 PushPreferences 和 unsubscribeDevice | 用户管理设备，退出时处理绑定 |
| 订单消息构造 | 使用设备摘要和含挂载前缀的目标 URL | 系统通知可打开应用内订单 |

### 接入与配置

1. 在身份认证、权限管理及通知之后注册 Server 插件，同时注册 Client 插件并执行迁移。
2. 将 `/server` 导出的 `pushConfig` 组合到应用配置的 `push` 下。
3. 配置持久的 `push.privateKey` / `WEB_PUSH_PRIVATE_KEY`、联系地址 `push.contact` / `WEB_PUSH_CONTACT`，并保留用于订阅加密的 `SECRETS_KEYS`。
4. 配置 `notification.channels.webPush: { type: 'web-push' }`。
5. 在已登录页面挂载 `/client` 导出的 `PushPreferences`，提供宿主 API、语言、提示和查询上下文。

生产环境需要 HTTPS；localhost 可用于开发。VAPID 私钥不能每次启动重新生成，换钥后浏览器需要重新订阅。Worker 位于应用挂载路径下的 `/push-worker.js`。

### 使用设备订阅

用户在设置组件中订阅当前设备，并可暂停、恢复、测试或删除订阅。应用需要自行提供安装 manifest；iOS/iPadOS 使用前需要将应用安装到主屏幕。

设备 API 位于 `/api/webPush`，包括 `/key`、`/subscriptions` 和 `/subscriptions/:id/test`。返回的是当前用户的设备摘要，不暴露订阅 endpoint 或加密密钥。登出时应用应调用公开的 `unsubscribeDevice(api, base, userId)`，失败时先处理解绑问题。

## AI 开发的约束与验证

### 本插件的开发约束

- 不能每次启动生成新 VAPID 密钥，也不能在设备 API 中暴露 endpoint 与加密密钥。
- URL 仅指向应用内并包含挂载前缀；dedupeKey 只替换可见通知，不替代事件幂等。
- 测试权限拒绝、暂停和失效设备，并在真实设备确认展示；排队成功不代表推送已展示。

### 验证与边界

检查未授权、无订阅、暂停设备、订阅过期和实际设备收到推送的情况。测试接口返回排队结果，不等于浏览器已展示。404/410 的失效订阅会被移除；其他投递错误按通知运行时处理。

`dedupeKey` 用于替换同标签的可见通知，不能代替业务幂等。最终 payload 有大小限制，超限会拒绝而非截断。插件不提供离线缓存，也不决定前台提醒与系统推送之间的协调方式。

相关文档：[通知](notification.md)、[站内信](in-app.md)、[管理插件](../../developing-apps/manage-plugins.md)。

上述检查是接入后的验收要求，不表示本文已完成运行验证。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skills 与通用检查流程见[持续开发应用](../../getting-started/develop-with-an-agent.md)和[测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-web-push)。
