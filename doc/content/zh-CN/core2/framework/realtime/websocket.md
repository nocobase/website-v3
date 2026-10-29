---
title: WebSocket 协议与适配
description: 了解 WebSocket 适配层与 Realtime 协议层的分工、连接接口、路径与代理的要求，以及身份校验和资源释放。
---

`@nocobase/app-websocket` 定义了宿主和应用共用的 WebSocket 接口，以及针对 Node HTTP Server 的升级适配。普通页面的实时刷新，优先使用 [实时消息与主题订阅](topics.md)；只有在需要自定义宿主或其他协议时，才需要接触这一层。

## 两层职责

| 层次 | 负责的内容 |
| --- | --- |
| WebSocket 适配 | HTTP upgrade、连接的打开和关闭、消息大小、原生的 ping/pong |
| Realtime 协议 | 主题订阅与确认、身份和资源授权、事件投递、重连后恢复订阅 |

Node 适配器使用 `ws` 的 `noServer` 模式，让已有的 HTTP 服务先决定是否接受升级。`AppWebSocketHandler` 接收一个 `Request`，返回事件处理器、表示拒绝的 `Response`，或者表示不处理的空值。

## 连接接口

`AppWebSocket` 提供 `url`、`protocol`、`readyState`、可选的 `bufferedAmount`，以及 `send()` 和 `close()`。事件处理器包括 `onOpen`、`onMessage`、`onClose`、`onError`；消息是字符串或 `ArrayBuffer`。

宿主可以用 `isWebSocketUpgrade()` 识别升级请求，用 `createWebSocketUpgradeRequest()` 转换请求，最后调用 `acceptWebSocketUpgrade()` 或 `rejectWebSocketUpgrade()`。普通的应用和插件不需要自己再启动一个 WebSocket Server。

## 路径与代理

Realtime 在应用内部的路径是 `/ws`，对外的路径可能还包含应用的挂载前缀。浏览器应使用宿主解析出的地址，不要把部署环境中的前缀写死。用普通的 HTTP 请求访问这个路径，会得到一个要求 WebSocket upgrade 的响应。

反向代理需要转发升级请求，保留正确的对外 Host 和协议，并允许足够长的空闲时间。应用适配器会拒绝来自其他来源的浏览器连接；如果代理错误地改写了 origin 或协议，握手就会被拒绝。

## 身份与资源释放

应用适配器从握手请求中解析身份，并在之后的活动和闲置检查中重新确认会话；不能把 URL 中的用户 ID 直接当作身份。自定义的适配器必须自行补齐来源检查、认证、消息限制和心跳处理。

连接关闭或出错时，释放订阅和监听器；应用关闭时，终止所有连接。请限制发送缓冲区，避免慢速的客户端无限积压消息。传输连接成功只说明通道已经建立，主题权限和业务消息的校验仍然由协议层完成。

## 接口与实现

- [WebSocket interfaces and Node adapter](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket/src/index.ts)
- [Realtime transport](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
