---
title: "Email"
description: "Connect users' mailboxes, send and receive mail, synchronize history and compose a mail workspace."
---

## Capabilities

`@nocobase/app-plugin-mail` works with mailboxes users connect themselves, providing account authorization, mail synchronization, reading, composing, sending, drafts, attachments and send history. For delivering system verification codes and business notification emails, use [Notification providers](providers.md); use this plugin only when you need to read a user's mailbox or send through an account the user connected.

The personal mailbox connection page and the mail workspace are mounted by the application, while system notification emails are handled by notification channels.

## Scenarios and examples

### Example: view correspondence on a customer's details

1. The user connects a mailbox and chooses the start date of the first synchronization.
2. Wait for synchronization to finish, and confirm the target messages are in local data.
3. The application queries the correspondence with `MailClient.listMessages({ participant: 'alice@example.com' })`, or matches an exact domain with `participant: '@example.com'`.
4. Show the records with the mail components; when sending, let the user choose an identity that can send, and check the real sending result.

`participant` exactly matches the actual addresses in From, To and Cc; domain matching excludes subdomains. It neither widens the user's mailbox permissions nor queries remote history that has not been synchronized yet. For fuzzy keyword search, use the separate `q`.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Mail to show the current user's customer correspondence. Compose Mail config
and integrate personal account connection and workspace pages with existing access
checks. Query synchronized messages by the customer's exact participant address
and handle loading and failures. Select sendable identities and associate business
records with exact submission IDs. Verify synchronization, sending, receiving and
mailbox isolation using a test mailbox; do not blindly resubmit unknown outcomes.
```

**Done when**: the customer's details show the user's synchronized messages with that customer, sending results link to the exact records, and other users' mailboxes cannot be accessed.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `server/config/mail.ts` and the application's configuration composition | Connect `mailConfig` and named providers | Mailbox authorization and synchronization use real configuration |
| Client routes and mailbox pages | Compose `MailAccountsPage` and `MailWorkspacePage` | Users can connect their own mailboxes and open the workspace |
| Customer details and the send callback | Query by `participant` and record the submission ID | Only synchronized mail the user may read is shown, and sending results are traceable |

### Integration and configuration

Register the Client and Server plugins and run the migrations. In addition, compose the Mail configuration explicitly; the plugin's registration command does not change the application's configuration composition for you:

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';
export default mailConfig;
```

In the application's `defaultAppConfigs()`, connect the factory above under the `mail` key and update the corresponding configuration type. Then configure named instances in `mail.providers`. The plugin has built-in Gmail, Microsoft 365 and IMAP/SMTP implementations, but that does not mean those external services are already configured.

Credentials such as OAuth and SMTP are kept in the server's private configuration. When using OAuth, configure the callback for the corresponding provider, and point `mail.oauthReturnUrl` to the application's own personal mailbox connection page; it defaults to the application root.

### Connect the mail pages

The plugin does not register mail pages automatically. The application can use these from `/client`:

- `MailAccountsPage`: connect and manage personal mailboxes.
- `MailWorkspacePage`: the mail workspace, pointing to the accounts page through `accountsHref`.
- `MailClient`, `mailClientToken`: for custom pages to call `/api/mail`.
- `/client/components`: reusable interfaces such as the composer, message list, conversations, labels and signatures.

The personal accounts page requires authentication and the `page:mail.workspace/access` permission. A page where administrators see mailbox information for all users cannot replace the flow in which users connect their own accounts.

## AI development constraints and verification

### Development constraints for this plugin

- An administrator's mailbox overview cannot replace users authorizing their own connections; keep the mailbox permission checks in queries, and remember that `participant` does not widen access.
- Keep exact matching by address and domain separate from fuzzy search with `q`; do not describe unsynchronized mail as "remote data the query cannot find".
- Check the OAuth return path, the synchronization range and the sending status; when a sending result is unknown, verify the specific submission first to avoid sending twice.

### Verification and extension

Check the authorization callback, first synchronization, sending and receiving, drafts and attachments, and distinguish the three sending states "submitted", "failed" and "result unknown". When a sending result must be linked to a business record, use the specific submission ID the composer returns, never "the latest history record".

On the server, use `mailServiceToken` exported from `/server`; custom providers are registered through `mailProviderRegistryToken`. Providers differ in capabilities, so the interface should show what each actually supports. When upgrading existing mail data, check the migration requirements of the version: migrating participant indexes or IMAP locations may need a maintenance window with writes stopped.

Related documentation: [Notification providers](providers.md), [Authentication](../authentication/sign-in.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-mail).
