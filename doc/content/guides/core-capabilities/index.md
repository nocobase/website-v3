---
title: "Topic tutorials"
description: "Learn NocoBase Core capabilities through a complete CRM example—covering data modeling, workspace UI, permissions, approvals, scheduled tasks, attachments, template printing, notifications, email, knowledge bases, business Agents, and integrations."
---

For developers and teams applying NocoBase Core capabilities to real business requirements. The core topics follow a single **CRM sales application** to demonstrate Core features and plugins one capability at a time—follow them by group or jump straight to the capability you need with an Agent team in Studio or a local Coding Agent.

## Example project

Each topic guide stands on its own, so you can pick the capability you need and practice with the reference app or your own project:

- **Complete CRM reference app**: The first six groups use [nocobase/doc-demo-crm](https://github.com/nocobase/doc-demo-crm) (English UI and sample data) as the main reference implementation. Its `main` branch contains the complete working CRM features—run it to inspect any implementation or apply the rules and prompts directly to your own app.
- **Installation and run instructions**: Follow the example project’s [README](https://github.com/nocobase/doc-demo-crm/blob/main/README.MD) to set up and start the app.
- **Commercial features and external services**: Requirements such as commercial approvals, task center, or an authorized mailbox apply only to the topics that use them and do not affect other topics.
- **Advanced scenarios**: Explore advanced usage and more flexible ways to build cross-department permissions, multi-branch approvals, and multi-workflow coordination.

## Courses

### App foundations

| Topic | Scenarios and related features |
| --- | --- |
| [Data modeling and schema changes](data-modeling.md) | Model CRM opportunities, products, and quotes with an ER diagram and data dictionary, add tables incrementally with migration scripts, and verify relations and transactional consistency. |
| [Build a workspace and business pages](pages-and-ui.md) | Follow shadcn conventions to build the CRM sales workspace, filtered customer list, and detail tabs with UI Library. |
| [Role permissions and data scopes](roles-and-permissions.md) | Configure sales and manager action permissions, owner-based CRM customer scopes, and read-only sharing, then verify UI and API boundaries. |

### Workflows and automation

| Topic | Scenarios and related features |
| --- | --- |
| [Approval workflows and to-do center](approval-workflows.md) | Configure discount-threshold approval flows for CRM quotations and handle approvals, returns, rejections, and locking in the task center. |
| [Scheduled tasks and due reminders](scheduled-reminders.md) | Run scheduled tasks (Scheduler) to scan CRM customer follow-up plans and quotation response deadlines and notify the current owner. |

### Files and documents

| Topic | Scenarios and related features |
| --- | --- |
| [Business attachments and file management](file-management.md) | Add requirement file upload, preview, and download to CRM customer details with customer-scoped access checks and unlinked temporary file cleanup. |
| [Template printing and document generation](template-print.md) | Generate immutable DOCX quotations from confirmed CRM quotes using a fixed template and verify content snapshots and download permissions. |

### Notifications and email

| Topic | Scenarios and related features |
| --- | --- |
| [Business events and in-app notifications](notifications.md) | Send in-app notifications automatically when CRM customer ownership changes or quotation approvals complete, and distinguish queued events from actual delivery. |
| [Email integration and messaging](email.md) | Connect a salesperson's personal mailbox to match correspondence by CRM contact address and send issued quotation DOCX attachments from the workspace. |

### AI and knowledge

| Topic | Scenarios and related features |
| --- | --- |
| [Build a knowledge base](ai-assistant.md) | Add the Knowledge plugin to CRM to manage product guides, pricing policies, and sales playbooks with version review and search. |
| [Connect a business Agent](business-agent.md) | Connect a permission-aware sales assistant Agent in CRM to query customer and opportunity records, summarize history, and assist daily operations. |

### Data import and integrations

| Topic | Scenarios and related features |
| --- | --- |
| [Bulk data import and background processing](data-import.md) | Combine background jobs and transactional validation to bulk-import CRM customers and contacts with conflict handling, error reports, and rollback. |
| [External APIs and system integrations](external-integrations.md) | Use API keys and standardized endpoints to ingest external leads and sync CRM quotes or won deals with ERP and finance systems with idempotency and error handling. |

### Advanced scenarios

| Topic | Scenarios and related features |
| --- | --- |
| Complex data scopes and permission configuration (Planned) | Combine default access, restriction rules, and runtime permission screens to handle cross-department multi-condition scopes and overlapping grant resolution. |
| Complex approvals and multi-workflow coordination (Planned) | Design conditional branches, joint approvals, return and resubmission, timeouts, delegation, and multi-workflow coordination in purchasing and expense scenarios. |
