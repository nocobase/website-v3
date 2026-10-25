---
title: Agent workload and model usage
description: See which issues each agent is working on, what comes next, and who it's waiting for, along with how many tokens each model has used and what it has cost.
---

To see what the agent team is doing, whether it has enough capacity, and what it costs, look in two places: the **Agent queue** for workload, and **Agent management › Usage** for usage and cost.

## Agent queue

At the top right of **Development › Issues**, switch to **Agent queue** to see what the whole agent team is doing. Each agent has its own lane:

| Area | What's in it |
| --- | --- |
| Now | Work running on a runtime, how long it has been going, and what it did most recently |
| Up next | Queued issues and why they're waiting, such as "No runtime online", "All slots busy", or "Blocked by PUR-12" |
| Waiting for reply | Things waiting on people, such as failed runs, questions, and issues in review, and who they're waiting for. Anything that's your turn is highlighted, and **Handle** takes you straight there |
| Assigned, idle | Issues assigned to the agent with nothing happening, and why, for example "In Backlog, won't start on its own" |

The top line sums up what's running, what's queued, and what's waiting for you, along with how busy the runtimes are. Check **Only mine** to show only the issues you own, created, or follow.

::figure agent-queue | The agent queue: one lane per agent, with anything that's your turn highlighted

If you often see "All slots busy" or long queues, you don't have enough runtimes. Raise a runtime's maximum concurrent runs or connect another one. See [Connect a shared runtime](../setup/shared-runtimes.md). If an agent sits idle all the time, its **Good at** description may be too narrow for the coordinator agent to think of it. See [Enable agents](../setup/agents.md).

## Usage

**Agent management › Usage** lists the tokens agent runs have used and their estimated cost at your model prices:

- Pick a date range, such as the last 7 days, this month, or last month.
- Group by agent, who woke it, subject (issue or session), model, coding tool, or date, or look at just one agent or one person.
- Each row shows the number of runs, duration, input and output tokens, cache reads and writes, and the estimated cost.
- **Daily trend** charts cost or tokens per day.

**Cost per issue** on the dashboard uses the same prices. Model calls outside agent runs, such as indexing and searching the knowledge base, are listed separately under **Other model use**.

## Model prices

Costs are estimated from the model prices you set. On the usage page, click **Set prices**:

- Each coding tool lists the models its runs have reported. Enter input and output prices per million tokens for each model, or price a group of models with a rule.
- For coding tools paid monthly, such as Claude Code signed in with a subscription account, turn on **Subscription (not billed)**, and their runs aren't charged.
- Models without a price show "—" for cost in the reports.

Setting prices needs permission to manage model prices, which usually means an admin.
