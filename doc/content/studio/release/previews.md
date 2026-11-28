---
title: PR previews
description: Open the preview for the task’s commit to verify changes before merging.
---

## Open a task’s preview

1. Open **Code & previews** on the task and find the PR you want to verify.
2. Check the commit shown for the preview. If the PR has newer changes, wait for the new build to be published.
3. Open the preview app. If sign-in is required, anyone who can edit the task can select **Account** on the PR row at the top of the task to copy the initial administrator credentials.

![The PR preview includes build status and an access link](https://static-docs.nocobase.com/studio-en-req-preview-20261111-normal-2x.webp)

Try the acceptance scenarios from the delivery report in the app, then return to [task acceptance](../use/accept.md) to accept the delivery or request changes.

An idle preview wakes on the next visit. Studio removes the preview app when the PR is merged or closed. See [Hosted environments](../admin/environments.md#manage-preview-applications).

## Skip a preview

Enable **No preview needed** in the task properties. The Agent adds the `no-preview` label to the PR, which generated CI templates respect. Existing previews are not automatically deleted by this setting.

See [Configure PR previews for a repository](../configure/pr-previews.md) to change the repository default.
