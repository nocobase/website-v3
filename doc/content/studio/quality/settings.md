---
title: Configure quality tests
description: Set triggers, dimensions, and project standards, and maintain core scenarios.
---

Project managers configure tests under **Quality › Settings**. First confirm the project lead, repository, Agent, and runtime are available.

![Configure triggers, dimensions, and Skills](https://static-docs.nocobase.com/studio-en-quality-settings-20261111-normal-2x.webp)

## Settings by test type

| Type | Settings |
| --- | --- |
| Daily | Whether it runs every day, the run time, the minimum number of completed tasks it needs, and which dimensions it includes |
| Release | Whether it triggers automatically, how many new tasks awaiting release trigger it, and which dimensions it includes |
| Project | No automatic trigger, weekly or monthly, the weekday or date, the run time, and which dimensions it includes |
| Custom | The dimensions selected by default, which can still be changed when starting a test |

New projects have no automatic triggers. Scheduled tests run as the project lead. If the project has no lead, or the lead's account is disabled, cannot see the project, or lacks permission to create tasks and start quality tests, scheduled tests are skipped and the quality overview asks you to set a project lead.

## Scenario language

Scenario language controls the language of newly generated core scenarios. If unset, it follows the instance's default language.

## Dimensions and Skills

Functional checks are always enabled. For other dimensions, choose the applicable test types and bind a Skill; the Skill defines how the dimension tests and judges.

To add a dimension, enter its name, choose a Skill from the library, and select the test types.

New tests use an updated Skill version. Existing tests keep the version frozen at creation.

## Adjust project standards

Each dimension's checking methods and pass criteria are written in the Skill it is bound to. To adjust a standard, edit that Skill in the skill library, or bind the dimension to a different Skill.

For example, the performance dimension's budgets live in its Skill's `budgets.json`, where API P95 response time defaults to at most 500 ms. Change it to 800 ms, and later tests judge against 800 ms.

Only tests started after the change use the new standard; existing tests keep the Skill version from when they were created, and their results are never rewritten. See [Quality standards](standards.md) for the defaults.

<h2 id="scenarios">Maintain core scenarios</h2>

Open **Quality › Core scenarios** to see scenarios, expected results, and their latest verification results by business function.

![Core scenarios and their latest verification results](https://static-docs.nocobase.com/studio-en-quality-scenarios-20261111-normal-2x.webp)

Scenarios live in `.nb-studio/scenarios/` in the tested repository:

- Development tasks that change a feature update its scenarios at the same time.
- Project tests add missing scenarios and update outdated ones.
- When a special business rule needs to be added, you can also describe it on a task, and an Agent updates it and submits it for review.

Each scenario has a stable key; titles can change, and results compare across tests by key. The page shows the snapshot from the latest test. After editing repository files, the page updates when the next test submits a new snapshot.
