---
title: Knowledge base, project memory, and skills
nav: Knowledge base and project memory
description: Your team's methods and business knowledge stay in Studio: people write business material into the knowledge base, agents record what they learn in project memory, and development methods are built into skills.
---

Agents read three things as they work. Only the knowledge base needs people to maintain it:

| | What it stores | Who maintains it |
| --- | --- | --- |
| Knowledge base | Business rules, product descriptions, technical conventions, decision records | People write and upload; agents only read |
| Project memory | Lessons agents learn while working | Agents write and read it themselves; people do not need to manage it |
| Skills | Methods for doing the work: development standards, review points, test steps | NocoBase development best practices are built in and update with Core |

## Knowledge base

The knowledge base holds material that people write and upload, shared by people and agents. The next time you add a feature, you do not need to explain the project background again.

- **System knowledge**: shared across projects, such as the company's approval policy and general technical conventions.
- **Project knowledge**: one space per project. Anyone who can read a project's knowledge can also read system knowledge.

**Look things up.** **Development › Knowledge** brings together every space you can access, and search covers all of them. Each result says which project and which folder it comes from.

**Write.** First select the space or folder to put things in, then create an article, upload a file, or create a folder. People with edit permission can change things directly; people with only propose permission can propose changes, and the project owner (an administrator, for system knowledge) decides in the inbox whether to adopt them. Articles keep their version history.

**How agents use it.** When running a task, the relevant knowledge is placed next to the agent's working directory. In a session, the agent can search the knowledge base and says which section it cited.

> [!TIP] What is worth writing into the knowledge base
> Write only business information that an agent cannot tell from the code: business rules and where they come from, what terms mean, how to handle exceptions, and key decisions that were made.

## Project memory

Project memory lets agents remember what they learned in this project and read it before starting next time, so they do not repeat mistakes. It works on the same idea as Claude Code's automatic memory and is maintained entirely by agents.

An agent records something only when it is worth remembering, and most tasks write nothing:

- What a person corrected or confirmed, for example "New suppliers default to grade B".
- Constraints discovered only after a failure, for example "Migration numbers follow the order of merging".
- Decisions whose reasons cannot be seen in the code.
- Where outside material lives, for example "Scoring weights follow the knowledge base article Purchase Approval Policy".

Memories are files in the repository's `.nb-studio/memory/` directory, one file per memory. They are committed with the task's PR, checked together with the code by the reviewing executing agent, and enter the default branch after the merge. When an agent uses a memory, it checks it against the current code; if they do not match, the code wins and the memory is corrected.

Project memory is written for agents, so you do not need to read or tidy it. To make an agent remember a business rule, just tell it in the task. Material that people and agents should both consult over the long term belongs in the knowledge base.

> [!WARNING] Do not let agents record sensitive information
> Memories go into the code repository, and no repository may hold keys, tokens, passwords, or personal information. Memories in a public repository are public.

## Skills

Skills are methods for doing the work, written down in words, and every agent run carries them. Studio has the official NocoBase development skills built in: how to use Core's capabilities, what to take from the foundation and what to write yourself, where code goes, and how to write permissions and migrations. The official skills update with Core versions and work out of the box, so you do not need to write them yourself.

You can view the current skills under **Agent team › Skills**. When your team has special conventions of its own, the technical lead can add team skills here and set them to apply globally, to a project, or to a working directory.
