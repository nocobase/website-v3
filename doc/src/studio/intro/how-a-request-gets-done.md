---
title: How a request gets done
description: Follow one request, supplier scoring and tiers, from idea to release. See how the agent team moves it forward, where people make the key decisions, and what evidence they have when they do.
---

The purchasing team has a Supplier Management project in Studio, and the app is built on NocoBase Core. Zhou Hang, the purchasing lead, doesn't write code. This time purchasing wants to tier its suppliers, so Zhou Hang raises this request:

> Score suppliers on on-time delivery, quality pass rate, and price, and sort them into tiers A, B, and C. Orders to tier C suppliers need the purchasing manager's approval before they go out.

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>Raise</strong><span class="who human">Zhou Hang</span><span class="who agent">My agent</span></div><p>Explains the tier rules in business terms and answers the agent's questions. The agent writes them up as an issue with acceptance scenarios.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Assign</strong><span class="who agent">Coordinator agent</span></div><p>Asks an agent that is good at design for a plan first, then hands development to an agent that is good at building features.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Answer</strong><span class="who human">Zhou Hang</span></div><p>The plan turns up an existing approval rule, and Zhou Hang decides whether small orders from tier C suppliers need approval.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Build</strong><span class="who agent">Worker agent</span></div><p>Builds on Core in the issue's own branch, writes tests, and opens a PR.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Check and review</strong><span class="who sys">Repository CI</span><span class="who agent">Worker agent</span></div><p>CI runs the checks and tests, then a model from another vendor reviews the code.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Accept</strong><span class="who human">Zhou Hang</span></div><p>Reads the delivery report, acceptance criteria, and screenshots, tries it in the preview, and merges.</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>Release</strong><span class="who human">Project lead</span></div><p>Once merged, it goes to staging. Production needs a person's approval, and you can roll back if something goes wrong.</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>Remember</strong><span class="who agent">Worker agent</span></div><p>Writes what it learned into project memory, which agents read before the next job.</p></div></li>
</ol>

## Raise

Zhou Hang opens **My sessions** and talks it over with their own agent. The agent first looks at the existing supplier module, then asks two questions: how much does each of the three measures count toward the score, and which tier does a new supplier with no order history get? Zhou Hang settles both on the spot. On-time delivery and pass rate count 40% each and price 20%, and new suppliers start at tier B and are re-tiered by score after three months.

The agent writes these rules into the issue description and acceptance scenarios and adds the issue to the Supplier Management project. Zhou Hang clicks **Start 1 issue**, and the issue moves to **In progress**.

::figure req-session | Zhou Hang talks the request through with their agent, which creates the issue once the rules are settled

Zhou Hang owns the issue, and the coordinator agent is the executor. The session keeps the issue and its progress attached, so Zhou Hang can come back any time and ask how it's going.

Zhou Hang could also skip the conversation and click **New issue** to fill one in directly. See [Make a request](../use/raise-a-request.md).

## Assign

The coordinator agent reads the issue description, the Purchase Approval Policy in the knowledge base, and the project's skills. The change touches the data structure and approvals, so instead of going straight to development, it first asks an agent that is good at design for a short plan.

::figure req-dispatch | The coordinator agent hands out a step and says what to do, what to read, and when it counts as done

The coordinator agent assigns work by what each agent is good at, and writes no code itself. Only one step changes code at a time, while reviews and investigations run alongside it, read-only.

## Answer

While writing the plan, the agent finds that the Purchase Approval Policy already has a rule: an order above ¥50,000 needs the purchasing manager's approval. The request doesn't say whether small orders from tier C suppliers need approval, and that is a business call.

The coordinator agent moves the issue to **Blocked** and spells out, in the **Needs you** card, what Zhou Hang has to decide. Zhou Hang sees it under **Waiting for you** in **My issues** and clicks **Reply**: every order from a tier C supplier needs approval regardless of amount, and other suppliers keep the amount rule. With the answer in, the coordinator agent hands development to an agent that is good at building features.

::figure req-blocked | Decisions that need a person go to the issue owner in the Needs you card

## Build

The worker agent builds on a runtime, in the issue's own working directory, on a branch named `agent/PUR-23` by default. It uses Core's data, permission, and approval building blocks as they are, builds only the supplier scoring and tiers, and writes tests for the acceptance scenarios. Once it commits, it opens a PR, and Studio links the PR to the issue automatically.

The top of the issue page always shows where the work stands: which agent is on it, for how long, on which machine, and what comes next.

::figure req-now | The top of the issue page: who is working on it now and what comes next

## Check and review

The repository's CI runs lint, type, test, and build checks. When a check fails, Studio wakes the coordinator agent to arrange a fix. If the checks still fail after three fixes in a row, the issue owner is notified.

Once the checks pass, the coordinator agent has an agent from another vendor review the code. If none is online, it uses a different model from the same vendor. The model that wrote the code never reviews its own work.

::figure req-checks | After a failed check is fixed, a model from another vendor reviews the code

## Accept

When the PR has passed its checks and review, the coordinator agent moves the issue to **In review** and attaches a delivery report: how it was before, the agreed approach, what changed, how it was checked, open issues with recommendations, and finally the acceptance criteria. The building agent attached a screenshot for each acceptance scenario.

::figure req-accept | At acceptance you read the delivery report, the acceptance criteria, and the screenshots

This project's CI deploys a preview for every PR. Zhou Hang opens the preview from the issue page, signs in as the first administrator, places a ¥10,000 order with a tier C supplier, and confirms that it goes to the purchasing manager for approval.

::figure req-preview | The PR's preview, where you can try the change yourself

It works as expected, so Zhou Hang clicks **Merge**, and the issue moves to **Done**. If something had been off, Zhou Hang would have clicked **Send back for changes** and said why, and the coordinator agent would have arranged the fix and handed it back.

## Release

After the merge, the repository's CI deploys the change to staging, and the issue shows which environments it has reached.

Production is protected. When a new version is released, a deployment request lands in the approver's inbox with the version to deploy, the commit it came from, and the CI log. In this project the approver is the project lead, and the version goes to production only after approval. If something goes wrong, you can roll back to the previous version.

Issues that are done but not yet released are listed under **Merged, not released** in the project.

> [!NOTE] Previews and deployments need CI
> PRs get previews, and merges and releases get deployed to each environment, only after the repository's CI is connected to Studio. See [Connect CI](../setup/ci.md).

## Remember

The issue keeps its discussion, decisions, code, tests, and every run, and the code stays in the repository. The worker agent also writes what it learned into project memory, such as the rule Zhou Hang confirmed: every order from a tier C supplier needs the purchasing manager's approval, whatever the amount. Project memory lives in the repository and is reviewed and merged with the PR.

Next time Zhou Hang asks to adjust payment terms by tier, the agent reads project memory before it starts and builds on the knowledge base and the existing tests. Zhou Hang doesn't have to explain the background again, and if someone else takes over, or a different agent does the work, they can pick up where the last one left off.

## What Zhou Hang did

Zhou Hang said what was needed in business terms, settled the scoring rules with their own agent, answered one question before development, tried the change in the preview, and merged. The agent team wrote the plan, the code, and the tests, and handled the fixes and the review. While the agents work, Zhou Hang can add requirements at any time by commenting on the issue. See [Follow progress](../use/follow-progress.md).
