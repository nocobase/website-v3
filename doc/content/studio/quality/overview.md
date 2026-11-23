---
title: Quality overview
description: Test each project, inspect evidence, and track follow-up work.
---

Quality management is available in Studio Enterprise Edition (EE). Use the Quality workspace to maintain core scenarios, run project tests, review reports and metrics, and create follow-up tasks. [Contact us for Enterprise Edition](https://www.nocobase.com/contact/).

![Quality testing workflow](/assets/studio/quality/quality-flow-en.svg)

## Standards, tools, reports, and follow-ups

Quality management connects four activities: define standards, run checks with tools and Agents, produce evidence-based reports, and assign follow-up work.

### Standards: built in and configurable

The five built-in dimensions—functionality, permissions, security, performance, and code quality—define checking methods, metrics, and standards. Methods draw on references such as OWASP ASVS, Sonar way, and RAIL, with budgets chosen for the project. Running these checks does not certify compliance with those standards. Projects can override performance budgets, change a dimension's Skill, or add a dimension. See [Quality metrics and standards](metrics.md).

### Tools: measure results, with Agents coordinating the work

Vitest, Playwright, Lighthouse, OWASP ZAP, and other tools produce raw results. Agents prepare environments and data, invoke tools, analyze findings, and supplement them with business UI checks and design reviews. Quantitative metrics come from actual execution, not estimates based on reading code.

### Reports: turn raw evidence into verifiable conclusions

Each dimension produces a report, followed by a combined delivery report. The server parses JUnit, SARIF, audit JSON, Lighthouse, and other raw results, calculates metrics, and applies the relevant rules. Missing data, incomplete tools, and parsing failures remain unverified; they do not mean zero problems.

### Follow-ups: track work and verify fixes

Findings are grouped by cause into tasks that use the normal development, review, and acceptance workflow. People decide unclear business rules and accept delivery reports. Testing does not change product code. Later tests verify fixes after they are merged.

Open **Development › Quality** and select a project. Review its [settings](settings.md), then [start a test](runs.md). New projects have no automatic triggers.

![Example project: results for functionality, permissions, security, performance, and code quality](https://static-docs.nocobase.com/studio-en-quality-sample-20261111-normal-2x.webp)

## Test types

| Type | Scope and trigger |
| --- | --- |
| Daily | Scheduled checks of completed business tasks not yet covered; the first run or a run after a long pause looks back at most three days |
| Release | Current tasks awaiting release; start manually or trigger at the configured task threshold |
| Project | Core scenarios across the project; run manually, weekly, or monthly |
| Custom | Manually select completed business tasks or test the whole project code |

Daily tests run only on their schedule. Use a custom test to check selected tasks now.

## Tests and tasks

Each test creates a native task. It keeps the test scope, frozen Skill versions, and execution history. You accept its delivery report on the task.

Agents check each dimension and link findings to follow-up tasks. Completing a test does not resolve those findings. Continue in [Follow-ups](runs.md#follow-ups), then verify the changes in a later test.

PR checks and code review still validate individual changes. Project quality tests examine a broader scope over time. See [PR checks and code review](../project/checks-and-review.md).

## Core scenarios

Core scenarios describe expected business behavior, such as “Suspended suppliers cannot receive new orders.” Project tests and whole-project custom tests use them.

## Checking dimensions

| Built-in dimension | Checks |
| --- | --- |
| Functional | Expected behavior of business tasks and core scenarios |
| Permissions | Account, role, and data access boundaries |
| Security | Dependency vulnerabilities and findings reported by security scanners |
| Performance | Page loads and API responses. Review measurements, test conditions, and risks found during code inspection |
| Code quality | Maintainability issues and slow or unstable tests |
