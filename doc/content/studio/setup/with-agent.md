---
title: Let an agent set up Studio
description: The recommended way to set up Studio. Hand a prompt to your agent, such as Claude Code or Codex, and it follows the docs to deploy and configure Studio, while you step in only where a person is needed. When it's done, it asks whether to do a trial run with an issue that takes a few minutes.
---

| | What happens | Time |
| --- | --- | --- |
| Setup | Deploys Studio, connects your code host, connects a runtime, and enables agents. Then it stops, reports back, and asks whether to do a trial run | About half an hour, with a few steps you do yourself |
| Trial run (optional) | If you agree, it creates a trial project with the simplest possible issue and watches the agent team take it to In review | About 5 minutes |

## What you need

| What | Notes |
| --- | --- |
| A server | Linux with Docker and Docker Compose, which your agent can reach over SSH. See [Install Studio](install.md) |
| A NocoBase Pro token | Used to pull the Studio image. When it's needed, the agent asks you to sign in to the registry on the server yourself |
| A code host account | GitHub, GitLab, or Gitee. For GitLab or Gitee, have a token ready. See [Connect Git](git.md) |
| A runtime | A dedicated system user on the same server, or another machine, with Node.js 24 and Claude Code, Codex, or other coding tools installed and signed in. The agent installs whatever else is needed by following [Connect a shared runtime](shared-runtimes.md) |
| Your agent | Any coding tool, such as Claude Code or Codex, to carry out the prompt below |

## Setup

Replace the parts in angle brackets with your own details and give the prompt to your agent:

```prompt
Please set up NocoBase Studio for me.

Docs: https://docs.nocobase.com/llms.txt lists the Markdown version of every page in the NocoBase docs. For each step, read the matching page in the Studio docs first, follow its steps, and check the result against the page's "Done when": Install Studio, Connect Git, Connect a shared runtime, Enable agents.

Environment:
- Server for Studio: <how to SSH in>
- Studio address: <https://studio.example.com>, or http://<server address>:13000 if there is no domain yet
- Code host: <GitHub, GitLab, or Gitee>, with repositories under <account or organization>
- Shared runtime: <how to SSH in>, running the runner as system user <username>, with <Claude Code, Codex> already installed and signed in

Do these in order:
1. Deploy Studio, version <version>. When the NocoBase Pro token is needed, ask me to sign in to the registry on the server myself, and never let the token pass through you. When you're done, tell me the address and which file on the server holds the first administrator's password.
2. After I sign in to Studio, I'll give you the setup instructions from "Connect a local Coding Agent". Follow them to install nb-studio, sign in, and install the skills. Signing in needs my approval in the browser, so keep the sign-in command running while you wait. From then on, use nb-studio for everything in Studio.
3. Connect the code host.
4. Generate a registration credential for the shared runtime, then install and register the runner there, adding whatever the docs' "Prepare a machine" section lists. Confirm it is online and its coding tools show as signed in.
5. Check the enabled agents and write what each is "Good at" based on its strengths. Pick a first choice and a fallback for the coordinator agent.
6. Then stop and give me a summary: the Studio address, the result of each step and where to see it in the interface, and anything left for me to do. Then ask me whether to do a trial run with the simplest possible issue. If I agree, follow the prompt in the "Trial run" section of the "Let an agent set up Studio" page.

Rules:
- When you need me to do something in the browser, give you a token, or answer a question, stop and tell me where to go and what to do.
- Keep secrets, passwords, and one-time credentials out of the command history, the logs, and your replies. Anything you need to hand me goes into a file only I can read, and you tell me the path.
- Don't touch any service on the server that has nothing to do with Studio.
```

### The steps you do yourself

The agent stops at each of these and tells you what to do. Do it, then tell the agent to continue:

| When | What you do |
| --- | --- |
| Before the image is pulled | Sign in to the registry on the server: run the `docker login` command the agent gives you, and enter your NocoBase Pro token at the prompt |
| After deployment | Sign in to Studio as the first administrator and change the password. In the account menu at the top right, click **Use Studio in your agent**, and give the agent the setup instructions from **Connect a local Coding Agent** |
| When the agent signs in to nb-studio | Open the address it gives you in your browser, check the code, and click **Approve** |
| When connecting GitHub | Create a GitHub App in **Settings › Integrations › Git**: choose the account under **Owner of the app**, turn off **Webhook** if Studio has no public address, confirm on GitHub, and choose **All repositories** when you install it. For GitLab or Gitee, you only need to provide a token |

### When setup is done

Everything below should be done in the agent's final summary, and you can check each item in Studio yourself:

| Done | Where to check |
| --- | --- |
| You can sign in to Studio, the interface is in your team's language, and the sign-in page has no **Sign up** link | The sign-in page |
| The code host is connected | **Settings › Integrations › Git** |
| The shared runtime is online, and its coding tools show **Signed in** | **Agent management › Runtimes** |
| At least two agents are enabled, each with a **Good at** description | **Agent management › Agents** |
| The coordinator agent has a first choice and a fallback | The coordinator agent section at the top of **Agent management › Agents** |

That's Studio set up. When the agent asks about a trial run, you can let it go ahead, or skip it and go straight to [Create a project](new-project.md) and [Invite members](invite.md).

## Trial run

If you agree to a trial run, the agent follows the prompt below. You can also give it to the same agent any time later:

```prompt
In NocoBase Studio (<address>), do a trial run of the agent team's workflow with the simplest possible issue. nb-studio is already signed in.

1. Create a project called "Studio trial run" with a new repository named <repository name>. Choose the empty repository option, not the NocoBase app template.
2. Create an issue in this project and start it, with this description: "Create hello.md in the repository root with one line: This repository is for a NocoBase Studio trial run. This repository has no CI, so don't wait for check results. Once the review passes, hand it to me for acceptance."
3. Follow the issue until it reaches In review. When the coordinator agent asks a question, pass it on to me.
4. Tell me the addresses of the issue and the PR, and how long each step took.

I'll accept and merge in Studio myself. Don't merge the PR for me.
```

A few minutes later, the issue reaches **In review**. In those few minutes, the agent team does all of this: the coordinator agent hands the step to an agent that is good at small changes, which edits the file and opens a PR. The coordinator agent then has another model review the PR, and once the review passes, it attaches a delivery report and hands the issue to you for acceptance.

Open the issue, read the delivery report, and merge. The trial project has no check results, so the button reads **Merge anyway**. Once merged, the issue moves to **Done**, and the whole workflow has run end to end.

You can delete the trial project afterwards. For a real business system, create a project from the NocoBase app template as described in [Create a project](new-project.md).

## When the agent gets stuck

See which step it stopped at and read the matching page, or hand that page straight to the agent:

| Step | Page |
| --- | --- |
| Deployment | [Install Studio](install.md) |
| Connecting the code host | [Connect Git](git.md) |
| Connecting a runtime | [Connect a shared runtime](shared-runtimes.md) |
| Agents and the coordinator agent | [Enable agents](agents.md) |
| Creating and initializing a project | [Create a project](new-project.md) |
| Previews and deployments | [Connect CI](ci.md) |
| The first real request | [Walk through your first request](first-request.md) |
