---
title: NocoBase Core
description: Create an application, explore its structure, and learn by building a task application.
---

Start with a running project and build your own business application with NocoBase Core. Work with a coding agent or follow the manual instructions. Chinese is the source language for this documentation; both editions use the same English example application and screenshots.

## Getting started

1. [What is Core](getting-started/what-is-core.md): understand the relationship between Core, templates, plugins and applications.
2. [Create app](getting-started/create-app.md): create, configure and start an application, then sign in.
3. [Project structure](getting-started/project-structure.md): locate pages, APIs, database migrations and tests.
4. [Build your first app](tutorials/build-your-first-feature.md): build a complete team task application with an agent or manually, write tests, and choose a deployment method.

## Developing apps

Look up application conventions by topic; prepare the corresponding data and endpoints when running an example.

- [Application development overview](developing-apps/overview.md): applications, templates, plugins and the page-to-database path.
- [Develop with an agent](developing-apps/develop-with-an-agent.md): requirements, project guidance and verification.
- [Data models and migrations](developing-apps/data-models-and-migrations.md): fields, relations, constraints and existing data.
- [Querying and manipulating data](developing-apps/querying-data.md): Repositories, pagination, relations, transactions and Query.
- [Business services and HTTP APIs](developing-apps/apis-and-services.md): services, validation, permissions and API declarations.
- [Pages, routes and navigation](developing-apps/pages-routes-and-navigation.md): registration, menus, child routes and access.
- [UI components and interactions](developing-apps/pages-and-interactions.md): lists, forms, dialogs and feedback.
- [Application configuration and system settings](developing-apps/configuration-and-settings.md): runtime configuration, business settings and administration.
- [Localization and themes](developing-apps/localization-and-themes.md): copy, locale resources and consistent appearance.
- [Manage plugins](developing-apps/manage-plugins.md): existing capabilities, registration, updates, removal and extension.
- [Testing and acceptance](developing-apps/testing-and-acceptance.md): test boundaries, real data, permissions and user flows.

## Developing plugins

- [When to write a plugin](extension-development/when-to-write-a-plugin.md): decide what needs reuse and divide application and plugin responsibilities.
- [Create a plugin](extension-development/create-plugin.md): generate a scaffold in an existing App, select capabilities and connect the workspace.
- [Plugin structure](extension-development/plugin-structure.md): optional directories, runtime entries, public exports and resource ownership.
- [Write your first plugin](extension-development/write-your-first-plugin.md): implement an announcements API and page, then test, register and verify them in an App.
- [Pages and menus](extension-development/pages-and-menus.md): declare menus and child pages, with default navigation and access rules.
- [Server APIs](extension-development/server-apis.md): Input validation, access, responses and API docs.
- [ServiceProvider](extension-development/service-provider.md): Client and Server contracts, registration and lifecycle.
- [Database and migrations](extension-development/database-and-migrations.md): Plugin schema, task history and upgrades.
- [Localization](extension-development/localization.md): Resource ownership, namespaces and translation checks.
- [Extend the command line](extension-development/extend-command-line.md): Command registration, output and deployment checks.
- [Testing and verification](extension-development/testing-and-verification.md): Plugin tests, App integration and delivery checks.
- [Write plugin skills](extension-development/write-plugin-skills.md): Document and verify public capabilities for App Agents.
- [Publish a plugin](extension-development/publish-plugin.md): ship local plugins with the App, or publish to a private npm registry for sharing.

## Deployment and operations

- [Choose a deployment method](deployment/choose-a-deployment-method.md): deploy a production application independently with Docker or PM2 and prepare configuration, data, and recovery.
- [Deploy with Docker](tutorials/deploy-with-docker.md): build images and run containers with persistent mounts.
- [Deploy with PM2 (app-installer)](tutorials/deploy-with-app-installer.md): supervise the process with PM2 and install and update the application with app-installer.
- [Upgrade NocoBase Core](developing-apps/upgrade-nocobase-core.md): merge a newer template with an agent or manually, verify compatibility, and deploy the upgraded application.
- [Publish an application release](deployment/publish-app-release.md): rebuild and redeploy, with the update steps for each deployment method.
