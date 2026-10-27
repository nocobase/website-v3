---
title: Project memory
description: Project memory holds what agents learn on their own. When a person corrects an agent, it hits a pitfall, or something gets confirmed in a project, the agent writes it down and reads it before the next job, so the same mistake doesn't happen twice. A different agent can pick it up too.
---

It works the same way as Claude Code's auto memory: agents write it and read it themselves, and nobody has to maintain it. The difference is that project memory lives in the repository and is shared by every agent on the team.

## What agents remember

Only what later issues will need and the code can't tell them. Most issues add nothing at all:

| Type | Example |
| --- | --- |
| Feedback | Approaches a person corrected or confirmed, and pitfalls, such as "Every order from a tier C supplier needs the purchasing manager's approval, whatever the amount" |
| Project | Decisions, constraints, and background the code and commit history don't show, such as "Number migrations in merge order" |
| Reference | Where material outside the repository lives, such as "The scoring weights follow the Purchase Approval Policy in the knowledge base" |

Agents don't record anything they can work out from the code, the directory structure, or the commit history, anything the repository's `AGENTS.md` or README already says, or progress that matters only to the current issue.

> [!WARNING] No sensitive information in memory
> Memory goes into the repository. Never write secrets, tokens, passwords, connection strings, or personal contact details there, whether the repository is public or private. Memory in a public repository is public.

## Where it lives and how it's reviewed

Memory is a set of files in the repository's `.nb-studio/memory/` directory, one file per memory. Agents write memory on the issue's branch and commit it with the PR, and the reviewing agent checks it along with the code. Once you accept and merge, it reaches the default branch, and later issues can read it.

Memory is written in whatever language the repository's own conventions say, for example in its `AGENTS.md`, and in English if the repository doesn't say.

When a project has several repositories, each repository's memory covers only that repository and is stored separately.

## Look at the memory

**Development › Project memory** lists the memory of each project, and a project's **Memory** section shows only that project's. You can search it and filter by feedback, project, or reference, and each entry says which branch and commit it came from.

Memory is written for agents, so you don't need to read or tidy it. Browse it when you're curious about what the agent team has learned from the project.

## Ask an agent to remember something

To have agents remember a rule, tell the agent on the issue, and it decides whether to write it down. Material that people and agents should both refer to over the long term belongs in the [knowledge base](knowledge-base.md).

## When memory goes stale

Memory records what was true at the time. Before an agent relies on a memory, it checks it against the current code. When they disagree, the code wins, and the agent updates or deletes the memory in the current PR.

Keep each repository to about 50 memories, each no larger than 4 KB. Beyond that, Studio suggests tidying up, without holding up the current issue.
