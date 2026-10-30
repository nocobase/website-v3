---
title: Skills
description: Apply shared design, development, review, and delivery practices to Agent runs.
---

A skill contains `SKILL.md` and optional reference files or scripts. Its `name` identifies it, its `description` explains when to use it, and its body defines the working method.

## Built-in skills

| Skill | Purpose |
| --- | --- |
| studio-workflow | Dispatch, task steps, and delivery conditions |
| studio-development | Implementation, verification, and failure handling |
| studio-approach | Design proposals |
| studio-review | Code review and finding severity |
| studio-comment-style | Comments and delivery reports |

The first four attach to new projects by default. The comment style attaches globally. You can edit built-in skills; upgrades preserve saved changes. The NocoBase application template also includes Core development instructions.

![Maintain team skills and their versions](https://static-docs.nocobase.com/studio-en-guide-skills-20261031.png)

## Create and update

Open **Skills**, select **New skill**, write `SKILL.md`, and add supporting files. You can also import a ZIP package in the Agent Skills format.

Save edits as a new version. Previous versions can be viewed and exported as ZIP files. Creating skills requires Agent management permission. Creators and administrators can edit them; project leads can attach existing skills to their projects.

## Set the scope

| Scope | Where to configure it | Applies to |
| --- | --- | --- |
| Global | Global attachment in skill details | All projects |
| Project | Project settings › Default skills | Runs in the project |
| Repository | Select the repository in Default skills | Runs in that repository |

Scopes combine. The more specific scope takes priority for skills with the same name. Automatic attachment to new projects affects future projects only.

Document team-specific rules, such as required tests, review criteria, and delivery evidence. Keep each skill focused on one kind of work. After changing it, check subsequent runs and delivery reports to see how it is used.
