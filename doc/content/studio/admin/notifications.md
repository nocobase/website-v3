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
    from: "Studio <notifications@example.com>"
```

Supply the password through `MAILERS_SYSTEM_PASSWORD`, as shown below. Authorize the sender address with your email provider and use its required port and TLS settings.

For Resend, set `mailers.system` to `provider: resend` and `from`. Remove the SMTP fields and pass the API key through `MAILERS_SYSTEM_API_KEY` in both `.env` and Compose.

Invitations use `mailers.default`. To select another configured service, set `users.invitations.mailer` to its name. Without email configuration, administrators can copy and share invitation links. See [Invite members](../setup/invite.md).

## Password reset email

Password resets use `mailers.default` too. Enable password sign-in and recovery:

```yaml
auth:
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
  passwordReset:
    enabled: true
```

Set `APP_PUBLIC_ORIGIN`, such as `https://studio.example.com`, so email links reach your Studio instance. To use a different configured service for recovery, set `auth.email.mailer` to its name.

## Pass secrets and apply configuration

Add to the deployment's `.env`:

```dotenv
MAILERS_SYSTEM_PASSWORD=<smtp-password>
```

Add these entries under `services.studio.environment` in `docker-compose.yml`:

```yaml
MAILERS_SYSTEM_PASSWORD: ${MAILERS_SYSTEM_PASSWORD:?set MAILERS_SYSTEM_PASSWORD in .env}
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

## Push notifications

Push notifications need:

- Studio served over HTTPS, with `APP_PUBLIC_ORIGIN` set to the public address. An `http://` address on your local network won't work.
- A stable 32-byte P-256 private key, encoded as base64url or 64 hexadecimal characters. Set `push.privateKey` or `WEB_PUSH_PRIVATE_KEY`. Set a contact address in `push.contact`, such as `mailto:admin@example.com`.

Without the private key, members can't subscribe to push.

> [!WARNING] Preserve the push key
> If you change the push private key, every subscribed device has to subscribe again. Store it somewhere safe together with `SECRETS_KEYS`, back them up together, and never commit it to a repository.

![Member notification preferences](https://static-docs.nocobase.com/studio-en-guide-preferences-20261031.png)
