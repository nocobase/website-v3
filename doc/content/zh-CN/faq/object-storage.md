---
title: "文件可以存到阿里云 OSS 等对象存储吗？"
---

可以。Core 的文件存储基础库提供原生 `oss` 驱动，也支持 `s3` 驱动连接 S3 兼容服务。文件插件在存储驱动之上提供文件记录、上传、下载和访问控制，见[文件存储与驱动](../core/framework/file-storage.md)及[文件管理](../core/using-plugins/data-and-files/file-management.md)。

接入阿里云 OSS 时，在应用的 `drive.disks` 中增加 `driver: oss` 的磁盘，配置 Bucket、Region 和服务端凭据，并通过 `drive.default` 或业务文件配置选择该磁盘。凭据可以使用 AccessKey，也可以在满足运行条件的 ECS 环境中使用 RAM Role。具体字段和网络条件见 [OSS 驱动配置](https://github.com/nocobase/nocobase/blob/2d79f24347b38e9286ffc5eac0ba451d7dae2841/packages/libs/drive/skills/nocobase-drive/references/oss.md)。

密钥仅保存在服务端配置中。Bucket 访问策略和应用中的文件权限需要分别设置；接入后检查上传、下载以及无权限用户的访问。切换默认磁盘只影响使用该默认值的新文件操作，不会自动搬迁已有文件或修改已有文件记录；需要迁移时，还要安排对象复制和记录更新。
