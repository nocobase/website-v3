---
title: Members and roles
description: Manage your team's accounts and roles: invite people, edit profiles, disable accounts, and reset passwords, and use built-in or custom roles to decide what each person can do.
---

You manage members in **Settings › Members** and roles in **Settings › Roles**. Agents work on behalf of the person who started the work and never have more permissions than that person, so a member's role also decides what agents working for them can do.

## Members

**Settings › Members** lists every account with its roles. You can filter by status and search by name, username, or email.

- **Invite**: click **Invite members**. See [Invite members](../setup/invite.md). Everyone joins Studio by invitation, and self sign-up is off.
- **Roles**: give someone a role or take one away. New members get the **Default role for new members** set in **Settings › General** when they first join.
- **Disable and enable**: when someone leaves the team, disable their account. The account isn't deleted, and the work they started and its records are kept. You can enable it again when needed. Disabled accounts can't be given roles.
- **Edit profiles and reset passwords**: change another person's name, username, and email, or reset their password. You change your own password in **Account settings › Account and security**.

Who can do what:

| Action | Who |
| --- | --- |
| See accounts and roles | Every member |
| Invite members | Admins and owners |
| Give roles and define roles | Admins and owners |
| Disable accounts, edit other people's profiles, and reset other people's passwords | Owners |

Only owners can change an owner's account, and only owners can give or take the Owner role. The last owner can't remove their own Owner role.

## Built-in roles

| Role | What it allows |
| --- | --- |
| Member | Every page. Raise requests and work on the issues that concern them. Manage settings and the knowledge base in projects they lead. Connect personal runtimes and create their own API keys. See all settings |
| Admin | Every page, every business operation, and every setting: connect shared runtimes, enable agents, manage deploy environments, Git connections, and organization API keys, and give and define roles |
| Owner | Everything an admin can do, plus managing accounts: disabling accounts, editing profiles, and resetting passwords |

The first administrator created when Studio is installed is also an owner, and is the system administrator. The system administrator has every permission, and this account's roles aren't managed here.

## Custom roles

When the built-in roles don't fit, click **New role** in **Settings › Roles**, or use **Duplicate as new role** on an existing role and adjust it.

The role editor has three groups:

| Group | What it covers |
| --- | --- |
| Pages | Which pages the role can open |
| Settings | Which settings the role can see or manage, such as Git connections, API keys, roles, and accounts |
| Business operations | What the role can do with issues, projects, apps, and the knowledge base, each at one of three levels: **None**, **Related**, or **All** |

What **Related** means depends on the operation, and the editor spells it out. For example:

- Editing the knowledge base: the knowledge spaces of projects I lead. System knowledge needs **All**.
- Deploying apps: apps I created, and apps linked to projects I lead.

The Owner role has every permission and can't be edited. Built-in roles can't be deleted. A role that someone still holds, or that is the default role for new members, has to be changed before it can be deleted.

> [!NOTE] There's no ceiling on what a role can grant
> Whoever can define roles can put any permission into a role, including into their own. Give "Give and take roles" and "Create, edit and delete roles" only to people you trust.
