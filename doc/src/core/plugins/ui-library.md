---
title: UI library
status: Body to be completed
description: The business components and blocks NocoBase publishes. When an agent installs one, its source is copied into the app, after which the app owns it: you can change it, and it is never updated automatically.
---

> [!PENDING] Body to be written
> The table below comes from `ui-library/registry/` on the NocoBase repository's `v3-develop` branch. Previews of each component are at [ui.nocobase.com](https://ui.nocobase.com).

## Planned contents

- What the library is: published the shadcn way, where installing means copying the source
- Where things are installed: components go in `client/components/`, and blocks in `client/extensions/nocobase-<name>/`
- Which ones the default template preinstalls
- Upgrading: components are not updated automatically; when needed, an agent updates them with a three-way merge
- Which plugin each component depends on

## Components and blocks

| Group | Components / blocks | Plugin they depend on |
| --- | --- | --- |
| General | Page frame `page-container` and `page-header`; dialogs and drawers `route-dialog`, `route-drawer`, and `route-child-page`; `data-table`, `kanban`, `property-fields`, `rich-text-editor`, `markdown-view`, `long-text`, `comment-thread`, `attachment-list`, `record-link`, `settings-dialog`, `flow-diagram`, `setup-readiness` | — |
| Sign-in | `auth-forms`, `auth-methods`, `auth-centered-layout`, `auth-split-layout`, `device-approval` | Authentication |
| Permissions | `permission-editor`, `role-list`, `default-access-editor` | Permissions |
| Workflows | `lifecycle-diagram`, `workflow-management` (the **Workflow management** page) | Record lifecycle |
| Approvals | `approval-ui` | Approvals <span class="tag pro">Commercial</span> |
| Task center | `task-center-ui` | Task center <span class="tag pro">Commercial</span> |
| Inbox | `inbox`, `inbox-button` | In-app messages |
| Agents | `agent-chat`, `agent-queue`, `agent-run-history`, `agent-composer`, `agent-picker` | Agents |
| Projects | `issue-table`, `issue-card`, `issue-detail`, `project-detail`, `plan-card` | Projects |

Plugins can also publish their own components, such as the file plugin's `component-ui` and the notification plugin's `logs-ui`.
