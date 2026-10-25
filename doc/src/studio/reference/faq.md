---
title: FAQ and troubleshooting
description: Common problems with installing, signing in, connecting Git, runtimes, moving issues forward, accepting and merging, and previews and deployments, and how to deal with them.
---

> [!TIP] When something goes wrong, ask your agent first
> Whatever the problem, hand it to your agent first, such as Claude Code or Codex. Tell it what you see and the error. It can sign in to the server to read the logs, check Studio's state with `nb-studio`, and use this page and the rest of the docs to find the cause and fix it. When it needs you to do something in the browser or provide a credential, it stops and tells you.

## Installing and signing in

**The address doesn't show the sign-in page.** Include `/main/` in the address, for example `https://studio.example.com/main/`.

**You don't know which account to sign in with.** The username is `nocobase`, and the password is in `.env` in the deployment directory: `grep INITIAL_ADMIN_PASSWORD .env`. See [Install Studio](../setup/install.md#sign-in).

**The interface is in the wrong language, or the sign-in page has a Sign up link.** `config.yml` doesn't set the interface language or turn off self sign-up. Set `i18n.defaultLocale` to your team's language, such as `zh-CN`, and add `auth.emailAndPassword.disableSignUp: true`. Then restart Studio.

**Pulling the image fails.** If it says unauthorized, the token is wrong, so sign in to the registry again. If pulling `postgres:16` times out, the server can't reach Docker Hub, so set up a registry mirror or use an existing PostgreSQL. If downloading image layers hangs, allow the image layer download address you received with your token. See [Install Studio](../setup/install.md#troubleshooting).

**The container won't start or keeps restarting.** Run `docker compose logs studio` to see why. Common causes: `config.yml` wasn't copied out first, so Docker created a directory with that name; the `storage` directory isn't owned by UID 1000; or no encryption key is set.

**`nb-studio login` was approved but you're still not signed in.** `nb-studio login` has to keep running while you approve. Approving after it exits has no effect. Run `nb-studio login` again and approve the new code.

## Connecting Git

**GitHub says "Hook url is not supported because it isn't reachable over the public Internet" when you create the GitHub App.** Studio has no public address, but the webhook is on. Turn off **Webhook** and create it again, and Studio checks once a minute instead. See [Connect Git](../setup/git.md#should-you-turn-on-webhooks).

**Creating a project says "The repository was created, but the App could not confirm access."** The GitHub App was installed with access to only some repositories. Add this repository in the App's installation settings on GitHub, then create the project again and choose **Existing repository**.

**An agent opening a PR says it has no permission to push.** The member connected their own Git account, but that account has only read access to the repository. Give the account write access, or disconnect the personal account so the workspace's connection is used.

## Runtimes and agents

**A runtime shows as offline.** A runner that hasn't contacted Studio for 150 seconds shows as offline. On that machine, run `nocobase-runner status` to make sure it's running and can reach Studio's address.

**A coding tool shows Login required or Not installed.** On that machine, install and sign in to the tool as the system user that runs the runner, then click **Detect again** in the runtime's details. If it's installed and still shows as not installed, the background service's PATH doesn't include it: in a terminal where `which claude` works, run `nocobase-runner service install` again and restart the service. See [Connect a shared runtime](../setup/shared-runtimes.md#troubleshooting).

**A model is missing from the agent list.** Common models are enabled automatically once a runtime reports them. Add other models from **Available models** under **Add agent**. If a model shows **Needs setup** or **Version too low**, deal with it on the runtime as the hint says.

## Moving issues forward

**An issue never starts.** Look at the **Now** line on the issue page. It says what it's waiting for: no runtime online, all slots busy, an agent that exists only on someone else's personal runtime, a blocker, or "Initialize project" still running. Issues in Backlog need you to click **Start** first.

**Work waited more than 24 hours and the run failed.** No runtime picked it up. Connect or start a runtime, then click retry on the card the issue owner received.

**The coordinator agent stops to ask whether to add CI.** The project has no CI yet, so the PR has no check results. Connect CI, or reply that you'll accept without CI. You can also say so in the issue description up front. See [Connect CI](../setup/ci.md).

**Agents went back and forth many times and paused.** By default, comments from agents can trigger at most 20 runs per issue in 24 hours. First check the activity and runs to see whether they keep fixing the same problem. If you're sure it should continue, click **Continue (comment-triggered runs reached their limit)** on the issue page. See [Answer the agents’ questions](../use/answer.md#comment-run-limit-reached).

**The delivery report has no screenshots, or says screenshots failed.** The runtime has no browser. Install Chromium and its system dependencies as described in the preparation section of [Connect a shared runtime](../setup/shared-runtimes.md).

**A coding tool ran out of quota.** The coordinator agent immediately hands the step to another suitable agent, preferably from another vendor. The tool stops taking work on that runtime. When the reset time is known, it resumes automatically then. When it isn't, the runtime's owner or an admin clears the mark under the quota in the runtime's details once the quota is back.

## Accepting and merging

**The Merge button is disabled.** The PR has conflicts, is still a draft, or checks are still running. The coordinator agent arranges for conflicts to be resolved. Merge once the checks finish.

**The button says Merge anyway.** A required check failed or there are no check results. When you're sure it can be merged, give a reason and merge. The merge is recorded on the PR and in the issue's activity.

**The PR was merged directly on GitHub, and the issue in Studio didn't change.** Studio checks once a minute (or knows right away when webhooks are on). Give it a moment, and the issue moves to Done on its own.

## Previews and deployments

**A PR has no preview.** The project hasn't connected CI yet, or CI can't reach Studio's address. See [Connect CI](../setup/ci.md).

**A preview is slow to open.** Previews stop or go to sleep after a while without visitors and have to start or get ready again when opened. Give it a moment.

**Deploying to production does nothing.** Production is protected, so the deployment became a deployment request waiting for an approver. The approver handles it under **To decide** in the inbox.

## Notifications

**The invitation email wasn't sent.** Studio has no email channel yet, and the result shows **Email not sent**. Copy the invitation link and send it to your colleague, or set up email. See [Notifications and push](../admin/notifications.md).

**Push notifications don't reach your phone.** Push needs Studio to be served over HTTPS and an admin to set up the push private key. On an iPhone, add Studio to your Home Screen first, then open it from the Home Screen to subscribe.
