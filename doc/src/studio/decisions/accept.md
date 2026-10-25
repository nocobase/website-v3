---
title: Acceptance
description: After an issue is delivered, its owner confirms the result. Read the delivery report, look at the changes, merge if it passes, and send it back for changes if it does not.
---

## When acceptance is needed

The coordinator agent moves an issue to **In review** and hands it to you only after its PR has passed checks and review. At that point:

- The issue appears under **Waiting for you** in **My issues**, marked **Needs your acceptance**.
- The **Needs you** card at the top of the issue page says what you need to confirm.
- Below it is the delivery report submitted by the coordinator agent.

Only a person can complete acceptance. Neither the coordinator agent nor an executing agent can mark an issue Done or merge a PR.

## Read the delivery report

The delivery report is the main basis for acceptance. It usually includes:

| Part | Contents |
| --- | --- |
| Before the change | What things were like before and where the problem was. |
| Agreed approach | What approach this work follows and where its scope ends. |
| What changed | The changes, listed in business language. |
| How it was verified | Which tests the agent ran and in what environment it checked. |
| Acceptance criteria | Check points you can compare against one by one. |

Next to the report are the screenshots attached to the agent's comments. Select one to enlarge it and move left or right.

::figure req-accept | An issue in review: the action buttons are on the Needs you card, with the delivery report below

The acceptance criteria are for comparing against; you do not need to tick them off one by one. You judge the result as a whole: pass it or send it back.

## Look at the changes

- Select **View changes** to open the PR on the code host.
- The **Code & deploys** tab lists every PR linked to the issue, each PR's check results, and any conflicts.

You can accept without reading code: focus on whether the acceptance criteria and screenshots in the delivery report meet your needs. If you have questions, comment on the issue, or use **Ask agent**.

> [!PENDING] Accept in a preview
> Generating a preview environment you can actually use for every PR belongs to the release and deployment module. This will be added once the module is complete.

## Pass

**An issue with a PR**: select **Merge**. The confirmation dialog first checks the PR and its checks with the code host, and states:

- The title and method of the merge commit (squash merge on GitHub; on GitLab it follows the project's settings).
- What status the issue moves to after the merge.

::figure merge-dialog | Confirmation before merging

After you confirm, Studio merges the version you confirmed. If the PR gets new commits in the meantime, you are asked to confirm again. Once all the PRs linked to the issue are merged, the issue becomes **Done** automatically.

**An issue without a PR** (for example research or documentation cleanup): select **Accept**, and the issue becomes **Done**.

> [!NOTE] Whose identity the merge uses
> If you connected your own account under **Account settings › Git**, the merge uses your identity. Otherwise it uses the workspace's Git connection.

## When checks do not pass

In these cases **Merge** is unavailable and you need to resolve the problem first: the PR has conflicts, checks are still running, the PR is still a draft, or the code host's own rules do not allow the merge.

When a required check fails or has no result, someone with the right permission, such as the project owner, can choose **Merge anyway** and give a reason. The forced merge is recorded in the issue activity and written to the PR as a comment. An agent can never force a merge.

## Send back for changes

When the result is not what you expected:

1. Select **Send back for changes**.
2. Say what needs to change. The more specific, the better, for example "After merging, keep the earliest creation time. It currently keeps the latest."
3. Select **Send and return to In progress**.

The issue goes back to **In progress**. The coordinator agent arranges the changes based on your feedback and hands it back to you for acceptance when they are done.

## Already merged on the code host

If someone merges the PR directly on GitHub or GitLab, Studio notices through a webhook or polling, and the issue is completed automatically in the same way. If you really need to, you can also select **Mark as merged** in Studio to record it as merged.
