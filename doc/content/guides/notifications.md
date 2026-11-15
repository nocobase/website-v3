---
title: In-app notifications for assignments and quotation results
metaDescription: Notify customer owners and quotation applicants, then verify delivery, recipient isolation, read state and authorized business links.
lesson: 10
---

Continue from [Attachments and quotation documents](attachments-and-documents.md). This lesson sends information to the people responsible for the next step or affected by its outcome.

If you are trying the completed version without exercise data, prepare:

- An administrator, salespeople Alex and Taylor, and manager Morgan using [account and role setup](team-permissions.md#configure-users-and-roles).
- **CRM implementation** at `12000 USD`, created by Morgan using [Lesson 8's product preparation](quote-approvals.md#review-quotations-in-the-task-center).

This lesson creates its own customer, opportunity, and draft quotation. Confirmed quotes and attachments are not required.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-9"><code>lesson-9</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-10"><code>lesson-10</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-10/docs/lesson-10.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/using-plugins/notifications/notification.md">Notifications</a> · <a href="../core/using-plugins/notifications/in-app.md">In-app messages</a></td></tr>
</tbody>
</table>
</div>
</div>

## Decide when to notify and who receives messages

| Event | Recipient | No notification |
| --- | --- | --- |
| Customer owner changes | New owner | Unchanged owner, unassignment or read-only sharing |
| Quotation confirmed, rejected or returned | Original applicant | Submission for approval or withdrawal |

Automatic confirmation at a discount of 10% or less also sends a result. Keep messages in short English without customer names, amounts or approval comments. Opening a retained notification must check current business access.

## Prepare in-app notifications

This lesson uses [in-app notifications](../core/using-plugins/notifications/in-app.md), without external accounts or credentials. Have the Agent configure `inbox` as an `in-app` channel and provide an inbox, following the installed version's guidance. The [notification service](../core/using-plugins/notifications/notification.md) handles delivery, results, and retries.

Other channels need separate configuration. See [email and group bots](../core/using-plugins/notifications/providers.md) and [Web Push](../core/using-plugins/notifications/web-push.md). This example has not verified them. Keep credentials out of prompts and screenshots.

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

Create these exercise records now; they are not seeded by the project. Preserve the previously confirmed **Phase one implementation** quotation instead of submitting it again.

1. Morgan creates **Harbor Services**, initially keeping ownership, then changes its owner to Alex. Alex should receive **Customer assigned to you** in **Inbox**. Saving the same owner again adds no message.
2. Alex creates the **Customer service rollout** opportunity under that customer, then a draft **Service rollout proposal** quotation. Select the existing **CRM implementation** product from Lesson 8: quantity `2`, unit price `12000`, discount `15%`, total `20400.00 USD`.
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

[Owner changes](https://github.com/nocobase/doc-demo-crm/blob/lesson-10/server/routes/crm-access.ts) and [quote decisions](https://github.com/nocobase/doc-demo-crm/blob/lesson-10/server/lifecycles/quote-approval.ts) save pending records. The [CRM notification service](https://github.com/nocobase/doc-demo-crm/blob/lesson-10/server/providers/crm-notifications.ts) submits them without resending submitted records.

![Actual notification delivery records](/assets/guides/crm-notification-logs.png)

Use separate accounts to check:

- Only intended recipients receive messages; read and unread states can change.
- Marking a message read leaves approval tasks open.
- After customer transfer, the former owner cannot read business content through old notifications or previously opened pages.
- Events match their delivery records in settings, and template previews add no messages.

The Agent should automatically check duplicate requests, unauthorized access, failed saves, and temporary notification failures. Retrying after service acceptance but before the business record updates should still deliver only once. Review its report for actual results and any incomplete checks.

The management page only displays delivery results. For a terminal delivery failure, fix its cause and use the notification service’s authorized retry action. External channels and deployments with multiple app instances need checks in those environments.

**Done when**: Assignment and quotation-result notifications reach the intended inbox, and business events can be matched to delivery records. Repeated requests do not add messages, old notifications cannot bypass current customer access, marking a message read does not close its approval task, and recovery after a temporary failure has been checked.
