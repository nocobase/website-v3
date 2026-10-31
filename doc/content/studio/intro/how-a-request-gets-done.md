---
title: How a request gets done
description: Follow supplier scoring and tiers from requirements through development, review, acceptance, and release.
---

The purchasing team wants to add scoring and tiers to its supplier management application, built on NocoBase Core. Purchasing lead Jordan confirms business rules and accepts the result. The Agent team handles design, development, testing, and review.

> Score suppliers by on-time delivery, quality, and price, then assign tiers A, B, or C. Orders from tier C suppliers require purchasing manager approval.

::figure request-lifecycle | Decisions and execution records stay with the task, from requirements to release

## Define requirements and acceptance criteria

Jordan discusses the request with a Runner Agent in **My sessions**. The Agent checks the existing supplier module and confirms two rules:

- **Score weights**: on-time delivery 40%, quality 40%, price 20%.
- **New suppliers**: start at tier B and receive a calculated tier after three months.

The Agent creates **PUR-23, Supplier scoring and tiers**, with the rules and acceptance scenarios. Jordan starts the task, handing execution to the Lead Agent.

![A Runner Agent turns the agreed rules into a task for Jordan to start](https://static-docs.nocobase.com/studio-en-req-session-20261030.png)

As the task owner, Jordan can continue in the session or add requirements to the task. See [Raise a request](../use/raise-a-request.md) for other ways to create tasks.

## Assign the design

The change affects supplier data and order approval. The Lead Agent first asks Claude to design an approach. The handoff includes the requirements, purchasing policy, scoring sheet, and business scenarios to verify.

The design must explain how scores are calculated, how tiers are stored, and how the change fits the existing approval workflow. The Lead Agent assigns later development and review steps according to each Agent's strengths.

![The Lead Agent assigns Claude the design, with business documents and verification requirements](https://static-docs.nocobase.com/studio-en-req-dispatch-20261030.png)

## Confirm the approval rule

The current policy requires approval for orders over $50,000. The Agent needs to know whether the new tier C rule also applies below that threshold.

The Lead Agent marks the task **Blocked** and asks the question in **Needs you**. Jordan replies from **My issues**:

> All orders from tier C suppliers need approval, regardless of value. Other suppliers still follow the amount threshold.

With the rule confirmed, the Lead Agent assigns development to Codex.

![The Needs you card asks Jordan to confirm the approval rule](https://static-docs.nocobase.com/studio-en-req-blocked-20261030.png)

## Develop the feature

Codex works on a runtime. It extends the supplier module using Core's data and permissions, updates order approval, and adds tests. It commits to the task branch and opens a PR, which Studio links to PUR-23.

![The task shows the active Agent, runtime, and next step](https://static-docs.nocobase.com/studio-en-req-now-20261030.png)

## Run checks and review

Repository CI runs checks and tests. A test finds that new suppliers have no tier instead of the agreed default B. The Lead Agent returns the issue to Codex, which fixes it and reruns checks.

After checks pass, Claude reviews scoring, approval rules, and test coverage. Development, fixes, and review results remain in the task activity. See [Checks and review](../project/checks-and-review.md).

![Codex fixes the default tier and Claude completes an independent review](https://static-docs.nocobase.com/studio-en-review-thread-20261030.png)

## Accept the delivery

Once checks and review pass, the task moves to **In review**. The Lead Agent provides a delivery report covering changes, verification, and remaining issues. Jordan checks it against the acceptance criteria.

![The delivery report summarizes changes and checks, with actions to merge or request changes](https://static-docs.nocobase.com/studio-en-req-accept-20261030.png)

This project has CI and PR previews configured. Jordan opens the preview and creates a $10,000 order for a tier C supplier. The order correctly requires purchasing manager approval. Previews support hands-on verification; see [Configure checks and previews](../setup/ci.md).

![The PR preview includes build status and an access link](https://static-docs.nocobase.com/studio-en-req-preview-20261030.png)

The result meets the requirements. Jordan clicks **Merge**, and the task becomes **Done**. If it did not, Jordan could request changes and explain the problem for the Lead Agent to assign. See [Accept a result](../use/accept.md).

## Release and record production

After merging, the project's CI deploys the changes to its test environment. The project lead reviews pending work in **Releases** and includes supplier scoring and tiers in **v1.4.0**.

The team deploys production, then records v1.4.0 as the production version in Studio. Studio links the version to its tasks and marks the change as live. See [Release overview](../release/overview.md).

![Releases links the test environment, v1.4.0, and the production version record](https://static-docs.nocobase.com/studio-en-releases-20261030.png)

## Preserve project knowledge

The Agent adds the confirmed approval rule to [project memory](../project/project-memory.md) and records the source of the scoring weights. Memory is reviewed and merged with the code for future tasks to use.

![Project memory keeps the approval rule and the source of the scoring weights](https://static-docs.nocobase.com/studio-en-project-memory-20261030.png)

A later request to adjust payment terms by supplier tier can reuse these rules, documents, and tests. The context stays with the project when the owner or Agent changes.

## What Jordan did

Jordan raised the request, confirmed the scoring rules, answered the approval question, reviewed the delivery report, tried the result, and merged it. Agents handled design, coding, testing, fixes, and review.

During execution, Jordan could add requirements or check progress at any time. See [Follow progress](../use/follow-progress.md).
