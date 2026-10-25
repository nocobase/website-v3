---
title: Capabilities overview
description: Core's 13 building blocks, matching the categories on the App foundation page inside the app. Each one explains what comes ready out of the box, what agents build in the app, what administrators can adjust after launch, and what to configure at deployment.
---

Before you write a request, check here: does Core already provide what you need, which plugins supply it, and what should the request make clear.

## The 13 building blocks

| Building block | What it solves | Ready out of the box | Main packages |
| --- | --- | --- | --- |
| [Data modeling](data.md) | Business objects, fields, relations, schema changes, connecting existing databases | Database access, migrations, five database dialects, the database explorer API | Database, Database explorer |
| [File management](files.md) | Attachments and images on records, documents generated from templates | Upload, storage, preview, download, and the file component | Files, storage, Template printing |
| [Users and organization](users.md) | Who can sign in, and how accounts are managed | Sign-in, sign-up, password reset, sessions, invitations, and the **Users** page | Authentication, Users |
| [Permissions](permissions.md) | Who can open which page, run which actions, and see which records | The permission model and checks, the **Roles and permissions** and **Default data scopes** pages, sharing and restriction rules | Permissions and three rule plugins |
| [Workflows and approvals](workflows.md) | Documents that move in stages, approvals, scheduled runs | Record lifecycle, the **Workflow management** component, scheduled jobs; approvals and the task center in the commercial edition | Record lifecycle, Scheduled jobs, Approvals |
| [AI and agents](ai-agents.md) | Business agents that handle work in the app within their permissions | Model services, agents, runs and conversations, runners | Agents, Agent sessions |
| [Knowledge base](knowledge.md) | Managing and searching business material, for people and agents | Knowledge spaces, versions, search, change proposals and review | Knowledge base |
| [Email](mail.md) | Sending and receiving email in the app, linked to business records | Mailbox connections, sync, sending, signatures and templates | Email |
| [Notifications](notifications.md) | Telling the right people when something happens | Sending and delivery logs, in-app messages and the inbox, email and group bot channels | Notifications, In-app messages, Notification channels |
| [Integrations](integrations.md) | Letting scripts and other systems reach the app | API keys, API docs, the app's command line | API keys |
| [Interface and settings](interface.md) | Pages, navigation, language, and appearance | The page framework, UI library, languages, themes, realtime updates | Runtime, Languages |
| [Audit log](audit.md) | Recording sensitive operations so they can be traced afterward | Not available yet, see the page | — |
| [Operations](operations.md) | Background jobs, queues, caching, secrets, and how the app is running | Background jobs and queues, secret encryption and rotation, logs, **App foundation** | Runtime, command line |

For details on each plugin, see the [Plugin directory](../plugins/index.md).

## How each building block is organized

The first page of each building block is an overview, written in the same order:

1. What the building block solves;
2. **The four layers**: ready out of the box / agents build in the app / administrators adjust after launch / configured at deployment;
3. Which packages provide it, whether they are open source or commercial, and whether the default template includes them;
4. What you see in the app;
5. How to write a request: what to make clear, and examples you can copy;
6. How to check the result;
7. Limits and common questions;
8. How it maps to NocoBase 2.

After that come scenario pages for the building block, such as all-sign, adding a signer, and transfer under "Workflows and approvals".

## What to state in every request

Whatever the building block, a good request makes these clear. Each building block's overview adds the points specific to it:

| What to make clear | Example |
| --- | --- |
| Who uses it | Buyers, department managers, finance |
| Where | On the purchase order detail page, in **System settings** |
| What is recorded and what the rules are | Amounts over 50,000 need finance approval |
| Who can see it and who can change it | Buyers see only their own orders |
| What gets adjusted after launch, and by whom | Administrators can change the amount threshold |
| What counts as done | Walk through it with three accounts and the results follow the rules |

For how to write it, see [Working with agents](../develop/working-with-agents.md).
