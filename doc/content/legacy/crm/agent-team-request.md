---
title: Work with Agents
metaDescription: Take quote revision comparison from discussion through development, business decisions, checks, review, and human acceptance.
lesson: 16
---

Continue with the CRM [connected to Studio](bring-into-studio.md). Salespeople revise quotes during negotiations and need to explain price changes while retaining versions already sent to customers. Ask the Agent team to implement this change.

## Describe quote revision comparison

Open **My sessions** and choose **New conversation**. Select an available Agent and the CRM project below the message box before sending the first message. Start a new conversation to discuss a different project. With a shared team runtime, business colleagues do not need a coding tool installed locally.

![Choose an Agent and the CRM project when starting a conversation.](/assets/guides/studio/new-session.png)

```prompt
Customers often ask us to revise quotes. I want to compare versions of the same CRM quote and see changes to products, quantities, unit prices, discounts, and totals, plus who changed it and when. Keep versions already sent to customers so later edits cannot overwrite them. Discuss the rules with me first, then turn the agreed requirement into an issue.
```

Agree on when a version is saved, which versions can be compared, and who can read them. For this exercise, submitted revisions are immutable; further changes create a new draft. Comparison follows the customer's existing access scope. A user without access to that customer must not read its quote history. Save these rules and acceptance scenarios in the issue description.

**Step check**: The CRM project has a quote revision comparison issue with an owner and explicit retention and access rules.

## Start work and follow progress

After reviewing the issue, click **Start**. The coordinating Agent arranges design, implementation, testing, and review. The issue moves from **Backlog** to **In progress**. Read **Now** and the next action at the top, use **Activity** for handoffs, and open **Runs** for execution details.

![The project board groups issues by their current status.](/assets/guides/studio/issues-board.png)

Add requirements in issue comments. Private conversation conclusions are not automatically shared project documentation: check that important decisions are written back to the issue. See [Follow progress](../../studio/use/follow-progress.md).

## Answer business questions

The Agent may ask how to handle existing quotes that have no revision history. When a decision is needed, the issue may become **Blocked**. Its owner can open **Needs you** from **My issues** and reply:

```prompt
Keep each existing quote's identifier, lines, and amount as its first viewable version. Do not invent earlier edits. Record new revisions from this release onward, and do not allow submitted versions to be edited.
```

Check that the decision is recorded and work resumes. Runtime or check failures can also block an issue; resolve the actual cause rather than merely changing its status. See [Answer questions](../../studio/use/answer.md).

## Check results and review

Open **Code & previews** to inspect the PR commit, checks, and preview. The coordinating Agent arranges independent review according to project Skills and returns required fixes to the implementer. The configured check source may be CI or Agent self-check. See [Checks and review](../../studio/project/checks-and-review.md).

![Code & previews lists a CRM issue’s PR, check source, and individual results.](/assets/guides/studio/issue-checks.png)

Read the delivery report for evidence covering existing-quote migration, amount calculations, immutable revisions, and access boundaries. Passing tests do not replace business acceptance.

## Verify existing quotes and merge

When the issue enters **In review**, use separate test accounts in the preview:

| Action | Expected result |
| --- | --- |
| Open a quote created before the upgrade | Its identifier, customer relationship, lines, and amount remain unchanged; its initial version is available |
| Submit a version, then change quantities or discounts | A new draft is created; the submitted version remains unchanged |
| Compare two versions | Product additions and removals, quantities, prices, discounts, totals, editor, and time can be checked |
| Change a product's catalog price | Saved quote versions do not change |
| Open quote history or call its API as a salesperson without customer access | The history cannot be read |

![The demo's completed quote revision issue retains its business context, delivery report, and verification records.](/assets/guides/studio/quote-task.png)

Click **Merge** in **Needs you**, check the target branch and commit, then confirm. If the result is wrong, choose **Send back** and describe the action, actual result, and expected behavior. The issue completes after its linked PRs merge. Git permissions and branch protection still apply; see [Accept work](../../studio/use/accept.md).

**Done when**: Quote revision comparison is accepted and merged, and existing customers and quotes remain usable.

Next, [let the sales manager participate in customer handover](../../guides/team-delivery/business-colleagues.md).
