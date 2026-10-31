---
title: 文件与产物存储
description: 配置本地文件、S3 和 OSS 存储，以及发布产物的存储位置。
---

`drive.disks` 定义存储位置，`drive.default` 选择文件上传使用的磁盘。磁盘名称可以自定义，`driver` 决定连接方式。

| driver | 用途 |
| --- | --- |
| `fs` | 本地文件系统 |
| `s3` | Amazon S3 或提供 S3 兼容接口的服务 |
| `oss` | 阿里云 OSS 原生接口 |

将所需配置合并到 `config.yml`，替换示例中的 bucket、地域和凭据。修改后运行 `docker compose up -d --force-recreate studio`。

## 本地文件（fs）

Studio 默认使用本地存储。Docker 部署时，将 `/app/storage` 挂载到持久化目录。

```yaml
drive:
  default: local
  disks:
    local:
      driver: fs
      location: /app/storage
      visibility: private
```

`location` 是容器内的目录，需要允许 Studio 进程写入。非 Docker 部署时，改为对应的持久化目录。

## S3

下面以 Amazon S3 为例。使用 S3 兼容服务时，按服务要求补充 `endpoint` 和 `forcePathStyle`。

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

| 配置 | 说明 |
| --- | --- |
| `bucket`、`region` | bucket 名称及所在地域 |
| `endpoint` | S3 兼容服务地址；使用 Amazon S3 时可省略 |
| `forcePathStyle` | 是否使用路径形式访问 bucket，按存储服务要求设置 |
| `supportsACL` | 是否支持对象 ACL；禁用 ACL 的 bucket 设为 `false` |
| `credentials` | 访问密钥；设为 `{}` 时使用 AWS SDK 默认凭据链 |

bucket 本身也应设为私有。`visibility: private` 不会替你修改 bucket 策略。

## OSS

阿里云 OSS 使用 `driver: oss`。它的凭据字段是 `accessKeySecret`，与 S3 的 `secretAccessKey` 不同。

```yaml
drive:
  default: oss
  disks:
    oss:
      driver: oss
      bucket: example-studio-files
      region: oss-cn-hangzhou
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        accessKeySecret: replace-with-access-key-secret
```

| 配置 | 说明 |
| --- | --- |
| `region` | 使用 `oss-` 前缀，例如 `oss-cn-hangzhou` |
| `internal` | 设为 `true` 使用内网地址，需要 Studio 所在网络能够访问 |
| `domain` | bucket 绑定的自定义 HTTPS 域名，不带路径 |
| `timeout` | 请求超时，单位毫秒，默认 `600000` |
| `supportsACL` | 是否通过对象 ACL 设置访问权限 |

部署在已绑定 RAM 角色的阿里云 ECS 上时，可以用以下配置替换整个 `credentials`，无需填写固定访问密钥：

```yaml
credentials:
  provider: aliyun-ecs-ram-role
  # roleName: studio-storage
```

`roleName` 可省略，由实例元数据服务提供角色名称。不要同时填写角色和访问密钥。

## 发布产物

文件上传和构建产物分别配置。修改 `drive.default` 不会改变产物存储；产物默认保存在 `/app/storage/releases/artifacts`。

使用前面的 S3 磁盘保存产物：

```yaml
releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

`disk` 引用 `drive.disks` 中的名称，`prefix` 是可选的对象键前缀。产物磁盘必须是私有磁盘。当前按名称引用产物磁盘支持 `fs` 和 `s3`，暂不支持 `oss`。

Studio 和预览所在的 Host 都需要访问产物存储。文件磁盘生成浏览器直达下载链接时，存储地址也必须能从浏览器访问。

产物默认上限为 256 MiB，可通过 `releases.maxArtifactSizeMB` 调整。大文件上传还受反向代理和 `API_BODY_LIMIT` 限制。

## 切换与验证

更换磁盘不会搬迁已有文件。先复制文件并保留对象键，再切换配置；增加 `prefix` 也不会移动旧产物。使用对象存储后，仍需持久化 Studio 的 `storage` 目录。

1. 在任务或知识库上传测试文件，刷新后下载。
2. 运行一次构建，确认产物上传成功。
3. 打开 PR 预览，确认能够读取产物并启动。
