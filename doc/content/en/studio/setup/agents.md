---
title: Enable agents
description: Once runtimes report their coding tools and models, check what each agent is good at, enable the ones you need, and pick a first choice and a fallback for the coordinator agent.
---

A runtime reports the coding tools and models that are installed and signed in there, and each coding tool and model pair is an agent, such as Claude · Opus 5.5 or Codex · GPT-6.1 Sol. Once enabled, it joins the agent team. The coordinator agent hands out work by what each agent is **Good at**, so how well that description is written decides how well the work gets assigned.

Enabling agents and setting up the coordinator agent need permission to manage agents, which usually means an admin.

## Check the agents that were enabled automatically

Open **Agent management › Agents**. When a runtime reports in, common coding tool and model pairs join the list and are enabled automatically, with a suggested **Good at** description already filled in.

Go through each **Good at** description and adjust it to how your team actually uses the agent: click **Edit**, make your changes, and save. Say clearly what it is suited for and what it isn't, for example:

| Agent | Good at (example) |
| --- | --- |
| Claude · Opus 5.5 | Approach design, hard investigations, and code review |
| Codex · GPT-6.1 Sol | Regular feature work, cross-module changes, and refactoring |
| Codex · GPT-6 Luna | Small changes, adding tests, and finding out why CI failed. Fast and cheap |

**Edit** also lets you set the reasoning effort. The coordinator agent can't change it when it hands out work, so set it for the kind of work this agent usually does.

::figure qs-agents | The agent list: what each agent is good at and which runtimes it runs on

## Add other models

Models that aren't on the common list have to be added by hand:

1. Click **Add agent**. **Available models** lists every model the runtimes have reported, grouped by coding tool. Models on the common list are marked **Enabled automatically when reported**, and ones you've already added are marked **Added**.
2. Select the models you want and write what each is good at.
3. Click **Add**. They're enabled right away.

If a model shows **Needs setup** or **Version too low**, set up or upgrade that coding tool on the runtime as the hint says, then detect again.

An agent that exists only on personal runtimes is marked **Personal runners only**. The coordinator agent hands it work only for issues started by the owner of that runtime.

Enable agents from at least two vendors. For reviews, the coordinator agent gives the code to an agent from another vendor. With only one vendor, it uses a different model from the same vendor.

## Set up the coordinator agent

The coordinator agent is built into Studio. There is only one, and it arranges the issues of every project. It needs an enabled agent to run on. Above the agent list, click **Settings** in the coordinator agent section:

1. Under **First choice**, pick an agent that is good at reasoning, such as Claude · Opus 5.5.
2. Pick another one as the **Fallback**. If the first choice waits in the queue longer than the **Fallback delay** (120 seconds by default), an idle fallback takes over. If no runtime can run the first choice at all, the fallback is used right away.
3. Save.

::figure qs-coordinator | The coordinator agent's settings

Leave the other settings at their defaults for now:

| Setting | Default | What it does |
| --- | --- | --- |
| Allocation principles | Built-in | How the coordinator agent hands out and moves work along. You can change them or click **Restore built-in**. See [How the agent team works](../intro/agent-team.md) |
| Comment run limit | 20 per issue every 24 hours | How many runs agents can trigger for each other. Beyond the limit the issue pauses and its owner is notified |
| Delegated step queue timeout | 600 seconds | When no runtime picks up a step the coordinator agent handed out, the step is withdrawn and the coordinator agent rearranges it |

**Done when**: the agent list has at least two enabled agents, **Where it runs** shows your runtime, and the coordinator agent section shows a first choice and a fallback.

Next, [create a project](new-project.md).

## Disable agents

- To stop using an agent, turn off **Enabled** in **Edit**. Disabled agents are hidden by default. Check **Show disabled** to see them, and turn them back on when you need them.
- If no runtime has reported an agent for 14 days, it shows as having no runtime, and the coordinator agent stops giving it work.
