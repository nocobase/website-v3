---
title: "Email"
description: "Connect personal mailboxes, synchronize messages and compose email workflows."
---

## Capabilities

`@nocobase/app-plugin-mail` manages user-connected mailboxes: authorization, synchronization, reading, composing, sending, drafts, attachments and delivery history. Use [Notification providers](providers.md) for system emails; use Mail to read a person's mailbox or send through their connected account.

The application mounts personal account and workspace pages. System notification emails use notification channels.

## Scenarios and examples

### Example: customer correspondence

1. Connect an account and choose an initial synchronization date.
2. Wait for the relevant messages to synchronize.
3. Use `MailClient.listMessages({ participant: 'alice@example.com' })`, or `participant: '@example.com'` for an exact domain.
4. Render the results and let users select a sendable identity when composing.

`participant` matches actual From, To and Cc addresses. Domain matching excludes subdomains. It neither widens mailbox access nor searches unsynchronized remote history. Use `q` separately for fuzzy keyword search.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Show the current user's correspondence with a customer on the customer detail page.
Users first connect their own mailbox. Show only synchronized messages they are allowed to access, with clear loading, synchronization and failure states.
Let users choose an available sending identity and link the specific submission result to the customer record.
Use test mailboxes to verify synchronization, sending, receiving and account isolation. If a sending result is unknown, check it before sending again.
```

**Done when**: Customer detail shows the user's synchronized correspondence, sends have exact record associations, and other mailboxes remain inaccessible.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Mail config and app composition | Integrate mailConfig and named providers | Authorization and synchronization use configured services |
| Client routes and mailbox pages | Compose MailAccountsPage and MailWorkspacePage | Users connect personal mailboxes and open the workspace |
| Customer detail and send callback | Query participant and retain submission IDs | Show authorized synchronized mail and trace send outcomes |

### Configuration

Register both runtimes and apply migrations. Explicitly compose Mail configuration; registration does not modify application configuration composition:

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

Add this factory under `mail` in `defaultAppConfigs()` and update its configuration type. Configure named instances in `mail.providers`. Built-in Gmail, Microsoft 365 and IMAP/SMTP implementations still require external-service configuration.

Keep credentials in private server settings. Configure provider OAuth callbacks and set `mail.oauthReturnUrl` to the application's personal account page; its default is the application root.

### Compose the UI

No Mail pages are registered automatically. `/client` provides:

- `MailAccountsPage` for personal connections.
- `MailWorkspacePage`, with `accountsHref` pointing to account management.
- `MailClient` and `mailClientToken` for `/api/mail` access.
- `/client/components` for composers, lists, conversations, labels and signatures.

The personal account page needs authentication and `page:mail.workspace/access`. An administrator overview cannot replace personal account connection.

## AI development constraints and verification

### Plugin-specific development constraints

- An administrator overview does not replace personal authorization. Retain mailbox access checks; participant does not widen access.
- Keep exact address/domain matching separate from fuzzy q. Do not imply queries inspect unsynchronized remote mail.
- Check OAuth return paths, sync boundaries and send states. Investigate the specific submission before retrying an unknown outcome.

### Verification and extension

Verify callbacks, synchronization, reading, sending, drafts and attachments. Distinguish submission, failure and unknown outcomes. Associate business records with the composer's exact submission IDs rather than the newest history row.

Server integrations use `mailServiceToken`; custom providers register through `mailProviderRegistryToken`. Render capabilities actually supported by the provider. Review migration requirements for upgrades with existing data: participant indexes and IMAP-location migrations can require an offline maintenance window.

Related: [Notification providers](providers.md), [Authentication](../authentication/sign-in.md), [Manage plugins](../../developing-apps/manage-plugins.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail).
