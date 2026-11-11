---
title: Migrate a single application
description: Choose a multi-app migration path for an existing NocoBase 3 application while preserving data, identities, and recovery options.
---

These steps apply to an existing NocoBase 3 application with business data. Do not overwrite it with the example or treat a newly provisioned empty instance as a completed migration. Migration from NocoBase 2 to NocoBase 3 is outside this procedure.

## Assess the application and retained data

Record the source application, destination platform, framework and plugin versions, deployment mode, and allowed downtime. Review the [three commercial plugin dependencies](overview.md) and confirm compatibility before integration.

| Area | Preserve or verify |
| --- | --- |
| Business code and migrations | Custom pages, APIs, executed migration sources, and history |
| Databases and files | Records, attachments, user foreign keys, and storage locations |
| Identity and permissions | User IDs, external account bindings, role assignments, and local recovery administrator |
| Private configuration | Encryption keys, signing configuration, client secrets, and third-party credentials |
| Jobs and external integrations | Schedules, queue consumers, callbacks, webhooks, and writers |

If core or template versions are incompatible, merge through the application's upgrade process and validate retained data. Do not overwrite the project with a newer template.

A Coding Agent can first perform a read-only assessment:

```prompt
This inventory application is already in use. I want to connect it to the multi-app platform while keeping products, stock movements, users, and permissions. Compare keeping its current deployment with moving it under platform management. Tell me what to prepare, but do not change the system yet.
```

## Choose external integration, App Host, or platform conversion

| Path | Suitable when | Main changes |
| --- | --- | --- |
| Keep the existing deployment and register externally | You want shared entry or login with fewer deployment changes | Register the entry; add identity and role mapping if SSO is needed |
| Move into App Host | You want platform-managed versions, start, stop, and upgrades | Build a template and transfer runtime configuration, data, and files |
| Add platform capabilities to the existing application | The existing system should become the management platform | Integrate management and identity while preserving existing business and login |

External integration usually changes deployment less, but still requires identity and authorization decisions. Multi-app does not require splitting every module into separate databases immediately. Treat business-data separation as its own migration.

A Host template archive supplies code, not existing business data. Plan restoration or connection for the actual database and storage. There is no universal volume import command for every application.

## Preserve identities and business permissions

Before the first platform login, decide which platform identities correspond to existing business users and how access roles map to child permissions.

SSO identifies users by issuer and subject, not automatic email linking. Preserve user IDs and business foreign keys. Stop on identity conflicts rather than creating replacement users with matching names.

Platform administrators do not automatically become business administrators. Assign membership to named users, retain legitimate roles, and identify which SSO-derived grants a downgrade must remove. Do not grant business access to every authenticated user to bypass migration problems.

An issuer change requires coordinated review of callbacks, runtime variables, and existing account bindings. Keeping the same platform behind a different domain does not make old identity bindings update automatically.

## Rehearse migration and cut over

Restore consistent database, file, and configuration backups into an isolated environment. Disable production notifications, webhooks, and background-write credentials so the rehearsal cannot affect real operations.

Follow the selected path:

- **External integration:** retain deployment and data, register the entry, add required login, and verify existing behavior. Do not provision a Host instance.
- **Move into Host:** build a compatible artifact and prepare the target. Determine when migrations run, stop target writers, and restore databases, files, and private configuration in the rehearsed order.
- **Convert to a platform:** merge plugins and authentication without overwriting user fields, page permission IDs, or login methods. Run required migrations against restored data.

Before production cutover, confirm the maintenance window, recovery owner, and final backup. Stop original writers and background consumers, resolve or record in-flight operations, then restore, migrate, and switch traffic as rehearsed. Each schedule, queue, and business writer must have one defined owner.

Do not run old and new applications against the same data without a designed concurrency strategy merely to avoid downtime.

## Verify retention and recover the original environment

Compare record counts, representative records, user IDs, relationships, attachments, configuration, and permissions against the baseline. Test existing ordinary users, SSO, local recovery, direct API denials, and persistence after restart.

If migration fails, fence traffic and uncertain background effects first, retaining the failed phase and operation identifiers. Revert code directly only if it is compatible with the resulting database. Otherwise restore a consistent backup with matching code and configuration. Destructive database rollback or reset is not the default recovery step.

Keep the old deployment available for recovery but stopped from writing until migration is accepted, recovery is verified, and retention is agreed. A successful health check is not grounds for deleting the original environment. See [Deployment and operations](deployment.md) for runtime preparation and backup scope.
