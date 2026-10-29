---
title: "Notification providers"
description: "Configure SMTP, Resend, Feishu and DingTalk notification channels."
---

`@nocobase/app-plugin-notification-providers` adds SMTP, Resend, Feishu and DingTalk channels to [Notifications](notification.md). It has only a Server runtime entry, without a configuration page or personal mailbox UI.

## Configure a channel

Register it after the notification Server plugin and add named channels:

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      from: notifications@example.com
```

This shows structure only; supply actual authentication through private server configuration. YAML does not interpolate `${...}`. The template's `defineMailChannelsConfig` maps `SMTP_PASSWORD` to `channels.system-email.auth.pass`; other names or credential paths need explicit environment mappings.

## Channel types

| `type` | Purpose | Message |
| --- | --- | --- |
| `smtp` | SMTP email | Email recipients, subject and text or HTML |
| `resend` | Resend email | Email recipients, subject and text or HTML |
| `feishu-webhook` | Feishu bot | Text and optional complete HTTP(S) target URL |
| `dingtalk-webhook` | DingTalk bot | Text and optional complete HTTP(S) target URL |

Several channels may share a type with independent credentials. Prefer `type`; the legacy `provider` alias must match it when both are present.

## Example: separate business notices and operational alerts

Configure `system-email` and `ops-feishu`, then provide complete messages under those names in `notification.send()`.

Email accepts an address or address array. Webhooks reject `to`, since configuration determines the destination. The plugin does not resolve user IDs to addresses. Feishu and DingTalk require official HTTPS webhook hosts and follow no redirects.

## Verify and extend

Send through a business flow or trusted server call and inspect [notification logs](notification.md). Successful configuration does not establish successful delivery.

Additional implementations use `ChannelInstance` and `registry.registerChannelType()`. [In-app notifications](in-app.md) and [Web push](web-push.md) come from separate plugins. Use [Email](mail.md) to connect personal mailboxes.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers).
