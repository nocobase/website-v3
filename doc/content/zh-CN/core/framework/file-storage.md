---
title: 文件存储与驱动
---

`@nocobase/drive` 统一文件存储驱动，宿主通过 `@nocobase/app-server/drive` 的 `driveManagerToken` 提供管理器。文件插件在它上面提供文件记录、上传、下载和访问控制。

## 配置磁盘

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

`default` 选择默认磁盘，`disks` 声明可用磁盘。解析管理器后用 `drive.use('local')` 选择磁盘，再调用该磁盘的文件读写接口。磁盘名会被业务配置引用，重命名时需要同步引用。

| 驱动 | 主要配置 | 使用场景 |
| --- | --- | --- |
| `fs` | `location`、`visibility`、可选 `url` | 本地或挂载的共享文件系统 |
| `s3` | bucket、region、credentials、可选 endpoint | S3 及兼容服务 |
| `oss` | bucket、region、credentials | 阿里云 OSS，可使用受支持的 RAM Role 配置 |

服务端凭据通过环境与配置系统提供，不要发给浏览器。文件键应由业务层生成和校验；不要直接把用户输入当成本地绝对路径。

## 存储与访问的边界

`visibility: 'private'` 不会替文件系统自动配置操作系统权限，也不会自动保护一个公开的 HTTP 目录。`url` 只参与 URL 生成，不会创建下载路由。默认文件系统驱动没有内置签名下载或签名上传能力。

需要私有文件访问时，使用文件插件的授权下载接口，或在自定义接口中完成身份和资源检查。对象存储的签名能力也取决于具体驱动，不应假定所有磁盘行为一致。

## 部署和测试

宿主启动时准备配置的文件系统目录；独立使用库时由调用方准备存储位置。多实例使用本地磁盘时，需要共享卷或改用对象存储。

`storage/files` 属于业务数据，应随数据库中的文件元数据一起备份。删除元数据不等于已经删除对象，反过来也一样；业务服务应安排失败重试和孤立文件清理。测试使用临时磁盘或驱动 fake，避免改写真实文件。更多应用层能力见[使用插件](../using-plugins/overview.md)。

## 接口与实现

- [Disk configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [Filesystem integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [Host drive provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
