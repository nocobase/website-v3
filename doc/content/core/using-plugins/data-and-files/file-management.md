---
title: "Files"
description: "Integrate file uploads, metadata, content access and previews."
---

`@nocobase/app-plugin-file` provides file Repositories, upload route helpers and client services backed by the application's database and Drive. Use it for avatars, attachments or document libraries.

## Prerequisites

After registering both runtimes, the application must:

1. Configure a Drive disk; see [File storage](../../framework/file-storage.md).
2. Create a business file Collection through migrations.
3. Declare resource name, Collection, disk, content path, operations and `policy` using `defineFileRepositoryApiRoutes()` from `/server`.

The plugin creates no file table or management page. Required fields are `id`, `disk`, `key`, `filename`, `ext`, `mimeType`, `size`, `createdAt` and `updatedAt`. `contentUrl` is derived in responses.

## Upload and access

For an application-declared `attachments` resource:

| Capability | Declared endpoint |
| --- | --- |
| Upload one | `POST /api/attachments/uploadOne` |
| Upload several | `POST /api/attachments/uploadMany` |
| Query metadata | Declared Repository actions such as `POST /api/attachments/findMany` |
| Read content | Configured `accessPath`, such as `/uploads/attachments/<uuid>.<ext>` |

Only listed `actions` are exposed. Uploads obey `policy.create`; `create: false` denies them. Upload requests do not accept arbitrary business fields; provide required values through server-side policy defaults or equivalent application handling.

Resolve `clientFileRepositoryManagerToken` from `/client`, then call `manager.repository('attachments')`. The server counterpart is `serverFileRepositoryManagerToken` from `/server`.

## Example: order attachments

Create an attachment Collection, expose upload and query operations, connect them to order details and preserve the business association. Install the UI Library's `component-ui` source for editable upload, list, thumbnail and preview components.

DOCX, XLSX and PPTX can render locally in the browser. Legacy Office and OpenDocument preview fallbacks need an internet-accessible URL and cannot use an application session to open private files.

## Content and deletion boundaries

The helper's generated `accessPath` content route has no authentication and is outside Repository `policy`. Private attachments require an application-owned protected content path; restricting metadata queries alone does not protect file bytes.

`stream` returns content; `redirect` needs storage support for public or signed URLs. Changing the default disk does not move existing files. `deleteOne` removes metadata without deleting the physical object.

Verify upload limits, denied writes, metadata/object consistency, content access and preview fallback. Related: [Repository data APIs](../../framework/http/repository-routes.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file).
