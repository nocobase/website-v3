---
title: "How can I integrate existing Java, Spring Boot, or other business systems?"
---

Keep your existing systems and have a Core application call their APIs to add business pages or new features. For example, Spring Boot can continue to own quality and equipment services while the NocoBase application displays data, submits operations, and combines user interactions. See [Server-side services](../core/developing-apps/server-business-services.md) for where to implement integrations.

Prefer the original service's API for writes it owns, preserving its validation, transactions, and business processes. Define account mapping, permissions, retries, and duplicate-submission handling across systems. A local NocoBase database transaction cannot automatically include a remote service call.

For direct access to an existing database, use a connection with `schemaManagement: 'external'` so the original system retains control of the schema. `external` does not mean read-only: database credentials and application permissions still determine access. See [Connect an existing database](../core/developing-apps/existing-databases.md).

An existing identity platform can be integrated through the [authentication](../core/using-plugins/authentication/sign-in.md) extension mechanism, implementing sign-in and account mapping for its protocol. Shared identity does not automatically synchronize business permissions; define the authorization boundary on both sides.
