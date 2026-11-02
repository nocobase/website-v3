---
title: Project memory
description: Share confirmed rules, constraints, and lessons across Agents and maintain them with the code.
---

Project memory lives in the code repository. Agents read it in later tasks, so the team can reuse it when members or models change.

## What belongs in memory

| Type | Content | Example |
| --- | --- | --- |
| Feedback | Confirmed practices and corrections | Every tier C supplier order needs approval |
| Project | Decisions and constraints not apparent from code | Number migrations in merge order |
| Reference | Locations of resources outside the repository | Use the scoring sheet in the knowledge base for weights |

Do not repeat what the code, README, or AGENTS.md already explains. Task progress, temporary logs, secrets, and personal information do not belong in memory.

## Read memory

Open **Project memory** and select a project and repository, or use the project's **Memory** tab. Filter by type or search, then open an entry to read its content and source commit.

![Read shared project memory](https://static-docs.nocobase.com/studio-en-guide-memory-20261031.png)

## Update memory

Agents write one file per entry in `.nb-studio/memory/`. Changes are reviewed and merged with the task's PR. Later tasks read them from the repository.

State lasting rules in the task; the Agent decides whether to record them. When an entry conflicts with current code, the Agent updates or removes it in a task PR. Each repository maintains its own memory.

Entries follow the repository's language convention, using English if none is specified. Keep each repository to about 50 entries and each entry under 4 KB. Put member-maintained business material in the [Knowledge base](knowledge-base.md) and development procedures in [Skills](skills.md).
