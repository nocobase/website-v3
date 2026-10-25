---
title: Walk through your first request
description: Raise a small request and watch the agent team plan, build, and review it. Answer its questions, accept and merge, and confirm the whole workflow runs end to end.
---

Once Studio, the Git connection, a runtime, agents, and a project are all set up, take one small request through the whole workflow. Along the way you'll see how the agent team moves an issue forward and confirm that every part is connected before you invite your colleagues.

## Before you start

- The project's "Initialize project" issue is done. See [Create a project](new-project.md).
- At least two agents are enabled, and the coordinator agent has a first choice. See [Enable agents](agents.md).
- A runtime is online.

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

**Done when**: the issue is **In progress** and its executor is the coordinator agent.

## 2. Watch the agent team work

Open the issue. The **Now** line at the top always shows which agent is working on it, for how long, and on which runtime, with what comes next below it.

**Activity** shows every handoff the coordinator agent makes: who gets the step, what to do, what to read, when it counts as done, and why that agent. This request adds a table, so the coordinator agent first has an agent that is good at design write a short plan, then hands development to an agent that is good at building. The building agent writes the code and tests, takes screenshots in the running app, and opens a PR from the `agent/<issue key>` branch. Finally, the coordinator agent has another model review the code. Review findings go back for fixes, and the fix is reviewed again.

A small request like this one takes about half an hour from start to ready for acceptance.

::figure req-now | The top of the issue page: who is working on it now and what comes next

**Runs** has the full record of every run, which helps when you need to dig into a problem.

## 3. Answer questions

When something isn't clear in the request, such as a choice between two approaches, the coordinator agent moves the issue to **Blocked** and spells out what you need to decide. It shows up at the top of **My issues**. Open it, click **Reply** in the **Needs you** card, and write your decision. The coordinator agent picks up from your reply.

If the request is written clearly, this step may never come up.

If CI isn't connected yet, it will come up: the PR has no check results, so the coordinator agent asks whether to set up CI first or accept without CI, based on the delivery report and screenshots. For a trial run you can reply "No CI this time. I'll accept from the delivery report and screenshots and merge myself", and it hands the issue to you for acceptance. Before real use, remember to [connect CI](ci.md).

## 4. Accept the result

Once the PR has passed review and its checks, the issue moves to **In review** and appears under **Waiting for you** in **My issues**.

1. Open the issue. The **Needs you** card says what you're asked to accept, and below it is the delivery report: how it was before, what changed, how it was checked, open issues with recommendations, and finally the acceptance criteria and screenshots.
2. Click **View changes** to see the PR.
3. If CI is connected, open the preview from the issue page, sign in as the first administrator, and try it against the acceptance criteria.
4. If it works as expected, click **Merge**. The confirmation shows the merge method (for example, squash into `main`), the commit title, and that the issue will move to **Done**. Confirm it. Without check results, the button reads **Merge anyway**, and you can give a reason. Studio records the merge on the PR and in the issue's activity.
5. If something is off, click **Send back for changes** and say what needs fixing. The coordinator agent arranges the fix and hands it back to you.

::figure req-accept | At acceptance you read the delivery report, the acceptance criteria, and the screenshots

**Done when**: the issue is **Done** and the change is on the repository's default branch. If CI is connected, the change is deployed to staging, and the issue shows which environments it has reached.

## Troubleshooting

**The issue never starts.** Look at the **Now** line on the issue page. It says what it's waiting for: no runtime online, all slots busy, or the agent exists only on someone else's personal runtime. If no runtime picks the work up within 24 hours, the run fails, and you're notified so you can retry.

**"Initialize project" isn't done yet.** New issues in the project wait until it is.

**The agent says it couldn't take screenshots.** The runtime has no browser. See the preparation section of [Connect a shared runtime](shared-runtimes.md).

Once it all works, [invite members](invite.md).
