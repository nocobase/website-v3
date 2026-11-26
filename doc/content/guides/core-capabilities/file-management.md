---
title: "Business attachments and file management"
metaDescription: Add customer attachment upload, preview, and download with customer-scoped access checks and unlinked temporary file cleanup.
---

Add attachment management to CRM customer records so salespeople can upload, preview, and download customer requirement files under the customer's access rules, while administrators clean up unlinked temporary uploads.

When trying the complete example, prepare separate administrator, salesperson Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)), with Alex owning **Northstar Manufacturing**.

**Modules covered**

- [Files](../../core/using-plugins/data-and-files/file-management.md)
- [File storage](../../core/framework/file-storage.md)

## Define attachment usage and access rules

Requirement attachments store customer-provided material that can be added or removed as work progresses, strictly following the customer's access scope:

- Allow up to 10 files per save, each up to 5 MB.
- The customer owner and authorized managers can upload, view, download, and delete attachments. Read-only shared users can view and download them, but cannot upload or delete them. Unrelated salespeople and signed-out visitors cannot access them.
- Cancelled or failed uploads must not appear as saved. After removal, even the original uploader cannot read the old download URL or reattach the file.
- Administrators can view storage rules in System settings and clean uploads older than 24 hours that have never been linked to a customer, without affecting saved attachments or formal documents.

## Upload and manage customer attachments

[Files](../../core/using-plugins/data-and-files/file-management.md) provides upload and preview; [file storage](../../core/framework/file-storage.md) persists file content. Download endpoints must check customer access on every request, even when someone holds the URL. The complete example's [file service](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/customer-files.ts) and [routes](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/customer-files.ts) enforce these rules.

Send this request to your development Agent:

```prompt
Add an Attachments tab to customer details for uploading, viewing, and downloading requirements. Allow up to 10 files per save, each up to 5 MB.

- Follow customer access rules. Read-only shared users can view and download, but cannot upload or remove files.
- Cancelled or failed uploads must not appear as saved. After removal, even the original uploader cannot access or reattach a file.
- Show storage rules in System settings. Administrators can clean uploads older than 24 hours that have never been linked to a customer, preserving saved attachments.
```

Uploaded files use private local storage and are linked to the customer only when you click **Save**. Administrators can inspect rules and clean unlinked uploads older than 24 hours under **System settings → Files and quotation documents**.

1. Prepare `Customer requirements.txt` with the project scope and implementation quantity.
2. As Alex, open **Northstar Manufacturing → Attachments → Add attachments**, upload the file, and save.
3. Check the filename, type, size, uploader, and timestamp. Select the filename to preview or **Download** to retrieve it.

![Requirement attachments in customer details](/assets/guides/customer-attachments.png)

## Check file storage and access permissions

Use separate accounts rather than an administrator to verify these behaviors:

- Cancel after uploading: no attachment appears on the customer. A failed save keeps the selection so retrying adds the file.
- Owners and authorized managers can read and manage attachments. Read-only shared users can download them but cannot upload or delete them. Unrelated and signed-out users cannot read them.
- After transferring the customer to another salesperson, retrying an earlier download URL as the former owner is denied.
- After removing an attachment, the original uploader can no longer access it.
- Administrative cleanup removes only unlinked uploads older than 24 hours and leaves saved customer attachments intact.

Have the Agent test failed saves, cleanup during concurrent uploads, and data retention after upgrades in a separate environment, then review its report for actual results and any incomplete checks.

## Summary and next steps

**Done when**: Customer attachments can be uploaded, saved, previewed, and downloaded; download access updates immediately with ownership and sharing changes; removed files and stale unlinked uploads follow the retention rules without affecting saved attachments.

To generate immutable documents from confirmed records using a template, see [Template printing and document generation](template-print.md).
