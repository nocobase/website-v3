---
title: How an app gets built
description: Using the purchasing app, from creation to launch and on to the next improvement: what people do, what agents do, and what Core provides at each step.
---

Zhou Hang, who leads purchasing, makes this request: **"Keep a profile for each supplier. Buyers submit purchase orders, and any order over 50,000 yuan needs finance approval. After goods arrive, upload the signed receipt. Every day, remind approvers about the orders piling up."** Here is the whole path of this app from nothing to done.

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>Create the app</strong><span class="who human">Developer</span><span class="who agent">Agent</span></div><p>Create the app from the default template, which gives you a code repository and an empty app you can sign in to.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>State the requirements</strong><span class="who human">Zhou Hang</span></div><p>Who uses it, what gets recorded, how the process runs, who can see and change what, and who adjusts it after launch.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Build</strong><span class="who agent">Agent</span></div><p>Read the skills, use the existing plugins, write the tables, APIs, pages, workflows, and admin pages, and run tests.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Try and accept</strong><span class="who human">Zhou Hang</span><span class="who human">Developer</span></div><p>Walk through the process with different accounts and check against the acceptance checklist.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Configure</strong><span class="who human">App administrator</span></div><p>In <b>System settings</b>, add users, assign roles, and set approvers and amount thresholds.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Deploy and launch</strong><span class="who human">Operations</span><span class="who agent">Agent</span></div><p>Build the deployment package and install it on a server. After launch, the app runs on its own.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Keep improving and upgrading</strong><span class="who human">Zhou Hang</span><span class="who agent">Agent</span></div><p>New requests follow the same path. When NocoBase has a new version, the agent upgrades against the new template.</p></div></li>
</ol>

## 1. Create the app

A developer has an agent create the app in an empty directory, or runs `pnpm create @nocobase/app` directly. A few minutes later you have:

- A code repository: `client/` (browser side), `server/` (server side), `database/` (migrations), `tests/`, plus `AGENTS.md` and `.agents/skills/` for agents.
- An app you can sign in to. The home page says "Describe it, and your agent builds it" and lists Core's built-in capabilities, each with prompts you can copy.
- The default template has already registered 16 plugins, including authentication, authorization, users, files, notifications, mail, and scheduled tasks, and you can see them in **System settings › App foundation**.

For the steps, see the [Quick start](../quickstart.md).

## 2. State the requirements

Zhou Hang explains the requirements to the agent, or writes them up in a paragraph for a developer. A good requirement makes these things clear:

| What to make clear | In the purchasing app |
| --- | --- |
| Who uses it | Buyers, department managers, finance, and warehouse receivers |
| What gets recorded | Suppliers: name, contact, qualification expiry date. Purchase orders: number, item, supplier, amount, applicant |
| The process | Draft → pending approval → pending purchase → arrived → completed. A rejection needs a reason, and an order goes back to the applicant for changes |
| Who can see and change what | Buyers see only their own orders; managers see their department's; finance sees all |
| Who adjusts it after launch | The amount threshold for finance approval is adjusted by an administrator |
| What counts as done | Walk through it with four accounts, and the results match the rules above |

You don't need to say which plugin to use or which file to write it in. The agent decides that from the skills. For more on how to write requirements, see [Working with agents](../develop/working-with-agents.md).

## 3. The agent builds

The agent works in the app directory. It follows the app's `AGENTS.md` and the skills in `.agents/skills/`, roughly like this:

1. **Check existing capabilities first.** The app development skill requires the agent to look at the installed plugins first, and not rewrite capabilities such as permissions, notifications, and scheduled tasks.
2. **Add missing plugins.** Approval is a commercial plugin. If the app doesn't have it yet, the agent tells you that a license is needed, and after you confirm, registers it with `pnpm nocobase plugin register` and reads that plugin's skill.
3. **Write the business code.** The supplier and purchase order tables (migration files), APIs with permission checks, list and detail pages, the order workflow (record lifecycle), and the 9 a.m. daily reminder (a scheduled task).
4. **Build the admin pages.** The app development skill requires agents to deliver admin pages by default: enable the **User management** and **Roles and permissions** pages the template prepares, add **Workflow management**, and make the amount threshold a workflow parameter that administrators can adjust.
5. **Verify.** Run type checks and tests, and confirm page and API permissions with accounts in different roles.

In the code repository you can see what changed: new migration files, APIs under `server/routes/`, pages under `client/pages/`, and an extra line in the plugin lists.

## 4. Try and accept

Refresh the app to try it. Zhou Hang and the developer walk through it with different accounts:

- A buyer submits an order for 60,000 yuan, and you confirm it goes into finance approval.
- Switch to another buyer and confirm they can't see this order.
- Call the API directly to change the order status, and confirm it is rejected (status can change only through workflow actions).
- Finance rejects it, and you confirm the order goes back to the applicant and the reason is recorded in the processing history.
- Open **System settings › App foundation** and confirm the capabilities in use are lit: data modeling, permissions, workflows and approvals, notifications, and so on.

For anything that doesn't match, tell the agent the same way and check again.

## 5. Administrator configuration

The app administrator finishes the pre-launch configuration in **System settings**, with no code changes:

- **User management**: add accounts for buyers, managers, finance, and receivers.
- **Roles and permissions**: assign each person a role and check the data scopes.
- **Workflow management**: view the purchase order flow chart and set the finance approval threshold to 50,000 yuan.

## 6. Deploy and launch

Operations (or an agent) builds the deployment package, installs it on a server with PM2 or Docker, and configures the database, public address, and secrets in the server's `config.yml`. After launch the app runs on its own. See [Deployment](../operations/deployment.md).

With Studio, this step is handled by Studio's release flow: build, approval, deployment, and rollback if something goes wrong.

## 7. Keep improving and upgrading

A month later, Zhou Hang wants to grade suppliers. The new request follows steps 2 to 6 again. The agent keeps building on the existing code, and the existing tables are adjusted through new migrations without affecting existing data.

When NocoBase releases a new version, the developer has an agent upgrade: following the `nocobase-app-upgrade` skill, the agent merges the changes against the new template without undoing the app's own edits, then runs the tests again. See [Upgrade NocoBase](../develop/upgrade.md).

> [!NOTE] Doing the same in Studio
> Steps 2 to 4 are one issue in Studio: you state the request in a session, the coordinator agent arranges for execution agents to build, check, and review it, and finally hands it to you for acceptance. See [How a request gets done](../../studio/intro/how-a-task-gets-done.md).

The next page, [Core concepts](concepts.md), explains the app, template, plugins, skills, and system settings that appeared here one by one.
