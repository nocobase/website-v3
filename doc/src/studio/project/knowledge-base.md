---
title: Knowledge base
description: The knowledge base holds business documents. Put requirement context, policies, and business rules in it, and agents read them as they work, so you don't have to explain the background again when people or agents change or a new request comes in.
---

The knowledge base holds only what people write and upload, and agents read it without writing to it. What agents learn on the job goes into [project memory](project-memory.md), and how work gets done goes into [skills](skills.md).

## System knowledge and project knowledge

| | What goes in it | Who manages it |
| --- | --- | --- |
| System knowledge | Documents shared across projects, such as the company's purchase approval policy and general technical conventions | Admins |
| Project knowledge | One space per project, for that project's business documents | The project lead |

Project knowledge includes system knowledge: inside a project, people and agents see both.

**Development › Knowledge** brings together every space you can access, and a project's **Knowledge** section shows only that project's. Search covers every space you can access, and each result says which project and folder it comes from.

## Add to the knowledge base

Select the space or folder first, then create:

- **Articles**: write them right in Studio, with Markdown.
- **Files**: upload policies, spreadsheets, documentation, and so on. Text is extracted from PDF, Word, Excel, PowerPoint, CSV, plain text, Markdown, and JSON files for search and for agents to read. Text in images isn't recognized. The original file is kept and can be downloaded.
- **Folders**: up to four levels deep.

Every save is a new version, and you can look back at earlier ones. Articles that have been read and confirmed can be marked as verified. Archive what's no longer used: archived content doesn't show up in search, and you can restore it when needed.

> [!TIP] What's worth writing down
> Business information agents can't see in the code: business rules and the reasons behind them, what terms mean, how exceptions are handled, and key decisions that were made.

## Files from issues

When you attach a file to a request, such as a supplier scoring sheet, the agent may suggest saving it to the knowledge base after using it. A card appears on the issue asking whether to save the file to the knowledge base. You can save it to the project's knowledge or to system knowledge, or click **No thanks**.

Only the person who uploaded the file or the issue owner can save it, and only with edit permission on the space it goes into.

## Who can read and change what

Every space, folder, article, and file can have its own permissions, at four levels:

| Permission | What it allows |
| --- | --- |
| Read | View and search |
| Propose | Suggest changes, which someone with manage permission accepts or declines in their inbox |
| Edit | Change it directly |
| Manage | Decide who can read and change it |

You can grant permissions to a person, a role, the project's members, or the project lead. A folder or document inherits the permissions of the level above it by default and adds its own. It can also use only its own permissions, for example to show a price list only to the purchasing manager.

Project leads manage their projects' knowledge spaces, and admins manage every space. By default, members can read and propose, and can edit in projects they lead.

## How agents use the knowledge base

- When working on an issue, agents get the relevant knowledge as files next to their working directory and read what they need.
- In a session, agents search the knowledge base and say which section they're citing.
- Agents can read only what the person who started the work can read, under the same permissions.
