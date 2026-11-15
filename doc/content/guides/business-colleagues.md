---
title: Involve business colleagues
metaDescription: Invite a sales manager to own the customer handover requirement, answer business questions, and accept the result.
lesson: 17
---

After [quote revision comparison](agent-team-request.md), sales manager Morgan wants customer handovers to retain their reason and history as well as change the owner. Let Morgan request, clarify, and accept the work directly in Studio.

## Invite the sales manager

Someone with member-management permission opens **Settings → Members → Invite members**, enters Morgan's email, and selects the CRM project. Follow [Invite members](../studio/setup/invite.md) to send the invitation or share its link. After joining, Morgan should be able to open the project.

![The CRM project's Members tab lists its members and lead.](/assets/guides/studio/members.png)

Studio project permissions govern participation in development. The sales manager role inside the CRM governs customer access. Configure them separately: joining a Studio project does not grant CRM business permissions. Keep separate CRM test accounts for acceptance.

## Request customer handover

Morgan starts a conversation in **My sessions**, selects the team's Agent and CRM project, and asks:

```prompt
When a salesperson changes jobs, I need to hand their customers to another salesperson. Our CRM can already change the owner, but I also want to record the reason, who made the handover, and when. The new owner must retain access to the customer's contacts, follow-ups, opportunities, and quotes. Salespeople must not transfer other people's customers to themselves. Discuss the rules with me first, then create an issue.
```

Once the rules are agreed, create the issue, make Morgan its owner, and start work. Extend the existing ownership and access controls with handover records; do not introduce a second ownership model.

![A conversation retains the discussion and shows its related issues and statuses on the right.](/assets/guides/studio/session.png)

**Step check**: Morgan owns the handover issue and receives its questions and acceptance requests directly.

## Decide ownership and access rules

The Agent may ask whether the former owner can still read the customer. Morgan replies in the issue:

```prompt
After handover, the new owner can maintain the customer and related records. The former owner loses access granted by ownership. If they still need to help, the manager must explicitly give them read-only sharing. Keep the original follow-up authors and quote history, and do not allow handover records to be rewritten.
```

This continues the [customer access rules](team-permissions.md). Before testing loss of access, confirm that the former owner has no other sharing grant. Otherwise, continued read access does not necessarily indicate a failed handover. Put the final decision in the issue description for implementation and review.

## Accept the handover result

Morgan reads the delivery report and opens the preview. Using separate manager, Alex, and Taylor CRM accounts:

1. As manager, transfer a customer owned by Alex to Taylor, with no extra sharing grants, and enter the reason.
2. As Taylor, maintain the customer and read its existing contacts, follow-ups, opportunities, and saved quote versions. Record counts, amounts, and original authors must remain unchanged.
3. As Alex, refresh the list, an already open detail page, and the workspace. The customer must no longer be readable; direct API requests must also respect access limits.
4. Verify that Alex cannot transfer another salesperson's customer to themselves or edit handover records.
5. As manager, grant Alex read-only sharing. Alex can now read the customer and related records but cannot change them.

For a failure, Morgan sends the issue back with a concrete report, such as “Alex can still edit the transferred customer after refreshing its detail page; editing should be denied.” Repeat the affected checks after redelivery and merge only after acceptance. See [Accept work](../studio/use/accept.md).

**Done when**: The business owner has accepted the handover, access follows ownership, and business records and handover history remain intact.

Next, [capture development methods and project experience](capture-knowledge.md).
