---
title: Sending email
---

`@nocobase/mailer` sends through SMTP and Resend. Use plugins for mailbox synchronization, mail records and notification-channel management. The transport layer does not own queues, business templates or subscriptions.

## Host Mailer

`@nocobase/app-server/mailer` exports `mailerToken` and `MailerProvider`. The Provider reads enabled, valid mail channels from `notification.channels`, creates transports lazily and closes them at shutdown.

Resolve `mailerToken` and call:

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

`system-email` is a configured channel name, not an automatically created SMTP service. Supply the channel type, sender and SMTP connection/authentication or Resend API Key. `defineMailChannelsConfig()` adds configuration, validation and environment mappings; setting only `SMTP_PASSWORD` or `RESEND_API_KEY` does not enable a channel.

Use `mailer.available(name)` to check availability. Do not close the host Mailer after each request; its lifecycle belongs to the host.

## Results

| Result | Business handling |
| --- | --- |
| `accepted` | Provider accepted the message; this does not prove receipt or reading |
| `failed` | Follow the error category and retry disposition instead of retrying every failure |
| `submission_unknown` | Acceptance is uncertain; immediate retry can send duplicates |

Persist important sending intentions in business data or a durable task, then update them from the result. Timeout or cancellation does not guarantee the provider rejected the message. Channels supporting idempotency still need stable business keys.

## Standalone transports and plugins

Callers of `createMailTransport()` own `close()`. Notification plugins and the host Mailer may own separate transport instances; do not assume shared connections or logs.

Escape business input during rendering, and constrain recipients and sending permissions. Implement retries, templates and auditing in a business service or plugin; use [Jobs](background/jobs.md) for background delivery.

## Interfaces and implementation

- [Mailer contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/mailer/README.md)
- [Host Mailer](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/mailer/index.ts)
