---
title: Manage templates and instances
description: Publish immutable versions, configure and selectively upgrade instances, and handle archives and uncertain operation results.
---

These operations manage App Host applications and require the relevant page, action, and row-scope permissions. Entry access does not grant administration. [Independent applications](external-apps.md) do not gain platform deployment capabilities by registering.

## Publish immutable versions and provision instances

First prepare a complete child archive compatible with the destination through [Deployment](deployment.md), and verify a working Host environment.

1. Open **Application templates** and create or select a template.
2. Upload the child's `dist.tar.gz`, checking the recognized package name, version, and artifact identity.
3. Publish and retain its checksum. Keep the application package name stable across versions; changed contents require a new version, not replacement.
4. In **Application instances**, enter a name and unique ID, then choose an explicit published version and deployment environment.
5. Complete required approvals, observe the operation/deployment result, and check the actual version, runtime state, and entry URL.

Instance IDs participate in runtime paths; they are not freely editable display names. A target version expresses intent. Successful deployment and business behavior establish effect. Publishing does not upgrade existing instances.

Disabling a template prevents new publication and provisioning without deleting published versions or existing instances. With identity integration enabled, each new instance registers its own client but still requires [explicit membership](single-sign-on.md).

## Configure, start, stop, and selectively upgrade

| Operation | Effect                                                          | Verify afterward                                                                 |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Start     | Run a stopped instance                                          | Entry works and existing data remains                                            |
| Stop      | Stop execution, retaining persistent data                       | Direct requests cannot reactivate it                                             |
| Restart   | Stop and start                                                  | Availability and business operations recover                                     |
| Configure | Change supported titles, default language, and similar settings | Intended settings apply without replacing others                                 |
| Upgrade   | Deploy an explicitly selected target version                    | Actual version, data, and permissions are correct; other instances are unchanged |

Instance configuration is not an arbitrary YAML or secret editor. Infrastructure and secret variables belong to authorized deployment configuration, not broader raw Releases write grants.

Viewing initial administrator credentials requires instance configuration permission and the relevant data scope, and is unavailable to non-user or restricted-key callers. It returns the originally generated credentials, not later password changes. Keep them out of tickets, logs, and URLs.

Before upgrading, record the current version, back up data, and check migration compatibility. Select the intended instance and version, then verify business behavior, attachments, permissions, restart retention, and an untouched instance. Upgrade testing needs a real new artifact, not a fixed pair of demonstration versions.

Automation first reads the authenticated `<application-path>/api/swagger` document and follows its revision, confirmation, and submission-protection requirements. Preserve the original submission ID when retrying the same logical request after an unknown result. Do not replace the real operator with an unauthorized internal caller.

## Inspect results, archive, and recover instances

Deployment history records execution, not business backups. Before selecting older code, verify that it supports the current database; switching code does not undo migrations.

Archiving stops an instance, retains data/files/configuration, and blocks platform identity entry. Restoring archive status retains membership but still requires explicit start. It does not restore a database backup; ordinary management does not provide permanent deletion.

After failure, timeout, or interruption, inspect the instance's operation records for:

- The failed stage and any existing deployment or approval request.
- Recorded operation/deployment IDs and actual results.
- Any unfinished operation still occupying the instance.

Reconcile existing deployments through supported recovery before retrying. Do not provision duplicates, clear locks, or edit internal state directly. Repeated upgrades cannot repair a failed migration. Retain IDs and errors, then use [Backup and recovery](deployment.md) with compatible code and data.

Generated project integration lives in `apps/main/client/pages/template-portal/`. The installed `nocobase-app-plugin-multi-app` Skill describes management capabilities and API rules.
