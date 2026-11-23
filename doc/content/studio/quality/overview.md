---
title: Quality overview
description: Test each project against built-in quality standards, generate reports automatically, and turn findings into follow-up tasks.
---

Quality management is available in Studio Enterprise Edition (EE). It tests a project against an explicit set of quality standards: Agents run established testing tools, Studio generates the test reports, and findings become follow-up tasks that later tests verify. [Contact us for Enterprise Edition](https://www.nocobase.com/contact/).

![Quality testing workflow](/assets/studio/quality/quality-flow-en.svg)

## Key capabilities

### Built-in quality standards that each project can customize

Functionality, permissions, security, performance, and code quality each have a set of metrics and pass criteria, such as “unauthorized reads = 0”, “initial JS ≤ 2 MB”, and “new circular dependencies = 0”. A passing test means the tested version meets these standards.

**Projects can define their own standards**: adjust performance budgets, replace the Skill a dimension uses, or add dimensions. See [Quality standards](standards.md) for the full list.

### Measured by established testing tools

Metrics come from actual tool runs, not from an Agent estimating by reading code. Vitest and Playwright run automated tests, pnpm audit and gitleaks check dependency vulnerabilities and leaked secrets, OWASP ZAP scans for security issues, Lighthouse measures page performance, and jscpd, knip, and dependency-cruiser check code quality.

Each dimension prepares its own test environment and test data on a Runner. Dimensions run in parallel and do not touch the systems your team is using.

### Test reports generated automatically

The server parses JUnit, SARIF, dependency audits, Lighthouse, and other raw results, calculates metrics, and applies the standards. Each dimension has a report, combined into one delivery report, with evidence for every failed and unverified item. When a tool did not finish or data is missing, the result shows as unverified, never as zero problems.

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

Core scenarios describe business behavior the project must keep, such as “Suspended suppliers cannot receive new orders.” Project tests and whole-project custom tests verify them one by one. See [Maintain core scenarios](settings.md#scenarios).

## Quality tests and PR checks

PR checks and code review guard each change. Quality tests keep checking the whole project over time. See [PR checks and code review](../project/checks-and-review.md).

## Get started

1. [Configure quality tests](settings.md): set triggers and dimensions. New projects have no automatic triggers.
2. [Run tests](runs.md): choose a scope, start a test, and follow its progress.
3. [Read test reports](reports.md): check results and evidence, accept the delivery, and handle follow-ups.
4. [Quality standards](standards.md): look up each dimension's metrics and pass criteria.
