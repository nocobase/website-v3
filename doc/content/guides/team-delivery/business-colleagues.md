---
title: Involve business colleagues
metaDescription: Invite a sales manager to own the customer handover requirement, answer business questions, and accept the result.
---

When business requirements pass through repeated handoffs, rule details get lost and acceptance turns into back-and-forth. Studio lets business owners join the project directly to raise requests, decide rules, and accept results in previews—without writing code or installing a local Agent.

In this walkthrough, sales manager Morgan leads a customer handover request in CRM. Before starting, prepare a Studio project (or use the example project [`nocobase/doc-demo-crm`](https://github.com/nocobase/doc-demo-crm) via [Connect an existing project](open-crm-project.md)), along with member-invitation permission and Morgan's email.

## Invite the sales manager

An administrator opens **Settings › Members** at the **bottom of the left workspace sidebar** (not the project's **Settings** tab), clicks **Invite members**, enters Morgan's email, selects the CRM project, and sends the invite. If Morgan already has a workspace account, add them directly in the CRM project's **Members** tab (see [Invite members](../../studio/setup/invite.md)).

![After joining, inspect project members and the project lead in the CRM project's Members tab.](/assets/guides/studio/members.png)

**Step check**: Morgan can sign in, open the CRM project, and appears in its **Members** list.

## Request customer handover

When rules are still taking shape, discuss them in a session before creating an issue. Morgan opens **My sessions**, clicks **New session**, chooses an available Agent, selects the **CRM project before sending the first message**, and asks:

```prompt
When a salesperson changes jobs, I need to hand their customers to another salesperson. Our CRM can already change the owner, so please extend the existing ownership setup to record the handover reason, operator, and time while letting the new owner keep seeing existing contacts, follow-ups, opportunities, and quotes. Salespeople must not transfer other people's customers to themselves. Discuss the rules with me first, then create an issue.
```

After answering the Agent's follow-up questions, Morgan asks it to create the issue, confirms Morgan is the owner on the issue card, and clicks **Start execution** so the issue moves to **In progress** (for Professional/Enterprise role splits, see [Multi-role workflow](../../studio/use/multi-role-workflow.md)).

![A conversation retains the discussion and shows its related issues and statuses on the right.](/assets/guides/studio/session.png)

**Step check**: The handover issue is **In progress** with Morgan as owner, so questions and acceptance requests go directly to Morgan.

## Decide ownership and access rules

If the Agent needs a business decision during implementation (such as whether the former owner can still read the customer), the issue moves to **Blocked** and appears under Morgan's **My issues › Waiting for you** (if all rules were settled in the session, the issue proceeds without pausing here).

Morgan opens the **Needs you** card at the top of the issue and clicks **Reply**:

![A blocked issue shows the pending decision in the Needs you card at the top, where the owner clicks Reply (shown with a sample project).](https://static-docs.nocobase.com/studio-en-req-blocked-20261111-normal-2x.webp)

```prompt
After handover, the new owner can maintain the customer and related records. The former owner loses access granted by ownership. If they still need to help, the manager must explicitly give them read-only sharing. Keep the original follow-up authors and quote history, and do not allow handover records to be rewritten.
```

Sending the reply returns the issue to **In progress**. This continues the [customer access rules](../core-capabilities/roles-and-permissions.md); before checking loss of access, verify the former owner has no separate sharing grant.

## Accept the handover result

When the issue moves to **In review**, Morgan opens it from **My issues › Waiting for you**, reads the **Handover report**, and opens the PR preview in **Code & previews**. Using three separate CRM test accounts—manager, salesperson Alex, and salesperson Taylor—verify:

1. As manager, transfer a customer owned by Alex (with no extra sharing) to Taylor and enter a reason.
2. As Taylor, maintain the customer and view existing contacts, follow-ups, opportunities, and saved quotes; counts, amounts, and original authors stay unchanged.
3. As Alex, refresh the list, open detail page, and workspace to confirm the customer is no longer readable; also verify in the **Handover report**'s permission tests and review notes that direct API requests are denied.
4. Confirm Alex cannot transfer another salesperson's customer to themselves or edit handover records.
5. As manager, grant Alex read-only sharing; Alex can view the customer but cannot edit it.

If anything fails, Morgan clicks **Send back** with actual versus expected behavior (for example, “Alex can still edit the transferred customer after refreshing its detail page; editing should be denied”). Once everything passes, click **Merge**; merging the PR moves the issue to **Done** (see [Accept work](../../studio/use/accept.md)).

**Done when**: The business owner has accepted and merged the handover with the issue **Done**, access follows ownership, and existing records and handover history stay intact.

## Summary and next steps

The request ran end to end—from proposal and rule decisions to preview acceptance—with the business owner directly in the loop, eliminating translation loss and confirming permission and history boundaries before merge.

Next, continue with [Capture knowledge and experience](capture-knowledge.md) to turn the agreed business rules and checks into project knowledge, skills, and memory.
