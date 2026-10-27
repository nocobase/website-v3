---
title: What is Core
description: Learn how NocoBase Core provides shared capabilities so you and your agent can focus on your business application.
---

NocoBase Core is the foundation for developing and running business applications. It provides an application framework and shared capabilities such as authentication, users, permissions, files and notifications.

Task management, purchasing and customer management all need accounts, data, permissions and user interfaces. Core supplies these foundations so you and your coding agent can focus on the business: what to store, who can act, and what each action should do.

Create app generates an independent application project. Core provides capabilities through dependencies; your pages, APIs, data structures and business rules live in your application's source code.

## What Core provides

- **Application templates and runtime:** start with a runnable project containing client code, server code and runtime configuration.
- **Shared capabilities:** compose plugins and libraries for authentication, users, authorization, data access, file storage and notifications.
- **UI Library:** reuse tables, forms, dialogs and business blocks. Components installed into your source can be adapted to the application.
- **Development tools and Skills:** CLI commands handle configuration, migrations, plugins and builds. Skills give agents guidance matched to the installed dependencies.

The template defines the starting point. Plugins and libraries provide capabilities. Your application combines them into business functionality. The exact capabilities available depend on which packages are installed and registered.

## What you develop

This tutorial builds a task application incrementally. Core provides the mechanisms; the application defines the task model and rules.

| Scenario | Core provides | Your application implements |
| --- | --- | --- |
| Signing in | Accounts, authentication and sessions | Who may use the task application |
| Storing tasks | Data access and migrations | Titles, completion status, assignees and APIs |
| Displaying tasks | Tables, forms and dialogs | The list, creation flow, filters and pagination |
| Controlling access | Permission models and server checks | Who may view, create or complete tasks, and which records they may access |

When someone clicks **Complete**, the application uses Core's authentication and authorization capabilities to check the request, updates the task according to its business rules, then displays the result.

Build these features directly in the application. Consider a separately published plugin when you need to reuse a capability across multiple applications.

## Development and maintenance

**With an agent.** Describe the business requirement, users and acceptance criteria. The agent reads the project guidance and Skills, then implements the data model, APIs, pages and tests. Try the result and refine the requirement.

**Without an agent.** Write code directly using the same framework, components, APIs and CLI. Both approaches can coexist in one project. Later chapters provide separate With an agent and Without an agent paths.

**You manage the code.** Keep the application in your own repository, review changes, run tests and publish releases. Deploy it to your own servers. To upgrade NocoBase, reconcile changes from the newer template with your business customizations and verify compatibility through tests.

After deployment, administrators can change users, roles and record access through the management pages enabled in the application. Changes to pages, data structures or business logic are delivered through code, verification and redeployment.

Core can run independently. Studio organizes team development, review and releases; Solutions are ready-made business applications built on Core. You do not need Studio to follow this tutorial.

## Create your application

Start with [Create app](create-app.md), then use [Project structure](project-structure.md) to find your way around the code.

Continue with [Build your first app](../tutorials/build-your-first-feature.md) to build a complete team task app, verify it and deploy it.
