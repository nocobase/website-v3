---
title: "Can files be stored in Alibaba Cloud OSS or other object storage?"
---

Yes. Core's storage library provides a native `oss` driver and an `s3` driver for S3-compatible services. The file plugin adds file records, uploads, downloads, and access control on top of storage drivers. See [File storage and drivers](../core/framework/file-storage.md) and [File management](../core/using-plugins/data-and-files/file-management.md).

For Alibaba Cloud OSS, add a disk with `driver: oss` under `drive.disks`, configure its bucket, region, and server-side credentials, and select it through `drive.default` or the business feature's file configuration. Use AccessKey credentials or an ECS RAM Role when the runtime meets its requirements. See the [OSS driver configuration](https://github.com/nocobase/nocobase/blob/2d79f24347b38e9286ffc5eac0ba451d7dae2841/packages/libs/drive/skills/nocobase-drive/references/oss.md) for fields and network requirements.

Keep keys in server-side configuration. Configure bucket access policies and application file permissions separately, then verify uploads, downloads, and access by unauthorized users. Changing the default disk affects new file operations that use that default; it does not move existing objects or update file records. Migration also requires object copying and record updates.
