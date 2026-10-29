---
title: WebSocket 协议与适配
---

`@nocobase/app-websocket` 定义宿主和应用共用的 WebSocket 接口，以及 Node HTTP Server 的升级适配。普通页面实时刷新优先使用[实时主题](topics.md)；需要自定义宿主或其他协议时再接触这一层。

## 两层职责

| 层次 | 负责内容 |
| --- | --- |
| WebSocket 适配 | HTTP upgrade、连接打开和关闭、消息大小、原生 ping/pong |
| Realtime 协议 | 主题订阅、确认、身份和资源授权、事件投递、重连后的订阅恢复 |

Node 适配器使用 `ws` 的 `noServer` 模式，让已有 HTTP 服务先决定是否接受升级。`AppWebSocketHandler` 接收 `Request`，返回事件处理器、拒绝的 `Response`，或表示不处理的空值。

## 连接接口

`AppWebSocket` 暴露 `url`、`protocol`、`readyState`、可选的 `bufferedAmount`，以及 `send()`、`close()`。事件处理器提供 `onOpen`、`onMessage`、`onClose`、`onError`；消息为字符串或 `ArrayBuffer`。

宿主可通过 `isWebSocketUpgrade()` 识别升级请求，用 `createWebSocketUpgradeRequest()` 转换请求，最后调用 `acceptWebSocketUpgrade()` 或 `rejectWebSocketUpgrade()`。普通应用与插件无需自己再启动一台 WebSocket Server。

## 路径与代理

Realtime 的应用内部路径为 `/ws`，对外路径可能还包含应用挂载前缀。浏览器应使用宿主解析的地址，不要把部署环境中的前缀写死。普通 HTTP 请求访问这个路径会得到需要 WebSocket upgrade 的响应。

反向代理需要转发升级请求，保留正确的对外 Host 和协议，并允许足够的空闲时间。应用适配器拒绝不同来源的浏览器连接；代理错误地改写 origin 或协议会导致握手被拒绝。

## 身份与资源释放

应用适配器从握手解析身份，并在后续活动和闲置检查中重新确认会话；不能把 URL 中的用户 ID 直接当作身份。自定义适配器必须补齐自己的来源检查、认证、消息限制和心跳处理。

连接关闭或错误时释放订阅和监听器，应用关闭时终止连接。限制发送缓冲，避免慢客户端无限积压。传输连接成功只证明通道建立；主题权限和业务消息校验仍由协议层完成。

## 接口与实现

- [WebSocket interfaces and Node adapter](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket/src/index.ts)
- [Realtime transport](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
