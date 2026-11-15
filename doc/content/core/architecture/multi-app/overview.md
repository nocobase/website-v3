---
title: Overview
description: Understand when to use multiple applications, how main and child applications work together, and what you need to get started.
---

## When to use multiple applications

Use a multi-app architecture when several business systems need independent data, configuration, and release versions, but you want a shared entry point and sign-in experience.

| Business need | Approach |
| --- | --- |
| Several stores need the same inventory features but separate data | Run an independent inventory application for each store, with separate data and update schedules |
| Different teams maintain customer management and purchasing on different release schedules | Develop and deploy each application separately, and access both from one workbench |
| An existing system should keep running while gaining a shared entry point | Add it to the workbench, optionally connect single sign-on, and retain its existing deployment |
| Several entry points share one application, dataset, and version | Use [multiple portals](../multi-portal/create-app.md) instead of splitting the system into applications |

The platform can deploy and manage child applications or connect systems that already run independently. Applications do not automatically share business data. Integrate them through APIs with the appropriate permissions when they need to exchange data.

## Main and child applications

The **main application** provides the workbench, application management, and single sign-on. After signing in, users open the applications they are allowed to access from the workbench.

A **child application** handles a specific business function, such as customer, inventory, or expense management. Each child has its own pages, data, configuration, and business permissions, and can be developed, deployed, and updated independently.

![The workbench shows the customer and expense applications available to the current user](/assets/core/multi-app/workbench.png)

The main application determines which applications a user may enter. Each child determines what that user may do inside it. For example, permission to enter an inventory application does not necessarily allow an employee to adjust stock. Administrators of the main application do not automatically become child application administrators.

Child applications can use their own sign-in method or integrate with the main application's single sign-on (SSO). SSO does not mean sharing user tables, business data, or all permissions.

## Prerequisites

Multi-app requires compatible commercial plugin versions, a valid commercial license, and package download access. The project template does not contain the commercial plugins' implementation or grant a commercial license.

| Plugin | Used in | Capabilities |
| --- | --- | --- |
| `@nocobase/app-plugin-multi-app` | Main application | Manage application templates, versions, instances, and external entries |
| `@nocobase/app-plugin-identity-provider` | Main application | Platform identity service, OIDC clients, and membership grants |
| `@nocobase/app-plugin-platform-sso` | Child application | Platform sign-in, session checks, and application switching |

For a new project, start with the [Quickstart](quickstart.md). For an existing NocoBase 3 application, see [Connect independently deployed applications](external-apps.md).
