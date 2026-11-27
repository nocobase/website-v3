---
title: Test reports
description: Read the delivery report and dimension reports, check evidence, accept the delivery, and follow up on findings.
---

Each test produces a delivery report that summarizes the dimension conclusions, plus a detailed report for each dimension. The server generates the reports from the tools' raw results, and you accept them directly on the testing task.

## Delivery report

Open a test from **Quality › Testing issues** to read its delivery report. Check the scope, tested commit, and dimensions first, then each dimension's conclusion.

![Review the delivery report and accept or request changes](https://static-docs.nocobase.com/studio-en-quality-report-20261111-normal-2x.webp)

Each dimension has one conclusion:

| Conclusion | Meaning |
| --- | --- |
| Passed | Every check has a result, and all meet the standards |
| Issues found | At least one check misses its standard |
| Partially unverified | No problems found, but some checks could not finish for lack of an environment, data, or tool results |
| Unverified | The dimension has no usable results |

No result does not mean no problems. Unverified and not-applicable items never count as passed.

## Dimension reports

Select a dimension to open its detailed report. Tabs show the dimension's results, with the raw files and evidence attached:

| Dimension | Report contents |
| --- | --- |
| Functional | Task results, core scenario results, automated test results, failure cause analysis |
| Permissions | Access violations, evidence, unverified items and reasons, identity coverage, comparison with the last test |
| Security | Dependency vulnerabilities, leaked secrets, code security issues, ZAP passive scan alerts, ZAP active scan alerts |
| Performance | Page performance data, API performance data, items over budget |
| Code quality | Metric values, locations of new issues |

The report also lists the time spent on environment preparation, test data, execution, and other stages.

![Inspect dimension findings and test evidence](https://static-docs.nocobase.com/studio-en-quality-dimension-20261111-normal-2x.webp)

Scenarios and checkpoints have four individual outcomes:

| Outcome | Meaning |
| --- | --- |
| Passed | Evidence supports the expected behavior |
| Failed | Observed behavior differs from the expectation, with a description and reproduction evidence |
| Unverified | A missing environment, account, or other prerequisite prevents a conclusion |
| Not applicable | Unrelated to this dimension; counts as neither passed nor failed |

Functional results distinguish scenarios proven by automated tests from those an Agent exercised directly. Select a scenario to see its checkpoints, observations, and evidence.

For project tests and custom tests covering the whole project, open **Scenarios** in the functional report to see which core scenarios were added, changed, or removed. The first test establishes the inventory.

## Accept or request changes

Accept on the testing task when the scope is complete, the evidence can be checked, and every finding has a follow-up task. If scenarios or evidence are missing, request changes and say what is missing.

Accepting a testing task accepts the test's conclusions. It does not mean the follow-up tasks are fixed.

<h2 id="follow-ups">Follow-up tasks</h2>

Findings are grouped by cause and registered as follow-up tasks linked to their source test and dimension. See them all under **Quality › Follow-ups**. Studio assigns new follow-up tasks to the current owner of the testing task. The owner can start work immediately.

![Follow-up tasks linked to their source tests](https://static-docs.nocobase.com/studio-en-quality-follow-ups-20261111-normal-2x.webp)

| Type | Purpose |
| --- | --- |
| Defect | A confirmed functional failure, unauthorized access, or security problem, with reproduction evidence |
| Question | An unclear business rule; a person decides the expected behavior |
| Test data | Records, identities, or other data needed so unverified checks can run |
| Code cleanup | New complex functions, unused code, circular dependencies, and similar issues |
| Performance | Pages and endpoints over budget, grouped by cause |
| Dependencies | Vulnerability fixes, grouped by package |

When an open task already covers the same problem, Studio reuses it instead of registering a duplicate.

## Fix and retest

1. Complete and accept the fix on its follow-up task.
2. Start a project, release, or custom test that covers the affected scope.
3. Check the new result for the original scenario or task.

Closing a follow-up task does not rewrite earlier results. Historical reports keep their original evidence; later tests show the fixed behavior.

<h2 id="metrics">Metrics and trends</h2>

In **Quality › Metrics**, choose a test type to see how each dimension's metrics change across recent tests. Select a metric to see the related tests, scenarios, or findings.

![Metrics distinguish recorded results from unverified items](https://static-docs.nocobase.com/studio-en-quality-metrics-20261111-normal-2x.webp)
