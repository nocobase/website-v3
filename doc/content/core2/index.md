---
title: NocoBase Core
description: Start by creating an app, then find the guides for apps, plugins, the framework, deployment and reference by task.
---

NocoBase Core provides the framework for building business applications, and plugins add features on top of it that you can compose and extend. You can write the business code yourself or work with a coding Agent, using Skills and examples to build the application.

These docs are organized by task: create and run an app first, then turn to the section for what you need to do next.

## Getting started

Read these four pages in order to go from nothing to an application you can run and verify:

1. [Meet NocoBase Core](getting-started/what-is-core.md): how Core, app templates, plugins and applications relate to each other.
2. [Create an app](getting-started/create-app.md): create a project, start the app and sign in.
3. [Project structure](getting-started/project-structure.md): where pages, APIs, the database, local packages and tests live.
4. [Build your first app](tutorials/build-your-first-app.md): build a task application with an Agent and verify a complete business flow.

## Developing apps

An application's business code is organized by the project directories `client/`, `server/`, `database/`, `cli/`, `packages/` and `tests/`.

- [Application development overview](developing-apps/overview.md): how pages, APIs, services and the database work together.
- [Develop with an Agent](developing-apps/develop-with-an-agent.md): use project rules and Skills to break down requirements and verify the results.
- [Client pages and navigation](developing-apps/pages-routes-and-navigation.md) and [components and interactions](developing-apps/pages-and-interactions.md): build pages and user actions.
- [Server APIs and business services](developing-apps/apis-and-services.md): organize business logic, validate input and apply permissions.
- [Create tables and initialize data](developing-apps/data-models-and-migrations.md) and [query and manipulate data](developing-apps/querying-data.md): store and access business data.
- [Application configuration (config.yml)](developing-apps/configuration-and-settings.md), [Localization](developing-apps/localization.md), [Themes and styles](developing-apps/themes-and-styles.md) and [Testing and acceptance](developing-apps/testing-and-acceptance.md): configure the application and check it before delivery.

## Using plugins

Reuse existing capabilities first. Follow each plugin's guide to install, register, configure and integrate it, then combine the APIs, services, components and Skills it provides as your business needs.

- [Using plugins overview](using-plugins/overview.md): choose, integrate and verify existing plugins.
- [Manage plugins](developing-apps/manage-plugins.md): manage the Client, Server and CLI plugin entries.
- [Plugin index](reference/plugins.md): find authentication, users, permissions, files, notifications, Agents and other plugins by purpose and package name.

## Developing plugins

When an extension needs its own maintenance or is reused across applications, organize it as a plugin: define its public entries and service contracts, integrate it into an application, then test and deliver it.

- [When to write a plugin](extension-development/when-to-write-a-plugin.md), [Create a plugin](extension-development/create-plugin.md) and [Plugin structure](extension-development/plugin-structure.md): set the plugin's boundaries and prepare the workspace.
- [Write your first plugin](extension-development/write-your-first-plugin.md): implement an announcements API and page, register the plugin and verify it in an app.
- [Pages, routes and menus](extension-development/pages-and-menus.md) and [Routes and HTTP APIs](extension-development/server-apis.md): build client and server extensions.
- [Components and styles](extension-development/frontend-components.md): build and integrate shadcn components, and optionally distribute editable source through an independent UI Registry package.
- [Database resources and migrations](extension-development/database-and-migrations.md), [Command-line extensions](extension-development/extend-command-line.md) and [Client localization](extension-development/localization.md): give the plugin database resources, commands and translations.
- [Testing and verification](extension-development/testing-and-verification.md), [Plugin Skills](extension-development/write-plugin-skills.md) and [Build and publish](extension-development/publish-plugin.md): verify how the plugin is integrated and deliver its public capabilities.

## Framework

The framework section covers the runtime mechanisms and core packages that applications and plugins share. Integrate through a business example first, and look up the underlying mechanism when you hit a specific question.

- [Framework overview](framework/overview.md): how runtimes, core packages and plugin features relate.
- [Runtimes](framework/runtime/client.md), [Service containers](framework/services/container.md), [ServiceProviders](extension-development/service-provider.md) and [HTTP and APIs](framework/http/routes.md): how an application is assembled, extended and called.
- [Database](framework/database/overview.md): connections, modeling, queries, transactions and schema evolution.
- [Caching](framework/support/caching.md), [File storage](framework/file-storage.md), [Logging](framework/support/logging.md) and [ID generation](framework/support/ids.md): reuse the shared services the host provides.
- [Background jobs](framework/background/jobs.md), [Scheduling](framework/background/scheduling.md), [Message queues](framework/background/queues.md) and [Realtime](framework/realtime/topics.md): handle asynchronous work and live page updates.

## Deployment and operations

Core's deployment guides cover independent production applications. For Studio's development environments, previews and hosting workflows, see the [Studio documentation](../studio/index.md).

- [Choose a deployment method](deployment/choose-a-deployment-method.md): prepare configuration, persistent data and recovery.
- [Publish an application release](deployment/publish-app-release.md): verify, build and update an application release.
- [Deploy with Docker](tutorials/deploy-with-docker.md) or [Deploy with PM2](tutorials/deploy-with-app-installer.md): choose how the application runs; PM2 deployments install and update the application with app-installer.
- [Upgrade NocoBase Core](developing-apps/upgrade-nocobase-core.md): merge template changes and verify business compatibility.

## Reference

Look up interfaces, options, directory conventions and compatibility here:

- [API reference](reference/api.md): common public entries, return values and database declarations.
- [Command-line reference](reference/cli.md) and [Configuration reference](reference/configuration.md): development and deployment commands, configuration precedence and environment variables.
- [Directory and file conventions](reference/project-conventions.md): where application, plugin, UI asset and generated files are maintained.
- [Core and tool package index](reference/packages.md) and [Plugin index](reference/plugins.md): find package names by responsibility and whether the default template includes them.
- [Database support and version compatibility](reference/compatibility.md) and [FAQ](reference/faq.md): check runtime requirements, database differences and common problems.
