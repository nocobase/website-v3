---
title: NocoBase Core
description: NocoBase Core is the open-source application foundation built for AI development. Every new app initializes with 30+ building blocks, consistent development standards, and built-in AI integration so agents focus on business logic and systems start and run independently.
---

## Overview

NocoBase Core is the open-source application foundation built for AI development. **Let agents focus on your business logic. The foundation is ready.**

You can start directly with Claude Code, Codex, Cursor, or other coding tools you already use, and Core also serves as the engineering foundation behind NocoBase Studio. From the moment you initialize a new app, 30+ building blocks are ready out of the box, including users and role permissions, sign-in and authentication, workflows, databases, file storage, notifications, and AI integration, along with one project structure and development standards.

Complex, high-reliability modules such as permissions, approvals, and workflow engines are never generated from scratch by AI. Core provides them directly and maintains and upgrades them continuously. Agents write real source code only for your business logic, making development faster and more reliable while sharply reducing manual testing and security review scope. Your business source stays in your own Git repository and runs independently once released.

<figure class="core-arch" aria-label="NocoBase Core layered architecture: business apps and business agents on top, backed by Core's 30+ open-source building blocks and engineering standards">
<div class="ca-layer">
<div class="ca-head"><b>Business layer (your business system)</b><span>Written by coding agents · You own the source · Runs independently</span></div>
<div class="ca-biz-grid">
<div class="ca-biz-card"><b>Business UI &amp; logic</b><p>Pages, forms, tables, APIs, data models, and business rules in standard TypeScript, React, and Node.js.</p></div>
<div class="ca-biz-card"><b>Business agents (optional)</b><p>Handle routine work by your rules within their owner's permissions, asking people to confirm key actions with evidence.</p></div>
</div>
</div>
<div class="ca-layer ca-base">
<div class="ca-head"><b>NocoBase Core · Open-source application foundation</b><span>Continuously maintained · 30+ building blocks ready out of the box</span></div>
<div class="ca-cap-grid">
<div class="ca-cap"><strong>Users, orgs &amp; permissions</strong><small>Departments, roles, and row-level data scopes</small></div>
<div class="ca-cap"><strong>Sign-in &amp; authentication</strong><small>Passwords, OIDC, API keys, enterprise SSO</small></div>
<div class="ca-cap"><strong>Data &amp; files</strong><small>Multi-database, external sources, S3 storage</small></div>
<div class="ca-cap"><strong>Workflows &amp; approvals</strong><small>Workflows, approvals, task center, schedulers</small></div>
<div class="ca-cap"><strong>Notifications, mail &amp; print</strong><small>In-app alerts, email, Feishu/DingTalk, template print</small></div>
<div class="ca-cap"><strong>AI &amp; business agents</strong><small>Model connections, agent scheduling, AI knowledge base</small></div>
</div>
<div class="ca-foot"><b>Engineering standards &amp; independent runtime:</b><span>Consistent project structure</span><span>·</span><span>AGENTS.md &amp; development skills</span><span>·</span><span>Plugin extension system</span><span>·</span><span>Docker / PM2 / K8s self-hosting</span></div>
</div>
</figure>

## Key features

### 30+ ready-made building blocks

Every newly initialized app includes the foundational building blocks enterprise business systems share, so agents never have to rebuild and re-verify them from scratch:

| Area | Ready-made building blocks |
| --- | --- |
| **Users, organizations, and permissions** | User management, departments and org structure, role-based page/action/data-scope permissions, default data scopes, sharing rules, and restriction rules |
| **Sign-in and authentication** | Password sign-in, social login, OIDC, and API keys; Professional adds SAML 2.0, LDAP, and WeCom, Feishu, and DingTalk SSO |
| **Data and files** | SQLite, PostgreSQL, MySQL, SQL Server, and Oracle (Professional adds Dameng, Kingbase, and OceanBase), external data sources, database explorer, and local and S3-compatible file storage |
| **Workflows and collaboration** | Workflows and record lifecycle coordination, scheduled jobs, task center, and basic approvals (Professional adds multi-level conditional routing and advanced approvals such as joint and any-one sign-off) |
| **Notifications, mail, and UI** | In-app notifications, inbound and outbound email, Feishu/DingTalk/browser push, internationalization, themes, business UI components, and DOCX/PDF template printing |
| **AI and business agents** | Cloud and local model connections, business agent scheduling, and a permission-aware, versioned AI knowledge base |

