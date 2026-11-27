---
title: "Email integration and messaging"
metaDescription: Connect personal mailboxes in CRM to match customer correspondence by contact email address, send issued quotation attachments, and inspect sync and send records.
---

Connect a salesperson's personal mailbox to the CRM app, match correspondence by customer contact email address, and send an issued formal quotation document as an attachment.

When trying the complete example, prepare separate administrator, salespeople Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)) together with an authorized IMAP/SMTP test mailbox.

**Modules covered**

- [Mail](../../core/using-plugins/notifications/mail.md)

## Define customer correspondence and quotation sending

[Core Mail](../../core/using-plugins/notifications/mail.md) provides account connections, synchronization, reading, drafts, attachments and submission records. This guide connects those capabilities to customer details. Personal mailbox providers are configured separately from system notification email channels.

Customer mail matches one contact's full email address against From, To and Cc in the current user's synchronized mail. Sharing a customer does not share a personal mailbox, including with sales managers. The same contact address on multiple customers can match the same messages; this is a filtered view, not exclusive message ownership or archiving.

## Connect a mailbox and find customer correspondence

### Develop with an Agent

Give your development Agent the first section's business rules together with this prompt:

```prompt
Add a personal Mail workspace and a customer mail tab that finds the current user's correspondence by the selected contact's full email address. Follow this topic's customer and mailbox access rules; ask for a contact email when it is missing.

Let me attach an issued quotation DOCX and send it manually after checking it. Provide sync and sending records, plus account status for administrators. Repeated clicks must not send duplicates; never automatically resend an unknown result. Preserve existing business data. Do not connect real mailboxes or send automatically.
```

### Understand the implementation

In the complete example, the [accounts page](https://github.com/nocobase/doc-demo-crm/blob/main/client/pages/mail/accounts.tsx) exports Core's `MailAccountsPage`, and the [workspace](https://github.com/nocobase/doc-demo-crm/blob/main/client/pages/mail/workspace.tsx) embeds `MailWorkspacePage` with account and log links. Core owns connection, synchronization, composition and sending.

The [CRM mail endpoint](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-mail.ts) checks customer access, reads a contact belonging to that customer, then calls Mail. In this excerpt, `actorId` limits the mailbox to the current user and `participant` filters by the full contact address:

```ts
await new CrmService(connection, policies).get(customerId);
// contact comes from the same customer's permission-scoped contacts.
const result = await app.container.resolve(mailServiceToken).listMessages(
  { actorId: c.get('auth')!.user.id },
  { participant: contact.email.trim().toLowerCase(), offset: (page - 1) * 20,
    limit: 20, withTotal: true },
);
```

### Configure and try a mailbox

Prepare an authorized test mailbox that supports IMAP/SMTP. Obtain its endpoints, ports, TLS settings and app password from the provider. Merge the following into the private `config.yml` at the project root, keeping existing database and other settings. If you use `APP_CONFIG_FILE`, edit that file instead.

```yaml
mail:
  oauthReturnUrl: /mail/accounts
  providers:
    company-mail:
      type: imap-smtp
      imap:
        host: imap.example.com
        port: 993
        secure: true
      smtp:
        host: smtp.example.com
        port: 465
        secure: true
```

Replace both hostnames and use the provider's ports and `secure` values. This example uses direct TLS; STARTTLS endpoints need different settings. Enter the mailbox password when connecting, not here. Keep the provider name `company-mail` stable after connecting accounts. If SMTP does not save sent copies or you need Gmail / Microsoft 365 callback shapes, see the [Mail plugin guide](../../core/using-plugins/notifications/mail.md) and [`config.example.yml`](https://github.com/nocobase/doc-demo-crm/blob/main/config.example.yml).

From the project root run `pnpm nocobase config check`, restart `pnpm dev`, and open its printed `Local:` URL. **Mail → Mail accounts → Connect account** should offer `company-mail`. If absent, check the configuration path and restart. A passing configuration check means settings load; a successful account connection verifies authentication to both endpoints.

Alex opens **Mail → Mail accounts → Connect account**, selects `company-mail`, enters the mailbox address, login username and password or app password, then selects the initial synchronization boundary. After synchronization, add the contact's email under **Contacts**, open **Customer mail** and select that contact. An empty list can mean that synchronization has not finished.

![Customer correspondence filtered by contact address](/assets/guides/crm-customer-mail.png)

The screenshot uses a local test fixture that is not available in an ordinary startup. Connect your own test mailbox using the steps above to obtain real messages.

## Send a quotation file and inspect the result

1. Download the DOCX from a confirmed quotation. If you have not generated one yet, see [Generate business documents from a template](template-print.md).
2. Open **Mail → Compose**, select your sending account, enter an authorized test recipient and message, and use **Add attachment** to upload the downloaded file.
3. Verify the recipient, quotation version and attachment, then click **Send**. Inspect **Mail logs → Submissions**. Confirm actual receipt and attachment contents from the receiving mailbox.

![Issued quotation attached in the native composer](/assets/guides/crm-quotation-mail.png)

`pending` means waiting and `submitting` means submission is in progress. `accepted` means provider acceptance, not delivery or reading. Inspect a `failed` result before retrying. An `unknown` result may already have been sent: check the provider before sending again. For partial recipient rejection, do not resend to everyone.

## Verify synchronization, matching and access

Check these items in the UI:

| Action | Expected result |
| --- | --- |
| Synchronize a contact's message and open customer mail | Exact address matches; other addresses or similar domains do not |
| Change contact or customer | The previous result clears; there is no unfiltered fallback |
| Share the customer read-only with Taylor | Taylor sees matches in Taylor's mailbox, never Alex's |
| Transfer the customer and refresh Alex's old CRM entry | Page and API deny access; Alex's personal mailbox retains its mail |
| Inspect sync and submission records | Sync errors remain distinct from pending, accepted and unknown sending outcomes |

As an administrator, open **System settings → Messages → Mail**. Select **Accounts** to check mailbox connections, **Sync logs** for synchronization results, and **Send logs** for submissions. Sales and sales managers have no mail administration grant by default.

Duplicate requests, changed content under the same request key and identical attachment bytes are automated checks, not UI steps. Run `pnpm test` from the project root; all checks should pass using an isolated database and local mailbox fixture without real credentials.

The Agent should automatically check mail synchronization, matching, unauthorized access, deduplication, and quotation attachment consistency, and report the actual results. External OAuth, IMAP/SMTP connections and actual recipient receipt require your own authorized test mailbox; local validation does not establish those results.

## Summary and next steps

**Done when**: Synchronization works with your own authorized test mailbox, and customer mail matches contact addresses only within the current user’s mailbox. The test recipient has actually received the quotation email with the correct attachment. Access after customer handover has been checked, and logs distinguish provider acceptance, failure, and unknown outcomes.

Return to [Topic tutorials](index.md) to explore other Core capabilities, or review [Generate business documents from a template](template-print.md) for how formal quotation files are generated and snapshotted.
