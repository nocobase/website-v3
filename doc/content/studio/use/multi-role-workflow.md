---
title: Multi-role workflow
description: Split requirements and acceptance from starting development and merging changes.
minimumEdition: professional
---

Procurement wants to block new orders from suspended suppliers while still receiving goods on existing orders. The procurement manager can act as the **requester**, confirm the rule, and test the result. The **owner** takes the task, starts the Agent team, and merges the change after acceptance.

This workflow is available in **Professional and Enterprise**. [Contact us](https://www.nocobase.com/contact/) for an image and license.

::figure multi-role-workflow | The requester confirms requirements and accepts delivery. The owner starts development and completes the task.

## Assign the requester and owner

The procurement manager creates an issue, chooses the project, enters the requirements and acceptance criteria, and assigns an owner. The creator is the requester by default. Open **Properties** on the issue to check or change either role.

If you leave the owner blank, Studio uses the default in [Project settings](../project/settings.md), initially the task creator. When one person holds both roles, they can start development and accept the result directly.

## Confirm requirements and start development

The **owner** opens the assigned task in **My issues** and selects **Take over** if prompted.

![The owner takes over the procurement request](https://static-docs.nocobase.com/studio-en-multi-role-handoff-20261119-c9a63c6ba5.webp)

The **requester** opens the task from [Requester decisions in the inbox](inbox.md#inbox-views), checks the description and acceptance criteria, and selects **Confirm requirements**. Editing the description while the task is in Backlog requires a new confirmation.

![The requester confirms the requirements before development starts](https://static-docs.nocobase.com/studio-en-multi-role-confirm-20261119-bbba66e940.webp)

Once the requirements are confirmed, the **owner** selects **Start**. The Lead Agent assigns the development work.

## Answer questions during development

The Agent may ask whether staff can receive goods ordered before a supplier was suspended. In **Requester decisions**, the requester can reply, “Yes. The restriction applies only to new orders.” The reply appears in the task comments and the Agent can continue. The task stays in progress while it awaits an answer.

![The requester can reply while the issue is in progress](https://static-docs.nocobase.com/studio-en-multi-role-question-20261119-a7eb6f2a79.webp)

The owner can also answer on the requester's behalf from the task.

## Accept delivery or request changes

When the task moves to **In review**, the requester opens the delivery report from **Requester decisions**. If a preview is available, try both operations with the same suspended supplier.

- Create a new order. The application should block it.
- Open an order placed before suspension. You should still be able to receive the goods.

Select **Accept** if both checks pass. If the application also blocks the existing order, select **Send back**, describe the failed step, and attach a screenshot if needed. The task returns to **In progress** for the Agent to make the correction.

![The requester can accept delivery or send it back for changes](https://static-docs.nocobase.com/studio-en-multi-role-accept-20261119-30cc443b04.webp)

## Merge or complete the task

After the requester accepts, the owner reviews the [PR checks and code review](../project/checks-and-review.md) and selects **Merge** once the PR is ready. For a task without a PR, the owner can accept the result and complete the task directly.

![With no PR linked, the owner can complete the issue after requester acceptance](https://static-docs.nocobase.com/studio-en-multi-role-complete-20261119-233bbcfacd.webp)

Linking another PR after acceptance requires the requester to accept again. If the owner sends the task back for a change that affects how the feature works, select **Require the requester to accept again**.
