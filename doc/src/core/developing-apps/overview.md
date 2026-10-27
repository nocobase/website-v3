---
title: Application development overview
description: Understand application code, templates and plugins, and follow a feature from its page through an API and service to the database.
---

Developing a NocoBase application means implementing business rules on top of its existing structure and capabilities: how data is stored, who can act on it, and how the interface presents the result. This section explains those topics for use during development. To build a feature from start to finish first, follow the [tutorial](../tutorials/build-your-first-feature.md).

The following sections use “assign a task to a project” to explain each responsibility. You do not need to run the example to read this overview.

> **Before running the topic examples:** The projects-and-tasks guides use a historical example based on the default template `1.0.0-beta.78`. Setup requires access to the `04-task-due-date` tag in the private `nocobase/app-tutorials` repository. Its `tutorialTasks` and `tutorialProjects` tables, endpoints and test configuration differ from the current tutorial's `tasks` example, so you cannot run it as a direct continuation of that tutorial. With repository access, follow [Data models and migrations](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate example application. Without access, you can still read the explanations and code in each guide.

## Application code, templates and plugins

Creating an application gives you source code that you can change and maintain independently. The template supplies its initial structure, Core packages provide development and runtime capabilities, and plugins provide reusable features.

| Part | What it supplies | How you use it |
| --- | --- | --- |
| Application code | Your pages, APIs, data models, business services and tests | Change it in your application repository and release it with the application |
| Application template | Entry points, layouts, components, configuration and development conventions | Generate it into the project when creating the app; merge template changes during upgrades |
| Core foundation packages | Client and server runtimes, data access, configuration and related capabilities | Use public APIs and manage versions through project dependencies |
| Plugins | Reusable authentication, users, authorization, files and other capabilities | Use the public interfaces, components and extension mechanisms of registered plugins |

Project names and task assignments are application business concerns; sign-in and role permissions can use existing plugins. The default template already includes several plugins. Check available capabilities before adding a feature; plugin installation is not a required first step for every change.

Business features usually live directly in the application. Consider extracting a plugin when you need reuse across applications, or want to maintain and release a capability independently; see [When to write a plugin](../extension-development/when-to-write-a-plugin.md). Customize the application through public plugin interfaces, keeping dependencies in `node_modules/` unchanged.

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

Start with the business outcome: “Users can assign a task to an eligible project, old tasks remain unchanged, and failed saves preserve input.” Define the data changes and permission rules, implement the API and page, then use isolated test data to verify successful operations, denied operations and existing behavior. When working with an agent, you specify the business requirements and the agent implements and verifies them using the project conventions. See [Develop with an agent](develop-with-an-agent.md).

## How a save reaches the database

When a user selects a project in Change project and saves, the request follows this path:

1. **The page submits the selection.** It sends the task ID and selected project ID, or requests that the association be cleared.
2. **The endpoint validates the request.** It checks authentication, assignment permission and input, and obtains the allowed task and project scopes.
3. **The service applies business rules.** It finds the task and target project within those scopes, confirms that the task can change and the project is eligible, then updates the association.
4. **The database stores the result.** A migration has already created the field and foreign key, so the database rejects associations with nonexistent projects. Migrations change the structure beforehand; they do not run for every save.
5. **The result returns to the page.** The endpoint returns the saved values, and the page updates the task list and provides feedback. Failures preserve input and associate field errors with the selector. Editing stops if the task no longer exists.

The endpoint receives and validates requests; the service keeps reusable business rules together. For service registration, endpoint implementation and transactions that commit or roll back these operations together, see [Business services and HTTP APIs](apis-and-services.md). For page requests and error feedback, see [UI components and interactions](pages-and-interactions.md). For fields and foreign keys, see [Data models and migrations](data-models-and-migrations.md).

### Permissions apply throughout the path

Page access controls navigation, business permissions control actions, and data scopes control which records an action can affect. Hiding a button is interface feedback and cannot replace server checks.

Changing a task's project requires checking both sides: the user must be allowed to modify the task and assign it to the target project. Permission to view a project does not grant assignment access. A foreign key establishes that a project exists, not that the caller may use it.

### Files must be registered

When adding a page, endpoint or service, update its registration entry point as needed:

- **Pages:** Write components in `client/pages/` and declare their routes and navigation in `client/routes.ts`.
- **Endpoints:** Write routes in `server/routes/` and connect them through its `index.ts`.
- **Services:** Register business services with a Provider and connect it through `server/providers/index.ts`.

`client/runtime.ts` and `server/runtime.ts` compose the application's routes, plugins, configuration and services. When the template already connects the entry points above, adding a business feature usually requires no changes to these two runtime files.

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
