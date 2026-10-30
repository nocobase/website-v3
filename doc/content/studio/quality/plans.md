---
title: Quality plans
description: Agree on test goals with an Agent, run verification, and read reports for each round.
---

A quality plan brings together a test goal, execution tasks, reports, and follow-up work. Administrators enable the quality navigation with `studio.testing.enabled`; see [Configuration reference](../reference/config.md).

## Create a plan

Open **Quality plans**, choose a project, and select **New quality plan**. Describe the business scope in the Agent conversation, for example:

```prompt
Check supplier scoring and order approval. Verify the scoring weights and that every tier C supplier order needs approval. Summarize any problems you find.
```

The Agent uses existing material and [Acceptance standards](standards.md) to propose a plan. Confirm the goal, scope, deliverables, and execution arrangement before work starts. The execution task determines detailed checkpoints and prepares the test environment; you do not need to list every test case first.

![Choose a project and create a quality plan](https://static-docs.nocobase.com/studio-en-guide-quality-plans-20261031.png)

## Follow execution

Plans execute through regular tasks. Progress and blockers are handled there. Following its skills, the Agent prepares an isolated test environment, records the actual version, runs existing tests, and performs relevant page checks.

| Tab | Content |
| --- | --- |
| Goal | Confirmed business objective, scope, standards, and arrangement |
| Reports | The current round, with access to previous rounds |
| Follow-up work | Defects, unresolved questions, and additional test work across rounds |

Checks that cannot run retain their reason and do not count as passed. Reply on the linked task when a business rule needs your decision.

## Read reports

Reports group checkpoints by function. Review existing automation coverage, tests actually executed this round, checkpoint results, and outstanding work separately.

A successful page check does not prove existing automated coverage. A historical pass does not prove the current round passed. Unexecuted, failed, and unresolved checks stay visible. Continue work through [Quality follow-ups](follow-ups.md).

## Retest and schedule

Start another round in the same plan after repairs. The new round retains the goal and verifies the current version; it does not copy earlier passes. Historical reports retain their original conclusions.

For recurring verification, set a daily or weekly schedule. Disabling it stops future launches without canceling dispatched tasks. Agree on a revised arrangement with the Agent before changing the plan's scope.
