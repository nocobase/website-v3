---
title: 邮件发送
---

`@nocobase/mailer` 提供 SMTP 和 Resend 发送能力。需要邮箱同步、邮件记录或通知渠道管理时使用对应插件；基础传输层不负责队列、业务模板和用户订阅。

## 使用宿主 Mailer

`@nocobase/app-server/mailer` 导出 `mailerToken` 和 `MailerProvider`。Provider 从 `notification.channels` 读取已启用且有效的邮件渠道，按需创建传输连接，在应用关闭时释放。

从容器解析 `mailerToken` 后调用：

```ts
import type { Mailer } from '@nocobase/app-server/mailer';

export async function sendOrderNotice(mailer: Mailer, recipient: string) {
  return mailer.send('system-email', {
    to: recipient,
    subject: 'Order received',
    text: 'Your order has been received.',
  });
}
```

`system-email` 是渠道配置的名称，不是隐式创建的默认 SMTP 服务。配置必须提供渠道类型、发送方、SMTP 地址与认证或 Resend API Key。`defineMailChannelsConfig()` 可声明配置、校验和环境映射，但仅设置 `SMTP_PASSWORD` 或 `RESEND_API_KEY` 不会自动启用渠道。

`mailer.available(name)` 可判断渠道是否可用。不要在每个请求结束时关闭宿主 Mailer，连接由宿主生命周期管理。

## 处理结果

| 结果 | 业务处理 |
| --- | --- |
| `accepted` | 服务商已接收；不代表收件人已经收到或阅读 |
| `failed` | 按返回的错误类别和重试建议处理，不要一律重试 |
| `submission_unknown` | 无法确认服务商是否已接收；直接重试可能重复发送 |

把订单通知等重要邮件的发送意图保存到业务记录或可靠任务中，再按结果更新状态。超时或取消不保证服务商没有接受邮件。有幂等能力的渠道也需要稳定的业务幂等键。

## 独立传输与插件

直接调用库的 `createMailTransport()` 时由调用方负责 `close()`。通知插件和宿主 Mailer 可能各自持有传输实例，不应假定它们共享连接或日志。

邮件渲染需要转义业务输入；限制收件人来源和发送权限。自动重试、模板和审计可放在业务服务或插件，后台发送可接[Jobs](background/jobs.md)。

## 接口与实现

- [Mailer contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/mailer/README.md)
- [Host Mailer](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/mailer/index.ts)
