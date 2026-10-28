---
title: File storage and drivers
---

`@nocobase/drive` provides storage drivers. The host exposes a manager through `driveManagerToken` from `@nocobase/app-server/drive`. The file plugin adds records, uploads, downloads and access control.

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

## Storage and access

`visibility: 'private'` does not configure OS permissions or protect a publicly exposed HTTP directory. `url` builds URLs without mounting a download endpoint. The default filesystem driver has no built-in signed download or upload URLs.

For private files, use the file plugin's authorized download API or enforce identity and resource checks in your own route. Object-store signing depends on the driver; disks do not all have identical capabilities.

## Deployment and testing

The host prepares configured filesystem directories during startup; standalone callers prepare their own storage. Multiple instances need a shared volume or object storage.

`storage/files` is business data. Back it up together with database file metadata. Deleting metadata does not delete an object, or vice versa; plan retries and orphan cleanup. Test with temporary disks or fakes rather than real files. See [Using plugins](../using-plugins/overview.md) for application-level features.

## Interfaces and implementation

- [Disk configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [Filesystem integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [Host drive provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
