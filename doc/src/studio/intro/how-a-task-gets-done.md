---
title: How a request gets done
description: Follow one request from proposal to acceptance, using supplier tiers as the example: who does each step and what you see in Studio.
---

The purchasing team has a "Supplier Management" project in Studio, with an app built on NocoBase Core. Zhou Hang, the purchasing lead, does not write code. He wants to sort suppliers into tiers:

> Score suppliers on on-time delivery, quality pass rate, and price, and sort them into tiers A, B, and C. Orders to tier C suppliers need purchasing manager approval before they are placed.

In Studio, this request goes through the steps below. <span class="who human">Person</span> marks work done by a person, and <span class="who agent">Agent</span> marks work done by an agent.

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>Make the request</strong><span class="who human">Zhou Hang</span><span class="who agent">My agent</span></div><p>Explain what is needed in a session, and the agent creates the task.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Arrange</strong><span class="who agent">Coordinator agent</span></div><p>Break the work into steps and hand each step to a suitable worker agent.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Build</strong><span class="who agent">Worker agent</span></div><p>Build on Core in a separate branch, write tests, and open a PR.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Check and review</strong><span class="who sys">The repository's CI</span><span class="who agent">Worker agent</span></div><p>Fix any failed checks, then have a model from another vendor review the code.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Answer a question</strong><span class="who human">Zhou Hang</span></div><p>When a business judgment comes up, the task moves to Blocked and waits for Zhou Hang's answer.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Accept</strong><span class="who human">Zhou Hang</span></div><p>Read the delivery report, then merge or send it back for changes.</p></div></li>
<li class="later"><div class="step"><div class="step-head"><strong>Release</strong><span class="tag wip">Module in development</span></div><p>To be added as the module matures.</p></div></li>
<li><div class="step"><div class="step-head"><strong>Keep what was learned</strong><span class="who agent">Worker agent</span></div><p>Records and project memory stay with the team, ready for next time.</p></div></li>
</ol>

## Make the request

Zhou Hang opens **My sessions**, chooses **My agent**, and talks it over with Claude Code on his own computer. The agent first reads the existing supplier module, then turns the request into a task in the "Supplier Management" project. Zhou Hang selects **Start**, and the task moves to **In progress**.

::figure req-session | Discussing the request with his own agent in My sessions, which creates the task

The task owner is Zhou Hang, and the executor is the coordinator agent. From then on, the session keeps the task and its progress attached, and Zhou Hang can come back at any time and ask "how is it going?"

He could also skip the discussion and select **New task** directly. See [Make a request](../team/hand-over.md).

## The coordinator agent arranges the work

The coordinator agent reads the task description, the comments, the purchasing policy in the knowledge base, and the project's skills. The change touches the data structure and approvals, so it first asks a worker agent that is good at solution design to write a short plan, then hands the build to a worker agent that is good at feature development.

::figure req-dispatch | The coordinator agent hands off one step in the task's activity, stating what to do, what to read, and when it counts as done

Each step states what to do, what to read, and what counts as done. Only one step changes code at a time, while reviews and investigations run in parallel in read-only mode.

## Build

The worker agent works in its own working directory on the runtime, on a branch named `agent/PUR-23` by default. Following Core's development guidance, it uses the data, permission, and approval building blocks directly and writes only the business code for supplier tiers, with tests for the acceptance scenarios. After committing, it opens a PR, and Studio links the PR to the task automatically.

::figure req-now | The Now line at the top of the task page always says what the task is waiting on

## Check and review

The repository's own CI runs the code style, type, test, and build checks. When a check fails, Studio wakes the coordinator agent to arrange a fix. If several fixes in a row still fail, the owner is notified.

After the checks pass, the coordinator agent sends the code to a worker agent from another vendor for review, or to a different model from the same vendor when none is online. The model that wrote the code does not review its own code.

::figure req-checks | A failed check is fixed, then a model from another vendor reviews the code

## Answer a question

During the build, a question comes up that needs a business judgment: which tier does a new supplier with no order history get? The coordinator agent moves the task to **Blocked** and writes the question in the "Needs you" card.

Zhou Hang sees it under "Waiting for you" in **My Tasks**, selects **Reply**, and writes his answer. Once the coordinator agent receives the reply, it carries on arranging the work.

::figure req-blocked | Anything that needs a person's judgment goes to the task owner in the "Needs you" card

## Accept

Once the PR has passed the checks and the review, the coordinator agent moves the task to **In review** and attaches a delivery report: the situation before the change, the agreed plan, what changed, how it was verified, plus the acceptance criteria and screenshots.

Zhou Hang checks the result against the acceptance criteria and selects **Merge**, and the task becomes **Done**. If something is wrong, he selects **Send back**, writes the reason, and the coordinator agent arranges the changes and hands the task back.

::figure req-accept | Read the delivery report during acceptance, and merge if it passes

## Release

> [!PENDING] Release and deployment
> How merged changes reach the test and production environments, and who approves them, will be added once the "release and deployment" module matures.

## Keep what was learned for next time

The discussion, decisions, code, tests, and every run for this request stay in the task and the repository. The agent also writes what it learned into project memory, such as Zhou Hang's confirmation that "new suppliers start at tier B". Project memory is written for agents to read, so Zhou Hang does not need to read or organize it.

Next time Zhou Hang asks to "adjust payment terms by tier", the agent reads that memory before starting, then carries on with the knowledge base and the existing tests, and Zhou Hang does not have to explain the background again.

## What Zhou Hang did

Throughout the process, Zhou Hang did only three things: said what he wanted, answered one question, and accepted the result. Breaking down the steps, writing the code, writing the tests, fixing the checks, and the review were all done by the agent team.

While the agents work, Zhou Hang can add requirements in a task comment at any time, @ an agent to ask a question, or change the executor to himself to take over. See [Following progress](../progress/task-page.md).
