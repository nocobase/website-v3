---
title: Overview
description: Understand when to use multiple applications, the Main/Sub workspace, and template, instance, identity, and permission boundaries.
---

## Use cases and application responsibilities

Use multiple applications when business areas need independent data, releases, or access management. A platform application supplies management and a shared entry point.

| Requirement                                                                | Approach                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| Stores share inventory features but keep separate data                     | One inventory template with multiple instances      |
| Customer and purchasing systems have different release cycles              | Separate application templates                      |
| An existing system needs shared entry or login without changing deployment | Register an independent application                 |
| Modules do not need independent data or upgrades                           | Keep one application and organize pages and plugins |

The platform manages templates, versions, hosted instances, independent entries, and platform identity. Each child owns its pages, APIs, migrations, and business permissions. Its business code does not need to move into the platform.

Multi-app does not automatically supply complete tenant organization management, cross-application queries, or service governance. Exchange business data through explicit APIs and permissions rather than reading another application's private database.

## The Main/Sub workspace, templates, and instances

A create-app release supporting `--template=multi-app` generates two complete applications:

| Location       | Responsibility                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Workspace root | Shared installation and lockfile; forwarding development, build, and Skills commands; not an application runtime |
| `apps/main/`   | Platform workbench, application management, and identity provider                                                |
| `apps/sub/`    | Business child with a reagent-management example and platform SSO integration                                    |

Each App has separate configuration, database, storage, development process, tests, and build output. Generated package names are `<project>-main` and `<project>-sub`; npm names are distinct from business template and instance identifiers.

A **template version** identifies a fixed child deployment artifact. An **instance** runs a selected version with its own data, configuration, and runtime version. Main consumes Sub's deployment archive, not its business source. One version can create multiple instances; publication does not upgrade existing instances.

**Hosted applications** use Releases and App Host for provisioning, start, stop, and upgrades. Independent instances do not necessarily have separate OS processes. **Independent applications** retain their own deployment, restart, and backup operations; the platform registers their entries and optionally supplies sign-in.

Source location does not determine deployment mode. A child in a separate repository can still produce an artifact for Host management.

## Commercial plugins and data, identity, and permission boundaries

Open-source template code does not make the following commercial plugins free or open source. You need compatible released versions, a commercial license, and package-download access:

| Plugin                                   | Install in                                 | Responsibility                                                                               |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `@nocobase/app-plugin-multi-app`         | Main                                       | Templates, immutable versions, hosted instances, deployment records, and independent entries |
| `@nocobase/app-plugin-identity-provider` | Main                                       | OIDC identity provider, client registration, and explicit membership                         |
| `@nocobase/app-plugin-platform-sso`      | NocoBase children requiring platform login | Sign-in, independent sessions, admission rechecks, and application switching                 |

Hosted deployment also needs Releases and a working App Host environment. Management can run without SSO. Third-party OIDC applications use their own client rather than the NocoBase child plugin.

The platform decides who may enter; the child decides what they may do. Platform administrators are not automatically child administrators, and provisioning does not grant access to every platform user.

OIDC supplies verified identity while the child retains its own account bindings and sessions, not shared user tables or cookies. Stopping or archiving retains data but is not a backup. Selecting older code does not roll back a database.

Start a new project with [Quickstart](quickstart.md). For existing business systems, read [Migrate a single application](migration.md) instead of overwriting the project with a new template.
