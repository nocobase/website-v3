---
title: Quality overview
description: Test each project against built-in quality standards, generate reports automatically, and turn findings into follow-up tasks.
---

Quality management is available in Studio Enterprise Edition (EE). It tests a project against an explicit set of quality standards: Agents run established testing tools, Studio generates the test reports, and findings become follow-up tasks that later tests verify. [Contact us for Enterprise Edition](https://www.nocobase.com/contact/).

Open a project’s **Quality** tab to see its testing tasks, core scenarios, follow-ups, and metrics. Select **Run test** to start a test if you have permission. To switch between projects, open **Quality** in the sidebar.

![Quality testing workflow](https://static-docs.nocobase.com/studio-quality-flow-en-20261126-f4287fc2ea.svg)

## Key capabilities

### Built-in quality standards that each project can customize

Functionality, permissions, security, performance, and code quality each have a set of metrics and pass criteria, such as “unauthorized reads = 0”, “initial JS ≤ 2 MB”, and “new circular dependencies = 0”. A passing test means the tested version meets these standards.

**Projects can define their own standards**: replace the Skill a dimension uses, or add dimensions. See [Quality standards](standards.md) for the full list.

### Measured by established testing tools

Test results come from running testing tools, not from an Agent estimating by reading code. Vitest and Playwright run automated tests, pnpm audit and gitleaks check dependency vulnerabilities and leaked secrets, OWASP ZAP scans for security issues, Lighthouse measures page performance, and jscpd, knip, and dependency-cruiser check code quality. The server then compares the results with the standards to decide whether they pass.

Each dimension prepares its own test environment and test data on a Runner. Dimensions run in parallel and do not touch the systems your team is using.

### Test reports generated automatically

The server parses JUnit, SARIF, dependency audits, Lighthouse, and other raw results, calculates metrics, and applies the standards. Each dimension has a report, combined into one delivery report, with evidence for every failed and unverified item. Every conclusion is based on measured data. Checks that could not run, for example because of the environment, are marked unverified and flagged for attention.

### Findings become follow-up tasks

Findings are grouped by cause and registered as defects, questions, test data, code cleanup, performance, or dependency tasks. They follow the normal development, review, and acceptance workflow. After a fix is merged, a later test confirms the problem is gone.

![Example project: results for functionality, permissions, security, performance, and code quality](https://static-docs.nocobase.com/studio-en-quality-sample-20261111-normal-2x.webp)

## Test types

| Type | What it tests | Trigger |
| --- | --- | --- |
| Daily | Recently completed business tasks not yet tested | On a daily schedule, once the set number of tasks has accumulated |
| Release | Tasks currently awaiting release | Manually, or when pending tasks reach the set number |
| Project | Core scenarios across the project | Manually, weekly, or monthly |
| Custom | Selected completed tasks, or the whole project code | Manually |

Each test creates a testing task. You accept its results through the task's delivery report.

## Dimensions

| Dimension | What it checks | Main tools |
| --- | --- | --- |
| Functional | Whether business tasks and core scenarios behave as expected | Vitest, Playwright, browser |
| Permissions | Anonymous access, unauthorized reads and writes | Permission engine |
| Security | Dependency vulnerabilities, leaked secrets, code security issues, endpoint scan alerts | pnpm audit, gitleaks, OWASP ZAP |
| Performance | Page loads, API responses, database queries | Lighthouse, autocannon, PostgreSQL |
| Code quality | Duplication, cognitive complexity, unused code, circular dependencies | jscpd, eslint-plugin-sonarjs, knip, dependency-cruiser |

## Core scenarios

Core scenarios organize the project's features, module by module, into business scenarios. Each scenario states the goal a user wants to reach and the result they finally see, such as “Suspended suppliers cannot receive new orders.”

- **Split by one standard**: Each scenario covers exactly one user goal and one final result. Studio organizes scenarios by a built-in splitting standard and granularity, so the granularity stays consistent.
- **The project's feature blueprint**: Project tests are built around core scenarios and verify the whole project one scenario at a time. Team members can also see here which features the project has.
- **No manual maintenance**: Scenarios keep up with tasks and tests. Development tasks update the related scenarios when they change a feature, and project tests add missing scenarios and update outdated ones. See [Core scenarios](settings.md#scenarios).

## Get started

1. [Quality settings](settings.md): set triggers and dimensions. New projects have no automatic triggers.
2. [Run tests](runs.md): choose a scope, start a test, and follow its progress.
3. [Read test reports](reports.md): check results and evidence, accept the delivery, and handle follow-ups.
4. [Quality standards](standards.md): look up each dimension's metrics and pass criteria.
