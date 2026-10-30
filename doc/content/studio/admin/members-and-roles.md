---
title: Members and roles
description: Manage accounts, roles, and team access.
---

Manage accounts under **Settings › Members** and permissions under **Settings › Roles**. Agent work is also limited by the requester's permissions and the operations available to Agents.

![Member accounts, roles, and status](https://static-docs.nocobase.com/studio-en-guide-members-20261031.png)

## Manage members

Search by name, username, or email, and filter active or disabled accounts. New members join by [invitation](../setup/invite.md). Set their default role under **Settings › General**.

| Action | Allowed by default |
| --- | --- |
| View accounts and roles | Members, administrators, owners |
| Invite members, assign and define roles | Administrators, owners |
| Edit other accounts, disable accounts, reset passwords | Owners |

Disabling an account prevents further use while preserving its work history. Enable it again when needed. Members change their own passwords under **Account settings › Account & security**.

Only owners can grant or remove the owner role. The last owner cannot be removed. The initial system administrator has full access; its roles are not edited here.

## Built-in roles

- **Member**: submit requests, handle related tasks, manage projects they lead, and connect personal runtimes.
- **Admin**: manage business settings, shared runtimes, Agents, Git connections, organization keys, and roles.
- **Owner**: administrator capabilities plus account administration.

Project visibility determines which projects ordinary members can access. See [Task states and permissions](../reference/statuses-and-permissions.md) for business permissions.

## Custom roles

Create a role or copy an existing one, then adjust pages, settings, and business actions.

![View and maintain team roles](https://static-docs.nocobase.com/studio-en-guide-roles-20261031.png)

Business actions can apply to none, related records, or all records. The editor explains what related means for each action, such as projects the member leads. Page permissions control entry points; business permissions control operations.

Remove member assignments and default-role references before deleting a role. Role managers can grant powerful permissions, so reserve that ability for members responsible for access management.
