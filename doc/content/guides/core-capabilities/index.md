---
title: "Topic tutorials"
description: "Learn NocoBase Core capabilities through focused single-topic guides covering data modeling, UI, permissions, approvals, files, template printing, notifications, scheduled tasks, email, business AI and integrations."
---

For developers and teams applying NocoBase Core capabilities to real business requirements. Each guide focuses on a single capability instead of mixing unrelated topics—pick what you need right now and build it with an Agent team in Studio or a local Coding Agent.

## Example project

This series is organized by focused capability, **not as a sequential lesson chain or Git tag progression**:

- **Complete CRM reference app**: Everyday topic guides reference [nocobase/doc-demo-crm](https://github.com/nocobase/doc-demo-crm) (English UI and sample data), whose latest `main` branch already contains the complete working CRM implementation. Clone and run the latest state directly to inspect any feature, or apply the guide's rules and prompts straight to your own app without checking out historical tags.
- **Commercial features and external services**: Requirements such as commercial approvals or an authorized mailbox apply only to the topics that use them and do not block unrelated topics.
- **Focused domain examples for complex topics**: Upcoming deep dives on configurable permissions, complex approvals and system integrations will use fitting business domains such as purchasing, expenses and contracts.

## Courses

| Topic | Capabilities and result | Preparation |
| --- | --- | --- |
| [Multi-table relations and historical snapshots](../opportunities-and-quotes.md) | Turn business requirements into an ER diagram and data dictionary, create relations with migrations, and preserve historical prices after catalog updates. | A runnable Core app (or the complete `doc-demo-crm` example) and an administrator account. |
| [Build a workspace UI with UI Library](../sales-workspace.md) | Follow shadcn conventions to compose workspace summaries, filtered lists, forms and detail tabs with UI Library. | An app with business records (or the complete `doc-demo-crm` example) and UI Library access. |
| [Role permissions and data scopes](../team-permissions.md) | Configure role permissions, owner-based record scopes and read-only sharing, then verify UI and API boundaries. | An app with sample records (or the complete `doc-demo-crm` example) and separate administrator, salesperson and manager accounts. |
| Configurable permission UI (Planned) | Design a runtime permission screen for administrators or business owners who need flexible access control. | Published with its topic example. |
| Complex data scopes and grant rules (Planned) | Design cross-department, multi-condition data scopes and rules for combining or revoking overlapping grants. | Published with its topic example. |
| [Approval workflows and to-do center](../quote-approvals.md) | Configure an approval flow and handle approvals, returns, rejections and status write-backs in the to-do center. | An app with approvable records (or the complete `doc-demo-crm` example), separate test accounts and commercial approval features. |
| Complex approval rules (Planned) | Design conditional branches, joint approvals, return and resubmission, timeouts, reassignment and delegation in domains such as purchasing and expenses. | Published with its topic example (requires commercial approval features). |
| [Business attachments and file management](../file-management.md) | Add file upload, preview and download to business records with permission checks and unlinked temporary file cleanup. | An app with business records (or the complete `doc-demo-crm` example) and test accounts. |
| [Template printing and document generation](../template-print.md) | Generate immutable DOCX documents from confirmed business records using a fixed template and verify content snapshots and access control. | An app with confirmed records (or the complete `doc-demo-crm` example) and test accounts. |
| [Business events and in-app notifications](../notifications.md) | Send in-app notifications automatically when record ownership changes or approvals complete, and distinguish queued events from actual delivery. | An app with business records (or the complete `doc-demo-crm` example); approval notifications use the approval flow. |
| [Scheduled tasks and due reminders](../scheduled-reminders.md) | Run scheduled jobs to detect due items and pending records and notify current owners automatically. | An app with dated records (or the complete `doc-demo-crm` example) and a working in-app notification channel. |
| [Email integration and messaging](../email.md) | Connect a personal mailbox to match correspondence by contact address and send emails with attachments from the workspace. | An app with business records (or the complete `doc-demo-crm` example), an authorized test mailbox and email capabilities. |
| [Connect an in-app business Agent](../business-agent.md) (In preparation) | Add an in-app business Agent that respects role permissions to assist daily operations. | Published with its example. |
| [Assist business workflows with AI and knowledge](../ai-assistant.md) (In preparation) | Combine knowledge bases and record history with AI to summarize context and suggest next steps. | Published with its example. |
| [Bulk data import](../data-import.md) (In preparation) | Validate and import external spreadsheet records in bulk with conflict handling, error reports and rollback. | Published with its example. |
| [External APIs and system integrations](../external-integrations.md) (In preparation) | Design API integrations, data sync, idempotency and error handling with ERP, finance or third-party systems. | Published with its topic example. |
