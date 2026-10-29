---
title: Application development overview
description: Understand the parts of a business feature, where they belong, how they connect, and which guide to read for each task.
---

Developing a NocoBase application means implementing your business on top of the template's structure and Core's existing capabilities: how data is stored, who can act on it and how pages present the result.

This guide explains the parts of a feature, where to write them and how an operation passes through them, then lists this section's guides by task. These are also the conventions an Agent follows, so you can use them to review its changes. To complete a feature from start to finish first, see [Build your first app](../tutorials/build-your-first-app.md).

## Which code you change

You own the application's source, but code from different origins is maintained differently:

| Part | Includes | How to change it |
| --- | --- | --- |
| Business code | Your pages, APIs, tables, business services, copy and tests | Edit directly and release with the application |
| Template code | `client/routing/`, `client/layouts/`, `client/theme/`, server entry points, `package.json` scripts and tsconfig files | Editable, but reconcile changes with new templates during upgrades. Prefer route declarations, component composition and theme configuration. When direct changes are necessary, comment on the reason and record the important details in `.agents/rules/` |
| Core packages and plugins | `@nocobase/*` packages in `node_modules/` | Do not edit directly. Customize through public APIs, plugin options and extension mechanisms, such as plugin options or route component overrides for plugin pages, and language-resource `overrides` for plugin copy |

Before building a feature, look for existing capabilities. The default template registers authentication, users, authorization, files, notifications and other plugins. Use the plugin documentation and Skills for capabilities such as permissions, notifications and scheduling rather than rebuilding them. See [Using plugins](../using-plugins/overview.md).

Write business features directly in the application by default. Create a plugin when you need reuse across applications or want to maintain a capability as an independent module; see [When to write a plugin](../extension-development/when-to-write-a-plugin.md).

## Where a feature belongs

Each kind of code has a defined location:

| Location | Contents |
| --- | --- |
| `database/main/migrations/` | Schema changes. Migrations are history: do not edit them after merging; add a new migration for later changes |
| `database/main/seeds/` | Initial data required by the application |
| `server/routes/` | HTTP APIs: validate input, check identity and permissions, call services and return results |
| `server/providers/` | Business services and their lifecycle; a place to centralize reusable business rules |
| `client/pages/` | Page components; use a directory for a page with child pages or supporting files |
| `client/routes.ts` | Page routes, navigation and page access permissions |
| `client/components/` | Application components. Add shadcn primitives under `client/components/ui/` with the CLI rather than writing them by hand |
| `client/locales/` | User-facing copy in `en-US.ts` and `zh-CN.ts` |
| `cli/commands/` | Application-owned commands |
| `tests/` | Tests, kept separate from source files |

A feature with a page and API usually changes five places: a table migration, an API in `server/routes/`, a page in `client/pages/`, routes and navigation in `client/routes.ts`, and copy in `client/locales/`. Add a service when the business rules warrant one, then add tests.

These are responsibilities, not a checklist to fill every time. Changing form copy does not require a migration; adding a field does not require changing sign-in. Identify what the requirement changes and edit the relevant parts. See [Project structure](../getting-started/project-structure.md) for the full directory guide.

### Register new files with the application

Putting a new file in a directory is not enough. Register it at the corresponding entry point so the application loads it:

| Addition | Location | Registration entry point |
| --- | --- | --- |
| Page | `client/pages/` | `client/routes.ts` |
| API | `server/routes/` | `server/routes/index.ts` |
| Server service | `server/providers/` | `server/providers/index.ts` |
| Client service | A file you organize | `client/service-provider.ts` |
| Component-tree context | React Provider | `client/react-providers.ts` |

`client/runtime.ts` and `server/runtime.ts` compose routes, plugins, configuration and services. The template connects these entry points already, so ordinary business features rarely require changes to either runtime file. You can create directories such as `server/services/` and `server/jobs/` to organize code, but their contents are not registered automatically.

## How a save reaches the database

Consider assigning a task to a project. A user selects a project in a dialog and clicks Save:

1. **The page submits.** It sends the task ID and selected project ID to the API, or requests that the association be cleared.
2. **The API checks the request.** It confirms sign-in, permission to change the task's project and valid input.
3. **The service handles the business rules.** It finds the task and target project within the user's data access, confirms that the task is editable and the project is eligible, then updates the association.
4. **The database saves.** A migration has already created fields and foreign keys. The database rejects a reference to a nonexistent project. Migrations run once for schema changes, not on every save.
5. **The page updates.** The API returns the result, and the page refreshes the task list and gives feedback. On failure, preserve the selection and show field errors beside the selector. Stop editing if the task has been deleted.

