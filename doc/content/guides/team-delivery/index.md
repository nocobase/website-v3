---
title: "Collaborate in Studio"
description: "Connect an existing project to Studio, involve business colleagues in requests, capture project knowledge, manage quality checks and ship updates safely."
---

For teams developing and maintaining applications together in Studio. Connect an existing Core repository to Studio, let business colleagues participate directly in requests and acceptance, preserve business rules and conventions, manage delivery quality with continuous tests, and move updates safely from staging to production.

## Preparation

Before starting, confirm you have:

- **Studio workspace**: A working Studio instance with at least one online [runtime](../../studio/setup/shared-runtimes.md) and an available [Agent](../../studio/setup/agents.md). If not set up yet, an administrator follows [Installation and configuration](../../studio/setup/index.md) and [Git connection](../../studio/setup/git.md); team members sign in via [Join a project](../../studio/join/index.md).
- **Repository**: Start with the first course if you have a NocoBase Core repository, or fork [`nocobase/doc-demo-crm`](https://github.com/nocobase/doc-demo-crm) to practice. If your project is already connected, pick any later course directly.
- **Permissions and editions**: Inviting new members requires administrator access; releasing requires configured [checks and previews](../../studio/setup/ci.md) and [hosted environments](../../studio/admin/environments.md). *Manage delivery quality* requires **Studio Enterprise Edition (EE)**, and multi-role acceptance applies to **Professional and Enterprise editions**.

> [!NOTE]
> If this is your first time using Studio and you want to walk through a single request first, start with [Develop with Studio](../../getting-started/collaborate-with-studio.md).

## Courses

Start with the first course if you need to bring an existing repository into Studio. Each remaining course covers an independent team delivery practice—pick the topic your team needs without following a fixed order.

| Course | Result | Starting conditions |
| --- | --- | --- |
| [Connect an existing project](open-crm-project.md) | Connect an existing repository to Studio, configure checks and PR previews, and merge your first PR. | A working Studio workspace, repository access, an online runtime, and an available Agent. |
| [Involve business colleagues](business-colleagues.md) | Let a business owner raise requests, clarify rules, and accept changes in previews directly in Studio. | A connected Studio project, the colleague's email, and member-invitation permission. |
| [Capture knowledge and experience](capture-knowledge.md) | Preserve confirmed business rules, review checklists, and project experience across Knowledge, Skills, and Memory. | A connected Studio project (with knowledge edit and skill management permissions) and rules to capture. |
| [Manage delivery quality](enterprise-management.md) | Use continuous tests, core scenario checks, and follow-up tasks to keep parallel development reliable. | Studio Enterprise Edition (EE), a connected project, an active project lead, an available Agent, and an online runtime. |
| [Release to production](release.md) | Verify a release candidate in staging and upgrade production while preserving existing business data. | A connected Studio project, a candidate commit, a configured staging environment, and your own production server. |
