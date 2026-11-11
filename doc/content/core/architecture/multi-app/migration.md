---
title: Migrate a single application
description: Use the migration Skill to choose an integration path, retain data and identities, and rehearse cutover and recovery.
---

This procedure applies to existing NocoBase 3 business applications, not migration from NocoBase 2 to 3. Do not overwrite an existing project with a Main/Sub workspace or treat a newly provisioned empty instance as completed migration.

## Use the migration Skill to assess three paths

The target workspace's `skills/nocobase-multi-app-migration/SKILL.md` covers assessment, rehearsal, confirmation, and recovery. The original application still follows its own `AGENTS.md` and upgrade/deployment Skills. Confirm the target platform, compatible commercial versions, data ownership, maintenance window, and recovery owner before changes.

| Path                                       | Suitable when                                        | Main changes                                                                   |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Keep deployment and register independently | Shared entry or login with fewer deployment changes  | Optional SSO and role mapping, without provisioning a Host instance            |
| Move into App Host                         | Platform-managed versions, start, stop, and upgrades | Build an independent artifact and transfer configuration, databases, and files |
| Add platform capabilities in place         | The existing system should become the platform       | Merge management and identity while retaining business features and login      |

First request a read-only assessment from a Coding Agent:

```prompt
This inventory application is already in use. I want to connect it to a multi-app platform while preserving products, stock movements, existing users, and permissions. Compare keeping its deployment, moving it under platform management, and making this system the platform. Tell me what to prepare, but do not change the system yet.
```

Resolve incompatible versions through the original application's upgrade Skill and retained-data checks, not template overwrite. Splitting business databases is a separate data migration, not an automatic result of multi-app adoption.

## Retain data, migration history, identities, and permissions

At minimum, inventory:

| Area                           | Preserve or verify                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Business source and migrations | Custom pages/APIs, historical migration sources, names, ownership, contents, and execution records |
| Databases and files            | Records, user foreign keys, relationships, attachments, and external stores                        |
| Identity and permissions       | Original user IDs, external bindings, roles, and local recovery administrator                      |
| Private configuration          | Encryption keys, signing configuration, client and third-party credentials                         |
| External effects               | Schedules, queues, webhooks, notifications, and other writers                                      |

A Host template archive contains deployable code and dependencies, not existing business data. Design restoration order for the actual database and storage; no universal command can import every instance volume.

Before first SSO, establish which platform identities correspond to existing users and how access roles map to business permissions. Identity binds by issuer and subject, not automatic email linking. Preserve original user IDs and business foreign keys. Stop on collisions instead of creating replacement users with matching names.

If the same platform already uses `PLATFORM_SSO_IDENTITY_NAMESPACE`, preserve it and verify actual bindings. It neither bypasses HTTPS nor provides arbitrary cross-platform account merging. An issuer change requires reviewing callbacks, client configuration, and existing bindings, not just replacing a URL.

Assign membership to named users, retain legitimate existing roles, and remove obsolete SSO-derived grants. Platform administrators do not automatically gain child administration. Do not grant business permissions to all authenticated users to bypass migration issues.

## Rehearse, cut over, verify, and recover

1. Restore coordinated database, file, and configuration backups into isolation, preventing production notifications, webhooks, queue consumers, or other real effects.
2. Prepare artifacts, the target environment, and identity mappings for the selected path. For a Host move, determine migration timing and fence the target from users and workers before restoring data.
3. Compare counts, representative records, user IDs, foreign keys, files, permissions, and migration checksums against the baseline.
4. Explicitly confirm the target, data scope, maintenance window, final backup, and recovery owner before quiescing original writers, resolving in-flight operations, and switching traffic as rehearsed.

Independent integration retains original deployment and backup ownership. In-place platform conversion merges authentication, user fields, pages, and permission IDs without overwriting business features. Keep one defined writer/worker owner per data or queue scope. Do not let old and new systems write the same data without a designed concurrency strategy.

After cutover, test existing ordinary users, business behavior, real SSO, local recovery, downgrade and revocation, direct API denials, and restart persistence. Health checks and a newly created account do not replace retained-data and identity comparisons.

On failure, fence traffic and uncertain background effects first, keeping the failed phase, instance, and operation IDs. Revert code directly only if it supports the current database; otherwise restore matching code, database, files, and configuration. Destructive reset or rollback requires separate approval rather than being the default remedy.

Keep the original deployment recoverable but stopped from writing until explicit acceptance and an agreed retention period. See [Deployment and operations](deployment.md) for backups and runtime requirements.
