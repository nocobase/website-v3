---
title: "Scheduled tasks and due reminders"
metaDescription: Schedule CRM customer follow-up plans and confirmed quotation response deadlines, then notify current owners through in-app notifications when due.
---

Schedule customer follow-ups and response deadlines for confirmed quotations in the CRM app, then run a scheduled task to notify the current owner when they become due.

When trying the complete example, prepare separate administrator, salespeople Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)) and a working in-app notification channel (see [Business events and in-app notifications](notifications.md)).

**Modules covered**

- [Scheduler](../../core/using-plugins/automation/scheduler.md)
- [Notifications](../../core/using-plugins/notifications/notification.md)
- [In-app messages](../../core/using-plugins/notifications/in-app.md)

## Define follow-up times, quotation deadlines and reminder rules

A plan has a title, due time and type. Enter time in the browser's local timezone; the application stores UTC. A quotation response deadline is an internal follow-up plan. It neither changes an issued document nor expires a quotation.

| State when checked | Result |
| --- | --- |
| Due, not yet notified, with an active customer and owner | Notify the current owner once |
| Not due, completed, cancelled or already notified | Do not notify |
| Customer inactive, owner missing or disabled | Defer and check again after recovery |
| Quotation's opportunity won or lost | Do not send a quotation reminder |

Shared readers can view plans but cannot create, complete or cancel them. Cancel and create another plan to change the time. Reading a message does not complete follow-up, and completing or cancelling a plan does not recall an already queued notification.

## Connect scheduling to existing notifications

[Core Scheduler](../../core/using-plugins/automation/scheduler.md) supplies definitions, occurrence history and pause/resume operations. [Notification](../../core/using-plugins/notifications/notification.md) handles delivery through the in-app notification channel (see [Business events and in-app notifications](notifications.md)). No external mailbox is required.

### Develop with an Agent

Give your development Agent the first section's rule table and access restrictions together with this prompt:

```prompt
Add customer follow-up plans and response deadlines for confirmed quotations. Implement the reminder rules and access restrictions above, using my local timezone for input. Reminders must not change issued files or quotation validity.

Check every minute and notify the current owner once, without duplicates after retries or restarts. Let me schedule, receive, complete and cancel reminders, and inspect, pause and resume the task in system settings. Reuse existing in-app notifications and preserve existing data.
```

### Understand the implementation

In the complete example, the [reminder provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-reminders.ts) uses `registerTarget` to register `crm.reminder-scan`, whose execution calls the business method `scan()`. It then binds that target to a minute schedule:

```ts
scheduler.defineSchedule({
  key: 'crm.reminders',
  title: 'Customer follow-up reminders',
  description: 'Check due plans and queue notifications; delivery has separate logs.',
  schedule: { cron: '* * * * *', timezone: 'UTC' },
  target: { type: 'crm.reminder-scan', config: {} },
});
```

Core Scheduler supplies triggers, occurrence history and pause/resume; see [Jobs](../../core/framework/background/jobs.md) for execution. CRM's `scan()` checks due times, customers and current owners, saving reminder state and an event in one transaction. The [CRM notification logic](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-notifications.ts) handles retries and passes delivery to Core Notification. Schedule success and notification delivery are separate outcomes.

### Try it

1. Alex opens an owned customer → **Reminders**, enters **Call Casey about the implementation proposal**, selects **Customer follow-up** and chooses a time a few minutes ahead.
2. To test quotation reminders, select **Quotation response deadline** and an existing confirmed quotation. If none is available, confirm one first using [Approval workflows and to-do center](approval-workflows.md).
3. Save, wait until the plan is due and the next minute check runs, then open the reminder in **Inbox** and handle the customer plan.

![Customer reminder plans and notification state](/assets/guides/crm-reminders.png)

## Inspect executions and reminder outcomes

Administrators open **System settings → Scheduled reminders** to see timezone, next execution and enabled state. Select **Customer follow-up reminders** for occurrence history. Sales and sales managers receive no scheduler management grant by default.

![Actual execution times, statuses and counts](/assets/guides/crm-reminder-schedules.png)

Checked counts due plans read in that execution; queued counts newly saved reminder events; skipped counts plans that did not qualify. **Succeeded** means the check completed. **Notification queued** on a plan means its event was saved. Inspect **Notifications** for actual delivery.

Pausing does not cancel an execution already running. After resuming, the next check handles overdue pending plans. After following up, click **Complete** and refresh to confirm **Completed** persists. Marking the inbox message read is a separate action.

## Verify due checks, duplicate execution and recovery

Check these items in the UI:

| Action | Expected result |
| --- | --- |
| Complete or cancel before the due time | No later reminder |
| Transfer the customer before the due time | The new owner receives the reminder |
| Pause, let the plan become overdue, then resume | The next check catches it without duplicates |
| Mark the notification read and reopen the plan | The plan still requires completion |

The Agent should automatically check time boundaries, repeated scans, delivery recovery, disabled accounts, closed opportunities, and migration rollback in isolated databases, and report the actual results. You do not need to change your data or disrupt the notification service.

These checks use one application process. Multiple instances require shared Jobs and concurrency locks plus their own runtime verification. No checks execute while every application process is stopped; the next check after restart revisits pending plans.

**Done when**: Due plans notify the current owner once, while completed or canceled plans produce no new reminders. Pause and resume, repeated execution, and recovery checks pass. Execution records and actual delivery outcomes are available, and a completed follow-up still shows Completed after reloading.

To connect personal mailboxes, view customer correspondence, and send formal quotations by email, continue to [Email integration and messaging](email.md).
