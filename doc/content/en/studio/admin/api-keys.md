---
title: API keys
description: Keys that CI, scripts, and other systems use to call Studio. Organization keys belong to no one and have only the permissions chosen for them. Personal keys work as you.
---

Wherever no person is clicking through the browser, such as CI deploying an app, a script creating issues in bulk, or another system reading reports, API keys are how it calls Studio. There are two kinds:

| | Organization API key | Personal API key |
| --- | --- | --- |
| Where it's managed | **Settings › API keys** | **Account settings › API keys** |
| Who it acts as | Itself. It belongs to no one, so it keeps working if the person who created it leaves | You |
| What it can do | Only what was chosen for it | What you can do, narrowed to the scope chosen for it. When you lose a permission, the key loses it too |
| Who can create one | Admins and owners | Every member, unless the organization has turned personal keys off |
| Good for | CI and long-running integrations | Your own scripts |

## Create an organization key

1. Open **Settings › API keys** and create a new key.
2. Enter a name and description, such as "GitHub Actions deployment".
3. Choose its permissions. You can **Start from a preset** and adjust it:
   - **CI deployment**: upload releases and deploy, optionally limited to a few apps.
   - A CI preset that uploads releases without deploying, for CI that shouldn't deploy on its own.
   - **Read only**: read everything you can read.
4. Choose when it expires, 90 days by default, or **Never**.
5. Copy the key once it's created. It's shown only this once and can't be viewed again.

Permissions are grouped by area, such as projects, issues, agents, runtimes, apps, deploy environments, the knowledge base, and reports, each with levels such as read, write, and manage, and some can be limited to particular projects or apps. You can grant only permissions you have yourself, and levels you don't have are grayed out.

## What keys can't do

However broad their permissions:

- Keys can't create, rotate, or revoke keys. Only signed-in people can manage keys.
- Keys can't change or delete apps or deploy straight to a protected environment. They can only request a deployment for an approver to approve.
- The endpoints behind the inbox, notifications, code host connections, and account management don't accept keys.

Wherever a key has done something, its name appears there, marked as an API key.

## Rotate, disable, and delete

- **Rotate**: the new key keeps the same name, permissions, and expiry, and the old one stops working immediately. Put the new value into your CI's secret settings.
- **Disable**: it stops working immediately, and you can enable it again when needed.
- **Delete**: revokes the key. What it did still shows its name.

Every organization key has a **History**: who created, renamed, changed permissions on, rotated, disabled, or deleted it, and when.

## A repository's CI key

When you set up CI for a repository, Studio creates an organization key named "<repository> CI", marked "Managed by <repository>", with permissions limited to that repository's apps. For its expiry reminders and how to rotate it, see [Connect CI](../setup/ci.md). If you disable or delete it here, CI stops deploying, and the project lead is notified.

## Turn off personal keys

If you don't want members creating their own keys, remove "Create API keys of one’s own" from the relevant roles in **Settings › Roles**. Existing keys can still be viewed and revoked.
