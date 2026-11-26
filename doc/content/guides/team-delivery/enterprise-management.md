---
title: Manage delivery quality
metaDescription: "Walk through a CRM pre-release quality gate in Studio: combine continuous tests, adjust a project standard, check core scenarios, triage findings, and retest to release readiness."
---

When multiple teammates and Agents iterate in parallel, passing individual PR checks does not guarantee that merged changes have no cross-feature access leaks, performance regressions, or broken core flows. Suppose CRM has merged quote revision comparison and customer handover for `v1.1.0` (substitute your own pending features)—this guide walks through a complete pre-release quality gate.

Before starting, confirm you have **Studio Enterprise Edition (EE)**, a connected project with pending tasks, an active project lead, an available Agent and online runtime, and separate role accounts in CRM test data (such as manager Morgan and salespeople Alex and Taylor). See [Quality overview](../../studio/quality/overview.md) for feature details and permissions.

## Plan continuous tests and project standards for CRM

Automatic tests are off by default on new projects. Split fast daily checks from deeper pre-release checks around your team's delivery rhythm.

### Combine three test types around your delivery cadence

Open **Development › Quality** in the **left navigation** (not inside the project's top tabs), select the CRM project, switch to **Settings**, configure the three test types below, and save (see [Quality settings](../../studio/quality/settings.md)):

| Test type | Recommended trigger for CRM | Dimensions | Role |
| --- | --- | --- | --- |
| Daily | Scheduled daily once at least 3 completed tasks accumulate | Functional, Permissions, Code quality | Catch daily regressions, access leaks, and code degradation fast |
| Release | Run manually before release (or trigger as pending tasks accumulate) | All five dimensions | Add Security and Performance verification for pending commits |
| Project | Scheduled weekly | Functional, Permissions | Run full core-scenario regression and refresh outdated scenarios |

![Configure triggers, per-test-type dimensions, and bound Skills under Quality › Settings (shown with a sample project; actual project names and data reflect your CRM).](https://static-docs.nocobase.com/studio-en-quality-settings-20261111-normal-2x.webp)

Scheduled tests run as the **project lead**—confirm an active lead is assigned before turning on schedules.

### Adjust a default standard to fit CRM

Default metrics and thresholds live in [Quality standards](../../studio/quality/standards.md). For a legitimate business exception (such as raising the quote-comparison endpoint P95 budget to 800 ms while keeping ≤ 20 SQL queries per request), check the Skill bound to Performance in **Quality › Settings**, edit `budgets.json` under **Agent management › Skills**, and save a new version (applies to subsequent tests only; see [Adjust project standards](../../studio/quality/settings.md#adjust-project-standards)).

## Check CRM core scenario coverage

Inspect **Quality › Core scenarios** by module. Studio maintains these scenarios automatically in `.nb-studio/scenarios/` during tasks and Project tests, so you do not maintain them by hand (see [Core scenarios](../../studio/quality/settings.md#scenarios)).

Before releasing, verify key business red lines are covered:

- After customer handover, the former owner immediately loses access to the customer and its contacts, opportunities, and quotes.
- Only an explicit read-only share from a manager grants read-only access to the former owner.
- Updating catalog prices leaves submitted historical quote prices and totals unchanged, while new drafts use the latest price.

If a rule is missing, ask an Agent in a task to add it and merge the PR:

```prompt
Please check our CRM core scenarios and add the rule that after customer handover, the former owner loses access to related quotes unless a manager grants read-only sharing. Submit the scenario update for review with the code.
```

**Step check**: Key business red lines appear in Core scenarios and are versioned with the code.

## Run a release test before shipping

In **Development › Quality**, select the CRM project and click **Run test › Release**. This creates a testing task where you can track live progress per dimension under **Quality › Testing issues** until it enters **In review** (see [Run tests](../../studio/quality/runs.md)).

Keep two points in mind while it runs:

- **Isolated execution**: Each dimension provisions its own environment and test data on a runtime without modifying product code or affecting active systems.
- **Unblock cleanly**: If a check pauses for missing role logins or an unclear rule, supply the accounts and [answer the question](../../studio/use/answer.md) on the testing task—never give a test salesperson admin privileges.

## Review the delivery report and triage follow-up tasks

Once the testing task reaches **In review**, open it in **Quality › Testing issues** and inspect the delivery report and each dimension's evidence (see [Test reports](../../studio/quality/reports.md)). Suppose the run surfaces three representative findings:

| Dimension | Conclusion | Example finding | Registered follow-up |
| --- | --- | --- | --- |
| Permissions | Issues found | After Alex hands over a customer, it vanishes from the list, but calling the quote comparison API directly still returns quote data (read violation > 0) | Defect |
| Performance | Issues found | Quote comparison with multiple line items triggers N+1 queries, exceeding the per-request SQL limit | Performance |
| Functional | Partially unverified | Missing repriced historical quote data leaves the snapshot scenario unverified; read-only share access to quote comparison is unspecified | Test data, Question |

![The quality overview summarizes dimension outcomes, pending acceptance prompts, and follow-up links (shown with a sample project).](https://static-docs.nocobase.com/studio-en-quality-sample-20261111-normal-2x.webp)

### Separate accepting the test from fixing the findings

If the test scope is complete, evidence is reproducible, and findings link to follow-ups, click **Accept** on the testing task; if scenarios or evidence are missing, click **Send back**.

> [!NOTE]
> **Accepting a testing task means accepting its conclusions**, not that follow-ups are fixed or ready to ship; **Partially unverified is not passed**.

### Triage follow-up tasks by release impact

Open **Quality › Follow-ups** (see [Follow-up tasks](../../studio/quality/reports.md#follow-ups)). New follow-ups start in **Backlog**—assign an owner and click **Start** so the Lead Agent schedules development and review:

1. **Release blockers (Defect)**: The read violation breaches an access boundary. Assign a developer and click **Start**; do not ship until merged.
2. **Rule decisions and test data (Question, Test data)**: Assign **Question** to business owner Morgan to confirm the rule, and start **Test data** to seed historical repriced quotes:

```prompt
When a former owner is given read-only sharing, they should be able to view the customer's quote revision comparison, but not create new drafts, edit line items, or modify any records. Please update the permission checks and core scenarios accordingly.
```

3. **Prioritized improvements (Performance)**: Fix the high-frequency N+1 query for `v1.1.0`; defer low-impact code cleanup to a later iteration rather than blocking every release.

![Filter items by type, dimension, and status under Quality › Follow-ups and trace their source tests and hit counts (shown with a sample project).](https://static-docs.nocobase.com/studio-en-quality-follow-ups-20261111-normal-2x.webp)

## Retest after fixes and confirm release readiness

**Closing follow-up tasks does not rewrite historical test reports**—verify fixes with fresh tests:

1. **Targeted check**: Right after a blocker merges, run **Run test › Custom** in **Development › Quality** selecting only the affected Permissions or Performance dimension.
2. **Full pre-release confirmation**: Once all blockers and test data updates merge, run a fresh **Release** test and confirm those items report **Passed**.

![Use a Custom test to pick the scope and only the affected dimensions for fast verification of an individual fix.](https://static-docs.nocobase.com/studio-en-quality-new-20261111-normal-2x.webp)

Finally, compare the **Release** trend in **Quality › Metrics** (see [Metrics and trends](../../studio/quality/reports.md#metrics)) to confirm access violations are `0`, performance is within budget, and unverified items are cleared.

**Done when**: CRM has continuous tests and aligned standards, core scenarios cover key red lines, and pre-release findings are resolved and confirmed in a passing test report.

## Summary and next steps

Your CRM project now has layered continuous tests, business-aligned quality standards, and verified core scenarios, with all pre-release blockers and unverified blind spots cleared in a fresh passing test run.

With the release test passing, continue to [Release to production](release.md) to deploy the verified candidate commit to staging and ship `v1.1.0` to production.
