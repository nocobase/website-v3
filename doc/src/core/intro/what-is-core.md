---
title: What is Core
description: Core is the open-source foundation for building and running business systems, a set of npm packages. Agents use it to build your app, so permissions, approvals, files, and notifications don't get rewritten every time.
---

When an agent builds a business system from scratch, permissions, approvals, notifications, and audit trails get rewritten every time. The structure differs from project to project, quality is hard to guarantee, and there is no common way to upgrade or maintain them.

Core builds the parts every system needs and hands them to agents to use directly. Agents write only your business: supplier records, purchase orders, approval rules, receiving. The foundation upgrades independently with NocoBase releases, so business code doesn't have to be rewritten along with it.

## What Core is made of

Core is a set of packages published on npm. An app built with Core depends on these packages, just as an ordinary project depends on frameworks and libraries:

| Part | What it is | Examples |
| --- | --- | --- |
| Template | The starting point for creating an app, generating a complete code repository | The default template and the examples template |
| Runtime | The app's server-side and browser-side framework | `app-server`, `app-client` |
| Plugins | Feature packages registered in the app, bringing server-side capabilities, pages, components, skills, or commands | Authentication, authorization, files, notifications, scheduled tasks; approvals in the commercial editions |
| Foundation libraries | Libraries the app uses directly, with no registration | Database, record lifecycle, background jobs, storage |
| UI library | Business components and blocks, copied into the app's source when installed and owned by the app from then on | Data table, workflow management, inbox, approval progress |
| Skills | Instructions shipped with a package that teach an agent how to use it | `nocobase-app-development`, and a skill for each plugin |
| Command line | Commands that manage configuration, the database, plugins, and skills | `pnpm nocobase config check`, `pnpm nocobase plugin register` |

The open-source repository has 23 plugins and about 30 foundation libraries and tool packages, and the UI library has more than 40 components and blocks. For a walkthrough of each, see the [plugin directory](../plugins/index.md).

## How people, agents, and Core divide the work

<figure class="map" aria-label="People state requirements and judge results, agents write the app's code, and Core provides the foundation">
<div class="row"><div class="box human"><b>You</b><span>Say what you want, answer the agent's questions, try the app and accept it. After launch, manage users, permissions, and workflow parameters in <b>System settings</b></span></div></div>
<div class="down">Requirements</div>
<div class="row"><div class="box agent"><b>Agents</b><span>Read Core's skills, register the plugins needed, write tables, APIs, pages, and workflows, and run tests</span></div></div>
<div class="down">Written into your code repository</div>
<div class="row c2"><div class="box brand"><b>Your app</b><span>Suppliers, purchase orders, approval rules, receiving, and the admin pages in <b>System settings</b></span></div><div class="box"><b>Core</b><span>Sign-in, users, permission checks, file storage, notification delivery, workflow runtime, scheduled execution, and deployment tools</span></div></div>
</figure>

Taking the purchasing app as an example, here is what is ready-made and what the agent writes:

| | Ready-made (Core) | Written by the agent (your app) |
| --- | --- | --- |
| Sign-in and users | Accounts, sign-in, password reset, and sessions; the **User management** page the template prepares | Whether sign-up is open, and what the sign-in page looks like |
| Permissions | The permission model and checks; the **Roles and permissions** page the template prepares | Rules such as "buyers see only their own orders" |
| Purchase orders | Database access, migrations, the workflow runtime, and processing history | The order table, order pages, and the workflow from submission to receiving |
| Approvals | The approval plugin <span class="tag pro">Commercial</span>: multi-level, all-must-approve, add approver, transfer | Who approves, and what amount needs finance approval |
| Attachments | Upload, storage, and preview | The attachments area in the order details, and who can upload |
| Reminders | Notification delivery, in-app messages, and scheduled execution | A 9 a.m. daily reminder for approvers to handle pending orders |

After launch, administrators can adjust some of this in the app: assign roles to people, adjust data scopes, change approvers and amount thresholds, and pause a scheduled task. The structure of a workflow and the look of a page are still code. To change them, have an agent change them and redeploy. For the difference between these layers, see [Core concepts](concepts.md#four-layers-of-responsibility).

## You own the app

- **The code is in your own repository.** Pages, APIs, tables, workflows, and admin pages are all the app's source code, which you can review, test, release by version, and roll back.
- **Foundation and business are separate.** Agents use plugins only through their public interfaces and never modify plugin code. Components copied in from the UI library belong to the app and can be changed.
- **The foundation upgrades independently.** When you upgrade NocoBase, the agent merges the changes against the new template and does not undo your edits.
- **Self-hosted.** The app is deployed on your own servers, and you choose the models and agents.

## 13 categories of foundation capabilities

Core's capabilities fall into 13 categories. The **App foundation** page that ships with the default template also lists which of these the app actually uses, in the same 13 categories:

| Capability | What it provides |
| --- | --- |
| [Data modeling](../capabilities/data.md) | Tables, fields, relations, and migrations, multiple databases, and external databases |
| [File management](../capabilities/files.md) | Upload, storage, preview, and attachments |
| [Users and organizations](../capabilities/users.md) | Accounts, sign-in, invitations, and company single sign-on |
| [Permissions](../capabilities/permissions.md) | Roles, data scopes, sharing rules, and restriction rules |
| [Workflows and approvals](../capabilities/workflows.md) | Record lifecycle, state transitions, approvals, and scheduled tasks |
| [AI and agents](../capabilities/ai-agents.md) | Model services, business agents, and runners |
| [Knowledge base](../capabilities/knowledge.md) | Knowledge spaces, documents, and retrieval |
| [Mail](../capabilities/mail.md) | Mailboxes, sync, and sending |
| [Notifications](../capabilities/notifications.md) | Notification channels, delivery, and in-app messages |
| [Integrations](../capabilities/integrations.md) | API keys and external access |
| [Interface and configuration](../capabilities/interface.md) | Pages, navigation, localization, and themes |
| [Audit log](../capabilities/audit.md) | Records of sensitive operations |
| [Operations](../capabilities/operations.md) | Migrations, background jobs, queues, and secrets |

## How it relates to Studio and Solution apps

- **Core alone**: you open a coding tool such as Claude Code or Codex in the app directory and build with an agent, while the team organizes testing, deployment, and backup itself.
- **With Studio**: Studio turns your team's agents into one agent team that builds, checks, reviews, accepts, and releases by the same process. A new project in Studio uses Core's default template, and the apps it builds are also built on Core. See [What is Studio](../../studio/intro/what-is-studio.md).
- **Solution apps**: official apps such as NocoCRM are also built on Core. You can deploy and use them as they are, or have an agent keep changing them to fit your business.

## Open source and commercial editions

The vast majority of Core's packages are open source. What the commercial editions provide today is approvals, the task center, and database support for Dameng, KingbaseES, and OceanBase. Every plugin in the plugin directory is labeled with its edition range.

The next page, [How an app gets built](how-an-app-gets-built.md), ties these together with the purchasing app.
