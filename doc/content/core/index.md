---
title: NocoBase Core
description: NocoBase Core is an open-source business application framework for AI-assisted development, providing a unified application architecture, reusable foundational capabilities and agent development guidance for building, deploying and continuously improving business systems.
---

**A foundation for business application development in the AI era.**

NocoBase Core is an open-source framework for developing and running business systems. It provides a unified application architecture, foundational services and a plugin mechanism. Companion plugins supply common capabilities such as authentication, authorization, workflows and file management, allowing developers and agents to focus on business functionality.

Creating a project from an application template gives you an application you can run, modify and deploy. Work with an agent or write code yourself to build pages, data models, APIs and rules for your business.

## Why choose NocoBase Core?

### Reuse common capabilities

Core and its companion plugins provide reusable foundational capabilities, reducing the infrastructure work repeated across projects. Choose, integrate and extend these capabilities according to your needs, and focus on your specific business requirements.

These capabilities form the foundation for building applications; they are not a finished business system with a fixed design. Developers and agents implement the pages, interactions and business processes as needed.

### Give agents clear development guidance

Consistent project structure, development conventions, Skills and examples help agents understand existing capabilities, find relevant code and follow project conventions.

During development, agents can prioritize existing capabilities instead of generating foundational modules again. Developers confirm business rules, review critical implementation decisions and accept the results.

### Customize and continuously improve business functionality

Business features are implemented in code. Pages, APIs, data models and business logic can be organized and modified as needed. Develop features directly in the application, or organize capabilities into plugins when they need independent maintenance or reuse across applications.

Clear responsibilities between business code, the framework and plugins make it easier to continue development, investigate problems and assess the impact of upgrades.

## Develop applications with NocoBase Core

**Core and plugins provide common foundational capabilities; developers and agents build the business application.**

A typical development process includes:

1. **Create an application**: create a project from an application template, prepare configuration and start the application.
2. **Develop business features**: clarify requirements and business rules, then build pages, data models, APIs and business logic using existing capabilities.
3. **Verify the results**: try the application, run tests and review the implementation, then address any issues.
4. **Deploy and iterate**: deploy to your own environment, deliver business updates and upgrade Core and plugins as needed.

You do not need to learn every framework detail before starting. Begin with a specific business feature and consult the documentation as you develop it.

## Quickstart

1. [Create an app](getting-started/create-app.md): prepare your environment, create a project with an agent or the command line, start it and sign in.
2. [Develop your first business feature](tutorials/build-your-first-app.md): follow the tutorial to build task management with an agent and explore the key code.

Read [Project structure](getting-started/project-structure.md) when you need to locate pages, APIs, database resources and tests.

## Develop business features

- [Develop with an agent](developing-apps/develop-with-an-agent.md): describe requirements, confirm business rules, check results and maintain project conventions.
- [Developing apps](developing-apps/overview.md): find implementation guidance for the client, server, business services, databases, configuration and tests.
- [Using plugins](using-plugins/overview.md): find existing capabilities, configure them and integrate them into your business, such as adding permissions, attachments or notifications to an application.

## Extend and understand Core

- [Developing plugins](extension-development/when-to-write-a-plugin.md): learn how to organize a feature as a plugin for independent maintenance or reuse across applications.
- [Framework principles](framework/overview.md): explore application runtimes, plugin integration, service containers and foundational services when you need to understand the underlying mechanisms.

## Deploy and maintain

- [Choose a deployment method](deployment/choose-a-deployment-method.md): deploy to your own environment and prepare configuration and persistent data.
- [Publish an application release](deployment/publish-app-release.md): verify, build and deliver business updates.
- [Upgrade NocoBase Core](developing-apps/upgrade-nocobase-core.md): learn how to update foundational dependencies and the application template, and check compatibility with business customizations.

## Reference

Look up specific usage in the [Command-line reference](reference/cli.md), [Configuration reference](reference/configuration.md) and [API reference](reference/api.md).

See [Database support and compatibility](reference/compatibility.md) for environment and database requirements, or the [FAQ](reference/faq.md) for common problems.
