---
title: "Notification providers"
description: "Configure SMTP, Resend, Feishu and DingTalk notification channels."
---

## Capabilities

`@nocobase/app-plugin-notification-providers` adds SMTP, Resend, Feishu and DingTalk channels to [Notifications](notification.md). It has only a Server runtime entry, without a configuration page or personal mailbox UI.

### Channel types

| `type` | Purpose | Message |
| --- | --- | --- |
| `smtp` | SMTP email | Email recipients, subject and text or HTML |
| `resend` | Resend email | Email recipients, subject and text or HTML |
| `feishu-webhook` | Feishu bot | Text and optional complete HTTP(S) target URL |
| `dingtalk-webhook` | DingTalk bot | Text and optional complete HTTP(S) target URL |

Several channels may share a type with independent credentials. Prefer `type`; the legacy `provider` alias must match it when both are present.

## Scenarios and examples

### Example: separate business notices and operational alerts

Configure `system-email` and `ops-feishu`, then provide complete messages under those names in `notification.send()`.

Email accepts an address or address array. Webhooks reject `to`, since configuration determines the destination. The plugin does not resolve user IDs to addresses. Feishu and DingTalk require official HTTPS webhook hosts and follow no redirects.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use Notification Providers to separate business email from operational Feishu alerts.
Configure system-email and ops-feishu using private server credentials and explicit
environment mappings. Supply email recipients; let the webhook configuration choose
the bot destination without to. Verify delivery and failures with controlled
recipients and a test group. Do not add a personal mailbox UI.
```

**Done when**: Test email and alerts reach their separate destinations, and credential failures are visible in logs.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Server plugins and notification config | Register the Server provider and named instances | Enable transports without adding pages |
| Config factories and private environment | Explicitly map SMTP or webhook credentials | Names match the actual credential paths |
| Business message construction | Build email or bot payloads per channel | Each message reaches its intended destination |

### Configure a channel

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

## AI development constraints and verification

### Plugin-specific development constraints

- Distinguish channel names from type. YAML does not expand environment placeholders into credentials.
- Retain official webhook-host and redirect validation rather than disabling it to pass a test.
- Check authentication failures, recipient formats and delivery logs using controlled test destinations.

### Verify and extend

Send through a business flow or trusted server call and inspect [notification logs](notification.md). Successful configuration does not establish successful delivery.

Additional implementations use `ChannelInstance` and `registry.registerChannelType()`. [In-app notifications](in-app.md) and [Web push](web-push.md) come from separate plugins. Use [Email](mail.md) to connect personal mailboxes.

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Continue developing your app](../../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers).
