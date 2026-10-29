---
title: "Email"
description: "Connect personal mailboxes, synchronize messages and compose email workflows."
---

`@nocobase/app-plugin-mail` manages user-connected mailboxes: authorization, synchronization, reading, composing, sending, drafts, attachments and delivery history. Use [Notification providers](providers.md) for system emails; use Mail to read a person's mailbox or send through their connected account.

## Configuration

Register both runtimes and apply migrations. Explicitly compose Mail configuration; registration does not modify application configuration composition:

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

Add this factory under `mail` in `defaultAppConfigs()` and update its configuration type. Configure named instances in `mail.providers`. Built-in Gmail, Microsoft 365 and IMAP/SMTP implementations still require external-service configuration.

Keep credentials in private server settings. Configure provider OAuth callbacks and set `mail.oauthReturnUrl` to the application's personal account page; its default is the application root.

## Compose the UI

No Mail pages are registered automatically. `/client` provides:

- `MailAccountsPage` for personal connections.
- `MailWorkspacePage`, with `accountsHref` pointing to account management.
- `MailClient` and `mailClientToken` for `/api/mail` access.
- `/client/components` for composers, lists, conversations, labels and signatures.

The personal account page needs authentication and `page:mail.workspace/access`. An administrator overview cannot replace personal account connection.

## Example: customer correspondence

1. Connect an account and choose an initial synchronization date.
2. Wait for the relevant messages to synchronize.
3. Use `MailClient.listMessages({ participant: 'alice@example.com' })`, or `participant: '@example.com'` for an exact domain.
4. Render the results and let users select a sendable identity when composing.

`participant` matches actual From, To and Cc addresses. Domain matching excludes subdomains. It neither widens mailbox access nor searches unsynchronized remote history. Use `q` separately for fuzzy keyword search.

## Verification and extension

Verify callbacks, synchronization, reading, sending, drafts and attachments. Distinguish submission, failure and unknown outcomes. Associate business records with the composer's exact submission IDs rather than the newest history row.

Server integrations use `mailServiceToken`; custom providers register through `mailProviderRegistryToken`. Render capabilities actually supported by the provider. Review migration requirements for upgrades with existing data: participant indexes and IMAP-location migrations can require an offline maintenance window.

Related: [Notification providers](providers.md), [Authentication](../authentication/sign-in.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail).
