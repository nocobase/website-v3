---
title: 文件存储与驱动
description: 配置文件存储磁盘，在应用和插件中通过宿主的管理器读写文件，并了解存储与访问的边界，以及部署和测试时的注意事项。
---

`@nocobase/drive` 统一了文件存储驱动，宿主通过 `@nocobase/app-server/drive` 中的 `driveManagerToken` 提供管理器。文件插件在它之上提供文件记录、上传、下载和访问控制。

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

`default` 指定默认磁盘，`disks` 声明可用的磁盘。解析出管理器后，用 `drive.use('local')` 选择磁盘，再调用该磁盘的文件读写接口。业务配置会引用磁盘名，重命名磁盘时需要同步修改这些引用。

| 驱动 | 主要配置 | 使用场景 |
| --- | --- | --- |
| `fs` | `location`、`visibility`，可选的 `url` | 本地文件系统，或挂载的共享文件系统 |
| `s3` | bucket、region、credentials，可选的 endpoint | S3 及兼容 S3 的服务 |
| `oss` | bucket、region、credentials | 阿里云 OSS，可以使用受支持的 RAM Role 配置 |

服务端的凭据通过环境变量和配置系统提供，不要发送给浏览器。文件键应由业务层生成并校验；不要把用户输入直接当作本地的绝对路径。

## 在应用与插件中读写文件

磁盘配置由应用提供，应用和插件通过同一个 Token 取得管理器。下面的示例把业务生成的文本写入默认磁盘：

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

调用方在服务端生成 `key`，例如 `exports/orders/<id>.csv`，并保存磁盘名和文件键，供之后查找。`get(key)` 读取内容，`delete(key)` 删除文件；创建导出之前，仍然要完成业务授权。

这个函数只写入存储对象，既不会创建文件插件中的记录，也不会生成可以公开访问的 URL。需要完整的上传、文件记录和访问流程时，请接入文件插件。插件应复用宿主的磁盘配置，不要在每次请求时创建新的管理器。

## 存储与访问的边界

`visibility: 'private'` 不会自动为文件系统配置操作系统权限，也不会自动保护一个公开的 HTTP 目录。`url` 只参与 URL 的生成，并不会创建下载路由。默认的文件系统驱动没有内置签名下载或签名上传的能力。

需要访问私有文件时，使用文件插件的授权下载接口，或在自定义接口中完成身份和资源检查。对象存储的签名能力也取决于具体的驱动，不要假设所有磁盘的行为都一样。

## 部署与测试

宿主启动时会准备配置中的文件系统目录；独立使用这个库时，由调用方准备存储位置。多个实例使用本地磁盘时，需要共享卷，或改用对象存储。

`storage/files` 属于业务数据，应与数据库中的文件元数据一起备份。删除了元数据不等于已经删除了存储对象，反过来也一样；业务服务应安排失败重试和孤立文件的清理。测试时使用临时磁盘或驱动的 fake，避免改写真实的文件。更多应用层面的能力，见 [使用插件](../using-plugins/overview.md)。

## 接口与实现

- [Disk configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/src/types.ts)
- [Filesystem integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive/skills/nocobase-drive/references/fs.md)
- [Host drive provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/drive/provider.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/drive/token.ts)
