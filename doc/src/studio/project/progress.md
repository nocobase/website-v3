---
title: Project progress
description: The dashboard answers three questions: how delivery is going, how the agents are performing, and what's stuck. Each project's overview shows its progress, the setup still to do, and the changes not yet released.
---

You don't have to ask issue by issue how a project is going. Project leads look in two places: the **Dashboard** for the whole team, and a project's **Overview** for that project.

## Dashboard

The **Dashboard** answers three questions: how delivery is going, how the agents are performing, and what's stuck. Pick a time range, and every figure is compared with the previous period and charted over the current one.

The dashboard counts only the projects and issues you have permission to see.

### Key figures

| Figure | How it's calculated |
| --- | --- |
| Issues completed | Issues completed in the period |
| Median cycle time | The median time from an issue starting to being done |
| Completed by agents | The share of issues completed in the period that agents worked on |
| Cost per issue | The period's agent usage priced at current model prices, divided by the number of issues completed |
| Run success rate | The share of finished runs that completed successfully |
| Rework rate | The share of agent-worked issues that were sent back for changes or reopened after being done |
| Runs per issue | The average number of runs for each issue agents completed |
| Human intervention | The share of runs in which an agent moved the issue to **Blocked** to ask its owner |
| Median queue wait | The median time from work being queued to a runtime picking it up |

Hover over a figure to see how it's calculated.

Read some of them together. A high rework rate suggests the requests aren't clear enough, or the agents' **Good at** descriptions or skills need adjusting. High human intervention suggests the requests are missing business rules. Long queue waits mean you don't have enough runtimes. See [Agent workload and model usage](usage.md).

### Agent performance

Each day's queued runs, by outcome: completed, failed, cancelled, and in progress, so you can see how the agent team has been doing.

### Needs attention

Only what's stuck or overdue right now: blocked issues, overdue issues, issues waiting too long for acceptance, and runs that failed in the last 24 hours. When everything is fine, this section is empty.

### By project

Every project you can see: how much is done so far, and how much was delivered in the period.

## Project overview

Open a project, and its **Overview** has:

- **Key figures and status breakdown**: how many issues in total, in progress, in review, and done.
- **Next steps**: setup the project still needs, such as adding a repository, finishing the initialization, or connecting preview CI. Once it's all done, this section goes away.
- **Releases**: the version running in each environment. See [Approve releases and roll back](release.md).
- **Merged, not released**: issues that are done but whose changes haven't reached production yet.
