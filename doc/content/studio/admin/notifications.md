---
title: Notifications and push
description: Configure invitation email, password recovery, and device push.
---

Studio reminds people in three ways:

| Reminder | Setup needed | Used for |
| --- | --- | --- |
| In-app reminders | None | The inbox, the count on **My issues**, the sound reminder, and desktop notifications |
| Email | A service in `mailers` | Invitations and password resets |
| Push notifications | HTTPS and a push key | Reminders on a phone or computer even when Studio isn't open |

For how members turn on the sound reminder and desktop notifications and subscribe to push on their phones, see [Inbox and reminders](../use/inbox.md).

## Invitation email

Invitations and password resets share the default service in `mailers`. Merge this SMTP example into the matching sections of `config.yml`:

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
      pass: replace-with-smtp-password
    from: "Studio <notifications@example.com>"
```

Set the SMTP password in `mailers.system.auth.pass`. Authorize the sender address with your email provider and use its required port and TLS settings.

For Resend, replace the `mailers` configuration with the following. Do not mix SMTP fields into it:

```yaml
mailers:
  default: system
  system:
    provider: resend
    apiKey: replace-with-resend-api-key
    from: "Studio <notifications@example.com>"
```

Invitations use `mailers.default`. To select another configured service, set `users.invitations.mailer` to its name. Without email configuration, administrators can copy and share invitation links. See [Invite members](../setup/invite.md).

## Password reset email

Password resets use `mailers.default` too. Enable password sign-in and recovery:

```yaml
app:
  publicOrigin: https://studio.example.com

auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
```

Set `app.publicOrigin`, such as `https://studio.example.com`, so email links reach your Studio instance. To use a different configured service for recovery, set `auth.passwordReset.mailer` to its name.

## Apply configuration

Save `config.yml` and ensure the container user can read it. Then recreate the Studio container:

```bash
docker compose up -d --force-recreate studio
```

## Verify delivery

1. Send an invitation to a test mailbox you control that has not registered yet. Confirm delivery and that the link opens the correct Studio instance.
2. Sign out and request a password reset for an existing account.
3. Set a new password through the email link and confirm that you can sign in.

A submitted request does not prove delivery. Check sender authorization, SMTP connectivity, spam folders, and Studio logs. Keep passwords and reset links out of public logs.

## Push notifications

Push notifications need:

- Studio served over HTTPS, with `app.publicOrigin` set to the public address. An `http://` address on your local network won't work.
- A stable 32-byte P-256 private key, encoded as base64url or 64 hexadecimal characters. Set `push.privateKey` in `config.yml`. Set a contact address in `push.contact`, such as `mailto:admin@example.com`.

Without the private key, members can't subscribe to push.

> [!WARNING] Preserve the push key
> If you change the push private key, every subscribed device has to subscribe again. Store it somewhere safe together with `secrets.keys`, back them up together, and never commit it to a repository.

![Member notification preferences](https://static-docs.nocobase.com/studio-en-notifications-20261111-normal-2x.webp)
