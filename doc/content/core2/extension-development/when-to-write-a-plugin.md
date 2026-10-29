---
title: When to write a plugin
description: Organize a feature as a plugin to reuse code, or to make it easier to install and maintain through modularity.
---

In NocoBase, a plugin packages a feature as an independent package that an App connects as needed. There are two main reasons to write a plugin: **code reuse** and **modular code organization**. Either one alone is reason enough to consider a plugin.

## 1. Code reuse

When several applications need the same feature, package the shared part as a plugin rather than developing and copying the code in each application.

For example, several business applications all need to connect to the same SMS service. You can package SMS sending, provider configuration and error handling into a plugin that each App installs and uses. The order application decides when to send order notifications and the approval application decides when to send approval reminders, while the underlying SMS capability shares one implementation.

Fixes and new features can then be maintained in the plugin in one place, with each application upgrading as needed. The plugin provides stable public interfaces, and the App handles its own business composition and configuration.

Before reusing an existing capability, check whether a suitable plugin already exists; see [Manage plugins](../developing-apps/manage-plugins.md). Develop your own implementation only when the existing capabilities do not meet the need.

## 2. Modular code organization

Even with only one App, plugins can organize the code. Putting related pages, APIs, services and data logic into one module makes feature boundaries clearer and makes installation, configuration, maintenance and upgrades easier.

For example, a business App has orders, inventory and reports. As these features grow, you can organize each as a plugin:

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

Each plugin maintains its own implementation, public entries, configuration and tests, and the App decides which plugins to connect and how to combine them. Team members can also divide work by module, depending less on the internals of other features.

Modules may still depend on each other. For example, when the reports plugin needs order data, it should get it through an explicit public interface rather than importing private source from the orders plugin. Splitting into plugins is precisely what makes these dependencies clearer and easier to maintain later.

## Develop plugins inside an App

First [create an application with create-app](../getting-started/create-app.md), then develop plugins inside that App. The App supports a monorepo: local plugins live under `packages/`, connect through pnpm workspace dependencies, and are developed and built together with the application.

**A plugin can serve only the current App and does not need to be published to npm first.** Consider distribution, versioning and compatibility once other applications need it. Code reuse and modularity can also come together step by step: first organize one feature of the current application as a plugin, then offer it to other applications once it matures.

A plugin's size is decided by its feature. It can provide just one CLI command, or combine client pages, server APIs and database logic; it does not need every capability. For directories and entries, see [Plugin structure](plugin-structure.md).

## Choose a suitable organization

Plugins are just one way to organize features. Simple pages or business logic can live directly in the App, and functions, types and utilities reused only through `import` can use ordinary modules or shared packages. Consider a plugin when you want a feature to be a whole that can be connected and maintained, or to be used by several applications.

Next, read [Create a plugin](create-plugin.md) to generate a scaffold with `@nocobase/create-plugin`; after understanding [Plugin structure](plugin-structure.md), follow [Write your first plugin](write-your-first-plugin.md) to implement, register and verify it.

If you need to share a plugin across several Apps and manage its versions independently, continue with [Build and publish](publish-plugin.md). When it is used only in the current App, there is no need to publish it.
