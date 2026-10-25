---
title: Publish an application release
description: Rehearse a business release with a new migration while preserving tasks, permissions and configuration.
---

This exercise uses the historical `03-filtering-pagination` → `04-task-due-date` example in an isolated environment. The current getting-started example already includes due dates; do not add the field to it again. Prepare a separate application from the old tag for this exercise.

Next, add optional due dates. Publish to the same application, preserving its database, configuration, stable secrets, and file storage. Apply the new migration to existing tasks and verify the result.

This exercise publishes a business feature. To update the framework and related dependencies, follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), then use the [deployment guides](choose-a-deployment-method.md).

## Exercise: add an optional due date

The [04-task-due-date](https://github.com/nocobase/app-tutorials/tree/04-task-due-date) tag and [chapter diff](https://github.com/nocobase/app-tutorials/compare/03-filtering-pagination...04-task-due-date) add a nullable `dueDate`. The existing migration files stay unchanged. Existing tasks keep their IDs, titles, assignees and completion states, with an unset date. The API validates a calendar date in `YYYY-MM-DD` form.

Use a separate old-version deployment with two assigned tasks, one completed, and a read-only member. Prepare the updated source and run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/client/tutorial-tasks-date-picker.test.tsx
```

For an existing custom branch, review and merge the chapter changes instead of overwriting your source. Use the historical tags named above, rather than the current getting-started example revision.

![Choosing an optional due date.](/assets/core/tutorials/tasks-update/choose-date.png)

Run `tests/playwright/tutorial-tasks-due-date.test.ts` against a local test app using the environment requirements in that tagged test file. It writes tasks and should not target production.

## Keep the original deployment method

- [app-installer](../tutorials/deploy-with-app-installer.md#publish-a-new-release): review the update plan and backup before applying migrations and switching releases.
- [Studio](../tutorials/deploy-to-studio.md#publish-a-new-release): upload and deploy a new release to the same application and environment.
- [Docker](../tutorials/deploy-with-docker.md#publish-a-new-release): use a new image tag with the original configuration and storage mounts.

After deployment, check old tasks and permissions, create a dated task, refresh, complete/reopen it and verify the date persists. Old records should show no date until one is assigned.

![Existing tasks retain their data while a new task has a due date.](/assets/core/tutorials/tasks-update/updated-list.png)

The original deployment rehearsal used template `1.0.0-beta.77`: app-installer was exercised through an existing SQLite database update and restart; Studio and Docker were exercised for initial deployment. The refreshed repository uses template `1.0.0-beta.78` and is verified separately for development, tests and build. The screenshots of the task feature are from that refreshed app; they do not establish a new deployment rehearsal for all three methods.
