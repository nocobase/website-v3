---
title: Review reports and accept results
description: Check scope, dimension results, and evidence before accepting a test.
---

Open a test under **Quality › Testing issues**. Its delivery report uses the normal task acceptance flow.

![Review the delivery report and accept or request changes](https://static-docs.nocobase.com/studio-en-quality-report-20261111-normal-2x.webp)

## Results and evidence

Check the scope, code commit, and selected dimensions first. Open a dimension to read its detailed report and attachments.

| Outcome | Meaning |
| --- | --- |
| Passed | Evidence supports the expected behavior |
| Failed | Observed behavior differs from the expectation; inspect the problem and reproduction evidence |
| Unverified | Missing access, an environment, or another prerequisite prevents a conclusion |
| Not applicable | The scenario is unrelated to this dimension; it counts as neither passed nor failed |

Functional verification distinguishes existing automated tests from Agent-operated checks. Automated results come from submitted test reports. Scenario results explain what was checked. Permissions, performance risks, and code quality may involve code inspection rather than browser testing.

Review failure evidence, reasons for unverified items, and linked follow-ups. A screenshot is one form of evidence; it does not replace a clear expectation and observation.

![Inspect dimension findings and test evidence](https://static-docs.nocobase.com/studio-en-quality-dimension-20261111-normal-2x.webp)

## Accept or request changes

Accept through the task when the scope is complete, evidence can be checked, and findings have a follow-up plan. Request changes if scenarios or evidence are missing.

Tests may create PRs for test cases or core scenario assets. Keep those separate from business fixes, which belong in [follow-up tasks](follow-ups.md). Accepting a test does not complete those fixes.
