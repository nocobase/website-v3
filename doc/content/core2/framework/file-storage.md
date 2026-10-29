---
title: File storage and drivers
description: Configure file storage disks, read and write files through the host's manager in applications and plugins, and understand the boundaries of storage and access and what to watch for in deployment and testing.
---

`@nocobase/drive` unifies file storage drivers, and the host provides a manager through `driveManagerToken` from `@nocobase/app-server/drive`. The file plugin builds file records, uploads, downloads and access control on top of it.

## Configuring disks

```ts
// server/config/drive.ts
import { defineAppConfig } from '@nocobase/app-server/config';
import type { AppDriveConfig } from '@nocobase/drive';

export default defineAppConfig<AppDriveConfig>(({ paths }) => ({
  default: 'local',
  disks: {
    local: {
      driver: 'fs',
      location: paths.storage('files'),
      visibility: 'private',
    },
  },
}));
```

`default` selects the default disk, and `disks` declares the available disks. After resolving the manager, select a disk with `drive.use('local')` and call that disk's file methods. Business configuration refers to disk names, so when you rename a disk, update those references as well.

| Driver | Main settings | Use cases |
| --- | --- | --- |
| `fs` | `location`, `visibility`, optional `url` | A local filesystem or a mounted shared filesystem |
| `s3` | bucket, region, credentials, optional endpoint | S3 and S3-compatible services |
| `oss` | bucket, region, credentials | Alibaba Cloud OSS, including the supported RAM Role configuration |

Server credentials are provided through environment variables and the configuration system; never send them to the browser. File keys should be generated and validated by the business layer; never use user input directly as an absolute local path.

## Reading and writing files in applications and plugins

The application provides the disk configuration, and applications and plugins get the manager through the same Token. The following example writes business-generated text to the default disk:

```ts
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { ServiceResolver } from '@nocobase/service-provider';

export async function writeOrderExport(
  container: ServiceResolver,
  key: string,
  content: string,
): Promise<string> {
  const disk = container.resolve(driveManagerToken).use();
  await disk.put(key, content);
  return key;
}
```

The caller generates the `key` on the server, such as `exports/orders/<id>.csv`, and stores the disk name and file key for later lookup. `get(key)` reads the content and `delete(key)` removes the file; business authorization must still be completed before creating an export.

This function only writes a storage object; it neither creates a record in the file plugin nor produces a publicly accessible URL. When you need the complete upload, file record and access workflow, connect the file plugin. Plugins should reuse the host's disk configuration instead of creating a new manager for each request.

## Boundaries of storage and access

`visibility: 'private'` does not configure operating system permissions on the filesystem for you, and does not protect a publicly served HTTP directory. `url` only takes part in generating URLs and does not create a download route. The default filesystem driver has no built-in signed download or signed upload capability.

When private files need to be accessed, use the file plugin's authorized download API, or perform identity and resource checks in your own endpoint. Signing support in object storage also depends on the specific driver, so do not assume every disk behaves the same.

## Deployment and testing

The host prepares the configured filesystem directories at startup; when the library is used on its own, the caller prepares the storage location. When several instances use local disks, they need a shared volume, or should switch to object storage.

`storage/files` is business data and should be backed up together with the file metadata in the database. Deleting the metadata does not mean the storage object has been deleted, and vice versa; business services should arrange retries on failure and cleanup of orphaned files. Use a temporary disk or a driver fake in tests to avoid overwriting real files. For more application-level capabilities, see [Using plugins](../using-plugins/overview.md).

## Interfaces and implementation

- [Disk configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [Filesystem integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [Host drive provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/drive/token.ts)
