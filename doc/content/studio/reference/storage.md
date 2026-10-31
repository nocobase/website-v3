---
title: File and artifact storage
description: Configure local files, S3-compatible services, and release artifact storage.
---

`drive.disks` defines storage locations. `drive.default` selects the disk for file uploads. Disk names are customizable; `driver` determines how Studio connects.

| Driver | Use |
| --- | --- |
| `fs` | Local filesystem |
| `s3` | Amazon S3 or an S3-compatible service |

Merge the configuration you need into `config.yml` and replace the example bucket, region, and credentials. Apply changes with `docker compose up -d --force-recreate studio`.

## Local files (fs)

Studio uses local storage by default. For Docker deployments, mount `/app/storage` to a persistent directory.

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /app/storage
      visibility: private
```

`location` is a directory inside the container that the Studio process must be able to write to. For other deployments, use your persistent storage directory.

## S3

This example uses Amazon S3. For an S3-compatible service, add `endpoint` and `forcePathStyle` as required by that service.

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      bucket: example-studio-files
      region: us-east-1
      supportsACL: false
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        secretAccessKey: replace-with-access-key-secret
```

| Setting | Meaning |
| --- | --- |
| `bucket`, `region` | Bucket name and region |
| `endpoint` | S3-compatible service URL; optional for Amazon S3 |
| `forcePathStyle` | Use path-style bucket access if required by the service |
| `supportsACL` | Whether object ACLs are supported; set to `false` for buckets with ACLs disabled |
| `credentials` | Access keys; use `{}` for the AWS SDK default credential chain |

Make the bucket private too. `visibility: private` does not change its bucket policy.

## Release artifacts

File uploads and build artifacts use separate settings. Changing `drive.default` does not change artifact storage. Artifacts default to `/app/storage/releases/artifacts`.

To store artifacts on the S3 disk above:

```yaml
releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

`disk` names an entry in `drive.disks`; `prefix` is an optional object-key prefix. Artifact disks must be private. Use `fs` or `s3` for named artifact disk references.

Studio and the preview Host must reach artifact storage. When a file disk generates direct browser download links, its address must also be reachable from the browser.

Artifacts default to a 256 MiB limit, adjustable with `releases.maxArtifactSizeMB`. Large uploads are also limited by the reverse proxy and `API_BODY_LIMIT`.

## Switch and verify storage

Changing disks does not migrate existing files. Copy files and preserve their keys before switching. Adding a prefix does not move older artifacts. Keep Studio's `storage` directory persistent even when using object storage.

1. Upload a test file to a task or knowledge base, refresh, and download it.
2. Run a build and confirm artifact upload succeeds.
3. Open a PR preview and confirm it can read the artifact and start.
