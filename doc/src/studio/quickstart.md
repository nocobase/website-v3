---
title: Quickstart
description: Connect a runtime, agents, and a code repository, then hand your first issue to the agent team and accept the result.
---

When you finish this page you will have an online runtime, two or more enabled agents, a project built on NocoBase Core, and an issue that an agent completed and you accepted and merged.

## Prerequisites

| What you need | Requirements |
| --- | --- |
| Studio | Deployed, and you can sign in with the admin account. See [Install Studio](install.md) |
| A runtime machine | macOS, Linux, or WSL on Windows; Node.js 24 or newer, pnpm 11, and Git. A dedicated virtual machine is recommended |
| Coding tools | Installed and signed in on the runtime, for example Claude Code and Codex. Tools from two vendors are recommended, so they can review each other's work |
| Code hosting | A GitHub account or organization that can create a GitHub App, or a GitLab group |

> [!TIP] Why two vendors
> The coordinator agent sends code to an agent from another vendor for review, and falls back to a different model from the same vendor when there is none. Connecting coding tools from two vendors makes the review more effective.

## Add a runtime

A runtime is the machine where agents actually do their work.

1. Open **Agent team › Runtimes** and click **Add runtime**.
2. Choose who this runtime works for:
   - **Team**: runs work for the whole team, suited to a team server.
   - **Personal**: runs only the work you start, suited to your own computer.
3. Check the coding tools on this machine that you want to use. Only checked tools are offered work, and you can change this later.
4. Set **Max concurrent runs**, which is how many runs this machine takes at once. The default is 4. Set it according to the machine's resources and your model quota.
5. Click **Generate install command**, choose the runtime's operating system, and copy the command.
6. On the runtime, run the command as the system user that will run the agents. It downloads `nocobase-runner` and the Studio command line, registers them, and sets them to start at login.

The command carries a one-time credential that works once and expires quickly. Generate a new one if it expires. After a few seconds the runtime appears in the list, along with the coding tools it found.

::figure qs-add-runtime | Adding a team runtime

> [!WARNING] A runtime is not a security boundary
> Agents work on the runtime as this system user and can read and write everything it can access, including SSH keys and other credentials. Use a dedicated system user, container, or virtual machine, and do not install it under the same user as Studio itself.

**Done when**: the runtime shows as online, and its coding tools show as installed and signed in.

## Enable agents

Once the runtime reports in, every "coding tool · model" combination appears as an agent under the new discoveries on **Agent team › Agents**, with the status **To enable**.

1. Open **Agent team › Agents** and expand the new discoveries.
2. Find an agent you want to use and click **Fill in and enable**.
3. Write what it is **Good at**. Studio prefills a suggestion, so edit it to match how your team will use the agent.
4. Choose a default reasoning effort if you need one, then click **Enable**.

Enable agents from at least two vendors. What an agent is **Good at** is the only thing the coordinator agent uses to hand out work, so write it as the work the agent is suited for, for example:

| Agent | Good at (example) |
| --- | --- |
| Claude · Opus 5.5 | Requirements, solution design, and code review |
| Codex · GPT-5.5 | Feature development and bug fixes |
| Claude · Sonnet 5.5 | Writing and running tests, regression checks |

::figure qs-agents | Two enabled agents and one waiting to be enabled

**Done when**: the list shows two or more enabled agents, and the **Where it runs** column shows your runtime.

## Set up the coordinator agent

The coordinator agent arranges every issue handed to agents, and it needs an agent of its own to run on.

1. On **Agent team › Agents**, open **Coordinator agent**.
2. Under **The agent it runs with**, choose a **First choice**, then choose a **Fallback**. The fallback takes over when the first choice has waited in the queue too long or no runtime is available for it.
3. Save.

Leave **Allocation principles** as the built-in text for now.

::figure qs-coordinator | The coordinator's settings

**Done when**: the coordinator agent's first choice shows as online.

## Connect code hosting

### The workspace Git connection

1. Open **Settings › Integrations › Git** and click **Add connection**.
2. Choose GitHub or GitLab:
   - **GitHub**: Studio creates a GitHub App for you. Choose whether the app belongs to your account or an organization (GitHub Enterprise Server needs a server address), confirm the creation on GitHub, then install the app on the repositories you need or on the whole organization.
   - **GitLab**: enter the instance address (gitlab.com by default) and a group access token. The token needs the `api` scope, and the Developer role is recommended.
3. Check the **Webhooks** setting. Keep it on when GitHub or GitLab can reach your Studio. Turn it off when Studio is only on an internal network, and Studio polls every 60 seconds instead.

### Your own Git account

