---
title: Glossary
description: The terms used across the whole site. Documentation, the website, the product interface, and command-line help all follow this list.
---

## Products and roles

| Term | Meaning |
| --- | --- |
| NocoBase Core | The open-source foundation for building and running business systems, a set of npm packages |
| NocoBase Studio | The workspace where people lead an agent team to build apps, available in the commercial editions |
| NocoBase Solution | A line of open-source business apps built on NocoBase, such as NocoCRM and NocoITAM. Individual apps are called Solution apps |
| Agent | The general term for an AI worker: a coding tool plus a model, for example "Claude · Opus 5.5". Written in lowercase in running text |
| Coding tool | Claude Code, Codex, OpenCode, Cursor, and so on |
| Business agent | An agent that handles business work inside an app, within its permissions. Connected by the Agents plugin. Called "AI employee" in NocoBase 2 |
| Development agent | An agent that writes the app's code. Used only where it needs to be contrasted with a business agent. Everywhere else, just say agent |

## Core

| Term | Meaning |
| --- | --- |
| App | A code repository created from a NocoBase template. Once deployed, it is a business system. You own it |
| Template | The starting point for creating an app: the default template and the examples template |
| Plugin | An `@nocobase/app-plugin-*` package registered in the app. It brings server-side capabilities, pages, UI components, skills, or commands |
| Plugin lists | The three files in the app where plugins are registered: `server/plugins.ts`, `client/plugins.ts`, and `cli/plugins.ts` |
| Foundation library | A package the app uses directly without registering it, such as record lifecycle or the database |
| UI library | The business components NocoBase publishes. Installing one copies it into the app's source, and it belongs to the app from then on. A single item is called a component or a block |
| Skill | Instructions (`SKILL.md`) that teach an agent how to do something. Skills shipped with packages are synced to the app's `.agents/skills/` |
| Capability | A kind of functionality Core provides, grouped into the 13 categories of **App foundation** |
| System settings | The admin entry point in the app: user management, roles and permissions, workflow management, app foundation, and so on |
| App foundation | A page that ships with the default template. It shows which Core capabilities the app uses and which packages provide them |
| Record lifecycle | A record's state is stored in its own field, and the transitions between states are declared in code. Every NocoBase 3 workflow is built on it |
| Workflow parameter | A value administrators can adjust in **Workflow management**, such as approvers or amount thresholds |
| Permission set | A bundle of page, action, and data scope grants, assigned to a role or a person. Shown as "role" in the interface |
| Data scope | Which records an action can apply to, for example "orders the user is responsible for" |
| Migration | A code file that changes the database structure. Migrations run in order, and a migration that has run is never edited |
| `config.yml` | The app's deployment configuration: database, storage, secrets, background jobs, and so on. It is not committed to the code repository |

## Studio

| Term | Meaning |
| --- | --- |
| Issue | The basic unit of delivered work in Studio. Not "ticket" or "request form" |
| Issue owner | The person responsible for an issue's outcome. Always a person |
| Coordinator agent | The single system agent that splits work into steps, assigns them, asks questions, and hands over for acceptance. It does not write code. |
| Worker agent | An agent on the agent team that carries out the steps the coordinator agent assigns |
| My agent | Your own coding tool, such as Claude Code or Codex. Once connected to Studio, it talks requests through with you in My sessions |
| Agent team | All the agents the team has enabled |
| Runtime | A machine that runs `nocobase-runner`, either a shared runtime or a personal one |
| My issues, My sessions | The two ways to follow work: by issue, and by session |
| Project memory | What agents note down while working. It is stored in the code repository, and agents read and write it themselves |
| Knowledge base | Material that people write and upload. Agents can only read it |
| Delivery report | What the coordinator agent submits when an issue moves to In review |
| Backlog / In progress / Blocked / In review / Done / Cancelled | The six fixed issue statuses. In review means delivered and waiting for the issue owner to accept |

For the full Studio vocabulary, see Studio's [Core concepts](../studio/intro/concepts.md).

## Conventions

- Names, buttons, and menus in the interface are written in **bold**, exactly as they appear in the English interface. Paths are written as **A › B**.
- Names in code (package names, file names, commands) use code formatting, and appear only where needed.
