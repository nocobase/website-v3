---
title: Configure repository checks
description: Choose where PR check results come from, set branch rules, and verify results on a task.
---

## Choose a check source

Open **Project settings › Code repositories**. On the repository card, edit **Checks**, choose a source, and save.

| Check source | When to use it | How Studio gets results |
| --- | --- | --- |
| Agent self-check (default) | The development Agent runs the project checks | The Agent runs the project scripts and reports results with `nb-studio check report` |
| Code-host CI | The repository already runs checks in GitHub Actions, GitLab CI, or another supported host | Studio reads the checks on the linked PR or MR |
| External CI | A separate pipeline such as Jenkins runs the checks | The pipeline sends results and log links to Studio |

![Select GitHub Actions as the repository check source](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## Connect external CI

Select **External CI** under the repository’s **Checks**. This example uses a Jenkins pipeline that already builds pull requests. Choose **Jenkins** to copy the setup prompt for a local Coding Agent, or expand the manual setup.

1. Generate a repository CI key in the panel. In Jenkins, add a **Secret text** credential available to the pipeline with the ID `nb-studio-api-key`. The key is shown once and expires after 90 days by default.
2. Add the generated `ci/nb-studio-check.sh` to the repository. Copy the generated `Jenkinsfile`, or add its environment variables and check stages to your existing pipeline. Set `NB_STUDIO_URL` to a Studio address the runner can reach. The pipeline reads `NB_STUDIO_API_KEY` from the Jenkins credential.
3. Set each stage to run your project’s check command. Give each check you want to see in Studio its own name. For example, run a check named `test` with:

```bash
sh ci/nb-studio-check.sh test pnpm test
```

The script reports `pending`, runs the command, then reports success or failure from its exit code and links to the Jenkins build log. Commit the changes and run the PR pipeline. In the task’s **Code & previews** tab, look for `test` on the current commit.

For an existing pipeline in another CI system, choose **Other CI**, configure the Studio URL and repository key, and wrap the existing checks with the same reporting script. Set `BUILD_URL` to the job log URL so readers can open it from Studio. If the CLI cannot identify the repository or commit, pass `--repository` and `--sha` explicitly to the script’s `nb-studio check report` calls.

## Configure branch rules

Under **Project settings › Code repositories › Branch rules**, configure:

- Whether failed required checks wake the Lead Agent.
- Whether passing checks trigger the next step.
- Whether PR conflicts trigger repair work.
- Which checks are advisory and do not block normal merging in Studio.

Checks not listed as advisory are required. The code host's branch protection still applies. When automatic wake-up is disabled, comment on the task to ask the Lead Agent to continue.

## Verify checks on a task

Open the task linked to the PR and select **Code & previews** to see the status and logs for each check. **Not reported yet** means the selected source has not sent a result. See [PR checks and code review](../project/checks-and-review.md) for handling failures.
