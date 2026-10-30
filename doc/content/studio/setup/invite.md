---
title: Invite members
description: Invite members to Studio and assign projects and roles.
---

Once the project is ready, administrators can invite requesters and teammates. Before sending invitations, [configure invitation email](../admin/notifications.md#invitation-email).

## Invite people

1. Open **Settings › Members** and click **Invite members**.
2. Enter your colleagues' email addresses, one per line or separated by commas or spaces, up to 50 at a time.
3. Under **Projects**, choose the projects they'll work on. Invitees join these projects as members.
4. Click **Send invitations**.

![Enter member email addresses and select their projects](https://static-docs.nocobase.com/studio-en-setup-invite-20261030.png)

When email is configured, each address gets an email with a link to set a name and password and join. The link is valid for 7 days.

If Studio has no email set up yet, the result shows **Email not sent**. Click **Copy invitation link** and send the link to your colleague yourself.

## Roles

New members get the default role set in **Settings › General** when they join. Studio has three built-in roles:

| Role | What they can do |
| --- | --- |
| Member | Raise requests, follow and accept their own issues, manage settings and the knowledge base in projects they lead, and connect personal runtimes |
| Admin | Every page and every setting: connect shared runtimes, enable agents, and manage deploy environments, Git connections, and organization API keys |
| Owner | Everything an admin can do, plus managing accounts: editing profiles, deactivating accounts, and resetting passwords |

When you need to, change someone's role in **Settings › Members**, or define a new role in **Settings › Roles**. See [Members and roles](../admin/members-and-roles.md).

**Done when**: invited members appear in the member list and can open their assigned projects.

Share [Get started](../join/index.md) with members. They can sign in, submit a request, follow development, and accept the result. Connecting a personal Git account or runtime is optional.
