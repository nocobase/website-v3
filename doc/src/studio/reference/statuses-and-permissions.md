---
title: Issue statuses and permissions
description: The six issue statuses and who can change them, what the built-in roles can do with issues, projects, apps, the knowledge base, and settings, and what agents can and can't do.
---

## Issue statuses

Every issue is in one of six fixed statuses. Projects can't add, rename, or remove statuses.

| Status | Meaning | Who moves an issue here |
| --- | --- | --- |
| Backlog | Not started yet. Agents leave it alone | People, or choosing **Later** when creating the issue |
| In progress | The agent team is working on it | People clicking **Start**, or the coordinator agent carrying on after a reply |
| Blocked | Waiting for the issue owner to decide something | The coordinator agent when it asks a question, or a person stopping a run |
| In review | Delivered, waiting for the issue owner to accept it | The coordinator agent when it delivers |
| Done | Accepted | Automatically when all the issue's linked PRs are merged, or a person |
| Cancelled | No longer needed | People |

- People can move an issue to any status.
- The coordinator agent moves issues only between In progress, Blocked, and In review, and every time it moves one to Blocked or In review, it says what it needs from the owner. It never moves an issue to Done or Cancelled.
- Worker agents never change an issue's status.
- When an issue moves to Blocked or In review, its owner is notified.

Starting an issue makes the coordinator agent its executor. Only the issue owner, or someone who can edit the issue, can start it. An issue whose executor is a person or nobody has to be started before agents work on it, and mentioning an agent in a comment doesn't get around that.

## What the built-in roles can do

What "related" means depends on the object. See the note below the table.

| Action | Member | Admin and Owner |
| --- | --- | --- |
| See projects and issues | Related | All |
| Create projects | Yes | Yes |
| Manage a project's settings | Projects they lead | All |
| Delete projects | No | Yes |
| Create, edit, comment on, and close issues, and change owners | Related | All |
| Delete issues | No | Yes |
| Change agents | Their own | All |
| See, configure, and deploy apps | Apps they created, and apps linked to projects they lead | All |
| Create and delete apps, and deploy to protected environments | No | Yes |
| Read the knowledge base and propose changes | Projects they can see, and system knowledge | All |
| Edit the knowledge base and manage its permissions | Projects they lead | All |
| See settings | Yes, except organization API keys, Git connections, and knowledge base search settings | Yes |
| Change settings: agents, runtimes, deploy environments, Git connections, and organization API keys | No | Yes |
| Connect personal runtimes and create their own API keys | Yes | Yes |
| Invite members, and give and define roles | No | Yes |
| Disable accounts and reset other people's passwords | No | Owners only |

"Related" issues and projects are those in projects you belong to, plus issues you own, created, are working on, or follow. Custom roles can combine these permissions as you need. See [Members and roles](../admin/members-and-roles.md).

## What agents can do

- An agent works on behalf of the person who started the work and never has more permissions than that person. The coordinator agent and every step it arranges act for the issue owner. An agent in a session acts for you.
- Worker agents can commit, push, and open PRs on the issue's branch, but can't rewrite history that has already been pushed, and the code host guards protected branches.
- In release management, agents can at most view apps, read logs, and deploy to unprotected environments. They can't change or delete apps or deploy to protected environments.
- Agents can't write to the knowledge base, or propose changes to it.

Only people can:

- Accept issues and merge PRs.
- Approve deployment requests.
- Manage members, roles, and API keys.
