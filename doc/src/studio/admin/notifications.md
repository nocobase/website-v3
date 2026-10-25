---
title: Notifications and push
description: Set up email and push notifications, which invitation emails, password resets, and reminders while you're away from the page all depend on. In-app reminders need no setup.
---

Studio reminds people in three ways:

| Reminder | Setup needed | Used for |
| --- | --- | --- |
| In-app reminders | None | The inbox, the count on **My issues**, the sound reminder, and desktop notifications |
| Email | An email channel | Invitations and password resets |
| Push notifications | HTTPS and a push key | Reminders on a phone or computer even when Studio isn't open |

For how members turn on the sound reminder and desktop notifications and subscribe to push on their phones, see [Inbox and reminders](../use/inbox.md).

## Email

Add an email channel named `system-email` under `notification.channels` in `config.yml`. With SMTP:

```yaml
notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      auth:
        user: notifications@example.com
        pass: <SMTP password>
      from: notifications@example.com
```

You can also use Resend: `type: resend` with `apiKey` and `from`. To keep the password out of the file, provide it through an environment variable such as `SMTP_PASSWORD`.

Restart Studio once it's set up:

- Invitations now send emails. Without email, the invitation result shows **Email not sent**, and you can copy the invitation link and send it yourself.
- Password resets: make sure `auth.passwordReset` is on in `config.yml` with `emailChannel` pointing at `system-email`, so **Forgot password?** works on the sign-in page.

## Push notifications

Push notifications need:

- Studio served over HTTPS, with `APP_PUBLIC_ORIGIN` set to the public address. An `http://` address on your local network won't work.
- A push private key that stays the same for good: a 32-byte P-256 private key in base64url or as 64 hex characters, in `push.privateKey` in `config.yml` or in the `WEB_PUSH_PRIVATE_KEY` environment variable. Put a contact address in `push.contact`, such as `mailto:admin@example.com`.

Without the private key, members can't subscribe to push.

> [!WARNING] Keep the push key for good
> If you change the push private key, every subscribed device has to subscribe again. Store it somewhere safe together with `SECRETS_KEYS`, back them up together, and never commit it to a repository.

## Other channels

`notification.channels` also supports channels such as Feishu and DingTalk group bots (`feishu-webhook` and `dingtalk-webhook`). Studio's reminders currently use only in-app, email, and push.