Open **Account settings › Git** and connect your own GitHub or GitLab account. Once connected, the PRs that agents open for you and the merges you make in Studio are done as you. Without a connection, the workspace connection is used. Every team member should connect their own account.

> [!NOTE] Protect the default branch
> Studio does not protect branches for you. Turn on protection rules for the repository's default branch on GitHub or GitLab.

**Done when**: the connection under **Settings › Integrations › Git** shows as connected, and **Account settings › Git** shows your account.

## Create a project

1. Open **Development › Projects** and click **New project**.
2. **Basics**: enter a project name and description, for example "Supplier Management".
3. **Code**: choose **New repository**, choose the Git connection and the owner, and enter a repository name. For the initialization method, choose **NocoBase app default template**, and follow the prompt to choose which agent does the initialization (**Initialization agent**).
4. **Preview**: this step belongs to the release and deployment module, so click **Skip** for now.
5. Click **Create project**.

Studio creates the repository on the code hosting platform and generates an "Initialize project" issue. The agent in charge creates the app from the NocoBase app template on the runtime and pushes it to the default branch as the first commit. Every later issue in the project waits for this one to finish.

> [!NOTE] Initialization needs a runtime
> Initializing from the NocoBase app template needs an online runtime with Node.js 24 and pnpm 11. If no runtime is online right now, the project is created first, and initialization starts once a runtime comes online.

**Done when**: the "Initialize project" issue is **Done** and the repository contains the app code.

> [!PENDING] CI and previews
> Generating a preview environment for each PR automatically and viewing build results in Studio belong to the release and deployment module. They will be added as the module matures.

## Hand over your first issue

1. In the project, click **New issue**. Studio opens the agent panel and starts a new session. You have not connected your own computer yet, so the agent team replies.
2. Describe the first issue. It can be simple, for example:

   ```text
   Create a "Suppliers" data table in the app with these fields: name, contact, phone, and status (active/paused). Add a "Suppliers" page to the navigation where I can add, edit, and view suppliers.
   Acceptance: after signing in, I can open the "Suppliers" page from the navigation, add a supplier, and see it in the list.
   ```

3. After the agent creates the issue, click **Start** in the session.

If you would rather fill in a form, click **Fill in manually** in the panel, enter a title and description, choose **Start now** under **When to start**, and click **Create and start**.

The issue moves to **In progress**, and its executor becomes the coordinator. Open the issue and you will see:

- The **Now** line at the top says what the issue is waiting on, for example which agent is working and on which machine.
- **Activity** holds the coordinator's handoffs and the worker agents' replies.
- **Runs** holds the process of every run.

::figure req-now | An issue in progress

## Accept the work

After development, checks, and review are done, the issue moves to **In review**, and you will see it under "Waiting for you" in **My issues**.

1. Open the issue. The "Needs you" card at the top says what you need to do, and below it is the delivery report: the situation before the change, the agreed plan, what changed, how it was verified, plus the acceptance criteria and screenshots.
2. Click **View changes** to look at the PR.
3. If the result is what you expected, click **Merge** and confirm. Once the PR is merged, the issue becomes **Done**.
4. If something is wrong, select **Send back for changes**, write what needs to change, and click **Send and return to In progress**. The coordinator arranges the changes and hands the issue back to you when they are done.

::figure req-accept | An issue waiting for acceptance

**Done when**: the issue is **Done** and the repository's default branch contains the change.

## Next steps

- Invite colleagues under **Settings › Members**, and have them start with [Daily use](progress/my-tasks.md).
- Connect your own computer, then use **My agent** in **My sessions** to discuss requests and split them into issues. See [My sessions](team/sessions.md).

## FAQ

**The runtime is not online.** Check that `nocobase-runner` is running and that the machine can reach Studio's address. A runtime with no heartbeat for 150 seconds shows as offline.

**No new agents appear on the Agents page.** Only the coding tools you checked in **Add runtime** report in, and each tool must also be signed in on the runtime as the system user that runs `nocobase-runner`. After you sign in, wait for one heartbeat and they appear.

**The issue stays queued.** The **Now** line on the issue page, or the agent queue under **Development › Issues**, gives the reason: no runtime is online, concurrency is full, or the agent only runs on someone else's personal runtime. If a run waits more than 24 hours without being picked up, it fails and the owner gets a card with a retry option.

**"Initialize project" never starts.** Make sure an online runtime has Node.js 24 and pnpm 11 and can reach npm.

**Redirect fails after connecting GitHub.** Check that `APP_PUBLIC_ORIGIN` is the address browsers actually use to reach Studio. See [Install Studio › Environment variables](install.md#environment-variables).
