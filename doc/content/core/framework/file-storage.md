---
title: File storage and drivers
---

`@nocobase/drive` provides storage drivers. The host exposes a manager through `driveManagerToken` from `@nocobase/app-server/drive`. The file plugin adds records, uploads and content access helpers. The application must apply business permissions to both metadata and content endpoints.

## Configure disks

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

`default` selects a disk and `disks` declares the available ones. Resolve the manager, select `drive.use('local')`, and call the disk's file methods. Business configuration can reference disk names, so update those references when renaming a disk.

| Driver | Main settings | Use |
| --- | --- | --- |
| `fs` | `location`, `visibility`, optional `url` | Local or mounted shared filesystem |
| `s3` | bucket, region, credentials, optional endpoint | S3 and compatible services |
| `oss` | bucket, region, credentials | Alibaba Cloud OSS, including supported RAM Role configuration |

Provide server credentials through configuration and environment variables, never the browser. Generate and validate file keys in the business layer; never treat raw user input as an absolute filesystem path.

## File operations in applications and plugins

The application supplies disk configuration. Applications and plugins resolve the same manager Token. This helper writes business-generated text to the default disk:

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

Generate `key` on the server, for example `exports/orders/<id>.csv`, and retain the disk name and file key for later lookup. `get(key)` reads content and `delete(key)` removes the file. Authorize the business operation before creating an export.

This helper only writes a storage object. It creates neither a file-plugin record nor a public URL. Use the file plugin for complete upload, record and access workflows. Plugins reuse host disk configuration instead of creating a manager per request.

## Storage and access

`visibility: 'private'` does not configure OS permissions or protect a publicly exposed HTTP directory. `url` builds URLs without mounting a download endpoint. The default filesystem driver has no built-in signed download or upload URLs.

For private files, provide a protected content endpoint that checks identity and resource permissions before reading the file. The file helper's default content path is outside Repository policy; see [Content and deletion boundaries](../using-plugins/data-and-files/file-management.md#content-and-deletion-boundaries). Object-store signing depends on the driver; disks do not all have identical capabilities.

## Deployment and testing

The host prepares configured filesystem directories during startup; standalone callers prepare their own storage. Multiple instances need a shared volume or object storage.

`storage/files` is business data. Back it up together with database file metadata. Deleting metadata does not delete an object, or vice versa; plan retries and orphan cleanup. Test with temporary disks or fakes rather than real files. See [Using plugins](../using-plugins/overview.md) for application-level features.

## Interfaces and implementation

- [Disk configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [Filesystem integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [Host drive provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/drive/token.ts)
