---
title: WebSocket protocols and adapters
---

`@nocobase/app-websocket` defines the socket interface shared by hosts and applications and adapts Node HTTP Server upgrades. Prefer [Realtime topics](topics.md) for page updates; use this layer when implementing a host or another protocol.

## Responsibilities

| Layer | Responsibilities |
| --- | --- |
| WebSocket adapter | HTTP upgrade, connection lifecycle, message limits and native ping/pong |
| Realtime protocol | Topic subscriptions, acknowledgements, identity and resource authorization, delivery and subscription recovery |

The Node adapter uses `ws` in `noServer` mode so an existing HTTP server decides whether to accept an upgrade. An `AppWebSocketHandler` takes a `Request` and returns event handlers, a rejection `Response`, or an empty result when it does not handle the request.

## Connection interface

`AppWebSocket` exposes `url`, `protocol`, `readyState`, optional `bufferedAmount`, and `send()` and `close()`. Handlers implement `onOpen`, `onMessage`, `onClose` and `onError`; messages are strings or `ArrayBuffer` values.

Hosts identify upgrades with `isWebSocketUpgrade()`, convert requests through `createWebSocketUpgradeRequest()`, then call `acceptWebSocketUpgrade()` or `rejectWebSocketUpgrade()`. Ordinary apps and plugins do not need another WebSocket server.

## Paths and proxies

Realtime uses `/ws` inside the application; external paths may include a mount prefix. Use host URL resolution instead of hard-coding deployment prefixes. A normal HTTP request to this path returns an upgrade-required response.

Reverse proxies must forward upgrades, preserve the correct external host and protocol, and allow sufficient idle time. The application adapter rejects cross-origin browser connections. Incorrect origin or protocol rewriting can therefore reject a handshake.

## Identity and cleanup

The application adapter resolves identity at handshake and rechecks session validity during later activity and idle checks. A user ID in a URL is not authentication. Custom adapters own origin checks, authentication, message limits and heartbeats.

Release subscriptions and listeners on close or error and terminate connections during shutdown. Bound output buffering to avoid unlimited accumulation for slow clients. A connected socket only establishes transport; topic authorization and message validation remain protocol responsibilities.

## Interfaces and implementation

- [WebSocket interfaces and Node adapter](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket/src/index.ts)
- [Realtime transport](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
