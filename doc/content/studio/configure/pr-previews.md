---
title: Configure PR previews for a repository
description: Choose who builds PR previews for a repository and connect a CI pipeline if needed.
---

Open **Project settings › Code repositories** and edit **Previews** on the repository card. Choose the build mode independently of the [check source](checks.md). For example, GitHub Actions can run checks while the development Agent builds previews.

## Choose a build mode

- **Agent build** lets the development Agent deliver the preview. Document the application directory, build command, and archive path in the repository’s README or `AGENTS.md`. The Agent builds the linked PR’s latest commit and publishes it with `nb-studio deploy --preview --file <archive-path>`. The person initiating the run needs permission to create the preview app the first time.
- **CI build** uses a pipeline to build and publish each PR’s preview with the repository CI key.
- **No build** skips preview builds for this repository.

Select **Save** to apply the choice.

![Choose a build mode in the Previews drawer](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## Publish previews from CI

Select **CI build**. If external CI already reports checks with this repository’s key, reuse it for previews. Otherwise, generate a key in the panel and store it as the pipeline secret `NB_STUDIO_API_KEY`. Make sure the CI runner can reach Studio.

**Using GitHub Actions**

1. Select the **GitHub Actions workflow** tab, the pull request trigger, and a hosted environment for previews. Set the application directory to `.` for the repository root or a relative path such as `apps/shop`. Check the suggested App ID.
2. Give the panel’s prompt to a Coding Agent with repository access, or expand the manual setup and place the generated workflow in `.github/workflows/`. Store the repository key as a GitHub Actions secret named `NB_STUDIO_API_KEY`.
3. Open or update a PR. Once the workflow publishes the preview, check the app and commit in the repository’s **Build records** in Studio. Open the [PR preview](../release/previews.md) from the task.

![Repository key settings and workflow options under CI build](https://static-docs.nocobase.com/studio-guide-en-ci-build-20261127-a2f2cc4abfa1.webp)

**Using Jenkins or another CI system**

1. Under **Other CI**, expand the manual setup and copy the build and publish commands into the PR pipeline. Set `NB_STUDIO_URL` and the repository key, then authenticate the installed `nb-studio` CLI in the same job:

   ```sh
   printf '%s' "$NB_STUDIO_API_KEY" | nb-studio login --server "$NB_STUDIO_URL" --api-key-stdin
   ```

2. Set `PR` to the PR number, `SHA` to its head commit, and `CI_RUN_URL` to the build log URL. The generated commands report the build status and ask Studio whether the PR needs a preview.
3. Replace the build placeholder inside the conditional with your project’s build command. For example, `pnpm build --tar` produces `storage/exports/dist.tar.gz` for a NocoBase app. Point the deployment command’s `--file` at the resulting archive. Keeping the conditional lets the pipeline skip both the build and the deployment when Studio skips the preview.
