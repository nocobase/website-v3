---
title: Meet NocoBase Core
description: Learn which shared capabilities NocoBase Core provides, so you and your Agent can focus on the business application itself.
---

NocoBase Core is the foundation for developing and running business applications. It provides an application framework and shared capabilities such as sign-in, users, permissions, files and notifications that your application can use directly.

Task management, purchasing and customer management all deal with accounts, data, permissions and user interfaces. Core prepares these shared foundations, so you and your coding Agent can focus on the business itself: what data to store, who can act on it, and what should happen after each action.

Creating an app gives you an independent application project. Core provides its capabilities as project dependencies; your pages, APIs, data structures and business rules live in your own application.

## What Core provides

- **Application templates and runtime**: start from a project that runs out of the box, with client code, server code and runtime configuration in place, and add your own features.
- **Shared capabilities**: use authentication, users, permissions, data access, file storage and notifications through plugins and libraries, combined as the application needs.
- **NocoBase UI Library**: reuse tables, forms, dialogs and business blocks. Once installed into your source code, components can be changed as needed.
- **Development tools and Skills**: CLI commands handle configuration, migrations, plugin management and builds; Skills give Agents guidance that matches the installed dependency versions.

The division of work: the template sets the project's starting point, plugins and libraries provide capabilities, and the application turns them into business features. Which capabilities an application can actually use depends on which packages it installs and registers.

## What you develop

The getting-started tutorial builds a task application step by step. Core provides the mechanisms; the application defines the tasks and their rules:

| Scenario | Core provides | Your application implements |
| --- | --- | --- |
| Signing in | Accounts, sign-in and sessions | Who may use the task application |
| Storing tasks | Data access and migrations | Task titles, completion status, assignees and the related APIs |
| Displaying tasks | Tables, forms, dialogs and other UI components | The task list, the creation dialog, filters and pagination |
| Controlling access | A permission model and server-side checks | Who may view, create or complete tasks, and which records they may act on |

Take completing a task as an example: when a user clicks **Complete**, the application first uses Core's authentication and permission capabilities to check the request, then updates the task according to its own business rules, and finally shows the result on the page.

You usually build these features directly in the application project. Turn a capability into a plugin only when it needs to be published separately and reused across several applications.

## How to develop and maintain it

**With an Agent.** You describe the business requirement, its users and the acceptance criteria; the Agent reads the project guidance and Skills, then writes the data model, APIs, pages and tests. You try the result and refine the requirement.

**Without an Agent.** You can also write the code yourself with the same framework, components, APIs and CLI. Both approaches can be mixed in one project, and later tutorials provide separate "With an Agent" and "Without an Agent" steps.

**You manage the code.** The application's source lives in your own repository, where you can review it, test it, publish versioned releases and deploy it to your own servers. To upgrade NocoBase, merge the changes from the newer template, keep your business customizations, and verify compatibility with tests.

Once the application is live, administrators can adjust users, roles and record access in the management pages the application enables. Changes to pages, data structures or business logic are delivered by changing code, verifying it and redeploying.

Core can be used on its own. Studio organizes a team's development, review and releases; Solutions are ready-made business applications built on Core. You do not need to set up Studio to follow the getting-started tutorial.

## Create your application

Start with [Create an app](create-app.md) to create and run a project, then use [Project structure](project-structure.md) to learn where the code lives.

Continue with [Build your first app](../tutorials/build-your-first-app-agent-first.md) to build a complete team task application, verify its permissions and deploy it.
