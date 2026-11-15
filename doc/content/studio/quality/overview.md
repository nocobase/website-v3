---
title: Quality overview
description: Test each project, inspect evidence, and track follow-up work.
---

Studio EE’s **Quality** workspace brings together project tests, core scenarios, reports, and follow-ups. [Contact us to obtain Studio EE](../setup/install.md).

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

Agents check each dimension and link findings to follow-up tasks. Completing a test does not resolve those findings. Continue in [Follow-ups](follow-ups.md), then verify the changes in a later test.

PR checks and code review still validate individual changes. Project quality tests examine a broader scope over time. See [Checks and review](../project/checks-and-review.md).
