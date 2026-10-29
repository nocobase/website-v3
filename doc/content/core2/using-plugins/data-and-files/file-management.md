---
title: "Files"
description: "Integrate file uploads, metadata, content access and file previews."
---

## Capabilities

`@nocobase/app-plugin-file` provides file Repositories, builders for upload APIs and client services, reusing the application's database and Drive storage. Applications can build avatars, attachments or document libraries on top of it.

File tables, business associations, storage disks and pages are provided by the application; the plugin provides the common capabilities for file operations.

## Scenarios and examples

### Example: order attachments

The application creates an order attachment Collection, declares upload and query operations, uploads through the file client in the order details, saves the business association with the order, and shows the returned file records. The upload, list, thumbnail and preview interfaces can be installed as source from the `component-ui` component in the NocoBase UI Library and then maintained by the application.

DOCX, XLSX and PPTX previews can render locally in the browser. The online preview fallback for legacy Office formats and OpenDocument depends on a file URL reachable from the internet, so do not assume it can read private files that require an application session.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Files to add private order attachments: upload, list and preview. Create the
Collection through a migration, configure a Drive disk, and declare actions and
policy. Protect both metadata and bytes with order access checks; the default
public content route is not private download. Define metadata/object cleanup
separately and test denied uploads, unauthorized downloads and failed previews.
```

**Done when**: users with permission can upload and read order attachments, while users without permission can neither query the metadata nor download the file content directly.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Database migrations and Drive configuration | Declare the attachment fields and storage location | Uploaded files have persistent metadata and a clear storage owner |
| Server file routes and the order association | Declare operations, policies and protected access to private content | Lists and downloads follow business permissions |
| Order details and UI components | Connect upload, list and preview, and handle failures | An attachments area with clear action feedback appears on the page |

### Prepare before integrating

After registering the Client and Server plugins, the application still needs three pieces of configuration:

1. Configure the Drive disk used for uploads; see [File storage and drivers](../../framework/file-storage.md).
2. Create the business file Collection with a migration.
3. Declare the resource name, Collection, disk, content path, allowed operations and `policy` with `defineFileRepositoryApiRoutes()` exported from `/server`.

The plugin itself creates no file tables, registers no business pages and provides no unified "file management center". The file Collection must contain the fields `id`, `disk`, `key`, `filename`, `ext`, `mimeType`, `size`, `createdAt` and `updatedAt`; `contentUrl` is generated in responses and needs no database column.

### Upload and access

Taking an `attachments` resource declared by the application as the example:

| Capability | Entry available after declaration |
| --- | --- |
| Single-file upload | `POST /api/attachments/uploadOne` |
| Multi-file upload | `POST /api/attachments/uploadMany` |
| Metadata queries | Declared Repository operations such as `POST /api/attachments/findMany` |
| File content | The configured `accessPath`, such as `/uploads/attachments/<uuid>.<ext>` |

Only operations explicitly declared in `actions` are exposed. Uploads are also limited by `policy.create`: `create: false` forbids uploading. Upload requests do not accept arbitrary extra business fields; required business fields should be supplied through means such as server-side policy defaults.

On the client, use `clientFileRepositoryManagerToken` exported from `/client` and get a file operation object with `manager.repository('attachments')`; the server-side counterpart is `serverFileRepositoryManagerToken` exported from `/server`.

## AI development constraints and verification

### Development constraints for this plugin

- Check authorization for the content route and the metadata API separately; the default `accessPath` is not protected by the Repository `policy`.
- Uploads accept only the agreed fields, and the business owner is decided on the server; do not trust an order ID the client submits freely.
- Verify size limits, the state of metadata and stored objects after failures, private downloads and the deletion policy; `deleteOne` must not be treated as physical cleanup.

### Limits of content access and deletion

The `accessPath` content entry generated by the current route tool performs no authentication and is not protected by the Repository `policy`. If you need private attachments, the application must design a separate, protected way to access content; configuring list permissions does not mean the file content is isolated.

`stream` returns the file stream directly; `redirect` jumps to the storage URL and requires the disk to support generating public or signed URLs. Changing the default disk does not move historical files. `deleteOne` deletes only the metadata and does not delete the physical file automatically; business cleanup must be handled separately.

Verify upload size limits, rejected writes, consistency between metadata and physical files, content access and the preview fallback. Related documentation: [Repository data APIs](../../framework/http/repository-routes.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-file).
