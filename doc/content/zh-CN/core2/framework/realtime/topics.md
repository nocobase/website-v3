---
title: 实时消息与主题订阅
description: 用 @nocobase/realtime 把业务变更推送到订阅的页面，了解主题的声明与授权、页面刷新的接入方式，以及消息投递的边界。
---

`@nocobase/realtime` 把业务变更推送到订阅了的页面。应用通常复用 `@nocobase/app-server/realtime` 中的 `realtimeServiceToken`，组件则复用客户端运行时中已有的连接。

## 在应用与插件中接入

在服务端 Provider 的 `boot()` 中传入 `app.container`，声明由当前模块负责的主题：

```ts
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { ServiceResolver } from '@nocobase/service-provider';

export function registerOrderInbox(container: ServiceResolver) {
  const realtime = container.resolve(realtimeServiceToken);
  return realtime.defineTopic<{ changed: true }, 'user'>(
    'orders:inbox',
    { audience: 'user' },
  );
}
```

保存返回的主题句柄，在业务变更提交之后调用 `inbox.publishFor(userId, { changed: true })`。`userId` 来自服务端已经确认的通知对象，不能直接信任请求中携带的任意用户 ID。Provider 关闭时，调用 `inbox.close()` 释放自己声明的主题；共享服务和传输连接的启动与关闭由宿主负责。

应用和插件的接入方式相同，主题名需要避免冲突。前端在页面或组件中订阅即可，不需要再创建服务端主题。

## 声明主题

下面的独立示例展示了主题的声明、发送和释放。在应用中，请把声明放在 Provider 的 `boot()` 中，并通过宿主的服务管理连接：

```ts
import { createRealtimeService } from '@nocobase/realtime/server';

const realtime = createRealtimeService({ namespace: 'orders-demo' });
const inbox = realtime.defineTopic<{ changed: true }, 'user'>(
  'orders:inbox',
  { audience: 'user' },
);
await realtime.setup();
try {
  await inbox.publishFor('user-1', { changed: true });
} finally {
  inbox.close();
  await realtime.close();
}
```

`audience: 'user'` 只投递给指定的用户，订阅者的身份由连接上的认证结果决定，客户端不能自行选择用户。`public` 主题允许共享订阅，可以用 `authenticated: true` 要求登录；但登录并不代表有权查看所有的业务记录。

资源级别的订阅使用 `defineTopicFamily()` 和 `authorize()`，沿用 HTTP 接口的访问策略。授权会在订阅和投递时检查，权限被撤销之后，不能再依靠旧的订阅继续读取数据。主题必须先声明，未知的主题会被拒绝。

## 刷新页面

```tsx
import { useRealtimeRefresh } from '@nocobase/app-client';

export function OrderUpdates({
  refresh,
}: {
  refresh: (signal: AbortSignal) => Promise<void>;
}) {
  useRealtimeRefresh('orders:inbox', refresh, { delayMs: 100 });
  return null;
}
```

`refresh` 应通过带权限检查的 API 读取当前数据，并返回一个 Promise。这个 Hook 会在订阅成功之后以及变更到来时安排刷新，合并密集的事件，并在组件卸载时完成清理。对于隐藏或未选中的页面，可以设置 `enabled: false`，也可以使用空主题；不要为每个组件单独创建连接。

需要处理原始消息或订阅状态时，使用 `useRealtimeTopic()`。底层的 `watch()` 只有在收到订阅确认之后才会进入 `subscribed` 状态，每次重连后的确认都会触发 `onReady`。WebSocket 已经连接，并不代表某个主题已经订阅成功。

## 投递的边界

事件是临时的失效通知，断线期间的事件不会补发。消息中只放刷新所需的最少信息，权威的状态仍然保存在数据库和 API 中。发布的回执不代表浏览器已经收到消息；事务提交之后发布失败，也不能撤销已经提交的业务数据。

默认的 `inMemory` broker 只在当前服务实例内传播；多进程部署时，使用共享命名空间的 Redis Pub/Sub。仅仅使用相同的 namespace，并不能让多个内存 broker 互通。不要根据本进程的订阅人数来决定是否发布，其他实例上可能还有订阅者。

消息必须是有限的、没有循环引用的 JSON 数据；连接、函数和 `Date` 等不能直接传入。登录、退出或切换身份之后，应重新连接，并清理旧账号的缓存。传输层的说明见 [WebSocket 协议与适配](websocket.md)。

## 接口与实现

- [Realtime contracts and hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime/README.md)
- [Host WebSocket integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/realtime/types.ts)
