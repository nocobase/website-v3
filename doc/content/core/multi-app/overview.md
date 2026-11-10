---
title: Overview
description: Understand when to use multiple NocoBase applications, the three commercial plugins, and the boundaries between platforms, children, templates, and instances.
---

## When to use multiple applications

Use multiple applications when business areas need independent data, releases, or access management. A platform application provides a shared management interface and entry point.

| Requirement | Approach |
| --- | --- |
| Several stores use the same inventory features but keep separate data | One inventory template with multiple instances |
| Customer management and purchasing have different features and release schedules | Separate application templates |
| Existing systems should keep their deployments but share entry points and sign-in | Connect independent applications |
| Modules belong to one system and do not need separate data or upgrades | Keep one application and organize features with pages and plugins |

Multi-app does not automatically provide a complete tenant organization model, cross-application business queries, or service governance. Exchange business data through explicitly designed APIs and permissions, rather than treating another application's private database as an integration interface.

## Platform, child applications, templates, and instances

- The **platform application** provides the workbench, template and application management, and platform identity.
- A **child application** is a complete business application with its own pages, APIs, migrations, and business permissions.
- A **template** defines an application that can be deployed. Each published version refers to a fixed build artifact, not a changing source directory.
- An **instance** is a deployment of one template version, with its own data, configuration, files, and running version.

One template can have multiple instances. Publishing a new version does not upgrade existing instances. An administrator selects which instances to upgrade; others keep their current versions.

## App Host management and independent deployment

For **managed applications**, the platform uses Releases and App Host to provision, start, stop, and upgrade instances. App Host runs the instances; independent instances do not necessarily mean separate operating-system processes.

**Independent applications** run in their own environments. The platform registers their entry points and optionally provides sign-in. It does not deploy, restart, or back them up.

Source location does not determine deployment mode. A child can live in the same workspace or in a separate Git repository. An independently developed application can still build an artifact for App Host.

## The three commercial plugins

Developing a multi-app system with application management, shared sign-in, and application switching requires these three **commercial plugins**:

| Plugin | Installed in | Responsibility |
| --- | --- | --- |
| `@nocobase/app-plugin-multi-app` | Platform | Templates, immutable versions, managed instances, deployment history, and independent application entries |
| `@nocobase/app-plugin-identity-provider` | Platform | OIDC identity provider, application client enrollment, and explicit membership |
| `@nocobase/app-plugin-platform-sso` | NocoBase child | Platform sign-in, independent sessions, access revalidation, and application switching |


The plugins have distinct responsibilities. Application management can run without shared sign-in. A third-party OIDC application uses its own OIDC client rather than the NocoBase child plugin. Managed deployment also requires Releases and a configured App Host environment.

## Data, identity, and authorization boundaries

The platform decides **who may enter an application**. The child decides **what they may do inside it**. Platform administrators do not automatically become child administrators, and provisioning does not grant access to every platform user.

Shared sign-in uses OpenID Connect (OIDC) to convey verified identity. Each child creates its own account binding and session; it does not share the platform's user table or cookies. See [Single sign-on and access](single-sign-on.md).

Stopping or archiving retains instance data. Restoring an archived instance is not restoring a backup, and reverting code is not rolling back a database.

Start with the [Quickstart](quickstart.md). For an existing business system, read [Migrate a single application](migration.md) before making changes; do not overwrite it with the example.
