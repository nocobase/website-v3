---
title: Accept the result
description: Once an issue is delivered, its owner confirms the result. Read the delivery report and screenshots, try it in the preview if you need to, and merge if it passes or send it back if it doesn't.
---

Acceptance is the most important decision a person makes. What the agent team hands you is more than a PR. The delivery report says how it was before, what changed, how it was checked, and what's still open, and comes with acceptance criteria and screenshots, plus a preview you can try yourself when CI is connected. Even business experts who don't read code can make the call from it.

## When acceptance comes up

The coordinator agent moves an issue to **In review** and hands it to you only after its PR has passed its checks and review. If the project has no CI yet, it first asks whether you want to accept without CI. Once the issue is in review:

- It appears under **Waiting for you** in **My issues**, labeled **Needs your acceptance**.
- The **Needs you** card at the top of the issue page says what you're asked to confirm.
- Below it is the delivery report the coordinator agent submitted.

Only a person can accept. Neither the coordinator agent nor worker agents can mark an issue done or merge a PR.

## Read the delivery report

The delivery report is the main basis for acceptance. The coordinator agent follows a built-in structure:

| Section | What it says |
| --- | --- |
| How it was before | What things were like and where the problem was |
| Agreed approach | The approach taken this time and where its scope ends |
| What changed | The changes, in business terms |
| How it was checked | Which tests the agents ran, where they checked it, and what the review concluded |
| Open issues | Anything not solved this time or carrying risk, each with a recommendation |
| Details | Technical details such as the PR, commits, and data migrations |
| Acceptance criteria | Checks you can go through, with matching screenshots |

Next to the report are the screenshots the building agent attached. Click one to enlarge it and flip through the rest.

::figure req-accept | An issue in review: the Needs you card holds the buttons, with the delivery report below

The acceptance criteria are there to check against, not to tick off one by one. You make an overall judgment: accept it or send it back.

## Look at the changes

- Click **View changes** to open the PR on the code host.
- The **Code and deployments** tab lists every PR linked to the issue, with each PR's check results and any conflicts.

You can accept without reading the code: focus on whether the acceptance criteria and screenshots in the delivery report meet your needs. If you have questions, comment on the issue or use **Ask agent**.

## Try it in the preview

When the project has CI connected, every PR gets a preview. Open it from the issue page, sign in as the first administrator, and go through the acceptance criteria yourself.

::figure req-preview | The PR's preview, where you can try the change yourself

- Anyone who can edit the issue can see the preview's first administrator username and password on the issue page.
- Previews use sample data, never your company's real data.
- A preview stops and goes to sleep after a while without visitors, and starts again when you open it. Give it a moment.
- When the PR is merged or closed, its preview is deleted automatically.

Projects without CI have no previews. See [Connect CI](../setup/ci.md).

## Accept

**Issues with a PR**: click **Merge**. The confirmation first checks the PR and its check results with the code host, then shows:

- The merge commit's title and the merge method, such as "Squash and merge into main". GitHub and Gitee use squash merges, and GitLab follows the project's setting.
- The status the issue will have after the merge.

::figure merge-dialog | Confirming before the merge

Once you confirm, Studio merges the exact version you confirmed. If the PR gets new commits in the meantime, it asks you to confirm again. When every PR linked to the issue is merged, the issue moves to **Done** on its own.

**Issues without a PR**, such as research or documentation: click **Accept**, and the issue moves to **Done**.

> [!NOTE] Whose name the merge goes under
> If you've connected your own account in **Account settings › Git**, the merge is made as you. Otherwise it uses the workspace's Git connection.

## When checks haven't passed

**Merge** isn't available in these cases, which you need to resolve first: the PR has conflicts, checks are still running, the PR is a draft, or the code host's own rules don't allow the merge.

When a required check failed, or there are no check results (for example when the project has no CI yet), the button in the confirmation reads **Merge anyway**, and you can give a reason. Studio posts a comment about the forced merge on the PR and records it in the issue's activity. The code host's own rules still apply. Agents can never force a merge.

## Send it back

When the result isn't what you expected:

1. Click **Send back for changes**.
2. Say what needs to change, as specifically as you can, for example "After merging, keep the earliest creation time. Right now it keeps the latest."
3. Click **Send and return to In progress**.

The issue goes back to **In progress**, and the coordinator agent arranges the changes based on your feedback, then hands it back to you for acceptance.

## Already merged on the code host

If someone merges the PR directly on GitHub or GitLab, Studio picks it up through a webhook or polling, and the issue completes on its own just the same. When you really need to, you can also click **Mark as merged** in Studio to record it as merged.
