---
title: Connect CI
description: Connect your repository's CI to Studio so every PR gets a preview, and merges and releases deploy to staging and production.
---

Studio doesn't build code itself. Your repository's CI does the building and deploying, for example GitHub Actions or GitLab CI. Once CI is connected to Studio:

- Every PR gets a preview, so the issue owner can try the change before accepting it.
- Pushing to a branch or creating a tag deploys to staging or production, and protected environments need an approver's sign-off.
- Issues show which environments their changes have reached.

Without CI, the agent team still builds and opens PRs. You just don't get previews or deployments.

## Check two things first

- **CI can reach Studio.** After a build, CI uploads the result to Studio's address. If Studio is only on an internal network, cloud CI such as GitHub-hosted Actions can't reach it. Use a self-hosted CI runner that can reach Studio, or give Studio a public address.
- **There is an environment to deploy to.** Studio comes with a **Preview** environment for PR previews. An admin adds staging and production. See [Deploy environments](../admin/environments.md).

## Set up CI

Each setup connects one trigger for one app. To get PR previews and also deploy to staging, set it up twice.

1. Open the project, go to **Project settings › Deployment**, and click **Set up CI**.
2. Choose a **Trigger**:

   | Trigger | What it deploys | Default environment |
   | --- | --- | --- |
   | Pull request | Each PR that changes the app is deployed as a separate app and removed once the PR is merged or closed | Preview |
   | Push to a branch | Builds and deploys on every push to the branch, the repository's default branch by default | Staging (the environment named staging) |
   | Tag | Builds and deploys every matching tag, `v*` by default | A protected environment, such as production |

3. **Environment** follows the trigger by default, and you can change it. Protected environments are marked: every deployment from CI becomes a request waiting for an approver.
4. Under **App**, enter the app's directory in the repository (`.` if it's at the root) and the app ID. PR previews are deployed as `<app ID>-pr-<number>`.
5. Choose how to set it up:
   - **Template**: copy the CI file and the command that saves the CI secret, then commit the file and run the command yourself.
   - **Prompt for your agent**: the same content as a prompt for your local coding tool, which commits the CI file and saves the secret.

Studio never writes anything to your repository. You or your coding tool commit the CI file and save the secret. On GitHub, the CI file is `.github/workflows/nb-studio-<app>-<purpose>.yml` and reads the Actions secret `NB_STUDIO_API_KEY`. On GitLab, the CI file goes under `.gitlab/` and is included from the repository's `.gitlab-ci.yml`.

## The repository's CI key

CI uses an organization API key to upload and deploy to Studio. It doesn't belong to anyone, so it keeps working if the person who set up CI leaves the team. Generating it requires permission to manage the project, such as being its project lead.

- The key is shown only once, when it's generated, and Studio doesn't keep it. The commands in the template and the prompt save it straight into the code host's CI secrets without showing it on screen.
- The key expires after 90 days. Fourteen days and three days before it expires, and on the day itself, Studio reminds the project lead and admins in their inbox, with the command to replace it.
- You can see it in **Settings › API keys**, marked with the repository that manages it. Disable or delete it, and CI stops deploying.

## Check the setup

After CI reports in for the first time, **CI status** in **Project settings › Deployment** lists the apps CI deploys, grouped by environment, with the latest build and deployment. Until then, it shows that it's waiting for the first report.

**Done when**: once you open a PR, its preview shows up on the issue page, and you can open it and sign in as the first administrator.

## Previews

- Previews use sample data, and Studio generates the admin account, so no real company data is involved. Anyone who can edit the issue can see the first administrator's username and password on the issue page.
- The preview environment runs at most 20 previews at a time. A preview stops after 10 minutes without visitors, goes to sleep after 24 hours, and starts again when someone opens it. Change these defaults in **Releases › Deploy environments**.
- When a PR is merged or closed, its preview is deleted automatically.
- For an issue that doesn't need a preview, turn on **No preview needed** in the issue's properties. Agents then add the `no-preview` label to the PR, and the CI template skips the preview.

Next, [walk through your first request](first-request.md).
