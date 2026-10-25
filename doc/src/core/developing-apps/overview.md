---
title: Application development overview
description: Understand application code, templates and plugins, and follow a feature from its page through an API and service to the database.
---

Developing a NocoBase application means implementing business rules on top of its existing structure and capabilities: how data is stored, who can act on it, and how the interface presents the result. This section explains those topics for use during development. To build a feature from start to finish first, follow the [tutorial](../tutorials/build-your-first-feature.md).

The following sections use a separate projects-and-tasks example to explain each responsibility. Its tables, endpoints, and test configuration differ from the [getting-started example](../tutorials/build-your-first-feature.md). To run the code, prepare its baseline through [Data models and migrations](data-models-and-migrations.md); reading the concepts does not require running it.

## Application code, templates and plugins

Creating an application gives you source code that you can change and maintain independently. The template supplies its initial structure, Core packages provide development and runtime capabilities, and plugins provide reusable features.

| Part | What it supplies | How you use it |
| --- | --- | --- |
| Application code | Your pages, APIs, data models, business services and tests | Change it in your application repository and release it with the application |
| Application template | Entry points, layouts, components, configuration and development conventions | Generate it into the project when creating the app; merge template changes during upgrades |
| Core foundation packages | Client and server runtimes, data access, configuration and related capabilities | Use public APIs and manage versions through project dependencies |
| Plugins | Reusable authentication, users, authorization, files and other capabilities | Use the public interfaces, components and extension mechanisms of registered plugins |

Project names and task assignments are application business concerns; sign-in and role permissions can use existing plugins. The default template already includes several plugins. Check available capabilities before adding a feature; plugin installation is not a required first step for every change.

A task page does not need to become a plugin. Consider that boundary when you need reuse across applications with independent publishing and versioning. Do not customize an application by editing plugin implementations in `node_modules/`.

Generated layouts and themes also belong to the application's source. Prefer route declarations, component composition and theme configuration. When you need to change the framework structure, record why so that [upgrading NocoBase Core](upgrade-nocobase-core.md) preserves the customization.

## The parts of a feature

“Assign a task to a project” requires more than a selector:

| Part | Question it answers | Location in the example |
| --- | --- | --- |
| Data model | How is the project stored, what happens to old tasks, and what if a project does not exist? | `database/main/migrations/` |
| Business service | Can this task change, is the target project eligible, and how is the association saved? | `server/providers/tutorial-project-service.ts` |
| HTTP API | Who is calling, is the input valid, and what is returned? | `server/routes/tutorial-projects.ts` |
| Permission declarations and service registration | Which business actions exist, and how do APIs obtain the service? | `server/providers/tutorial-projects.ts` |
| Page routes and navigation | Where do users enter, and who can open the page? | `client/routes.ts` |
| Pages and interactions | How are the current project, available options, loading and save results presented? | `client/pages/tasks/[taskId]/project.tsx` |
| Copy | What are the English and Chinese labels, field hints and errors? | `client/locales/` |
| Verification | Is data preserved, do allowed actions succeed, and are unauthorized actions rejected? | `tests/` |

This is a map of responsibilities, not a requirement to create all these files for every change. Editing form copy needs no migration; adding a field does not require rebuilding sign-in. Identify what the request changes, then edit those parts. See [Project structure](../getting-started/project-structure.md) for the full directory guide.

## How a save reaches the database

When a user selects a project in Change project and saves, the request follows this path:

1. **The page collects input.** It uses `useApiClient()` to request `PATCH tutorialTasks/:id/project` with a project ID, or `null` to clear the association. Client paths are relative to the application's API root, without a hard-coded server address or `/main`.
2. **The endpoint handles the request boundary.** It checks authentication, assignment permission, the task ID and request body, and obtains the operation's data permission policies for both tasks and projects.
3. **The service applies business rules.** The endpoint calls `TutorialProjectService.assignTask()`. The service reads the task and target project through policy-bound Repositories, then updates the association. This example groups those database operations in a transaction.
4. **The database stores the result.** A migration has already created the field and foreign key, so the database rejects associations with nonexistent projects. Migrations change the structure beforehand; they do not run for every save.
5. **The result returns to the page.** The endpoint returns the saved values, and the page updates the task list and provides feedback. Failures preserve input and associate field errors with the selector. Editing stops if the task no longer exists.

A service implements business rules; a Provider registers that service in the application container. They are different responsibilities. Endpoints resolve the service through its token. The service does not depend on a page or read an HTTP Context. Another entry point can reuse its rules, but must still establish its identity, permissions and input validation.

### Permissions apply throughout the path

Page access controls navigation, business permissions control actions, and data scopes control which records an action can affect. Hiding a button is interface feedback and cannot replace server checks.

Changing a task's project requires checking both sides: the user must be allowed to modify the task and assign it to the target project. Permission to view a project does not grant assignment access. A foreign key establishes that a project exists, not that the caller may use it.

### Files must be registered

Connect new files through the application's existing entry points:

- `client/routes.ts` declares pages and navigation; page components live in `client/pages/`.
- `server/routes/index.ts` collects application endpoints.
- `server/providers/index.ts` collects service Providers.
- `client/runtime.ts` and `server/runtime.ts` compose their routes, plugins, configuration and services.

Adding a business feature usually requires updating these registration points rather than rewriting client or server startup. A file's existence does not mean its contribution is registered.

## Breaking down a business change

Describe the outcome in business terms first: “Users can assign a task to an eligible project, old tasks remain unchanged, and failed saves preserve input.” Then answer:

1. **How does data evolve?** Can a new field be null, how are old records handled, and which rules require database constraints?
2. **How is the action authorized?** Who can open the page and call the endpoint, and which tasks and projects can they act on?
3. **What is the API contract?** What are its inputs, outputs and failures, and which rules need reuse?
4. **How does the page respond?** What happens during loading, empty results, permission denial, success and failure?
5. **How is it verified?** Check successful and denied paths, plus existing behavior, using isolated test data.

This also works with an agent. You supply the business decisions; the agent can read the project conventions, implement them and verify the result. See [Develop with an agent](develop-with-an-agent.md).

## Continue with your current question

| Current task | Guide |
| --- | --- |
| Add fields, relations or constraints to existing data | [Data models and migrations](data-models-and-migrations.md) |
| Validate requests, reuse business rules, enforce permissions and declare APIs | [Business services and HTTP APIs](apis-and-services.md) |
| Build lists, forms and dialogs with loading and error feedback | [UI components and interactions](pages-and-interactions.md) |
| Write queries, bulk operations and transactions | [Querying and manipulating data](querying-data.md) |
| Organize pages, menus and access conditions | [Pages, routes and navigation](pages-routes-and-navigation.md) |
| Configure runtime parameters and administration | [Application configuration and system settings](configuration-and-settings.md) |
| Adjust languages and appearance | [Localization and themes](localization-and-themes.md) |
| Inspect, update or extend registered capabilities | [Manage plugins](manage-plugins.md) |
| Choose verification methods and complete acceptance | [Testing and acceptance](testing-and-acceptance.md) |
| Complete a working feature first | [Build your first app](../tutorials/build-your-first-feature.md) |

The topic guides share a project example so you can compare their conventions. Read the topic you need directly; to run its code, prepare the models, endpoints and permissions listed in that guide's prerequisites.
