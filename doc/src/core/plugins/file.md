---
title: Files
description: Add attachments to business records: upload, storage, preview, and download. The plugin provides upload endpoints, a file repository, and editable UI components; the file tables, pages, and access permissions are defined by the app.
---

A purchase order needs the quote and the receipt attached, a supplier needs its qualification certificates on file, and an employee needs an avatar: any request that puts files on a record uses this plugin.

## Profile

| | |
| --- | --- |
| Package | `@nocobase/app-plugin-file` |
| Version | 1.0.0-beta.26 |
| Edition | <span class="tag">Open source</span> Apache-2.0 |
| Default template | <span class="tag ok">Enabled</span> server and browser |
| Depends on | The app's database and storage (`@nocobase/drive`) |
| Pages | None |
| UI components | The file component `component-ui`: upload, list, thumbnails, preview, preinstalled in the default template at `client/extensions/nocobase-file-component-ui/`; UI library `attachment-list` |
| Database tables | None; file tables are created by the app's migrations |
| Configuration | Storage is set in the app's `drive` configuration |
| Commands | None |
| Skill | `nocobase-app-plugin-file`; for storage configuration see `nocobase-drive` |

## How it works

The plugin provides a **file repository**: it uploads files, records file information, and serves a content URL for each file ID. File contents live in the storage the app is configured with (local disk, S3-compatible storage, or Alibaba Cloud OSS), and file information lives in the app's database.

| Who is responsible | What |
| --- | --- |
| The plugin | Upload endpoints (single and batch), looking up and deleting file information, content URLs, upload size limits, and cleaning up already-written files when an upload fails |
| The storage foundation library | Writing files to local disk, S3-compatible storage, or Alibaba Cloud OSS |
| The app (written by agents) | The file table, how files link to business records, who can upload and view, and the attachment area on pages |

An upload takes three steps:

<ol class="flow">
<li><div class="step"><div class="step-head"><strong>Upload</strong><span class="who sys">File plugin</span></div><p>The file is written to storage, the file table gets a new row, and the file ID and content URL are returned.</p></div></li>
<li><div class="step"><div class="step-head"><strong>Save the business record</strong><span class="who sys">App</span></div><p>When the purchase order is submitted, the file ID is saved with it, linking the order to the file.</p></div></li>
<li><div class="step"><div class="step-head"><strong>Preview and download</strong><span class="who sys">File component</span></div><p>When the order is opened, the attachment area previews or downloads the file through its content URL.</p></div></li>
</ol>

The first two steps are submitted separately: if an upload succeeds but the order is never saved, the file stays in storage and is not cleaned up automatically.

## What you see in the app

The file plugin has no pages. What you see is the part agents build into business pages with the file component, such as the attachment area on a purchase order's detail page: file name, size, preview, download, and remove.

The browser can preview these directly:

| Format | How it is previewed |
| --- | --- |
| Images, PDF, text, Markdown, audio, video | Built-in preview |
| DOCX, XLSX, PPTX | Rendered locally in the browser; file contents are not sent to third parties |
| Older Office formats such as DOC, XLS, and PPT, and OpenDocument | Previewed through Office Online, which requires the file URL to be reachable from the internet |
| Other formats | Download only |

## How to ask an agent to use it

Make these points clear:

- Which kind of record the files attach to, and where on which page they go;
- How many files each record can have, and which formats and sizes are allowed;
- Who can upload, who can view and download, and who can remove;
- Whether removing only unlinks the file from this record or deletes the file.

Example:

```text
Add attachments to purchase orders: put an attachment area on the order detail page, where each order can have multiple files, with support for PDF, images, Word, and Excel.
Show the file name and size, with preview, download, and remove; files are saved together with the order and still show when the order is reopened.
Anyone who can view the order can view and download its attachments; the requester and the buyer can upload and remove.
People without permission must also be refused when they open a file URL directly.
Removing an attachment only unlinks it from this order and keeps the file.
```

The agent creates the migration for the file table, uses the plugin to generate the upload and query endpoints and adds sign-in and permission checks, puts the file component on the order detail page, and saves the file IDs with the order.

## How to check the result

- Upload files in several formats and save the order; they are still there after a refresh, and preview and download match the original file.
- Try three accounts: not signed in, signed in without permission on this order, and signed in with permission. The upload endpoint, the file list, and the file content URL must all follow the rules.
- A file over the size limit gets a clear message.
- After you remove an attachment, the order no longer shows it; confirm whether the file is kept, as your request said.

## What administrators can adjust

The file plugin has no admin page. Attachment access follows the business record: adjust who can see which purchase orders under **Roles and permissions**, and attachment visibility changes with it, provided the agent connected the two as described above.

## Deployment configuration

- **Storage**: defined in the app's `drive` configuration, which `config.yml` can override. The default is local disk. For object storage, the storage administrator prepares the bucket, address, region, and credentials and puts them in the configuration on the server.
- **Changing the default storage**: files uploaded afterward go to the new storage; existing files do not move.
- **Backups**: back up both the database and the files in storage.
- **Upload size**: by default 5 MiB per upload and 20 MiB per batch upload, counted over the whole request. Ask the agent to change this if you need more.

## Limits and what is not yet supported

- The endpoints and file URLs the plugin generates **do not come with sign-in and permission checks**; the app must add them. When you check the result, always try an account without permission.
- Deleting a file record does not delete the file in storage, and a canceled form may leave files with no link. There is no automatic cleanup of orphaned files.
- Resumable uploads, range downloads (Range), and cache validation (ETag) are not supported.
- The real file type is not detected, and there is no virus scanning.
- Existing business tables are not migrated to the new file structure automatically.

If you need any of these, tell the agent as a requirement and it will build them in the app.

## How this maps to NocoBase 2

| NocoBase 2 | NocoBase 3 |
| --- | --- |
| The file manager plugin, with storage configured in the UI | The file plugin provides the capability, with storage set in the `drive` configuration |
| Attachment fields, used directly in forms | The app's file tables and links, built into pages by agents with the file component |
| One file table manages all attachments | Each kind of business can have its own file table, with fixed fields |

## Development reference

- Skills: `.agents/skills/nocobase-app-plugin-file/` and `.agents/skills/nocobase-drive/` in the app
- [README](https://github.com/nocobase/nocobase/tree/v3-develop/packages/plugins/app-plugin-file) and `docs/README.md` (the file repository manual)
- API: a running app lists the generated file endpoints at `/api/swagger/docs`; file content URLs are not under `/api` and do not appear in the API docs
- Example: `packages/examples/app-plugin-file-example`
