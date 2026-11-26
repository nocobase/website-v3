---
title: Skills
description: Apply shared design, development, review, and delivery practices to Agent runs.
---

A skill contains `SKILL.md` and optional reference files or scripts. Its `name` identifies it, its `description` explains when to use it, and its body defines the working method.

## Find a skill by purpose

In **Skills**, select **Workflows** to see the steps an Agent follows from start to delivery. **Ordinary skills** supply instructions for work such as design, implementation, and review. **Plugin-managed** lists skills supplied by features such as quality testing.

![Ordinary skills in the skill library](https://static-docs.nocobase.com/studio-en-skills-20261126-bbe0105444.webp)

## Create and update

Open **Skills**, select **New skill**, write `SKILL.md`, and add any reference files. You can also import a ZIP in the Agent Skills format. Save changes as a new version. Open the version history to read or export an earlier version.

An Agent working in the skill library uses the permissions of the person who started the run. Built-in workflows and plugin-managed skills are read-only.

## Set the scope

Choose the project default under [Workflow](../use/multi-role-workflow.md). To load the same instructions on every run, add an ordinary skill under **Resident skills** and select the project or a repository as its scope.

If all projects need the same instructions, enable global attachment in the ordinary skill’s details.

To set defaults for future projects, open a skill in the library. Choose one workflow as the default for new projects. You can also enable automatic attachment for each ordinary skill new projects should use.

Quality dimensions bind their own Skills in [quality settings](../quality/settings.md). Each test keeps the Skill versions captured when it was created; edits apply to later tests.
