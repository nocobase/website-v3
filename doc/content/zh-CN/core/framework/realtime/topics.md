---
title: 实时消息与主题订阅
---

`@nocobase/realtime` 将业务变更推送到订阅页面。应用通常复用 `@nocobase/app-server/realtime` 的 `realtimeServiceToken`，组件复用客户端运行时中的连接。

## 声明主题

下面独立示例展示主题的声明、发送和释放；应用中将声明放在 Provider 的 `boot()`，通过宿主服务管理连接：

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

`audience: 'user'` 只投递给指定用户，订阅身份由连接上的认证结果决定，客户端不能自行选择用户。`public` 主题允许共享订阅，可用 `authenticated: true` 要求登录；登录并不代表有权查看所有业务记录。

资源级订阅用 `defineTopicFamily()` 和 `authorize()`，沿用 HTTP 接口的访问策略。授权在订阅和投递时检查，权限撤销后不能继续靠旧订阅读取数据。主题必须先声明，未知主题会被拒绝。

## 页面刷新

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

`refresh` 应通过有权限检查的 API 读取当前数据并返回 Promise。Hook 在订阅成功后和变更到来时安排刷新，合并密集事件，并在组件卸载时清理。隐藏或未选中的页面可设置 `enabled: false`，也可使用空主题；不要为每个组件创建连接。

需要处理原始消息或订阅状态时使用 `useRealtimeTopic()`。底层 `watch()` 只有收到订阅确认后才进入 `subscribed`，每次重连确认都会触发 `onReady`。WebSocket 已连接不代表某个主题已经订阅成功。

## 投递边界

事件是临时失效通知，断线后不会补发。消息只包含刷新所需的最少信息；权威状态保留在数据库和 API 中。发布回执不代表浏览器收到消息，事务提交后的发布失败也不能撤销已经提交的业务数据。

默认 `inMemory` broker 仅在当前服务实例内传播，多进程用共享命名空间的 Redis Pub/Sub。仅使用相同 namespace 不会连通多个内存 broker。不要依据本进程订阅人数决定是否发布，其他实例可能有订阅者。

消息必须是有限、无循环的 JSON 数据；连接、函数和 `Date` 等不能直接传入。登录、退出或身份切换后应重连并清理旧账号的缓存。传输层说明见 [WebSocket](websocket.md)。

## 接口与实现

- [Realtime contracts and hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime/README.md)
- [Host WebSocket integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
