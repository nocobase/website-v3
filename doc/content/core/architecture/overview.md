---
title: Overview
metaDescription: Understand multi-portal, multi-app and multi-tenancy, and how business entry points, independent apps and tenant apps fit together.
---

Multi-portal, multi-app and multi-tenancy address business entry points, application boundaries and customer isolation. They can be combined: organize several business areas within one app as portals, split apps when data, configuration and versions need separate management, and create an independent app for each tenant when serving multiple customers.

## Multi-portal: one app, multiple business entry points

An app can offer portals for reagent, equipment and asset management. Each portal provides an entry point to its business area, shares the app's authentication and runtime, and upgrades with the app.

::figure architecture-style+architecture-portals | One app provides several business entry points.

A portal is an entry point within an app, not an independent app or a tenant isolation boundary. Permissions still control access to business data. An app can use multiple database connections; portals do not have to store all their data in one database. Multi-portal management, the portal generator and the multi-portal app template are commercial capabilities.

Start with [Create a multi-portal app](multi-portal/create-app.md), then follow the guides for portal development, access and management.

## Multi-app: independent operation, unified access

Customer, order and warehouse management can run as separate apps. Each app manages its own data, configuration and version, and can upgrade on its own schedule.

::figure architecture-apps | The platform app and business apps are independent apps connected through centralized authentication.

The platform is itself an app. Once centralized authentication is integrated, users with a valid platform session can switch between apps they are authorized to access without signing in again. A shared login does not grant access to every app or automatically connect their business data. Cross-app business operations need appropriate interfaces.

Independent apps do not require separate servers. Choose a deployment approach according to resource and isolation needs.

## Multi-tenancy: an independent app for each tenant

This approach implements multi-tenancy with multiple apps: each customer or organization gets an independent app with its own data, configuration and upgrade schedule. Each tenant app can also contain portals for sales, inventory and finance management.

::figure architecture-tenancy | Each tenant uses an independent app; users enter authorized tenant apps through the platform app.

Use the same template for tenants with the same business needs, or different templates for different needs. Apps created from the same template remain independent instances that can be configured and upgraded separately.
