---
title: Upgrade NocoBase Core
metaDescription: Upgrade NocoBase Core to the latest version with the app's built-in upgrade skill. Plan first, merge after you confirm, then run the tests and check the data.
---

The upgrade is done by the app's built-in `nocobase-app-upgrade` skill: it compares the old and new versions of the template and merges the differences into the app file by file, keeping the business code.

```prompt
Upgrade NocoBase Core to the latest version. Give me an upgrade plan first and change things only after I confirm.
```

The plan lists which files the template changed, how files the app has also changed will be merged, and what changes in dependencies and database migrations. After you confirm, the agent merges on a new branch, installs dependencies, syncs skills, runs the tests and the build, checks the data, and then merges back into the main branch.

For manual upgrade steps and a verification checklist, see [Upgrade NocoBase Core](../core/developing-apps/upgrade-nocobase-core.md). Releasing after an upgrade works like publishing any new release: build a new image, back up the deployment directory, then replace it. See [Publish a new release](../core/tutorials/deploy-with-docker.md#publish-a-new-release).

**Done when**: `nocobase.defaultTemplateVersion` in `package.json` is the new version, the tests and build pass, and all data from before the upgrade is still there.
