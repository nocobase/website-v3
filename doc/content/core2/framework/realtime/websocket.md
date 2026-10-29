---
title: WebSocket protocols and adapters
description: Learn how the WebSocket adapter layer and the Realtime protocol layer divide responsibilities, the connection interface, requirements for paths and proxies, and identity checks and resource release.
---

`@nocobase/app-websocket` defines the WebSocket interface shared by hosts and applications, along with the upgrade adapter for the Node HTTP Server. For realtime refreshes on ordinary pages, prefer [Realtime messages and topic subscriptions](topics.md); you only need this layer when implementing a custom host or another protocol.

## Two layers of responsibility

| Layer | Responsibilities |
| --- | --- |
| WebSocket adapter | HTTP upgrade, opening and closing connections, message size, native ping/pong |
| Realtime protocol | Topic subscription and acknowledgement, identity and resource authorization, event delivery, restoring subscriptions after reconnect |

The Node adapter uses `ws` in `noServer` mode, so that the existing HTTP service decides first whether to accept an upgrade. An `AppWebSocketHandler` receives a `Request` and returns event handlers, a `Response` that rejects the upgrade, or an empty value meaning it does not handle the request.

## Connection interface

`AppWebSocket` provides `url`, `protocol`, `readyState`, an optional `bufferedAmount`, and `send()` and `close()`. Event handlers include `onOpen`, `onMessage`, `onClose` and `onError`; messages are strings or `ArrayBuffer` values.

A host can recognize upgrade requests with `isWebSocketUpgrade()`, convert the request with `createWebSocketUpgradeRequest()`, and finally call `acceptWebSocketUpgrade()` or `rejectWebSocketUpgrade()`. Ordinary applications and plugins do not need to start a WebSocket server of their own.

## Paths and proxies

Inside the application, Realtime uses the path `/ws`; the external path may also include the application's mount prefix. Browsers should use the address resolved by the host instead of hard-coding the deployment prefix. An ordinary HTTP request to this path gets a response requiring a WebSocket upgrade.

Reverse proxies must forward upgrade requests, preserve the correct external Host and protocol, and allow a long enough idle time. The application adapter rejects browser connections from other origins, so if a proxy rewrites the origin or protocol incorrectly, the handshake is rejected.

## Identity and resource release

The application adapter resolves identity from the handshake request and reconfirms the session during later activity and idle checks; a user ID in the URL must never be treated as identity. Custom adapters must add their own origin checks, authentication, message limits and heartbeat handling.

When a connection closes or fails, release its subscriptions and listeners; when the application shuts down, terminate all connections. Limit the send buffer so that slow clients cannot accumulate messages without bound. A successful transport connection only means the channel is established; topic permissions and business message validation are still done by the protocol layer.

## Interfaces and implementation

- [WebSocket interfaces and Node adapter](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket/src/index.ts)
- [Realtime transport](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
