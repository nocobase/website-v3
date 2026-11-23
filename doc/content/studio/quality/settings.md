---
title: Configure quality tests
description: Configure triggers, performance budgets, dimension Skills, and core scenarios.
---

Project managers configure tests under **Quality › Settings**. First confirm the project lead, repository, Agent, and runtime are available. Automatic triggers do not replace these prerequisites.

## Trigger rules

| Type | Settings |
| --- | --- |
| Daily | Enable the daily schedule, choose a time, and set the minimum accumulated completed tasks |
| Release | Enable a pending-release task threshold and set its value |
| Project | No automatic trigger, weekly, or monthly; choose the day and time |
| Custom | Start manually; no schedule |

New projects have no automatic triggers. Choose an explicit time zone before enabling a schedule. Scheduled tests run under the project lead. Restore access first if that account is disabled or lacks permission.

Scenario language controls newly generated core scenarios. If unset, it follows the instance language. Existing tests keep their frozen scope and rules.

![Configure triggers, dimensions, and Skills](https://static-docs.nocobase.com/studio-en-quality-settings-20261111-normal-2x.webp)

## Dimensions and Skills

See [Quality overview](overview.md) for dimension scope and [Quality metrics and standards](metrics.md) for detailed criteria.

Functional checks are always enabled. Choose the applicable test types and Skill for other dimensions. To add a dimension, enter its name, choose a library Skill, and select the test types.

Skills define checking methods; submitted results determine metrics. New tests use updated Skill versions. Existing tests retain the versions frozen at creation.

Save, then [start a test](runs.md) to verify the configuration. Resolve runtime or permission problems before leaving automatic tests enabled without anyone able to handle them.

## Adjust project standards

Override performance budgets under **Quality › Settings**; unspecified budgets retain their defaults. Change other checking methods and decision rules through the dimension's Skill. Not every metric has a separate threshold field in the interface. See [Quality metrics and standards](metrics.md) for defaults and scope.

Start a new test after changing rules. Existing tests retain their original scope and Skill versions; new standards do not rewrite historical results.

<h2 id="scenarios">Maintain core scenarios</h2>

Open **Quality › Core scenarios** to inspect scenarios, expectations, and checkpoints by business function.

Scenario assets live in `.nb-studio/scenarios/` in the tested repository. Agents maintain them as requirements change. Describe additions or corrections on a task and ask the Agent to submit the update for review. Titles can change; stable scenario keys support comparison between tests.

The page shows a snapshot submitted by a test. Editing repository files does not update coverage until a later test submits a new snapshot.

![Core scenarios and their latest verification results](https://static-docs.nocobase.com/studio-en-quality-scenarios-20261111-normal-2x.webp)
