---
title: "Approval workflows and to-do center"
metaDescription: Add discount approvals to CRM quotations, review them in the task center, and verify snapshots, state changes and customer access.
---

Add an approval confirmation workflow to business records. This guide uses CRM quotations: standard discounts confirm immediately, while discounts above a threshold route to a selected sales manager's to-do center and lock once approved.

Prepare separate administrator, salesperson Alex, sales manager Morgan, and second salesperson accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)). Test sales operations without administrator privileges. The example uses English and USD.

> [!NOTE]
> Back up the database before applying migrations that add quote lock fields; schema changes cannot be undone automatically and rollback requires a matching backup.

**Modules covered**

- [Workflows](../../core/developing-apps/business-workflows.md)
- [Approval (commercial plugin)](../../core/using-plugins/collaboration/approval.md)
- [Task Center (commercial plugin)](../../core/using-plugins/collaboration/task-center.md)

## Define quotation states and approval rules

The threshold applies to **each line’s discount**, not the average discount.

| State or action | Result |
| --- | --- |
| Submit with every discount ≤ 10% | Confirm immediately, without a manager task |
| Submit with any discount > 10% | Select an active sales manager; applicants cannot review their own requests |
| Under review | Freeze products, unit prices, discounts and totals; prevent editing |
| Approve | Confirm the quotation and keep it locked for generating formal documents |
| Return with a reason | Let the applicant edit and resubmit, retaining earlier decisions |
| Reject with a reason | End this quotation; create another for a new proposal |
| Withdraw | Cancel the current task and return to Draft |

Administrators can change the threshold for future quotations. A quotation keeps the configuration version selected on its first submission, including returns and resubmissions.

## Prepare the approval plugin and build the feature

This guide uses the commercial [Approval plugin](../../core/using-plugins/collaboration/approval.md) (`@nocobase/app-plugin-approval`). Obtain usage authorization and package access, then sign in to the NocoBase package registry in **the environment where the Agent runs**. This is separate from app sign-in. Follow [authorization and registry sign-in](../../core/developing-apps/manage-plugins.md#commercial-plugin-authorization-and-registry-sign-in).

Then give the Agent your request. It installs a compatible plugin, registers it, updates the database, and connects tasks and quotation pages. If downloading fails, check authorization and registry sign-in in that environment.

> [!NOTE]
> The plugin assigns review tasks and records decisions. The application still implements quotation rules and customer access. See [Workflows](../../core/developing-apps/business-workflows.md), the complete example's [quotation state rules](https://github.com/nocobase/doc-demo-crm/blob/main/server/lifecycles/quote-approval.ts), and [approval integration](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/quote-approvals.ts).

Send this request to your development Agent from the application root:

```prompt
Add quotation approvals to the CRM, keeping customer access and read-only sharing rules.

For submission and review:
- Any line discount over 10% requires a selected, eligible sales manager. Applicants cannot review their own quotes. Block submission if no eligible manager is available. Confirm directly when every discount is 10% or less.
- Managers open My tasks to inspect submitted products, prices, discounts, and totals. They can approve, reject, or return for revision. Rejection and return require a reason.
- Lock quotes during review and after confirmation. Returned quotes can be edited and resubmitted, preserving history. Withdrawal cancels the task and returns to Draft. Rejection ends the quote; a new proposal needs a new quote.

When people or rules change:
- A manager who loses eligibility cannot continue. The applicant or another authorized manager can withdraw.
- After a customer transfer, the former owner loses access. The new owner creates a new quote instead of resubmitting for the original applicant.
- Administrators can change the threshold for new quotes. Submitted quotes keep their original threshold, including after return and resubmission.

Show the process and its history in System settings. Run the app so I can try it.
```

Check **System settings → Workflow management** for the quotation diagram, execution history and working threshold configuration. The sales-manager role does not grant workflow configuration access; administrators manage it. Do not simulate approval by changing database state directly.

## Review quotations in the task center

Prepare an exercise quotation and walk through the approval flow:

1. Alex creates **Northstar Manufacturing** and its **Regional CRM rollout** opportunity.
2. Morgan adds **CRM implementation** to the catalog at `12000`.
3. Alex creates **Phase one implementation** with that product, quantity `2`, and discount `15%`. The saved total is `20400.00`.
4. Alex opens the quotation, chooses **Submit quotation**, selects Morgan and submits. The state becomes **Manager review**, and editing is unavailable.
5. Morgan opens **My tasks** and sees one quotation task. Select **Open quotation**, check the line and total, then choose **Approve** and confirm.
6. The quotation becomes **Confirmed**. Return to the task center: the pending count decreases. Alex sees the same result after refreshing the quotation.

![A manager’s task center lists the quotation awaiting review.](/assets/guides/quote-approval-tasks.png)

![Open the quotation from its task to check the amount and approve, reject or return it.](/assets/guides/quote-approval-review.png)

To practice revision, create another quotation at 15%, submit it and have Morgan select **Return for revision** with a reason. Alex changes the discount to `12%` and resubmits. The total becomes `21120.00`, a new task appears, and the earlier return remains in the history.

## Check approval results and task updates

Use separate accounts to try submission, return, rejection, and withdrawal. Have the Agent test API requests, duplicate submissions, and saved amounts automatically.

Have the Agent test reviewer-role revocation and customer transfer with isolated accounts and records. Use additional quotations for return, rejection, and withdrawal checks.

| Check | Expected result |
| --- | --- |
| Exactly 10% discount | Direct confirmation, no task; the example total is `21600.00` |
| Edit during review, including a direct API request | Server rejects the write; quotation and approval amounts stay unchanged |
| Repeat the same submission request | No duplicate request or task |
| Return, edit and resubmit | New task uses the revised quote; earlier history remains |
| Reject or withdraw | Current task ends; rejection is final, withdrawal returns to Draft |
| Applicant self-review, unrelated salesperson decision or shared read-only write | Rejected |
| Remove the manager’s role | Further decisions are refused; the applicant or another authorized manager can withdraw |
| Transfer the customer | Former owner loses access; history remains, and the new owner creates a new quotation for a new proposal |

The Agent should automatically check duplicate submissions, unauthorized actions, and locked quotes in a separate database and report the actual results. In the browser, check that tasks and quotes refresh together and failed reads can recover.

**Done when**: Discount thresholds, approval locking, return and resubmission, and access checks follow the rules above, with review tasks and quote states kept in sync.

To generate a formal document from a confirmed quote, see [Template printing and document generation](template-print.md).
