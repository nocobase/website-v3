---
title: Skills
description: Skills hold how your team gets work done. Write your development standards, review points, and test steps as skills, attach them globally, to a project, or to a repository, and agents follow them on every run, whoever the person or agent is.
---

A skill is a `SKILL.md` file, optionally with a few supporting files, in the same format Claude Code and Codex use. The `name` at the top of the file is the skill's name, and the `description` tells agents when to read it.

## Built-in skills

Studio comes with five skills that set how the agent team works:

| Skill | What it sets | Attached by default to |
| --- | --- | --- |
| studio-workflow | How the coordinator agent splits work into steps, who gets each one, when a plan comes first, how reviews go, and when work is ready to deliver | New projects |
| studio-development | How a worker agent carries out a step: design, verification, handling CI failures, and delivery | New projects |
| studio-approach | How to write a plan | New projects |
| studio-review | How to review a PR: what to look at, how findings are graded, and what blocks a merge | New projects |
| studio-comment-style | How comments and delivery reports are written. The sections of the delivery report come from here | Global |

You can adapt the built-in skills to how your team works. Your changes are saved in Studio, and upgrading Studio doesn't overwrite them.

Repositories initialized from the NocoBase app template also come with Core's development standards, which agents read when they work in the repository.

## Create and edit skills

In **Agent management › Skills**:

- **New skill**: write the `SKILL.md`, and add files now or later. You can also **Import** a zip organized in the Agent Skills directory format.
- **Edit**: click **Edit**, make your changes, and click **Save new version**, optionally with a note on what changed. Every save is a new version, and you can view and export old ones.
- **Export**: export a version as a zip to use somewhere else.

Creating skills needs permission to manage agents, which usually means an admin. A skill's creator and admins can edit it, and project leads can attach existing skills to their own projects. Deleting a skill removes it everywhere it's attached.

## Where to attach them

Once a skill is attached, every run there brings it along. There are three scopes:

| Scope | Where to set it | Applies to |
| --- | --- | --- |
| Global | **Global attachment** in the skill's details | Every project |
| Project | **Project settings › Default skills**, choosing **The whole project** | Every run in this project |
| Repository | **Project settings › Default skills**, choosing a repository | Runs in that repository |

Skills from all three scopes add up. When two skills share a name, the more specific scope wins.

Turn on **Attach to new projects automatically** in a skill's details, and projects created from then on get it automatically. Existing projects stay as they are.

## Tips for writing skills

- Keep one skill to one topic, and make the `description` say clearly when to use it so agents know when to read it.
- Write down what's specific to your team, such as naming rules, checks that must run, and directories that must not be changed. General programming knowledge doesn't need to be written down.
- After a change, look at the activity and delivery reports of the next few issues to make sure agents follow it.
