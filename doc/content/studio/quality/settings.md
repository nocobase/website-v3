---
title: Configure quality tests
description: Set triggers, dimensions, and project standards, and maintain core scenarios.
---

Project managers configure tests under **Quality › Settings**. First confirm the project lead, repository, Agent, and runtime are available.

![Configure triggers, dimensions, and Skills](https://static-docs.nocobase.com/studio-en-quality-settings-20261111-normal-2x.webp)

## Trigger rules

| Type | Settings |
| --- | --- |
| Daily | Enable the daily schedule, choose a time, and set the minimum accumulated completed tasks |
| Release | Enable a pending-release task threshold and set its value |
| Project | No automatic trigger, weekly, or monthly; choose the day and time |
| Custom | Manual only |

New projects have no automatic triggers. Choose a time zone before enabling a schedule and check that the time suits your team. Scheduled tests run as the project lead; if that account is disabled or lacks permission, restore it first.

## Scenario language

Scenario language controls the language of newly generated core scenarios. If unset, it follows the instance's default language.

## Dimensions and Skills

Functional checks are always enabled. For other dimensions, choose the applicable test types and bind a Skill; the Skill defines how the dimension tests and judges.

To add a dimension, enter its name, choose a Skill from the library, and select the test types.

New tests use an updated Skill version. Existing tests keep the version frozen at creation.

## Adjust project standards

A dimension's Skill defines its standards; change or replace the Skill to adjust them.

See [Quality standards](standards.md) for the defaults. Changes take effect in new tests; existing results are never rewritten by new standards.

<h2 id="scenarios">Maintain core scenarios</h2>

Open **Quality › Core scenarios** to see scenarios, expected results, and their latest verification results by business function.

![Core scenarios and their latest verification results](https://static-docs.nocobase.com/studio-en-quality-scenarios-20261111-normal-2x.webp)

Scenarios live in `.nb-studio/scenarios/` in the tested repository:

- Development tasks that change a feature update its scenarios at the same time.
- Project tests add missing scenarios and update outdated ones.
- When a special business rule needs to be added, you can also describe it on a task, and an Agent updates it and submits it for review.

Each scenario has a stable key; titles can change, and results compare across tests by key. The page shows the snapshot from the latest test. After editing repository files, the page updates when the next test submits a new snapshot.
