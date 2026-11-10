---
title: Manage templates and instances
description: Publish template versions, manage hosted instances, and track upgrades, archiving, and recovery.
---

These operations apply to App Host-managed applications. Use [Connect independent applications](external-apps.md) for externally deployed systems; registration does not give the platform deployment control. Operators need the appropriate page, action, and row permissions. Being able to enter an application does not grant management rights.

## Create templates and publish immutable versions

Prepare the child's build archive and an available deployment environment. The artifact must match the environment's operating system, architecture, and runtime requirements.

1. Open **Application templates** and create or select a template.
2. Upload the child's `dist.tar.gz` in the template details.
3. Check the detected package name and version to confirm that the archive belongs to this template.
4. Publish the version and retain its version number and checksum for deployment checks.

Publication fixes artifact identity and content. To correct a release, change source and publish a new version rather than overwriting an existing one. Later versions retain the same application package name. Publication never upgrades existing instances automatically.

Retiring a template prevents new publication and provisioning without deleting existing versions or instances.

## Select a version and environment to create an instance

Under **Application instances**, provide a name and unique ID, then select the template, an explicit published version, and the environment. A sole available environment may be selected automatically; confirm the target when multiple environments exist.

The instance ID participates in its runtime path. Do not treat it as a freely editable display name. After provisioning, inspect current version, target version, state, and entry URL.

If the environment requires deployment approval, complete it and then observe the result. The target version expresses intent; the current version changes only after actual deployment succeeds.

With identity integration enabled, a new instance receives its own OIDC client and server variables. It does not grant access to every platform user. Add members through [access management](single-sign-on.md).

## Start, stop, and configure instances

| Operation | Effect | Check afterwards |
| --- | --- | --- |
| Start | Runs a stopped instance | Entry works and existing data remains |
| Stop | Stops execution and retains persistent data | Direct access does not reactivate it |
| Restart | Stops and then starts | Runtime is healthy and business reads/writes work |
| Configure | Changes supported presentation settings such as title and default locale | Intended settings take effect without overwriting others |

Instance configuration is not an arbitrary YAML or secret editor. Infrastructure configuration and secret variables belong to the authorized deployment configuration flow. Do not grant broad raw Releases access to bypass managed restrictions.

Explicitly reveal initial administrator credentials in instance details when needed. This requires configure permission and the instance row policy, and is not available to non-user or key-scoped callers. It retrieves the original generated credentials, not a subsequently changed password. Keep credentials out of tickets, logs, and URLs.

## Upgrade selected instances and inspect deployment history

Back up the instance before upgrading and check that the target migrations are compatible with existing data.

1. Record the current version in instance details.
2. Select the target version and confirm the exact instance.
3. Follow operation and deployment history until success or a definite failure.
4. Open the real application and verify version, records, attachments, and key operations.
5. Inspect an unselected instance and confirm its version is unchanged.

API callers must follow the current API document's revision checks, confirmation fields, and submission protection. Automated clients should obtain that document from `<application-base>/api/swagger`; do not replace the actual actor with an unrestricted service identity.

Deployment history is an execution record, not a business-data backup. Before selecting older code, verify that it can read the current database. Switching artifacts does not reverse migrations automatically.

## Archive, restore, and recover failed operations

Archiving stops an instance while retaining files, configuration, and data. Archived applications reject platform identity access. Restoring retains memberships but still requires an explicit start. Neither operation rolls back the database, and ordinary management does not provide permanent deletion.

For failed, timed-out, or interrupted operations, first inspect:

- The failed phase.
- Whether a deployment or approval request was already sent.
- Recorded deployment identifiers and actual runtime results.
- Whether an unfinished operation still holds the instance.

When the result is unknown, use supported reconciliation to inspect the existing deployment. Do not provision again, clear locks directly, or edit internal database state. Automated retries of the same logical request retain its original submission identifier rather than creating another external effect.

Repeated upgrade attempts do not repair a failed database migration. Retain error, operation, and deployment identifiers, then use the [backup and recovery procedure](deployment.md) to decide whether matching code and data must be restored.

The example's [management UI integration](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/client/pages/template-portal/management-ui.tsx) shows how an application composes plugin management capabilities.
