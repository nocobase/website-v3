---
title: Using plugins overview
description: Choose existing plugins and integrate their APIs, services, components and Skills into your application.
---

Before implementing a business feature, check which plugins the application already installs and registers. Authentication, users, permissions, files and notifications can be integrated through public plugin entries. See the [Plugin index](../reference/plugins.md) for package names and purposes.

## From capabilities to business features

NocoBase 3 plugins provide capabilities that applications can compose and extend. Depending on its design, a plugin may provide server APIs, business services, pages, components, commands or Skills. The application assembles these into its own interfaces and workflows.

For example, adding file uploads to a business page involves understanding the file plugin's upload and access interfaces, composing UI components, calling APIs and enforcing permissions. Installing a plugin is one part of that integration; it does not establish that the business page is complete.

## Integrate an existing plugin

1. **Check existing capabilities.** Inspect `package.json` and the Client, Server and CLI plugin registration files to see what is already connected.
2. **Install, register and configure.** Follow the plugin's dependency and runtime configuration instructions. See [Install, register and configure](../developing-apps/manage-plugins.md).
3. **Use public entries.** Call the plugin's APIs, services or components from the application, leaving dependency source in `node_modules/` unchanged.
4. **Consult Skills and examples.** Help an Agent understand what the plugin provides, its prerequisites and the business behavior the application must implement.
5. **Verify the complete flow.** Check normal operations, denied access, empty data and failures, then run relevant tests and the application build.

Applications and plugins can freely organize frontend components, using shadcn primitives. When composing interfaces, first consult the [NocoBase UI Library](https://ui.nocobase.com/). The consuming project maintains source added through UI Registry; updating that source is separate from upgrading runtime plugin packages.

## Continue by task

- To implement business pages, APIs and data models, read [Application development overview](../developing-apps/overview.md).
- To understand shared service container, database and runtime mechanisms, read [Framework features overview](../framework/overview.md).
- To provide an independent extension, read [When to write a plugin](../extension-development/when-to-write-a-plugin.md).
- To look up a plugin's purpose, package name and inclusion in the default template, read the [Plugin index](../reference/plugins.md).