For the full list and usage details, see [Built-in capabilities & plugins](using-plugins/overview.md).

### One project structure and development standards

When AI writes code from scratch, switching developers, models, or even sessions produces different directory layouts and coding styles, making a system harder to maintain over time.

Core provides standard app scaffolding, an `AGENTS.md` project rules file, and versioned development skills shipped with the foundation packages. Pages, APIs, data models, migration scripts, and tests each have a fixed home, so regardless of which model or coding tool you use, agents write standard TypeScript, React, and Node.js code with the same structure. Your system evolves steadily for years on one consistent architecture, and developers can step in to maintain it at any time. See [Application development overview](developing-apps/overview.md) and [Project structure](developing-apps/project-structure.md).

### Built-in AI capabilities inside every business system

Core is not just a foundation for coding agents to build apps. It also includes built-in model connections, business agent scheduling, and an AI knowledge base.

Once a system is live, business agents can work inside it around the clock within their owner's permissions, handling routine work such as researching leads, reconciling asset registers, triaging email, and routing support tickets, and handing decisions to people with supporting evidence. See [Agents](using-plugins/agents-and-knowledge/agents.md) and [Knowledge base](using-plugins/agents-and-knowledge/knowledge.md).

### Open source, ready to start and run independently

- **Free, open source, and continuously maintained**: Core is free and open source, with open, auditable code. NocoBase maintains bug fixes and new capabilities continuously and delivers them to every app through version upgrades.
- **No workbench or tool lock-in**: You do not need to install Studio to use Core. Start building right away with Claude Code, Codex, Cursor, or other coding tools you already use.
- **Self-hosted and independent runtime**: Your source code and data belong completely to your organization. Deploy on your own servers with Docker, PM2, multi-instance setups, or Kubernetes. Released apps run independently without Studio in the request path.

## Get started

If you are using Core for the first time, start with [Develop your first app](../getting-started/develop-your-first-app.md) to initialize a new app in minutes and build your first feature with a coding tool. To walk through a complete example covering an asset register, approvals, permissions, and deployment, read [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md).

## Learn

<div class="learn">

- [**Develop applications**](developing-apps/overview.md)
  Understand app composition and project structure, and build pages, APIs, data models, permissions, workflows, background tasks, CLI commands, and tests.
- [**Built-in capabilities & plugins**](using-plugins/overview.md)
  Explore ready-made capabilities for users and authentication, permission rules, files, notifications, email, Agents, knowledge base, approvals, and scheduled jobs.
- [**Deployment & operations**](deployment/choose-a-deployment-method.md)
  Choose a deployment method, deploy with Docker, app-installer, multi-instance setups, or Kubernetes, publish new releases, and upgrade Core.
- [**Multi-app architecture**](architecture/overview.md)
  Understand multi-portal, multi-app, and multi-tenant architectures to organize systems by business entry point, standalone app, or tenant boundary.
- [**Develop plugins**](extension-development/when-to-write-a-plugin.md)
  Decide when to extract capabilities into a plugin, and learn plugin structure, frontend and backend extensions, and publishing.
- [**Framework internals**](framework/overview.md)
  Understand the runtime, service container, HTTP layer, database layer, and client rendering internals.
- [**Configuration & CLI reference**](reference/configuration.md)
  Look up application configuration options, CLI commands, error codes, default plugin index, and coding tool prompt references.
- [**Database support & compatibility**](developing-apps/compatibility.md)
  Check supported open-source and commercial database drivers, connection settings, and runtime requirements.

</div>
