---
title: Workflows
description: Choose a project workflow, override it for one task, and share confirmation and acceptance between team members.
---

Open the project’s **Workflow** tab. The sides of the canvas show who starts the task and signs off on delivery. The center shows the steps the Agents follow to produce that delivery.

## From start to acceptance

### The owner starts and accepts the task

In Community Edition, the task owner takes the task and starts work. When the Agent delivers, the owner reviews the report and either merges the change or requests changes. Choose Standard or Simple for the Agent’s part of the workflow.

![Community canvas with the owner’s steps around the Standard workflow](https://static-docs.nocobase.com/studio-workflow-en-ce-20261126-e344b58869.webp)

<span id="requester"></span>

### The requester confirms requirements and accepts delivery

In Professional and Enterprise, you can assign a requester and an owner separately. The canvas adds two steps where the requester confirms the requirements and accepts delivery. The owner starts the task and merges the change.

![Enterprise canvas with separate requester and owner steps](https://static-docs.nocobase.com/studio-workflow-en-roles-20261126-af9a0cdf59.webp)

For example, purchasing wants to block new orders for suspended suppliers while still receiving goods on existing orders. The procurement manager is the requester, and a project member owns the task.

::figure multi-role-workflow | The requester confirms requirements and accepts delivery. The owner starts development and completes the task.

#### Assign the requester and owner

The procurement manager creates an issue, chooses the project, enters the requirements and acceptance criteria, and assigns an owner. The creator is the requester by default. When the roles are separate, the requester cannot change the owner or workflow, and the owner cannot replace the requester. The project lead or a member with project management permission can reassign either role.

If you leave the owner blank, Studio uses the default in [Project settings](../project/settings.md), initially the task creator. When one person holds both roles, they can start development and accept the result directly.

#### Confirm requirements and start development

The **owner** opens the assigned task in **My issues** and selects **Take over** if prompted.

![The owner takes over the procurement request](https://static-docs.nocobase.com/studio-en-multi-role-handoff-20261119-c9a63c6ba5.webp)

The **requester** opens the task from [Requester decisions in the inbox](inbox.md#inbox-views), checks the description and acceptance criteria, and selects **Confirm requirements**. Editing the description while the task is in Backlog requires a new confirmation.

![The requester confirms the requirements before development starts](https://static-docs.nocobase.com/studio-en-multi-role-confirm-20261119-bbba66e940.webp)

Once the requirements are confirmed, the **owner** selects **Start**. The Lead Agent assigns the development work.

#### Answer questions during development

The Agent may ask whether staff can receive goods ordered before a supplier was suspended. In **Requester decisions**, the requester can reply, “Yes. The restriction applies only to new orders.” The reply appears in the task comments and the Agent can continue. The task stays in progress while it awaits an answer.

![The requester can reply while the issue is in progress](https://static-docs.nocobase.com/studio-en-multi-role-question-20261119-a7eb6f2a79.webp)

The owner can also answer on the requester's behalf from the task.

#### Accept delivery or request changes

When the task moves to **In review**, the requester opens the delivery report from **Requester decisions**. If a preview is available, try both operations with the same suspended supplier.

- Create a new order. The application should block it.
- Open an order placed before suspension. You should still be able to receive the goods.

Select **Accept** if both checks pass. If the application also blocks the existing order, select **Send back**, describe the failed step, and attach a screenshot if needed. The task returns to **In progress** for the Agent to make the correction.

![The requester can accept delivery or send it back for changes](https://static-docs.nocobase.com/studio-en-multi-role-accept-20261119-30cc443b04.webp)

#### Merge or complete the task

After the requester accepts, the owner reviews the [PR checks and code review](../project/checks-and-review.md) and selects **Merge** once the PR is ready. For a task without a PR, the owner can accept the result and complete the task directly.

![With no PR linked, the owner can complete the issue after requester acceptance](https://static-docs.nocobase.com/studio-en-multi-role-complete-20261119-233bbcfacd.webp)

Linking another PR after acceptance requires the requester to accept again. If the owner sends the task back for a change that affects how the feature works, select **Require the requester to accept again**.

## Agent development workflows

### Standard and Simple workflows

| Workflow | When to use it | How the work proceeds |
| --- | --- | --- |
| Standard | Business rule changes or work across several parts of the application | Assess the approach when needed, implement, get a review from another model, check CI, and deliver |
| Simple | Small changes with a clear scope | One Agent implements the change and delivers it for acceptance |

Enterprise also lists **Quality test**, which the Quality module uses for testing tasks. See [Run tests](../quality/runs.md).

### Set the project default and resident skills

In the project’s **Workflow** tab, select a workflow and choose **Set as project default**. Tasks following the default use it from their next run.

![Set Standard as the default on the project’s Workflow tab](https://static-docs.nocobase.com/studio-workflow-en-project-default-20261126-ccf2ff2db7.webp)

To load team instructions on every run, open **Resident skills** on the project’s **Workflow** tab. Choose the project or one repository, select **Add skill**, and save the ordinary skills you want to load. Changes apply from the next run. See [Skills](../project/skills.md) to create or update a skill.

### Switch the workflow for one task

Open the task and select **Workflow**. Follow the project default or select a workflow for this task. For example, a project using Standard can use Simple for a field rename. A switch applies on the next run. The current run finishes with its original workflow. The stage bar shows where the task stands.

![Choose Simple for the field rename in the task’s Workflow menu](https://static-docs.nocobase.com/studio-workflow-en-task-switch-20261126-a1845238be.webp)

<span id="create-a-bug-fix-workflow"></span>

### Create a workflow

In Professional and Enterprise editions, members who can manage skills can create a workflow in an Agent conversation. Start from scratch or adapt an existing workflow. Community Edition includes the built-in workflows.

For example, your team wants a test that fails before a bug fix and passes afterward. Start with a blank **Bug fix** workflow to define how the team reproduces, fixes, and verifies bugs.

1. In the project’s **Workflow** tab, select **New workflow**, then **Blank workflow**.

   ![Choose Blank workflow from the New workflow menu](https://static-docs.nocobase.com/studio-workflow-en-blank-menu-20261126-5d2fd06cba.webp)

2. Describe the steps in the Agent conversation that opens.

   ```prompt
   Create a Bug fix workflow. Start with a failing test that reproduces the bug. Find and fix the cause, then rerun the same test. Once it passes, have another agent review the fix. Include the test results at delivery.
   ```

   ![Enter the bug fix requirements in the New workflow conversation](https://static-docs.nocobase.com/studio-workflow-en-blank-chat-20261126-3b7143454e.webp)

3. Check the Agent’s draft and ask it to create the workflow. Return to **Workflow** and select **Bug fix**. The center of the canvas shows five steps in order: **Reproduce**, **Diagnose and fix**, **Verify**, **Independent review**, and **Deliver**.

   ![Project workflow canvas showing the five Bug fix steps](https://static-docs.nocobase.com/studio-workflow-en-bug-fix-canvas-20261126-4006b9c4b6.webp)

   Select **View rules** for the instructions behind each step. For example, if the test still fails, the Agent returns to the fix. Another agent reviews the change once the test passes.

   ![Bug fix rules explain what to do if the regression test fails](https://static-docs.nocobase.com/studio-workflow-en-bug-fix-rules-20261126-766840e532.webp)

4. Open the **Fix duplicate purchase order submissions** task and select **Bug fix** in its **Workflow** menu. The selection applies only to this task.

   ![Choose Bug fix for the duplicate purchase order task](https://static-docs.nocobase.com/studio-workflow-en-bug-fix-task-20261126-43879dbebd.webp)

[Contact us](https://www.nocobase.com/contact/) for Professional or Enterprise images and licenses.
