---
title: "Team collaboration and continuous delivery"
description: "Connect an existing project to Studio, involve business colleagues in requests, capture project knowledge, manage quality checks and ship updates safely."
---

For teams developing and maintaining applications together in Studio. Connect an existing Core repository to Studio, let business colleagues participate directly in requests and acceptance, preserve business rules and conventions, and move updates safely from review to production.

## Preparation

Before starting this series, verify the following prerequisites:

- **Studio workspace and access**: A working Studio instance with at least one online runtime and an available Agent. If your team has not set up Studio yet, an administrator follows [Installation and configuration](../../studio/setup/index.md), [Git connection](../../studio/setup/git.md) and [Agent configuration](../../studio/setup/agents.md); invited members sign in through [Join a project](../../studio/join/index.md).
- **Repository and project**: If you already have a NocoBase Core repository, start with the first course to connect it to Studio. If your project is already connected, jump straight to the collaboration or release course you need.
- **Member accounts and environments**: Involving business colleagues requires separate Studio accounts and member-invitation permissions. Release and maintenance require configured [checks and previews](../../studio/setup/ci.md), [hosted environments](../../studio/admin/environments.md), and release permissions.

> [!NOTE]
> If this is your first time using Studio and you want to walk through a single request first, start with [Collaborate with Studio](../../getting-started/collaborate-with-studio.md).

## Courses

Start with the first course if you need to bring an existing repository into Studio. Each remaining course covers an independent team delivery practice—pick the topic your team needs without following a fixed order.

| Course | Result | Starting conditions |
| --- | --- | --- |
| [Connect an existing project to Studio](../open-crm-project.md) (In preparation) | Connect an existing repository to Studio, configure checks and PR previews, and prepare for team iteration. | A working Studio workspace, repository access, an online runtime and an available Agent. |
| [Involve business colleagues directly](../business-colleagues.md) | Let a business owner raise requests, clarify rules and accept changes in previews directly in Studio. | A connected Studio project, an account for the business colleague and permission to invite members. |
| [Keep business rules and development knowledge](../capture-knowledge.md) | Record confirmed business rules, design decisions and review checklists in the project knowledge base and memory. | A Studio project with a knowledge base and business rules or team conventions to capture. |
| [Manage quality in Studio](../enterprise-management.md) (In preparation) | Use continuous tests, core scenario checks and issue tracking to keep parallel Agent work reliable. | A connected Studio project (exercise-specific setup will be published with the course). |
| [Release updates and maintain your application](../release.md) | Verify a release candidate in a test environment and upgrade production while preserving existing business data. | A connected Studio project, a candidate commit, test and production environments, and release access. |
