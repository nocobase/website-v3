---
title: "Configure file storage and use attachments"
metaDescription: Configure a local directory or private S3 bucket, upload and download customer attachments, check customer access, and clean up expired uploads.
---

Salespeople can attach requirements to a customer record so colleagues with access to that customer can preview and download them. Add attachments to an app that already has customer details and access rules, or try the [complete CRM example](https://github.com/nocobase/doc-demo-crm/tree/main).

**Modules covered**

- [File storage and drivers](../../core/framework/file-storage.md)
- [Files plugin](../../core/using-plugins/data-and-files/file-management.md)

## Choose and configure file storage

Store file contents in a local directory or an S3 bucket. The app identifies each storage location by a disk name such as `local` or `s3`. Each file record keeps its disk name and object key so the app can find the file for download or cleanup.

### Use local storage with a private directory

The CRM example is ready to upload to its default disk, `local`. In the [server configuration](https://github.com/nocobase/doc-demo-crm/blob/main/server/config/drive.ts), `driver: 'fs'` selects the filesystem, and `location: paths.storage()` uses the app's storage directory, normally `storage/` under the project root.

To use a mounted volume on a new installation, set its absolute path in `config.yml` at the project root. Choose a persistent directory outside the public web root that the app process can read and write. If several instances use this disk, mount the same volume on each one.

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /srv/crm/files
      visibility: private
```

### Use S3 with a private bucket, region, and credentials

Prepare a private bucket with public access blocked. Grant the app's identity permission to read, write, and delete attachment objects. In `config.yml`, enter your bucket name and its region. This example relies on bucket policies and uses `supportsACL: false` to omit object ACLs on upload.

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      bucket: your-crm-bucket
      region: us-east-1
      credentials: {}
      visibility: private
      supportsACL: false
```

With `credentials: {}`, the AWS SDK obtains credentials from the server environment. Assign the app an IAM role, or supply `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` through your deployment environment. Temporary keys also require `AWS_SESSION_TOKEN`. [AWS credential configuration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html)

For an S3-compatible service, add the provider's `endpoint` to the same `s3` block and enter its signing region. Set `forcePathStyle: true` if the service expects the bucket in the URL path (`https://host/bucket`).

### Select the disk for customer uploads

In the CRM example, `drive.default` selects the disk for new customer attachments and newly issued quotation documents. When switching, keep the previous disk name, directory or bucket, and credentials available. Existing records still point to their original disk. Changing the default does not move the files. In your own app, pass the selected disk name to the [attachment upload routes](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/customer-files.ts).

Save the configuration and restart the app. As an administrator, open **System settings → System → File storage**, select the disk, and choose **Check**. Once the temporary file can be written, read, and deleted, open **Data and files → Files and quotation documents** and confirm the disk name shown for attachments. If your bucket policy restricts access by prefix, grant the app read, write, and delete access under both `nocobase-check/` for the disk check and `objects/` for CRM attachments. [File storage and drivers](../../core/framework/file-storage.md)

## Upload and manage attachments in customer details

### Set upload limits and customer access rules

When adding attachments to your own app, you can give your development Agent this request. In the complete example, go straight to uploading a file.

```prompt
Add an Attachments tab to customer details so salespeople can upload requirements. Allow up to 10 files per save and 5 MB per file. The owner and managers with edit access can add and remove attachments. Colleagues with read-only access can preview and download them.

Link the files to the customer when I click Save. If ownership changes or someone removes an attachment, check access again when anyone opens an old link. Let administrators clean up uploads that are over 24 hours old and have never been linked to a customer.
```

Serve previews and downloads through the app so each request checks the user's current access to the customer. The private directory or bucket controls where the bytes are stored. [CRM file service](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/customer-files.ts)

### Upload, save, preview, and download an attachment

1. Sign in as Alex and open **Northstar Manufacturing → Attachments**. Alex should own this customer. See [Configure users and roles](roles-and-permissions.md#configure-users-and-roles) for the example accounts.
2. Create `Customer requirements.txt` with a requirement you can easily recognize. Choose **Add attachments**, select the file, wait for the upload, and click **Save**. Cancelling discards the selection. If saving fails, you can retry with the selection intact.
3. Check the filename, size, and uploader in the list. Click the filename to preview the requirement, then choose **Download** and compare the contents with the original. If you just switched from local storage to S3, also download an attachment saved before the switch.

![Customer requirements in the Attachments tab](/assets/guides/customer-attachments.png)

## Verify access and clean up expired uploads

- Open the same customer as Morgan, an authorized manager, and as a read-only shared user. Both can preview and download. Only users with edit access can add or remove attachments. Taylor, a salesperson without access, and a signed-out visitor cannot read the file using its download link.
- Keep a download link and transfer the customer to another salesperson. Once the former owner loses access to the customer, opening the link should fail. After an attachment is removed, even its original uploader cannot use the old link or reattach that file.
- As an administrator, open **System settings → Data and files → Files and quotation documents**. Select an upload that is over 24 hours old and has never been linked to a customer. Confirm deletion and refresh the list. Saved customer attachments and issued quotations should still download.

## Summary and next steps

Salespeople can now use attachments on customer records, with download access following ownership and sharing changes. To generate a fixed-format DOCX from a confirmed quotation, see [Generate business documents from a template](template-print.md).
