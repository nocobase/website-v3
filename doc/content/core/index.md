---
title: NocoBase Core
description: Start by creating an app, then find guides for app development, plugins, the framework and deployment by task.
---

NocoBase Core provides application framework capabilities. Plugins provide features that applications can compose and extend. Write business code directly or work with a coding Agent, using Skills and examples to assemble your application.

## Getting started

1. [Meet NocoBase Core](getting-started/what-is-core.md): understand Core, templates, plugins and applications.
2. [Create an app](getting-started/create-app.md): create a project, start it and sign in.
3. [Project structure](getting-started/project-structure.md): locate pages, APIs, databases, local packages and tests.
4. [Build your first app](tutorials/build-your-first-feature-agent-first.md): build a task application with an Agent, and verify a complete business flow.

## Developing apps

Organize business implementation around `client/`, `server/`, `database/`, `cli/`, `packages/` and `tests/`.

- [Application development overview](developing-apps/overview.md): connect pages, APIs, services and the database.
- [Develop with an Agent](developing-apps/develop-with-an-agent.md): use project rules and Skills, divide requirements and verify results.
- [Client pages and navigation](developing-apps/pages-routes-and-navigation.md) and [components and interactions](developing-apps/pages-and-interactions.md): implement pages and user actions.
- [Server APIs and business services](developing-apps/apis-and-services.md): organize business logic, validate input and integrate permissions.
- [Create tables and initialize data](developing-apps/data-models-and-migrations.md) and [data operations](developing-apps/querying-data.md): store and access business data.
- [Application configuration (config.yml)](developing-apps/configuration-and-settings.md), [Localization](developing-apps/localization.md) and [Themes and styles](developing-apps/themes-and-styles.md), and [testing and acceptance](developing-apps/testing-and-acceptance.md): configure and verify the application.

## Using plugins

Start with existing capabilities. Follow each plugin's installation, registration, configuration and integration instructions, then compose its APIs, services, components and Skills for your business.

- [Using plugins overview](using-plugins/overview.md): choose, integrate and verify existing plugins.
- [Manage plugins](developing-apps/manage-plugins.md): manage Client, Server and CLI plugin entries.
- [Plugin index](reference/plugins.md): find authentication, users, permissions, files, notifications, Agents and other plugins by purpose and package name.

## Developing plugins

Organize independent extensions as plugins, define public entries and service contracts, integrate them into applications, and verify delivery.

- [When to write a plugin](extension-development/when-to-write-a-plugin.md), [Create a plugin](extension-development/create-plugin.md), and [Plugin structure](extension-development/plugin-structure.md): define boundaries and prepare the workspace.
- [Write your first plugin](extension-development/write-your-first-plugin.md): implement an announcements API and page, register the plugin and verify it in an app.
- [Pages, routes and menus](extension-development/pages-and-menus.md) and [Routes and HTTP APIs](extension-development/server-apis.md): implement client and server extensions.
- [Components and styles](extension-development/frontend-components.md): build and integrate shadcn components, then optionally distribute editable source through an independent UI Registry package.
- [Database resources and migrations](extension-development/database-and-migrations.md), [Command-line extensions](extension-development/extend-command-line.md), and [Client localization](extension-development/localization.md): provide resources and commands.
- [Testing and verification](extension-development/testing-and-verification.md), [Plugin Skills](extension-development/write-plugin-skills.md), and [Build and publish](extension-development/publish-plugin.md): verify integration and deliver public capabilities.

## Framework

Explore mechanisms and core packages shared by applications and plugins. Start with business examples, then consult the underlying mechanisms as needed.

- [Framework overview](framework/overview.md): runtimes, core packages and plugin features.
- [Runtimes](framework/runtime/client.md), [Service containers](framework/services/container.md), [ServiceProviders](extension-development/service-provider.md), [HTTP and APIs](framework/http/routes.md): assembly, extension and calls.
- [Database](framework/database/overview.md): connections, modeling, queries, transactions and schema evolution.
- [Caching](framework/support/caching.md), [File storage](framework/file-storage.md), [Logging](framework/support/logging.md), [ID generation](framework/support/ids.md): shared host services.
- [Background jobs](framework/background/jobs.md), [Scheduling](framework/background/scheduling.md), [Message queues](framework/background/queues.md), [Realtime](framework/realtime/topics.md): asynchronous work and page updates.

## Deployment and operations

Core deployment guides cover independent production applications. For Studio development environments, previews and hosting workflows, see the [Studio documentation](../studio/index.md).

- [Choose a deployment method](deployment/choose-a-deployment-method.md): prepare configuration, persistent data and recovery.
- [Publish an application release](deployment/publish-app-release.md): verify, build and update an application release.
- [Deploy with Docker](tutorials/deploy-with-docker.md) or [Deploy with PM2](tutorials/deploy-with-app-installer.md): choose how to run the application; PM2 deployments use app-installer for installation and updates.
- [Upgrade NocoBase Core](developing-apps/upgrade-nocobase-core.md): merge template changes and verify business compatibility.

## Reference

Look up interfaces, options, directories and compatibility as needed:

- [API reference](reference/api.md): common public entries, return values and database declarations.
- [Command-line reference](reference/cli.md) and [Configuration reference](reference/configuration.md): development/deployment commands, configuration precedence and environment variables.
- [Directory and file conventions](reference/project-conventions.md): ownership of application, plugin, UI asset and generated files.
- [Core and tool package index](reference/packages.md) and [Plugin index](reference/plugins.md): package purposes and inclusion in the default template.
- [Database support and version compatibility](reference/compatibility.md) and [FAQ](reference/faq.md): runtime requirements, database differences and common problems.
