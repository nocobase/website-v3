---
title: "Can developers take over an application built with AI?"
---

Yes. People and AI can also alternate development work. A Core application's pages, APIs, business logic, and database migrations live in your source repository. Developers can edit, test, and release the application directly, without converting the project into another format.

Hand over source code and the lockfile, run and deployment instructions, business rules, tests, and the process for managing configuration and keys. Record important decisions in project documentation rather than only in AI conversations. See [Project structure](../core/developing-apps/project-structure.md) for directory responsibilities.

Human developers still follow the application's authorization, API, and migration conventions and reuse existing Core capabilities. When an agent returns to the project, have it read the current source and project guidance and continue from that implementation. Verify changes through [testing and acceptance](../core/developing-apps/testing-and-acceptance.md), then [release a new version](../core/deployment/publish-app-release.md).
