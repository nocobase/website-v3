---
title: Run tests and accept results
description: Run tests, inspect evidence, accept delivery, and verify follow-up fixes.
---

Prepare a project repository, an enabled Agent, and an online runtime. Automatic tests also need an active project lead. The execution identity needs project management, task reading, and attachment upload permissions.

## Choose the scope

1. Open **Quality** and select a project.
2. Select **Run test**, then Release, Project, or Custom.
3. For a custom test, select completed tasks or the whole project code. Adjust the dimensions if needed.
4. Confirm and open the new testing task.

Release tests use the current tasks awaiting release. An empty eligible scope does not create a test. Project tests and whole-project custom tests use core scenarios.

Studio freezes the scope and Skill versions when it creates the test. Later settings changes do not alter that test. Start another test to use a new scope or standard.

![Choose the test scope and dimensions](https://static-docs.nocobase.com/studio-en-quality-new-20261111-normal-2x.webp)

## Follow progress and resolve blockers

![Testing tasks and their execution status](https://static-docs.nocobase.com/studio-en-quality-runs-20261111-normal-2x.webp)

Open **Testing issues** to see each test, or open it from **My issues**. The task shows dimension progress, elapsed time, checked items, and missing information.

If a runtime, permission, or test account is missing, provide it and reply on the task. The owner answers business questions. See [Answer questions](../use/answer.md).

Cancel a test when it is no longer needed. Existing records remain, and unfinished dimensions show as cancelled. After execution, [review the report and accept the delivery](runs.md#reports).

<h2 id="reports">Review reports and accept results</h2>

Open a test under **Quality › Testing issues**. Its delivery report uses the normal task acceptance flow.

![Review the delivery report and accept or request changes](https://static-docs.nocobase.com/studio-en-quality-report-20261111-normal-2x.webp)

### Results and evidence

Check the scope, code commit, and selected dimensions first. Open a dimension to read its detailed report and attachments.

The table describes individual scenario and checkpoint outcomes. Dimension summaries also distinguish issues and partial verification; see [Dimension conclusions and individual outcomes](metrics.md#dimension-conclusions-and-individual-outcomes).

| Outcome | Meaning |
| --- | --- |
| Passed | Evidence supports the expected behavior |
| Failed | Observed behavior differs from the expectation; inspect the problem and reproduction evidence |
| Unverified | Missing access, an environment, or another prerequisite prevents a conclusion |
| Not applicable | The scenario is unrelated to this dimension; it counts as neither passed nor failed |

Open the relevant dimension to inspect its evidence. Functional results distinguish automated tests from scenarios exercised by an Agent. Performance results can include page and API measurements. For a permission finding, check which role attempted which action and what happened. If the only evidence is a code review, verify the behavior with the affected role.

Review failure evidence, reasons for unverified items, and linked follow-ups. A screenshot is one form of evidence; it does not replace a clear expectation and observation.

![Inspect dimension findings and test evidence](https://static-docs.nocobase.com/studio-en-quality-dimension-20261111-normal-2x.webp)

### Inspect coverage

Results distinguish automated coverage, Agent-operated checks, and unverified items. Open a scenario to inspect its checkpoints, observations, and evidence.

Reuse an existing automated test when it proves the scenario. Other behavior still needs direct verification. Keep reasons for unverified items and follow up on missing environments or data. Arrange scenario and automated-test updates through development; see [Maintain core scenarios](settings.md#scenarios).

### Accept or request changes

Accept through the task when the scope is complete, evidence can be checked, and findings have a follow-up plan. Request changes if scenarios or evidence are missing.

Use development tasks to submit PRs for test cases or core scenario assets, separately from business fixes. Quality tests record findings and evidence; business fixes belong in [follow-up tasks](runs.md#follow-ups). Accepting a test does not complete those fixes.

<h2 id="follow-ups">Follow up and retest</h2>

**Quality › Follow-ups** collects work created from tests. Each item uses the normal task owner, discussion, and acceptance flow.

![Follow-up tasks linked to their source tests](https://static-docs.nocobase.com/studio-en-quality-follow-ups-20261111-normal-2x.webp)

### Create follow-up tasks

Agents register confirmed defects, business questions, missing test data, code cleanup, performance improvements, and dependency fixes as follow-up work linked to the source test and dimension. Group findings by cause and describe missing test data explicitly.

Development tasks maintain automated tests and core scenarios. Quality tests do not automatically create tasks to add test cases or scenarios. Record scenario gaps under the functional dimension's scenarios-to-update notes and arrange development updates as requirements change.

| Follow-up work | Purpose |
| --- | --- |
| Defect | Fix confirmed functional, permission, or security problems with reproduction evidence |
| Question | Ask a person to decide an unclear business expectation |
| Test data | Supply records, identities, or other data needed for unverified checks |
| Code cleanup | Address new complex functions, unused code, and maintainability findings |
| Performance | Group budget overruns by cause |
| Dependencies | Arrange fixes by vulnerable package |

Open the task and check its expectation, observed behavior, reproduction conditions, and evidence. Assign an owner and priority. Reuse or link an existing open task for the same problem to avoid duplicate fixes.

Business fixes run in follow-up tasks. The testing task records findings and evidence. Answer business questions on the relevant task.

### Fix and retest

1. Complete and accept the fix on its follow-up task.
2. Start a project, release, or custom test that covers the affected scope.
3. Check the new result for the original scenario or task.

Closing a follow-up does not rewrite earlier test results. Historical reports keep the original evidence; later tests show the corrected behavior.
