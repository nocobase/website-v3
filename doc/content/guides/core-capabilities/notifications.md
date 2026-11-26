---
title: "Business events and in-app notifications"
metaDescription: Notify customer owners and quotation applicants, then verify delivery, recipient isolation, read state and authorized business links.
---

Send in-app notifications in the CRM app when business state changes—such as when a customer is reassigned to another salesperson or a quotation receives an approval decision—so recipients can jump straight from their inbox to the record.

When trying the complete example, prepare:

- Separate administrator, salespeople Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)).
- **CRM implementation** at `12000 USD` in the product catalog created by Morgan (reuse the existing product if already present).

**Modules covered**

- [Notifications](../../core/using-plugins/notifications/notification.md)
- [In-app messages](../../core/using-plugins/notifications/in-app.md)

## Decide when to notify and who receives messages

| Event | Recipient | No notification |
| --- | --- | --- |
| Customer owner changes | New owner | Unchanged owner, unassignment or read-only sharing |
| Quotation confirmed, rejected or returned | Original applicant | Submission for approval or withdrawal |

Automatic confirmation at a discount of 10% or less also sends a result. Keep messages in short English without customer names, amounts or approval comments. Opening a retained notification must check current business access.

## Prepare in-app notifications

This guide uses [in-app notifications](../../core/using-plugins/notifications/in-app.md), without external accounts or credentials. Have the Agent configure `inbox` as an `in-app` channel and provide an inbox, following the installed version's guidance. The [notification service](../../core/using-plugins/notifications/notification.md) handles delivery, results, and retries.

Other channels need separate configuration. See [email and group bots](../../core/using-plugins/notifications/providers.md) and [Web Push](../../core/using-plugins/notifications/web-push.md). This example has not verified them. Keep credentials out of prompts and screenshots.

## Connect assignment and quotation result notifications

Send this prompt to your development agent:

```prompt
Add in-app notifications to the CRM with these rules:
- When ownership actually changes to another valid user, notify the new owner. Do not notify for an unchanged owner, unassignment, or read-only sharing.
- Notify the original applicant when a quote is confirmed, rejected, or returned, including automatic low-discount confirmation. Do not send results while awaiting approval or on withdrawal.
- Do not notify unrelated salespeople or read-only shared users. Send only once for each business change.

Use short English messages without customer names, amounts, or approval comments. Opening a notification leads to the customer or quote, with current access checked. Marking it read does not close an approval task.

If sending fails, send after recovery without undoing the business operation. Administrators can inspect scenarios, pending messages, and delivery results, distinguishing service acceptance from completed delivery. Template previews use fictional data and never send.
```

Create these exercise records to verify inbox delivery:

1. Morgan creates **Harbor Services**, initially keeping ownership, then changes its owner to Alex. Alex should receive **Customer assigned to you** in **Inbox**. Saving the same owner again adds no message.
2. Alex creates the **Customer service rollout** opportunity under that customer, then a draft **Service rollout proposal** quotation. Select **CRM implementation**: quantity `2`, unit price `12000`, discount `15%`, total `20400.00 USD`.
3. Alex submits the draft to Morgan. Morgan approves it in **My tasks**. Alex receives **Quotation confirmed** and opens its business link to the quotation.
4. Use separate new drafts for return, rejection and automatic low-discount confirmation. Do not edit a confirmed or rejected quotation.

![Alex's inbox with assignment and quotation result messages](/assets/guides/crm-notification-inbox.png)

Open **System settings → Notifications** to inspect actual templates, events and delivery records. Preview renders fixed sample content without sending. Business messages stay in English even when the interface language changes.

## Check delivery and business links

Saving the business operation also records the pending notification. A temporary failure does not undo the operation. Distinguish these states:

| State | Meaning and next step |
| --- | --- |
| `queued` | Waiting for the notification service. Startup checks and a task every 15 seconds submit it after recovery |
| `submitted` | Accepted by the service. Check the linked delivery record for the outcome; the service handles further retries |

In the complete example, [owner changes](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-access.ts) and [quote decisions](https://github.com/nocobase/doc-demo-crm/blob/main/server/lifecycles/quote-approval.ts) save pending records, and the [CRM notification service](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-notifications.ts) submits them without resending submitted records.

![Actual notification delivery records](/assets/guides/crm-notification-logs.png)

Use separate accounts to check:

- Only intended recipients receive messages; read and unread states can change.
- Marking a message read leaves approval tasks open.
- After customer transfer, the former owner cannot read business content through old notifications or previously opened pages.
- Events match their delivery records in settings, and template previews add no messages.

The Agent should automatically check duplicate requests, unauthorized access, failed saves, and temporary notification failures. Retrying after service acceptance but before the business record updates should still deliver only once. Review its report for actual results and any incomplete checks.

The management page only displays delivery results. For a terminal delivery failure, fix its cause and use the notification service’s authorized retry action. External channels and deployments with multiple app instances need checks in those environments.

## Summary and next steps

**Done when**: Assignment and quotation-result notifications reach the intended inbox, and business events can be matched to delivery records. Repeated requests do not add messages, old notifications cannot bypass current customer access, marking a message read does not close its approval task, and recovery after a temporary failure has been checked.

To scan due follow-ups on a schedule and notify owners automatically, see [Scheduled tasks and due reminders](scheduled-reminders.md).
