---
title: Build enterprise apps that keep evolving with NocoBase 3
metaDescription: From a requirements document, creating the app, building the system and upgrading Core, to teamwork, issues, shared knowledge and deployment in Studio, this guide shows how to build an enterprise app with NocoBase 3 that can keep evolving for years.
---

## Introduction

AI-assisted development, or vibe coding, can produce a system that looks like it works in very little time. For a personal app or a simple one, that is usually enough. Build an enterprise app the same way, though, and as it keeps evolving and needs maintenance, problems start to show:

1. Many foundational capabilities have to be built from scratch, such as permissions, workflows and approvals
2. The underlying architecture can slowly drift out of control as models change and developers come and go
3. There are too many parallel tasks and too many agent messages for people to keep up with
4. Knowledge and experience gained during development are hard to capture and share

With these problems in mind, and with agents becoming capable so quickly, NocoBase offers its own answer: let enterprises build their own apps quickly in the age of agents, while solving the problems above. This guide draws on our own experience to show how to build enterprise apps that keep evolving with NocoBase 3.

## Before you start

In our experience, it's best not to begin by asking the AI to build an "XX system" straight away. Generating a whole system from a single sentence is risky for an enterprise app and easily leads to rework or major rewrites later.

Instead, start by preparing a system design document or a requirements document for the product. The point is to talk it through with the agent first: what app you are building and what it needs to do. For example:

```prompt
Write a design document for a CRM system for the XXX industry. Cover an overview of the solution, the design goals, the core business objects and how they relate, the key business processes and the main pages, and how AI agents can assist with or directly handle routine work to make the business team more productive. Research a few leading products on the market before you write.
If you have any questions while writing, ask me at any time.
```

You can also use one of the well-known spec tools to help, such as:

