---
title: "Notification providers"
description: "Configure SMTP, Resend, Feishu and DingTalk notification channels."
---

## Capabilities

`@nocobase/app-plugin-notification-providers` provides SMTP, Resend, Feishu bot and DingTalk bot channels for [Notifications](notification.md). It only has a Server runtime entry and provides neither a configuration page nor a personal mailbox workspace.

### Choose a channel type

| `type` | When to use it | Message requirements |
| --- | --- | --- |
| `smtp` | Send mail through an SMTP server | Raw email addresses, plus subject and text or html |
| `resend` | Send mail through Resend | Raw email addresses, plus subject and text or html |
| `feishu-webhook` | Send messages to a Feishu bot Webhook | text, with an optional complete HTTP(S) target URL |
| `dingtalk-webhook` | Send messages to a DingTalk bot Webhook | text, with an optional complete HTTP(S) target URL |

One type can be configured as several named channels, each with its own credentials. Use `type` in new configuration; the old `provider` alias is still accepted, but when both appear they must match.

## Scenarios and examples

### Example: keep business notifications and operations alerts apart

Configure `system-email` as a mail channel and `ops-feishu` as a Feishu channel. When the business calls `notification.send()`, provide complete messages under `messages['system-email']` and `messages['ops-feishu']` respectively.

Mail accepts a single address or an array of addresses; bot Webhooks do not accept `to`, because the destination is decided by the configured Webhook. The plugin does not convert user IDs to email addresses. The Feishu and DingTalk channels validate the official HTTPS Webhook hosts and do not follow redirects.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Notification Providers to separate business email from operational Feishu alerts.
Configure system-email and ops-feishu using private server credentials and explicit
environment mappings. Supply email recipients; let the webhook configuration choose
the bot destination without to. Verify delivery and failures with controlled
recipients and a test group. Do not add a personal mailbox UI.
```

**Done when**: the test mail and the alert each reach their specified destination, and failures caused by wrong credentials can be located in the logs.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `server/plugins.ts` and notification configuration | Register the Server channel plugin and named channel instances | No new page; the server can choose delivery implementations |
| Configuration factories and private environment configuration | Map SMTP or Webhook credentials explicitly | Configuration names match the paths actually read |
| Building business notifications | Prepare mail messages or bot messages per channel | Both kinds of message reach their own destinations |

### Configure a channel

Register this plugin's Server entry after the notifications plugin, and add named channels under `notification.channels`:

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      from: notifications@example.com
```

This example only shows the configuration structure; real SMTP authentication must be supplied through private server configuration. Values in YAML are literals, and `${...}` is not expanded. The default template's `defineMailChannelsConfig` maps `SMTP_PASSWORD` to `channels.system-email.auth.pass`; custom channel names or credential paths need explicit environment variable mappings.

## AI development constraints and verification

### Development constraints for this plugin

- Distinguish the channel name from `type`; YAML does not expand environment variables, so a placeholder expression is not a valid credential.
- Keep the official Webhook host and redirect validation; do not turn off the provider's validation to make tests pass.
- Actually check authentication failures, recipient formats and delivery logs; use test destinations so acceptance messages are not sent to business users.

### Verify and extend

Verify a channel by sending through the real business or from the server, and check the logs of [Notifications](notification.md). Also confirm that the configuration is readable, authentication works and the recipient format is correct; never judge sending successful just because the configuration saved.

For a new channel, extend through `ChannelInstance` and `registry.registerChannelType()`; implementing general extensions belongs to plugin development. This plugin does not include in-app notifications or Web Push, which come from [In-app notifications](in-app.md) and [Web push](web-push.md) respectively. To connect users' own mailboxes, see [Email](mail.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-notification-providers).
