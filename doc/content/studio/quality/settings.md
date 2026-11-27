---
title: Quality settings
description: Configure each test type, dimensions, and project standards, and view core scenarios.
---

Open the project’s **Quality › Settings** tab to configure test triggers, owners, and dimensions. You need permission to manage quality settings.

![Select an owner for automatic daily tests](https://static-docs.nocobase.com/studio-en-quality-20261126-038f8c97d6.webp)

## Settings by test type

| Type | Settings |
| --- | --- |
| Daily | Whether it runs every day, the run time, the minimum number of completed tasks it needs, and which dimensions it includes |
| Release | Whether it triggers automatically, how many new tasks awaiting release trigger it, and which dimensions it includes |
| Project | No automatic trigger, weekly or monthly, the weekday or date, the run time, and which dimensions it includes |
| Custom | The dimensions selected by default, which can still be changed when starting a test |

Automatic tests are off for new projects. After enabling a trigger, select an **Owner** in the same row and save. The default is the project lead. You can choose another member who can access the project, create tasks, and run quality tests. A custom test belongs to the person who starts it.

If the owner is deactivated or loses permission, automatic runs pause for that test type. The quality overview shows why and links to the owner setting.

## Scenario language

Scenario language controls the language of newly generated core scenarios. If unset, it follows the instance's default language.

## Dimensions and Skills

Functional checks are always enabled. For other dimensions, choose the applicable test types and bind a Skill; the Skill defines how the dimension tests and judges.

To add a dimension, enter its name, choose a Skill from the library, and select the test types.

New tests use an updated Skill version. Existing tests keep the version frozen at creation.

## Adjust project standards

To change a dimension’s standards, create a skill with your team’s rules and select it in the dimension settings. The skills supplied by the quality plugin are read-only.

For example, the performance dimension's budgets live in its Skill's `budgets.json`, where API P95 response time defaults to at most 500 ms. Change it to 800 ms, and later tests judge against 800 ms.

Only tests started after the change use the new standard; existing tests keep the Skill version from when they were created, and their results are never rewritten. See [Quality standards](standards.md) for the defaults.

<h2 id="scenarios">Core scenarios</h2>

Open **Quality › Core scenarios** to see scenarios, expected results, and their latest verification results by business function.

![Core scenarios and their latest verification results](https://static-docs.nocobase.com/studio-en-quality-scenarios-20261111-normal-2x.webp)

**Studio maintains core scenarios automatically; no one needs to curate them by hand**:

- Development tasks that change a feature update its scenarios at the same time.
- Project tests add missing scenarios and update outdated ones.

Scenarios live in `.nb-studio/scenarios/` in the tested repository, so they are reviewed and versioned with the code. When a special business rule needs to be added, you can also describe it on a task and an Agent updates the scenarios.