- [OpenSpec](https://github.com/Fission-AI/openspec)
- [superpowers](https://github.com/obra/superpowers)

## Development workflow

### Create the app

With the preparation done, you can start building the app on NocoBase 3. Follow [Create app](../core/getting-started/create-app.md) to install our skills and create a NocoBase 3 app directory.

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
mkdir my-app
cd my-app
```

Then open your coding agent in the app directory and enter a prompt like the following (the database can be MySQL, PostgreSQL, SQLite and so on):

```prompt
Create a NocoBase 3 app for local development in the current directory.
Use the default template and SQLite, and follow the create-app guide to prepare and check everything.
Once it starts, tell me which address to open and how to complete the first sign-in.
```

Once the NocoBase 3 app is initialized, the agent tells you how to open it and sign in.

![](https://static-docs.nocobase.com/20261029150256019.png)

### Build the system

Next, start a new session of your coding agent in this directory (make sure it loads the development skills that NocoBase 3 ships in the project) and enter a prompt like the one below, putting what you prepared earlier to use. We recommend adding those documents to the project's repository too, for example under `docs/`, as the initial system outline and requirements.

If your company has its own design guidelines (brand colors, font sizes, component styles and so on), give them to the agent together with the requirements before it starts building, and ask it to follow them. If you don't have any, ask the agent to follow the design guidelines built into NocoBase 3:

```prompt
Read the xxx design document I put in the xxx directory, then build this PMS system on the capabilities NocoBase 3 provides, following the NocoBase 3 framework, design guidelines and development skills.

If you have any questions, ask me before you start or along the way.
```

While building, the AI refers to the material you prepared. With that material plus the foundational capabilities of NocoBase 3, it can deliver a business system that matches the requirements in a fairly short time. All you need to do is describe your business needs, without worrying much about how the underlying logic is implemented.

From the requirements document, you get a first version of the business system:

![](https://static-docs.nocobase.com/20261028161432844.png)

What lets the AI build a reliable business system quickly once it understands the requirements is the foundation that NocoBase 3 provides: [NocoBase Core](https://www.nocobase.com/core/). NocoBase Core is the foundation for developing and running business apps. It provides an app framework along with shared capabilities such as sign-in, users, permissions, files and notifications that your app can use directly. Core provides:

- **App template and runtime framework**: start from a project that already runs, with a client, a server and runtime configuration, and add your own features.

- **Shared capabilities**: use authentication, users, permissions, data access, file storage, notifications and more through plugins and base libraries, combined as your app needs.

- **UI component library**: reuse tables, forms, dialogs and other components, as well as business blocks. Components are installed into your app's source, so you can change them as needed.

- **Development tools and skills**: the command line handles configuration, migrations, plugin management and builds; skills give the agent guidance that matches the versions of your dependencies.

With these building blocks, the agent can put a business system together quickly, like building with bricks.

If you're not sure which NocoBase Core capabilities an app uses, the foundation plugin shows you at a glance. Apps built with the default template include it:

![](https://static-docs.nocobase.com/20261028161615621.png)


At this point, two of the problems above are solved:

1. Many foundational capabilities have to be built from scratch, such as permissions, workflows and approvals
2. The underlying architecture can slowly drift out of control as models change and developers come and go

As development continues, the agent keeps following NocoBase Core's conventions and builds on the capabilities that already exist, so different developers and agents all produce reliable apps that follow the same standards.

If you're interested in what Core provides and how it works, see the [Core documentation](../core/index.md).

### UI components

We provide a set of ready-to-use business components, which you can browse at https://ui.nocobase.com/#agent-queue. If you'd rather not reimplement business components, look through them, copy a component's install command, and hand it to your agent.

```prompt
Look at the agent queue component on https://ui.nocobase.com/, install it with `npx shadcn@latest add @nocobase/agent-queue`, and use it on a page to implement XXX.
```

![](https://static-docs.nocobase.com/20261029085625114.png)

### Upgrade Core

Once the app is built and you're evolving it, you won't need to upgrade Core very often. To keep the business system stable, in most cases we recommend simply carrying on with business development. If you do want to upgrade, because of a bug in Core or a new capability, we provide skills for upgrading Core, so you no longer upgrade each Core plugin and the framework by hand.

Use a prompt like the following to upgrade the project's Core version:

```prompt
Upgrade the NocoBase Core used by this app to the latest version in the current release channel.

First check and give me a concrete plan, without changing the project yet:
- The current version and the version you plan to upgrade to. If it is already on the target version, say no upgrade is needed, and don't downgrade.
- Which features, dependencies, configuration and plugins this upgrade affects, and which changes need my decision.
- How existing business features, themes, user permissions and data will be kept, and how to recover if something goes wrong.
- Whether there are data changes that can't be undone, or historical records that need fixing, with the reason and impact of each.

After I confirm the plan, follow the project's upgrade guide and make the changes on a separate branch.
Don't overwrite the current app or empty the database, and don't consider it done after only changing version numbers.
Verify in a separate test environment that existing data, sign-in, regular users' permissions and task operations still work.
Finally, tell me the versions before and after, the adjustments you made, the verification results and anything left unfinished.
This time, only prepare and verify the upgraded project. Deploying to production will be confirmed separately.
```

During the upgrade, the agent follows the skills and upgrades only Core itself, changing the business logic you've built as little as possible. If existing business code really has to change to work with the new Core, the agent brings it to you to decide.

### How other teams raise requests

Besides the development team, other teams in the company usually have their own business needs. We recommend that when they raise requests with the development team, they also do something like the preparation described in [Before you start](#before-you-start), and hand over fairly clear business requirements.

[Optional] If the requesting team can have an agent produce an HTML demo to help describe the request, that helps the agent too.

The development team can then give these requests to the agent as input:

```prompt
Read the material describing the xxx business requirement, and build this feature on the capabilities NocoBase 3 provides, following the NocoBase 3 framework, design guidelines and development skills.
```

## Teamwork and long-term evolution with Studio

Once the first version of a system is in place, it moves into a phase of continuous evolution:

1. Features already built need improvements and bug fixes
2. New feature modules need to be added to the system

When one person develops and runs several tasks in parallel, they have to jump back and forth between agent sessions; the faster the agents produce output, the more is asked of the person.
When several people develop, the background of requests, business material and project experience may be scattered everywhere. When a different person or a different agent takes over, that context is easily lost.
That is why we built [NocoBase Studio](https://www.nocobase.com/studio/): it is designed to govern how people and agents develop together.


In NocoBase Studio, you can turn your own agents (such as Codex, Claude Code and OpenCode) into an agent team that moves issues forward on its own, with people deciding only at the points that matter. Every issue has a clear status (in progress, waiting for your decision, done and so on), so you only need to pay attention to the issues that need your decision.

![](https://static-docs.nocobase.com/20261028173135810.png)


> [!NOTE]
> NocoBase Studio is currently available only in NocoBase Professional and NocoBase Enterprise. See [Editions & Pricing](https://www.nocobase.com/pricing/).

### Set up Studio

Follow [Let an agent set up Studio](../studio/setup/with-agent.md). At a minimum, you need to:

1. [Install Studio](../studio/setup/install.md)
2. [Connect Git](../studio/setup/git.md)
3. [Connect a shared runtime](../studio/setup/shared-runtimes.md)
4. [Enable agents](../studio/setup/agents.md)

After these steps, you can bring an existing project into Studio and keep developing it there.

### Bring an existing project in with your agent and nb-studio

Open Studio and use **Use Studio in your agent** at the top right to find the instructions that connect your own agent to Studio.

![](https://static-docs.nocobase.com/20261028173406008.png)

Send them to your coding agent. It installs the nb-studio CLI and the matching skills, so your agent knows how to work with Studio directly through nb-studio, for example to:

- Create issues
- Check the status of issues
- Create projects
- Change your password
- And more

Most of what you can do in the Studio interface, you can also have your own agent do with nb-studio by describing it in plain language. (This doesn't connect your local agent runtime to Studio. If you want Studio to be able to run your local agent, see the [Connect a shared runtime](../studio/setup/shared-runtimes.md) and [Enable agents](../studio/setup/agents.md) steps above.)

For example, to bring a project built on NocoBase Core into Studio, you can tell your agent:

```prompt
Use nb-studio to create a project called XXX in Studio and link it to the current project.
```

The agent then uses nb-studio to create the project in Studio and link it.

![](https://static-docs.nocobase.com/20261028181001387.png)

Once the project is created, you can start creating issues and evolve and maintain the project through them.

### Issues

#### Create issues

There are several ways to create an issue in Studio:

1. With the **New issue** button at the top right of the issues page

![](https://static-docs.nocobase.com/20261029151913059.png)

2. By describing a request or a problem in **My sessions**, which the agent breaks down into issues it can carry out

![](https://static-docs.nocobase.com/20261029151954700.png)

3. With your own agent

```prompt
I ran into problem YYY in project XXX. Here are the details: ZZZZ. Use nb-studio to create an issue for project XXX.
```

A new issue starts in **Backlog** by default and isn't worked on right away. To start it, see [How issues move between statuses](#how-issues-move-between-statuses) below.

#### How issues move between statuses

When developing locally, you've probably run into exchanges like this:

```text
Agent: XXX is like this. Should I continue?
Me: Yes, please continue.
...
Agent: YYY is like this. Should I continue?
Me: Yes, please continue.
```

The agent asks for permission even when it could clearly carry on. The task is interrupted, and you spend effort confirming low-value decisions.

Studio has a mechanism for this: issues move forward on their own as much as possible, and people step in only when a decision is really needed. A lead agent analyzes and breaks down each issue and hands the work to suitable executing agents. Whenever an executing agent stops to ask like this, the lead agent tells it to keep going.

Studio has six built-in issue statuses:

1. Backlog: the request is still being gathered, and agents haven't started work.
2. In progress: agents are working on it.
3. **Blocked: the agents ran into something that needs your decision.**
4. **In review: the agents have finished and need you to accept the result.**
5. Done: the work is finished and accepted, the code is merged and the PR is closed.
6. Cancelled: the issue was cancelled, and agents no longer work on it.

![](https://static-docs.nocobase.com/20261028201236304.png)

Of the six statuses, only **Blocked** and **In review** need you. As described above, the lead agent keeps the issue moving as far as it can. Only when it reaches a decision it can't make and a person has to step in does it move the issue to **Blocked** and ask you to decide. So Studio notifies you as little as possible, only when a decision really needs you:

![](https://static-docs.nocobase.com/20261028203035957.png)

All you need to do then is reply to the agent with your decision. Once the lead agent receives it, it moves the issue back to **In progress**, until it needs your decision again and the issue becomes **Blocked**, or the work is finished and the issue moves to **In review**.

When the work is complete, the issue moves to **In review**, which of course also needs a person. If everything looks right, click **Merge** to merge the code into the repository, and the issue moves to **Done**.

![](https://static-docs.nocobase.com/20261028201509073.png)

If you have many issues but care most about how a few of them are going, click **Follow** on those issues to add them to your following list, where you can keep track of them easily.

![](https://static-docs.nocobase.com/20261029152227386.png)

#### Preview environment

Once Studio is deployed, it comes with a preview environment, which gives each issue's code branch an environment where it actually runs:

![](https://static-docs.nocobase.com/20261028203544307.png)


The lead agent uses it to check the executing agents' work: an executing agent runs the result in the preview environment and takes screenshots for the lead agent to confirm. These are also a useful reference when you accept an issue.

![](https://static-docs.nocobase.com/20261028203712314.png)

You can also use the preview environment to see the issue branch's code in action yourself before deciding whether to accept it.

![](https://static-docs.nocobase.com/20261028204209835.png)

### Knowledge base and project memory

Studio has a built-in knowledge base where you can add documents and information at the project level or the system level (shared by all projects). While developing, agents consult the knowledge base as they need it. The knowledge base is stored in Studio's database. Anything important that people and agents should share, such as team standards and domain terms, can go into it. As the project evolves, the knowledge base keeps growing.

![](https://static-docs.nocobase.com/20261028205037978.png)

Project memory is another important feature. Modeled on Claude Code's [auto memory](https://code.claude.com/docs/en/memory), it has agents record memories automatically, and only at key moments: when a person keeps stressing a fact, when the project has context that can't be found in the code, when an agent has hit the same pitfall before, and so on. Project memory is stored in the project's repository (in `.nb-studio/memory/` at the repository root) and kept as part of the code. It is injected into the context of every Studio run (by design it is short and to the point, with strict limits on how much context it takes up), so agents don't repeat the same mistakes.

![](https://static-docs.nocobase.com/20261028205613068.png)


### Skills

Studio supports standard Agent Skills. You can use them for development standards, review points, test steps and more. Write them as skills, attach them globally, to a project or to a repository, and agents follow them on every run.

![](https://static-docs.nocobase.com/20261028210018195.png)


Skills in Studio can be attached at several levels:

1. Globally, so they apply to every project. You can also turn on **Attach to new projects automatically**.

![](https://static-docs.nocobase.com/20261028210517252.png)

2. To a project

Some skills only suit certain projects. In that case, don't attach them globally; instead, open the project's details and attach them in the **Default skills** panel for that project.

![](https://static-docs.nocobase.com/20261029152525192.png)

3. To a repository

A project can have several repositories, so you can also attach skills to a single repository in the project settings. Then, within the same project, only runs in that repository get those skills.

![](https://static-docs.nocobase.com/20261029152621517.png)

These three levels go a long way toward sharing standards across a team, while still letting individual projects and repositories have skills of their own.

### Deploy the app

Once a NocoBase 3 app is ready, we recommend [deploying it with Docker](../core/tutorials/deploy-with-docker.md): package the app as a Docker image, then deploy it on the target server. You can send the agent a prompt like the following, replacing the server, directory, address and so on with your own values:

```prompt
Use Docker to deploy the current task app for the first time to the environment below.

Server: <my Docker server>
Server platform: linux/amd64
Deployment directory: <absolute path on the server>/tasks-docker
Database: a new SQLite database, without importing development data or sample tasks
Local listen address on the server: 127.0.0.1:13000
Address for users: https://tasks.example.com/tasks/

Prepare and start the app following the project's Docker deployment guide, and touch only this tutorial app.
Keep configuration, passwords and business data separate from the image, so they survive rebuilding the container.
Set up the administrator sign-in, keep the app keys safe, and don't expose them in code or reports.
If a required configuration or storage location is missing, say so instead of quietly carrying on with empty data.

Check sign-in, task operations and read-only permissions, then rebuild this app's container and confirm the existing data and permissions are still there.
When you're done, tell me the address, the verification results, and anything not yet configured, such as the domain or HTTPS.
```

## Summary

AI writes code fast, but building a reliable business system is still hard. When AI writes a business system from scratch, the faster it writes, the more problems pile up. NocoBase Core solves two of them:

1. Many foundational capabilities have to be built from scratch, such as permissions, workflows and approvals

2. The underlying architecture can slowly drift out of control as models change and developers come and go

But as enterprise projects grow larger and teams take on more of them, two more problems become unavoidable:

3. There are too many parallel tasks and too many agent messages for people to keep up with

4. Knowledge and experience gained during development are hard to capture and share

That's why we built NocoBase Studio. With an agent team, a standard flow of issue statuses, and a knowledge base, memory and skills that keep growing, it solves these problems in enterprise app development. We hope our experience helps teams facing the same challenges in building and governing enterprise apps.
