---
title: "Files"
description: "Integrate file uploads, metadata, content access and previews."
---

## Capabilities

`@nocobase/app-plugin-file` provides file Repositories, upload route helpers and client services backed by the application's database and Drive. Use it for avatars, attachments or document libraries.

The application supplies file tables, business associations, disks and UI; the plugin supplies reusable file operations.

## Scenarios and examples

### Example: order attachments

Create an attachment Collection, expose upload and query operations, connect them to order details and preserve the business association. Install the UI Library's `@nocobase/file-component-ui` source for editable upload, list, thumbnail and preview components.

DOCX, XLSX and PPTX can render locally in the browser. Legacy Office and OpenDocument preview fallbacks need an internet-accessible URL and cannot use an application session to open private files.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Add private attachments to order details, with upload, a file list and preview.
Only users allowed to access the order may see attachment details or download files. Copying a download link must not bypass access checks.
Use the existing storage configuration. Explain preview failures and do not send private files to an online viewer that requires a public URL.
Explain what happens to the stored file when its attachment record is deleted, and check rejected uploads, unauthorized downloads and preview failures.
```

**Done when**: Authorized users can upload and read order attachments; denied users cannot query metadata or download bytes.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Database migrations and Drive config | Define attachment fields and storage | Persist metadata and storage ownership |
| File routes and order associations | Declare actions, policies and protected private content | Apply business access to lists and downloads |
| Order detail UI | Integrate upload, list, preview and errors | Add attachments with operation feedback |

### Prerequisites

After registering both runtimes, the application must:

1. Configure a Drive disk; see [File storage](../../framework/file-storage.md).
2. Create a business file Collection through migrations.
3. Declare resource name, Collection, disk, content path, operations and `policy` using `defineFileRepositoryApiRoutes()` from `/server`.

The plugin creates no file table or management page. Required fields are `id`, `disk`, `key`, `filename`, `ext`, `mimeType`, `size`, `createdAt` and `updatedAt`. `contentUrl` is derived in responses.

### Upload and access

For an application-declared `attachments` resource:

| Capability | Declared endpoint |
| --- | --- |
| Upload one | `POST /api/attachments/uploadOne` |
| Upload several | `POST /api/attachments/uploadMany` |
| Query metadata | Declared Repository actions such as `POST /api/attachments/findMany` |
| Read content | Configured `accessPath`, such as `/uploads/attachments/<uuid>.<ext>` |

Only listed `actions` are exposed. Uploads obey `policy.create`; `create: false` denies them. Upload requests do not accept arbitrary business fields; provide required values through server-side policy defaults or equivalent application handling.

Resolve `clientFileRepositoryManagerToken` from `/client`, then call `manager.repository('attachments')`. The server counterpart is `serverFileRepositoryManagerToken` from `/server`.

## AI development constraints and verification

### Plugin-specific development constraints

- Check content-route and metadata authorization separately; default accessPath is outside Repository policy.
- Accept only declared upload fields and resolve business ownership on the server, not from an arbitrary client order ID.
- Verify size limits, metadata/object state after failures, private downloads and deletion policy; deleteOne is not object cleanup.

### Content and deletion boundaries

The helper's generated `accessPath` content route has no authentication and is outside Repository `policy`. Private attachments require an application-owned protected content path; restricting metadata queries alone does not protect file bytes.

`stream` returns content; `redirect` needs storage support for public or signed URLs. Changing the default disk does not move existing files. `deleteOne` removes metadata without deleting the physical object.

Verify upload limits, denied writes, metadata/object consistency, content access and preview fallback. Related: [Repository data APIs](../../framework/http/repository-routes.md), [Manage plugins](../../developing-apps/manage-plugins.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file).
