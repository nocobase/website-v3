---
title: Bring the project into Studio
metaDescription: Bring itam-lite into NocoBase Studio so the agent team can carry it forward.
---

Once a system has a first version, it enters a phase of continuous iteration:

1. Features already built need to be improved and their bugs fixed.
2. New feature modules need to be added to the system.

If one person develops several tasks in parallel, they have to jump between several agent sessions, and the faster agents produce output, the more it demands of that person. If several people develop together, requirement context, business material and project experience can end up scattered everywhere. When a different person or agent takes over, much of that context is likely lost. To address this, NocoBase built NocoBase Studio, made for governing development where people and agents work together.

![My issues in Studio: what's waiting for you comes first](https://static-docs.nocobase.com/20261028173135810.png)

> [!NOTE] Studio is available only in the Professional and Enterprise editions
> See [Pricing](https://www.nocobase.com/pricing/). Installing it requires a NocoBase Pro token.

## 1. Have an agent set up Studio

Fill in the prompt in [Let an agent set up Studio](../studio/setup/with-agent.md) and give it to your coding agent. It does four things: deploys Studio, connects Git, connects a shared runtime and enables agents. You do a few steps yourself: signing in to the registry, signing in to Studio for the first time, approving the `nb-studio` sign-in and creating the App on GitHub.

**Done when**: every item in the table under [When setup is done](../studio/setup/with-agent.md#when-setup-is-done) is met.

## 2. Create a project linked to itam-lite

In the itam-lite directory, tell your coding agent:

```prompt
Use nb-studio to create a project called itam-lite in Studio, linked to the current repository, with no initialization. Tell me the project address when you're done.
```

For the other options, see [Create a project](../studio/setup/new-project.md).

**Done when**: the project page opens, and **Project settings › Code repositories** shows itam-lite.

## 3. Connect CI for PR previews (optional)

Once connected, every PR is deployed as a preview, and you can open it from the issue page to try it during acceptance.

Open the project's **Settings › Code repositories**, and in the **Checks** row for itam-lite, click **Edit**:

![Code repositories in the project settings, where the Checks row can be edited](https://static-docs.nocobase.com/20261030-studio-code-repositories.webp)

Click **Show prompt** and copy it to your coding agent. It commits the CI file, saves the secret and opens a PR. For details, see [Connect CI](../studio/setup/ci.md).

![Setting up checks: choose the trigger and the app, then give the prompt to your agent](https://static-docs.nocobase.com/20261030-studio-checks-dialog.webp)

**Done when**: after you merge this PR, the **Checks** row shows as connected, and for any PR opened afterwards, you can open its preview on the issue page.