APIs receive and validate requests; services centralize reusable business rules. Use a transaction when several operations must succeed or roll back together. See [Routes and HTTP APIs](apis-and-services.md), [Server business services](server-business-services.md), [Transactions and consistency](transactions-and-consistency.md), [UI components and interactions](pages-and-interactions.md), and [Tables and initial data](data-models-and-migrations.md).

### Check permissions at each layer

| Layer | Decides | Note |
| --- | --- | --- |
| Page route | Whether the page can open | Route `auth` controls browser navigation; it is not a server-side security measure |
| API | Whether the caller is signed in and may perform the action | Mounting under `/api` does not authenticate callers automatically. Add authentication and authorization checks to each API |
| Service and query | Which records the operation may access | Apply the user's permission policy so knowing another record's ID does not grant access |
| Page buttons | Whether to show an action | Interface feedback cannot replace the checks above |

Changing a task's project requires checking both sides: the user must be allowed to modify that task and assign it to the target project. Being able to view a project does not imply permission to assign tasks to it. A foreign key proves the project exists, not that the user may use it. See [Authentication, permissions and data access](authentication-and-permissions.md).

## Find documentation by task

> [!NOTE]
> Some topics use examples from earlier template versions. Each page describes its example version and setup. You do not need to run an example just to read its explanation and code.

### Client

| Task | Guide |
| --- | --- |
| Add pages and menus and control who can open them | [Pages, routes and navigation](pages-routes-and-navigation.md) |
| Build lists, forms and dialogs with loading and error feedback | [UI components and interactions](pages-and-interactions.md) |
| Fetch remote data and manage URL state, form drafts and shared state | [Data requests and state](data-requests-and-state.md) |
| Adjust page shells and containers | [Page layouts](page-layouts.md) |
| Organize copy, add languages and set the default language | [Localization](localization.md) |
| Adjust styles, theme presets and default appearance | [Themes and styles](themes-and-styles.md) |
| Implement and register client business services | [Client business services](client-business-services.md) |

### Server

| Task | Guide |
| --- | --- |
| Declare and register APIs, choose Repository data APIs and generate API documentation | [Routes and HTTP APIs](apis-and-services.md) |
| Reuse business rules and organize service dependencies and transaction boundaries | [Server business services](server-business-services.md) |
| Validate input and define responses and errors | [Request validation and errors](request-validation-and-errors.md) |
| Integrate authentication, action permissions and data access | [Authentication, permissions and data access](authentication-and-permissions.md) |
| Dispatch background jobs and declare recurring tasks | [Background tasks and scheduling](background-tasks.md) |
| Generate emails, notifications and other copy in the request or recipient's language | [Server localization](server-localization.md) |

### Database

| Task | Guide |
| --- | --- |
| Create tables, seed records and evolve existing schemas | [Tables and initial data](data-models-and-migrations.md) |
| Query data, read relationships and perform batch operations | [Querying and manipulating data](querying-data.md) |
| Keep multi-step writes consistent and handle failures and concurrency | [Transactions and consistency](transactions-and-consistency.md) |
| Add a second database connection | [Multiple database connections](multiple-databases.md) |
| Read a database whose schema is maintained by another system | [Connect an existing database](existing-databases.md) |

### Command line

| Task | Guide |
| --- | --- |
| Write maintenance commands that run in the application environment | [Application commands](application-commands.md) |
| Integrate commands provided by plugins | [Plugin commands](plugin-commands.md) |
| Let users or Agents sign in and call business APIs from their own computers | [Provide a CLI client](cli-client.md) |

### Configuration, plugins and delivery

| Task | Guide |
| --- | --- |
| Define, override and read application configuration | [Application configuration (config.yml)](configuration-and-settings.md) |
| Inspect, register and update plugins | [Manage plugins](manage-plugins.md) |
| Choose verification methods and complete acceptance | [Testing and acceptance](testing-and-acceptance.md) |
| Describe requirements and review Agent changes | [Develop with an Agent](develop-with-an-agent.md) |
| Upgrade and reconcile template changes | [Upgrade NocoBase Core](upgrade-nocobase-core.md) |

See [Framework overview](../framework/overview.md) for runtime composition, the service container, database mechanisms and other internals.
