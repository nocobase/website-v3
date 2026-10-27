---
title: When to write a plugin
description: Use plugins to reuse code or organize features into modules that are easier to install and maintain.
---

In NocoBase, a plugin packages a feature independently so an App can integrate it as needed. There are two main reasons to write one: **code reuse** and **modular code organization**. Either can be a reason to choose a plugin.

## 1. Code reuse

When several applications need the same functionality, package the shared part as a plugin instead of implementing or copying it into each application.

For example, several business applications may use the same SMS provider. A plugin can handle message delivery, provider configuration and errors, while each App installs and uses it. An order application decides when to send an order notification; an approval application decides when to send a reminder. Both share the underlying SMS implementation.

Fixes and improvements can then be maintained in one place, with each application upgrading when appropriate. The plugin provides stable public interfaces; the App handles its own business composition and configuration.

Before implementing shared functionality, check whether an existing plugin meets the requirement. See [Manage plugins](../developing-apps/manage-plugins.md). Develop your own implementation when the available capabilities do not fit.

## 2. Modular code organization

Plugins can also organize code within a single App. Keeping related pages, endpoints, services and data logic in one module makes feature boundaries clearer and simplifies installation, configuration, maintenance and upgrades.

For example, an App may contain order, inventory and reporting features. As they grow, you can organize them into separate plugins:

```text
my-app/
├── client/                        # App UI composition and entries
├── server/                        # App service composition and entries
├── packages/
│   ├── app-plugin-orders/         # Order module
│   ├── app-plugin-inventory/      # Inventory module
│   └── app-plugin-reports/        # Reporting module
├── package.json
└── pnpm-workspace.yaml
```

Each plugin can maintain its own implementation, public entries, configuration and tests. The App decides which plugins to integrate and how to compose them. Team members can also work by module, reducing their reliance on the internal implementation of other features.

Modules may still depend on one another. For example, a reporting plugin should obtain order data through explicit public interfaces instead of importing private source files from the order plugin. Organizing these features as plugins makes their relationships clearer and easier to maintain.

## Develop plugins inside an App

First [create an application with create-app](../getting-started/create-app.md), then develop plugins inside it. An App supports a monorepo: local plugins live under `packages/`, are connected through pnpm workspace dependencies, and are developed and built with the application.

**A plugin can serve only the current App without being published to npm.** Consider distribution, versioning and compatibility when other applications need it. Reuse and modular organization can develop together: start by organizing a feature in the current App as a plugin, then share it with other applications as it matures.

The feature determines the plugin's size. It may provide a single CLI command or include Client pages, Server endpoints and database logic. It does not need every capability. See [Plugin structure](plugin-structure.md) for directories and entries.

## Choose an appropriate organization

Plugins are one way to organize features. Simple pages or business logic can live directly in the App. Functions, types and utilities reused only through imports can use ordinary modules or shared packages. Consider a plugin when you want to integrate and maintain a feature as a unit, or make it available to several applications.

Continue with [Create a plugin](create-plugin.md) to generate a scaffold using `@nocobase/create-plugin`. After understanding [Plugin structure](plugin-structure.md), follow [Write your first plugin](write-your-first-plugin.md) to implement, register and verify it.

For sharing across Apps with independently managed versions, continue with [Publish a plugin](publish-plugin.md). Publication is unnecessary when using the plugin only in the current App.
