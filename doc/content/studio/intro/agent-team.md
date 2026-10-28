---
title: How the agent team works
description: The coordinator agent assigns design, development, testing, and review by what each agent is good at, and keeps many issues moving at once. Work reaches a person for acceptance only after it passes its checks and review.
---

Once Claude Code, Codex, and other coding tools are connected to Studio, they form one agent team. When a request has become an issue and the issue is started, this team moves it forward. The coordinator agent decides who does each step, worker agents do the design, development, testing, and review, and anything that needs a person's decision goes to the issue owner.

## Who is on the agent team

| | What it is | What it does |
| --- | --- | --- |
| Coordinator agent | Built into Studio, one for the whole team | Decides who does each step of each issue, reads the replies, and picks the next step. Goes to the issue owner when a person has to decide, and hands the finished work to the issue owner for acceptance. It writes no code and merges nothing. |
| Worker agent | A coding tool installed and signed in on a runtime. Each coding tool and model pair is one agent, such as Claude · Opus 5.5 or Codex · GPT-5.5 | Does the step the coordinator agent hands it: writing a plan, building, writing tests, reviewing, or finding out why CI failed. Replies on the issue with the result, and never changes the issue's status or passes the work to someone else. |

Every worker agent has a **Good at** description, such as "approach design and code review" or "feature development and bug fixes". It is the only thing the coordinator agent goes by when it assigns work, and an admin writes it when enabling the agent. See [Enable agents](../setup/agents.md).

The coordinator agent needs a model to run on too. An admin picks a first choice and a fallback for it. If the first choice can't start within two minutes, the fallback takes over.

In **My sessions** you can talk a request through with your own agent, which turns it into issues. Once an issue is started, the agent team takes it from there. See [My sessions](../use/sessions.md).

## How the coordinator agent assigns work

The coordinator agent wakes up when an issue is started, when a worker agent replies, when someone comments, and when a PR's checks pass or fail. It reads what's new, decides the next step, and then does one of three things:

- Hands a step to a worker agent.
- When a person needs to decide, moves the issue to **Blocked** and spells out what the issue owner has to decide.
- When the PR has passed review and its checks, moves the issue to **In review** and attaches a delivery report.

To hand out a step, the coordinator agent posts a comment on the issue that mentions the agent and says what to do, what to read, when the step counts as done, and why it picked that agent. The worker agent's reply wakes the coordinator agent again.

::figure req-dispatch | The coordinator agent hands out a step and says what to do, what to read, and when it counts as done

The coordinator agent follows built-in allocation principles:

- **Pick the agent by what it's good at.** Approach design and hard investigations go to an agent that is good at reasoning and design, regular development to one that is good at building, small changes and extra tests to one that is good at small changes, and reviews to one that is good at reviewing.
- **Plan first, then build.** When a change spans several modules, touches data and migrations, concurrency, or permissions, or the issue doesn't say how to do it, an agent that is good at design writes a short plan first. Once the plan is settled, it sets the scope of the build, and going beyond it needs the coordinator agent's approval.
- **Have another vendor review.** Code goes to an agent from another vendor for review. If none is online, a different model from the same vendor reviews it. The model that wrote the code never reviews its own work. Review findings go back to the agent that wrote the code, and the fix is reviewed again.
- **A person sees it only after the checks and review pass.** An issue moves to **In review** only when its PR has passed review and every check.

::figure req-checks | After a failed check is fixed, a model from another vendor reviews the code

Admins can change the allocation principles, for example to add the way your team likes to divide work, or restore the built-in ones. See [Enable agents](../setup/agents.md).

## How many issues move at once

- **Each issue works on its own.** Every issue has its own branch, `agent/<issue key>` by default, and its own working directory, so issues don't get in each other's way.
- **Within an issue, only one step changes code at a time.** Steps that don't change code, such as reviews and finding out why CI failed, run in a separate read-only copy and can run alongside development.
- **More machines, more issues at once.** Each runtime runs three pieces of work at a time by default, which you can adjust to the machine's resources and your model quota. Urgent issues are picked up first.
- **Issues with an order wait their turn.** An issue that has to wait for a blocker, or for all its sub-issues, doesn't start until they are done, then carries on by itself.
- **Work goes on around the clock.** Any runtime that is online picks up queued work. Nobody has to stand by.

::figure agent-queue | The agent queue: what each agent is doing, what comes next, and who it is waiting for

There are two kinds of runtime. Shared runtimes are connected by an admin and run everyone's issues. Personal runtimes are connected by members themselves and run only the work their owner starts. An agent that exists only on personal runtimes works only for their owners.

## When work goes to a person

The coordinator agent hands an issue to its owner in these cases, and each one shows up at the top of the owner's **My issues**:

- **A person needs to decide.** A trade-off between approaches, a missing permission or secret, or a business question the issue left open moves the issue to **Blocked**.
- **The work is stuck.** No suitable agent is online, or a step still fails after switching agents. The issue moves to **Blocked** with a note on what it needs to carry on.
- **It's ready for acceptance.** The PR has passed review and its checks, and the issue moves to **In review** with a delivery report.

The coordinator agent never marks an issue **Done** or **Cancelled**, and never merges a PR. People accept and merge.

## When something goes wrong

| What happens | How the agent team handles it |
| --- | --- |
| A check fails, or the PR has a conflict | The coordinator agent is woken to arrange a fix. If the checks still fail after three commits in a row, the issue owner is notified. |
| The same step fails twice | It goes to the next suitable agent. If that fails too, the issue moves to **Blocked**. |
| A coding tool runs out of quota | The step goes straight to another suitable agent, preferably from another vendor. |
| A runtime goes offline | Its work returns to the queue for other runtimes to pick up. |
| Work waits more than 24 hours with no runtime to take it | The run fails and the issue owner is notified, and can retry it, hand it to someone else, or cancel it. |
| Agents go back and forth too often | By default, comments from agents can trigger at most 20 runs per issue in 24 hours. Beyond that the issue pauses and its owner is notified to decide whether to continue. |

## What agents can and can't do

- An agent works on behalf of the person who started the work, and never has more permissions than that person.
- Worker agents can commit and push to the issue's branch and open PRs. They can't rewrite history that has already been pushed, and the code host guards protected branches.
- Only people can merge PRs, approve deployments to protected environments, and manage members.

While agents work, people can step in at any time: comment on the issue to add requirements, stop a run, or take the issue over. See [Follow progress](../use/follow-progress.md).
