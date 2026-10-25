---
title: Quick start
description: About 20 minutes: install the skills, create an app, get to know its home page and App foundation, then have an agent build the first feature and accept it.
---

## Prerequisites

- Node.js 24 or later, and pnpm 11. On Windows, work inside WSL.
- A coding tool that can load skills, such as Claude Code or Codex.
- An empty directory to hold the app.

## 1. Install the skills

Run this in a terminal and choose the coding tool you use when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill '*' -g
```

This installs the NocoBase 3 skills globally, including `nocobase-create-app`, which teaches an agent to create apps. After it finishes, reopen a session in your coding tool so it picks up the new skills. To update later, run the same command again.

## 2. Create the app

Open your coding tool in the empty directory and tell the agent:

```text
Create a NocoBase 3 app named purchasing in the current directory. Use SQLite for now, and start it once it's created.
```

The agent creates the app, generates the configuration, checks it, and starts the development server. You can also run the commands yourself:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta purchasing --template-tag=beta
cd purchasing
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Open the `Local:` address printed by `pnpm dev`. The address includes the app's path, for example `/main/`. Sign in as the initial administrator: the default username is `nocobase` and the password is `admin123`, which come from `users.initialAdmin` in `config.yml`. Change the password after signing in.

**Done when**: you can sign in to the app and see the home page.

## 3. Get to know the home page

The new app's home page explains how the app is built: describe what you need in plain words, hand it to an agent to build, then refresh the page to check and refine. The **Built-in capabilities** below lists the Core capabilities agents use directly, each with prompts you can edit and copy.

::figure core-app-home | The new app's home page. Open any capability to get a sample prompt

At this point the app has only the home page. Sixteen plugins, covering sign-in, users, permissions, files, notifications, and more, are already registered and wait for your first request to put them to use.

## 4. Build the first feature

Start a new coding tool session in the **app directory**. When the app was created, the development skills were synced to the app's `.agents/skills/`, and a new session reads them along with the app's `AGENTS.md`. Send the agent the sample request from the home page:

```text
Build a purchase order application.

An order has a number, item, applicant, amount, and approval status. Applicants create orders and see only their own; reviewers see all pending orders and approve or reject them.
After a decision, notify the applicant in the inbox with a link to the order.
```

The agent puts the existing capabilities to work: it writes the order table and its migration, writes the APIs and pages with permission checks, sets up the "Applicant" and "Reviewer" roles, sends in-app messages through the notification plugin, and enables the user and permission pages in **System settings**. When it finishes, it tells you what changed and how to verify it.

Refresh the app and check the following:

- In **System settings › User management**, create two accounts, one with the applicant role and one with the reviewer role.
- Create an order as the applicant, then switch to another applicant account and confirm it cannot see this order.
- Approve the order as the reviewer.
- Back in the applicant account, open the inbox (the template's `/inbox` page, with the agent deciding where to put the entry). There should be one notification, and opening it should lead to the order.

For anything that doesn't match, tell the agent the same way.

## 5. See which capabilities are used

Open **System settings › App foundation**. It lists the Core capabilities the app uses, in 13 categories. The categories the feature you just built relies on light up, for example data modeling, permissions, and notifications. Open one to see what it does in this app and which packages provide it.

::figure core-foundation | **App foundation**: which Core capabilities the app uses. This figure shows the state after the whole purchasing app is built

**Done when**: applicants and reviewers each see and do only what they should, and the applicant receives an in-app message after approval.

## Next

- Read [How an app gets built](intro/how-an-app-gets-built.md) to see what steps remain between here and launch.
- Read [How plugins work](intro/how-plugins-work.md) to learn about plugins, components, and admin entry points.
- Look up [Capabilities overview](capabilities/index.md) by what you need, such as adding multi-level approval, attachments, and daily reminders to orders.
- When you are ready to launch, see [Deployment](operations/deployment.md).

## FAQ

### The agent didn't follow NocoBase's way and wrote everything from scratch

Make sure the session was started fresh in the app directory and that `.agents/skills/` exists. If the directory is missing or out of date, run `pnpm nocobase skills sync` in the app directory, then start a new session.

### The app won't open, or the address is wrong

Use the `Local:` address printed by `pnpm dev`, including the app path in it (for example `/main/`), and don't build the address from the port alone. If the app isn't running, run `pnpm nocobase config check` and fix the configuration as prompted.

### I can't see **App foundation**

Only administrators with full permissions can open it. Sign in as the initial administrator.
