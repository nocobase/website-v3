---
title: Start and follow a test
description: Choose a scope, follow execution, and resolve blockers.
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

Cancel a test when it is no longer needed. Existing records remain, and unfinished dimensions show as cancelled. After execution, [review the report and accept the delivery](reports.md).
