---
type: "release"
product: "studio"
tag: "v1.0.0-beta.75"
channel: "beta"
version: "1.0.0-beta.75"
title: "NocoBase Studio · v1.0.0-beta.75"
date: "2026-11-08"
publishedAt: "2026-11-08T15:04:44Z"
---

### 🎉 New Features

- **[License]** {{edition:professional}} Studio is licensed with a Studio License Key: paste it in the license dialog or under Settings › License, which shows who the installation is licensed to and the available updates.
- **[Quality]** {{edition:enterprise}}
  - Browse project quality and release summaries, open categorized plans and trace evidence to its original reports.
  - Prepare built-in quality plans and create custom plans from editable templates.
  - Show report execution times and uncovered requirements with source-based project quality facts.
  - New projects schedule their daily and release tests automatically, and a test with nothing to test is recorded as "No test scope" without starting an Agent or waiting for acceptance.
  - Organize quality testing by named project dimensions and native tasks with readable evidence reports, live progress and linked follow-up work.
- **[Agents]**
  - Share Runner conversations with selected people as read-only snapshots from My sessions and the Agent panel.
  - Preserve progress when an Agent exhausts its quota, resume its original session after recovery, and allow an explicit change of Agent or Runner.
- **[Languages]** Studio is now available in Traditional Chinese, Japanese, Spanish, French, German, Portuguese, Indonesian, Vietnamese, Russian and Korean, and the language menu names each language in its own script.

### 🚀 Improvements

- **[Quality]** {{edition:enterprise}}
  - Add functional and thematic quality templates with focused testing methods.
  - Start independent testing rounds of a plan while earlier rounds are still active.
  - Reuse confirmed problems across quality plans while preserving cancellation decisions, and show follow-up sources by plan.
  - Let quality agents assess incomplete testing materials and keep plans accessible when templates change.
  - Browse project quality and all plans in a unified workspace, with real test results and built-in plans created only when first used.
  - Display thematic tests in the order Permissions, Performance, Security, UX, and Browser compatibility.
  - The Quality homepage shows each project's latest Daily test and how many test rounds are in progress, awaiting acceptance or blocked, and loads each project's row on its own.
  - Each quality round now belongs to the person who started it, scheduled rounds keep the previous round's owner, and plan details show each round's owner.
  - Open the Quality homepage and project quality page faster on large projects.
  - Simplify project quality to built-in and custom plans, with Daily test and Release quality cards, a list without action buttons, and a guided first run on the plan page.
  - Quality rounds no longer create "add automation" tasks for passing checks; the report conclusion states in one sentence how many checks lack automated tests.
- **[Agents]**
  - Show linked tasks in a runner conversation's details the same way as in My Agent.
  - Start Lead and independent review sessions with bounded handoff context and wake the Lead once per delegated step.
  - Let task and conversation agents upload build artifacts within the represented user's App permissions, with execution details in troubleshooting logs.
  - Keep fixed instructions first in new Lead and independent review sessions to improve prompt cache reuse.
  - Sending a message no longer flashes a waiting notice when a runtime is free, and a conversation whose runtime used up its quota can switch to another runtime as well as another Agent.
- **[My sessions]**
  - Align session list rows and show a separate status segment for every Runner Agent task.
  - Tasks an agent creates in a conversation now appear only once, in the conversation's task list card, instead of also under the agent's reply.
  - Runner conversations no longer add task progress cards or wake automatically for linked task updates.
  - Runner Agent's session list now filters by project with the same compact menu as My Agent, in the status filter row.
  - My sessions and the Agent panel now show only Runner Agent; My Agent is hidden and its old links open the runner conversations.
- **[Previews]** Show preview deployment queue and cancellation states, and stop cancelled previews from remaining busy or retrying automatically.
- **[Issues]** When a task has several pull requests, its "Needs you" row offers only the one the project manager asked you to merge, named by repository and number.
- **[Runtimes]** Runtime owners and administrators can clear a quota mark even when its reset time is known, and a mark lifts by itself when its window reports quota left; its reminder is settled either way and says the mark can be cleared early.
- **[Releases]** Hosted environments show each shared app host once as a capacity card linking to each environment's running apps; apps are listed with their runtime state and created on their environment's page.

### 🐛 Bug Fixes

- **[Comments]**
  - Keep text typed after a pasted reply link outside the link, including after a space.
  - On phones, Enter in a task's comment or reply box starts a new line; tap the send button to post.
- **[Agents]**
  - Runner Agent-created tasks now wait in Backlog for a person to start.
  - Preserve and resend questions refused by an incompatible runtime, and show one consistent next step for conversation problems across pages, panels and phones.
  - Recover from temporary GitHub preparation failures and show clear repository access guidance in task runs and Runner conversations.
  - Start a fresh agent session when switching between read-only and writable work, while preserving existing writable sessions.
  - Release runner capacity after implementation handoff while remote CI continues, preserving source-specific verification and final acceptance checks.
  - After a dropped connection, the conversation notice says what happened, its Refresh button shows progress and clears the notice once the conversation is up to date, and a message that may still arrive is never handed back for a duplicate send.
- **[My sessions]**
  - Runner conversation agents change code only when you explicitly ask them to, and otherwise propose an issue for the work.
  - When preparing a conversation's run fails and is retried, the conversation now says so instead of saying it waits for a free runtime, and shows why once it finally fails.
  - Hide the "Drop files to attach them" overlay once files are dropped on a conversation's input box.
- **[API keys]** API key tables no longer stretch past the page: long names, descriptions and permissions are truncated with the full text on hover.
- **[Previews]**
  - Let hidden Studio previews release capacity and refresh waiting indicators when reopened.
  - Whether a pull request gets a preview environment now follows the issue's "No preview environment" switch from its next CI run, and the task page shows why a preview was not published.
  - Return a retryable response for previews while their shared Host restarts, and say why a preview waits to start.
- **[Languages]** Keep the account language consistent across browsers and account switches.
- **[Releases]**
  - Open publication notifications with issues filtered to their project, with a switch to all accessible projects and clear historical counts.
  - Keep the Deployment guide link together when the Hosted environments description wraps.
- **[Quality]** {{edition:enterprise}}
  - Keep project test-plan summaries compact with two-line previews and full text on hover.
  - Show quality test plans as readable cards on phones and tablets instead of an overlapping table.
  - Fixed Studio failing to start after upgrading Quality on PostgreSQL
- **[Issues]**
  - Keep the task's progress text readable in a narrow task preview by placing its Start and hand-over buttons below it.
  - Show the full filtered task count, navigate across all task pages, and reveal tasks selected in folded groups.
  - The agent filter in a task's run history lists only the agents that ran on that task, including removed ones under their original names.
  - Put the Lead Agent first in task comment and reply mention suggestions and allow sending those mentions.
  - On phones, the follow star in a task's top row matches the icon buttons beside it, and the Needs you buttons slide in their own row instead of widening the page.
  - Sending a comment or choosing Reply from another tab of an issue now switches to Activity and shows the comment or the reply box.
  - Issue activity says "added a relation to" or "removed the relation to" on both related issues, instead of calling it a dependency.
- **[Notifications]**
  - Refresh attention counts only once when returning to a visible page.
  - Studio now notices new waiting tasks and mentions while its tab is in the background, shows a desktop notification and plays the reminder sound, and Preferences explains why desktop notifications are unavailable in the current browser.
- **[Interface]** Fix entries hidden under group labels in the collapsed sidebar, such as Back and Labels in Settings, being hard to click.
- **[Skills]** Built-in development guidance now limits process cleanup to processes started by the current run and protects the runner.
