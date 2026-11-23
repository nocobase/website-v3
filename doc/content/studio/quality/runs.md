---
title: Run tests
description: Choose a scope, start a test, follow each dimension's progress, and resolve blockers.
---

Tests run automatically by their [settings by test type](settings.md#settings-by-test-type), or you can start one at any time.

## Prerequisites

- The project has a code repository.
- An enabled Agent and an online Runner are available.
- Automatic tests need an active project lead. The execution identity needs project management, task reading, and attachment upload permissions.

## Start a test

1. Open **Development › Quality** and select a project.
2. Select **Run test**, then Release, Project, or Custom.
3. For a custom test, select completed tasks or the whole project code. Adjust the dimensions if needed.
4. Confirm and open the new testing task.

![Choose the test scope and dimensions](https://static-docs.nocobase.com/studio-en-quality-new-20261111-normal-2x.webp)

| Type | Manual start |
| --- | --- |
| Daily | Not supported; runs only on its schedule. To test selected tasks now, use a custom test |
| Release | Supported when there are tasks awaiting release |
| Project | Supported at any time |
| Custom | Supported; select completed tasks or the whole project code |

Studio freezes the scope and each dimension's Skill version when it creates the test. Later settings changes do not affect it. Start a new test to use a new scope or standard.

## How a test runs

1. Studio resolves the tested commit and skips dimensions unaffected by the changes.
2. Each dimension goes to an Agent, and dimensions run in parallel on Runners.
3. Each dimension prepares its own test environment and data, runs its tools, and submits results and evidence against the standards.
4. When every dimension has submitted, Studio generates the delivery report.

Testing does not change product code. Unclear rules are registered as questions; checks missing an environment or data are recorded as unverified with a reason.

## Follow progress

Open **Quality › Testing issues** to see each test, or open it from **My issues**. The testing task shows each dimension's status, checked items, and time spent in each stage.

![Testing tasks and their execution status](https://static-docs.nocobase.com/studio-en-quality-runs-20261111-normal-2x.webp)

## Resolve blockers

If a runtime, permission, or test account is missing, provide it and reply on the testing task. The owner answers business questions. See [Answer questions](../use/answer.md).

## Cancel a test

Cancel a test when it is no longer needed. Submitted results remain, and unfinished dimensions show as cancelled.

When the test finishes, [read the test report](reports.md).
