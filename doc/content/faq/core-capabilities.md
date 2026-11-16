---
title: "Is NocoBase 3 just Skills? Do I need to build users, organizations, and permissions myself?"
---

NocoBase Core provides the application runtime, foundation libraries such as the database layer, and plugins for authentication, users, authorization, files, and notifications. Skills guide an agent in using these capabilities. The running application still depends on Core; it is more than a set of prompts.

The default template registers authentication, users, and authorization plugins and includes prepared user and role administration modules. Connect the administration pages as you develop the app. You do not need to rebuild login or authorization, but you do need to define business operations and data scopes and enforce them in your APIs. For example, “sales representatives can edit only their own customers” must constrain server-side data access, not just hide buttons. See [Authentication, permissions, and data scopes](../core/developing-apps/authentication-and-permissions.md).

Users and roles are not a complete organizational structure. Model departments, positions, collaboration across departments, and their data scopes for your business, or integrate an existing organization system. Do not assume a new app includes the same department management features as NocoBase 2.

See the [plugin index](../core/reference/plugins.md) and [Manage plugins](../core/developing-apps/manage-plugins.md) for available capabilities and how to enable them.
