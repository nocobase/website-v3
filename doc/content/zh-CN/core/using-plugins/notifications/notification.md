---
title: "通知"
description: "通过命名渠道发送通知，查询投递结果并处理重试。"
---

## 提供的能力

`@nocobase/app-plugin-notification` 是通知投递运行时，负责消息校验、持久化、队列、幂等处理、投递状态和有限重试。具体发送方式由[通知渠道](providers.md)、[站内信](in-app.md)、[浏览器推送](web-push.md)等插件提供。

通知运行时负责投递协调；收件人、业务触发时机和具体渠道由应用及渠道插件提供。

## 使用场景与示例

### 示例：订单结果同时通知两种渠道

在订单业务成功后，为同一事件构造站内信和邮件消息。站内信 `to` 使用用户 ID，邮件 `to` 使用邮箱地址；业务代码负责查找正确收件人。用稳定的业务事件标识作为 `idempotencyKey`，避免相同事件重复提交。

各收件人对应独立投递记录，一路失败不等于全部失败。重试沿用原渠道及提供方。业务界面应区分排队、提交和失败，不能把渠道接受消息当作用户已收到或已读。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```text
请使用通知插件，在订单审批成功后发送站内信和邮件。
使用已配置的具名渠道，为每个渠道提供完整消息，分别解析用户 ID 与邮箱地址。
用业务事件标识实现幂等，保留每个接收者的投递结果，并接入受保护的日志查看。
验证重复事件、一路失败及无权查看日志，不把排队成功显示为用户已收到。
```

**完成标志**：同一业务事件的投递可追踪，失败渠道与接收者可识别，重复提交不会造成意外重复通知。

## 重要原理与实现

以下是实现本例时的接入位置与预期界面变化；它们是开发说明，具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| 服务端渠道配置与 Jobs | 注册投递渠道，接入执行器 | 通知可排队并由对应渠道处理 |
| 订单业务服务 | 在业务成功后调用 send，关联事件与接收者 | 同一事件有可追踪的通知结果 |
| 日志页面与权限 | 查询投递记录，区分等待、成功提交与失败 | 管理者能定位单个接收者的失败 |

### 接入与配置

注册 Server 插件及实际需要的渠道插件，执行迁移与种子数据，并保证应用的 Jobs 执行器可运行。Client 插件提供日志客户端等能力，不自动注册日志页。

在 `notification.channels` 中为每个用途配置一个渠道名称及其 `type`。例如 `system-email` 是渠道名称，`smtp` 是实现类型；两者不能互换。默认模板通过 `server/config/notification.ts` 的 `defineMailChannelsConfig` 组合配置。

### 发送通知

业务在服务端从 `/server` 解析 `notificationServiceToken`，调用 `send()`。下面假设已注册站内信插件，并配置 `inbox: { type: 'in-app' }`：

```ts
await notification.send({
  idempotencyKey: 'order:123:approved',
  source: { type: 'order', referenceId: '123' },
  messages: {
    inbox: {
      to: 'user-123',
      title: '订单已审批',
      body: '可以继续处理订单。',
      target: { type: 'route', path: '/orders/123' },
    },
  },
});
```

`notification` 是解析得到的服务，用户和订单 ID 应取自实际业务。`messages` 的键必须是已配置的渠道名，每个渠道都需要完整消息；运行时不会自动把一份通用内容转换成所有渠道格式。

## AI 开发的约束与验证

### 本插件的开发约束

- 业务成功与通知投递分别处理，重试时保留稳定事件标识，不能在每次重试时生成新幂等键。
- 每个渠道校验自己的消息结构，不能把用户 ID 当作邮件地址。
- 验证部分失败和日志权限；一次性凭据使用 transient 路径，不能依赖其持久重试或幂等。

### 查看投递与敏感消息

日志接口位于 `/api/notifications/logs`，需要 `page:notification.logs/access`。应用可接入日志 UI，按发送返回的通知标识检查投递结果。不要额外暴露一个不受保护的通用发送接口。

一次性凭据、邀请 token 等敏感内容使用 `sendTransient({ channel, message })`：它只尝试一次，不写通知快照、Jobs 或重试状态，也没有持久幂等保证。超时可能表示提交结果未知，应由业务决定安全的恢复方式。

验证多收件人结果、重复事件、渠道失败和日志权限。相关文档：[通知渠道](providers.md)、[站内信](in-app.md)、[浏览器推送](web-push.md)。

上述检查是接入后的验收要求，不表示本文已完成运行验证。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skills 与通用检查流程见[使用 Agent 开发](../../developing-apps/develop-with-an-agent.md)和[测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification)。
