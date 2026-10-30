---
title: Walk through your first request
description: Raise a small request and watch the agent team plan, build, and review it. Answer its questions, accept and merge, and confirm the whole workflow runs end to end.
---

After accepting your invitation and signing in, open the project your administrator prepared. Submit a small requirement and follow it through development and acceptance.

## Before you start

- The project's "Initialize project" issue is done. See [Create a project](new-project.md).
- The administrator has configured an available Agent team and Lead Agent.
- A team runtime is online, and the repository has a [check source](ci.md).

## 1. Raise the request

1. Open the project and click **New issue**. A session with an agent opens on the right, with the current project sent along as context.
2. Describe a small request in business terms, along with how you'll check it. For example:

   ```text
   Add a Suppliers table to the app with name, contact person, phone, and status (active or paused), and add a Suppliers page to the navigation where you can add, edit, and view suppliers.
   Acceptance: after signing in, open the Suppliers page from the navigation, add a supplier, and see it in the list.
   ```

3. Send it. If the request is clear, the agent turns it into an issue right away. If anything is unclear, it asks you first.
4. Once the issue is created, click **Start 1 issue** in the session, or open the issue and click **Start**.

To skip the session, click **Fill in manually** and enter the title and description yourself.

**Done when**: the issue is **In progress** and its executor is the lead agent.

## 2. Watch the agent team work

Open the issue. The **Now** line at the top always shows which agent is working on it, for how long, and on which runtime, with what comes next below it.

**Activity** records assignments, Agent replies, and review results. Agents design, implement, and verify the change, open a PR, and address review findings.

::figure req-now | The top of the issue page: who is working on it now and what comes next

**Runs** has the full record of every run, which helps when you need to dig into a problem.

## 3. Answer questions

When something isn't clear in the request, such as a choice between two approaches, the lead agent moves the issue to **Blocked** and spells out what you need to decide. It shows up at the top of **My issues**. Open it, click **Reply** in the **Needs you** card, and write your decision. The lead agent picks up from your reply.

If the request is written clearly, this step may never come up.

If checks or previews cannot complete, read the Agent report. Administrators can resolve configuration issues using [Checks and CI](../configure/checks.md). You do not need to install local coding tools to submit a request.

## 4. Accept the result

Once the PR has passed review and its checks, the issue moves to **In review** and appears under **Waiting for you** in **My issues**.

1. Open the issue. The **Needs you** card says what you're asked to accept, and below it is the delivery report: how it was before, what changed, how it was checked, open issues with recommendations, and finally the acceptance criteria and screenshots.
2. Click **View changes** to see the PR.
3. If a preview is available, open it from the issue page, sign in as the first administrator, and try it against the acceptance criteria.
4. If it works as expected, click **Merge**. The confirmation shows the merge method (for example, squash into `main`), the commit title, and that the issue will move to **Done**. Confirm it. Without check results, the button reads **Merge anyway**, and you can give a reason. Studio records the merge on the PR and in the issue's activity.
5. If something is off, click **Send back for changes** and say what needs fixing. The lead agent arranges the fix and hands it back to you.

::figure req-accept | At acceptance you read the delivery report, the acceptance criteria, and the screenshots

**Done when**: the issue is **Done** and the change is on the repository's default branch. If delivery to a test environment is configured, follow its progress on the issue.

## Troubleshooting

**The issue never starts.** Look at the **Now** line on the issue page. It says what it's waiting for: no runtime online, all slots busy, or the agent exists only on someone else's personal runtime. If no runtime picks the work up within 24 hours, the run fails, and you're notified so you can retry.

**"Initialize project" isn't done yet.** New issues in the project wait until it is.

**The agent says it couldn't take screenshots.** The runtime has no browser. See the preparation section of [Connect a shared runtime](shared-runtimes.md).

Continue with [My issues](../use/my-tasks.md) to handle pending work, or discuss your next requirement in [My sessions](../use/sessions.md).
