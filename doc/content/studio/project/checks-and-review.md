---
title: Checks and review
description: Before a person accepts the work, the code has to pass the repository's CI checks and then a review by a model from another vendor. The project lead decides which checks are required and when check results wake the coordinator agent.
---

You don't have to review the agents' changes line by line. Before the work reaches you for acceptance, Studio puts it through two gates: the repository's CI checks and a code review by another model. Only when it passes both does the issue move to **In review**.

## Checks

Checks run in the repository's own CI, such as GitHub Actions or GitLab CI: linting, type checks, tests, builds, and so on. Studio reads each PR's check results and shows them in the issue's **Code and deployments** section.

- **A check fails or a conflict appears**: Studio wakes the coordinator agent to arrange a fix. A common first step is to have an agent read the failure log and work out whether the change caused it or it was a fluke.
- **Checks still fail after three commits in a row**: Studio stops waking agents for it and notifies the issue owner.
- **All required checks pass**: Studio wakes the coordinator agent to arrange the review or the delivery.

If the project has no CI yet, PRs have no check results. Before delivering, the coordinator agent asks the issue owner whether to accept without CI. You can also say so in the issue description up front. To set up CI, see [Connect CI](../setup/ci.md).

### Required and reference checks

In **Project settings › Branch rules**, you can make some checks reference checks by entering one check name per line:

- **Reference checks**: a failure is only shown as a note. It doesn't wake agents or block merging in Studio. Use them for flaky or advisory checks, such as performance benchmarks.
- **Required checks**: every other check. A failure wakes the coordinator agent and blocks a normal merge in Studio.

Checks and reviews the code host itself requires, such as GitHub's branch protection rules, still apply. If the code host won't allow a merge, you can't merge in Studio either.

### When the coordinator agent wakes up

**Project settings › Branch rules** has three switches:

| Switch | When it's on |
| --- | --- |
| Wake when checks fail | A required check fails, and the coordinator agent arranges a fix |
| Wake when all checks pass | All required checks pass, and the coordinator agent moves on to the review or the delivery |
| Wake when the PR has a conflict | The PR conflicts with the target branch, and the coordinator agent arranges a fix |

Usually leave them on. With a switch off, a person has to comment on the issue in that situation before the coordinator agent carries on.

## Review

Once the checks pass, the coordinator agent gives the code to another agent to review:

- Preferably an agent from another vendor, for example Codex reviews code that Claude wrote. If none is online, a different model from the same vendor reviews it. The model that wrote the code never reviews its own work.
- The review follows the built-in `studio-review` skill: it looks at defects, security, whether the design is simple, and the tests and their CI cost, grades the findings, and says which ones block the merge.
- Review findings go back to the agent that wrote the code, and the fix is reviewed again.
- A review is a read-only step in a separate copy, so it can run alongside other work.

To have reviews follow your team's own standards, edit the `studio-review` skill or attach your team's review skill to the project. See [Skills](skills.md).

## Checks at merge time

When the issue owner clicks **Merge**, Studio checks the PR and its results with the code host once more:

| Situation | Can it be merged |
| --- | --- |
| The PR has conflicts, is a draft, or checks are still running | No. Resolve that first |
| A required check failed, or there are no check results | You can choose **Merge anyway** and give a reason. Studio posts a comment about the forced merge on the PR and records it in the issue's activity |
| The code host's rules don't allow it | No. Do what the code host requires |

Agents can't merge PRs, let alone force a merge.

> [!NOTE] Protect the default branch on your code host
> Studio doesn't protect branches for you. Turn on protection rules for the default branch on GitHub, GitLab, or Gitee, for example requiring checks to pass before merging, so the same gate applies when someone merges directly on the code host.
