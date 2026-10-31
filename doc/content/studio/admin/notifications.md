---
title: Notifications and push
description: Set up email and push notifications, which invitation emails, password resets, and reminders while you're away from the page all depend on. In-app reminders need no setup.
---

Studio reminds people in three ways:

| Reminder | Setup needed | Used for |
| --- | --- | --- |
| In-app reminders | None | The inbox, the count on **My issues**, the sound reminder, and desktop notifications |
| Email | Notification channel and authentication sender | Invitations and password resets |
| Push notifications | HTTPS and a push key | Reminders on a phone or computer even when Studio isn't open |

For how members turn on the sound reminder and desktop notifications and subscribe to push on their phones, see [Inbox and reminders](../use/inbox.md).

## Invitation email

Invitations use a notification channel named `system-email` by default. Merge the following into the corresponding nodes in `config.yml`:

```yaml
users:
  invitations:
    emailChannel: system-email

notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: notifications@example.com
      from: "Studio <notifications@example.com>"
```

Supply the password through `SMTP_PASSWORD`, as shown below. Authorize the sender address with your email provider and use its required port and TLS settings.

For Resend, replace the entire `system-email` channel with `type: resend` and `from`. Supply `RESEND_API_KEY` and remove SMTP fields.

Without email configuration, administrators can copy and share invitation links. See [Invite members](../setup/invite.md).

## Password reset email

Password resets use the independent `auth.email` sender. You can use the same SMTP account as invitations, but configure both senders separately.

```yaml
auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: "Studio <notifications@example.com>"
```

Supply the password through `AUTH_EMAIL_PASSWORD`. Set `APP_PUBLIC_ORIGIN`, such as `https://studio.example.com`, so email links reach your Studio instance.

For Resend, replace the entire `auth.email` object with `provider: resend` and `from`. Supply `AUTH_EMAIL_API_KEY` and remove SMTP fields.

Built-in recovery requires password sign-in, `auth.passwordReset.enabled: true`, and a valid sender.

## Pass secrets and apply configuration

Add to the deployment's `.env`:

```dotenv
SMTP_PASSWORD=<invitation-email-smtp-password>
AUTH_EMAIL_PASSWORD=<password-reset-smtp-password>
```

Add these entries under `services.studio.environment` in `docker-compose.yml`:

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

A Compose `.env` does not automatically pass variables into containers. Declare them in Compose. `${NAME}` in `config.yml` is not expanded either.

Recreate the Studio container after making changes:

```bash
docker compose up -d --force-recreate studio
```

## Verify delivery

1. Send an invitation to a test mailbox you control that has not registered yet. Confirm delivery and that the link opens the correct Studio instance.
2. Sign out and request a password reset for an existing account.
3. Set a new password through the email link and confirm that you can sign in.

A submitted request does not prove delivery. Check sender authorization, SMTP connectivity, spam folders, and Studio logs. Keep passwords and reset links out of public logs.

## Migrate older configuration

- Notification channels use `type: smtp`. The old `provider: smtp` remains a compatibility alias.
- Configure the password-reset sender under `auth.email` and remove `auth.passwordReset.emailChannel`. The latter remains only for compatibility.
- Keep `notification.channels.system-email` for invitations. `SMTP_PASSWORD` and `AUTH_EMAIL_PASSWORD` configure the two senders independently.

## Push notifications

Push notifications need:

- Studio served over HTTPS, with `APP_PUBLIC_ORIGIN` set to the public address. An `http://` address on your local network won't work.
- A push private key that stays the same for good: a 32-byte P-256 private key in base64url or as 64 hex characters, in `push.privateKey` in `config.yml` or in the `WEB_PUSH_PRIVATE_KEY` environment variable. Put a contact address in `push.contact`, such as `mailto:admin@example.com`.

Without the private key, members can't subscribe to push.

> [!WARNING] Keep the push key for good
> If you change the push private key, every subscribed device has to subscribe again. Store it somewhere safe together with `SECRETS_KEYS`, back them up together, and never commit it to a repository.
