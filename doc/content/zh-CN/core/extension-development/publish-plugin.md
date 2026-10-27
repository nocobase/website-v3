---
title: 发布插件
description: 本地插件可以随 App 构建和部署；需要跨应用共享时，再发布到私有 npm 源。
---

**插件不发布，也可以一直在 App 中使用。** 本地插件放在 `packages/` 下，通过工作区依赖和运行时注册接入应用。App 构建会构建依赖的本地包，将需要交付的插件产物收集到 `dist/vendor/`，并处理部署依赖。按正常流程构建、部署 App 即可，无需先搭建 npm 源。

当多个 App 或团队需要共享插件，并希望独立选择版本、安排升级时，再考虑发布。本篇沿用[编写第一个插件](write-your-first-plugin.md)的公告栏示例，将它发布到团队的私有 npm 源，再由另一个 App 安装使用。

发布后，插件源码仍可以留在原 App 的工作区中维护；原 App 继续使用本地源码，其他 App 使用发布的版本。

## 使用 Agent

已有私有源时，可以这样描述需求，将地址换成团队的实际地址：

```text
请把当前 App 的公告栏插件准备为 @my-company/app-plugin-announcements，
检查并构建后发布 0.1.0 到 https://npm.example.com/。
再在另一个 App 中安装、注册并验证这个版本。
```

没有私有源时，先让 Agent 协助搭建。登录信息通过包管理器登录或 CI 的凭据配置提供，不写进需求或插件源码。下面说明手动操作。

## 不使用 Agent

### 1. 准备私有 npm 源

团队已有私有 npm 源时，直接使用它提供的地址和账号，跳到下一步。没有时，可以使用 [Verdaccio](https://www.verdaccio.org/docs/docker/) 搭建。以下以本机 `http://localhost:4873/` 演示完整流程。

在独立目录中创建 `config.yaml`：

```yaml
storage: /verdaccio/storage

auth:
  htpasswd:
    file: /verdaccio/storage/htpasswd
    max_users: 1000

packages:
  '@my-company/*':
    access: $authenticated
    publish: publisher
    unpublish: publisher
```

这份配置只托管 `@my-company/*`：登录用户可以读取，名为 `publisher` 的用户可以发布。它不代理其他 npm 包，App 原有的依赖仍从各自配置的源获取。

在该目录启动服务，使用 Docker volume 保存包和账号数据：

```bash
docker run -d --name team-npm --restart unless-stopped \
  -p 127.0.0.1:4873:4873 \
  -v "$PWD/config.yaml:/verdaccio/conf/config.yaml:ro" \
  -v team-npm-storage:/verdaccio/storage \
  verdaccio/verdaccio:6
```

创建发布账号，按提示输入用户名 `publisher`、密码和邮箱：

```bash
npm adduser --registry http://localhost:4873/ --auth-type=legacy
```

按需为使用者创建账号。账号准备好后，把 `max_users` 改成 `-1`，再执行 `docker restart team-npm`，关闭自行注册，已有账号仍可登录。账号与包权限的配置见 [Verdaccio 认证说明](https://www.verdaccio.org/docs/authentication/)。

这个启动方式仅供本机访问。团队共享时，通过 HTTPS 入口提供服务，并把本文所有 `http://localhost:4873/` 换成实际地址；其他机器上的 `localhost` 不会指向这台服务器。保留并备份配置和 volume，删除容器不应删除这些数据。

### 2. 配置源并登录

在维护插件的 **App 根目录**的 `.npmrc` 中追加：

```ini
@my-company:registry=http://localhost:4873/
```

保留已有配置，尤其是 `@nocobase` 的源设置。使用自己的组织 scope，可以让团队插件与 NocoBase 依赖分别解析到正确的源。

创建账号的机器已经登录；在其他开发机上执行：

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

发布时应使用有发布权限的账号，本例为 `publisher`。登录凭据保存在用户配置中，不放进项目提交。

### 3. 准备插件包

以下仍在维护插件的 App 中操作。公告栏插件的目录可以保持为 `packages/app-plugin-announcements/`，将包名调整为 `@my-company/app-plugin-announcements`。

如果沿用前篇的 `@nocobase/app-plugin-announcements`，需要一起修改这些位置：

| 位置 | 调整内容 |
| --- | --- |
| 插件 `package.json` | `name` 改为新包名，`version` 设为 `0.1.0`，删除 `private: true` |
| 插件的 Client、Server 定义 | `packageName` 改为同一个新包名 |
| 插件测试和说明 | 同步包名及测试中的语言资源命名空间 |
| App `package.json` | 本地依赖键改为新包名，继续使用 `workspace:*` |
| App 的插件注册文件 | 将对应 import 改为新包名，保留注册 |

完成后运行 `pnpm install`，同步工作区链接和锁文件。新建准备共享的插件时，可以直接使用完整包名创建，见[创建插件](create-plugin.md#名称与常用选项)。

`private: true` 的含义是禁止发布到任何 npm 源，包括私有源。删除它不会让包自动公开；谁能读取或发布，由私有源的权限配置决定。参见 [npm 的 private 字段](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private)。

继续检查插件的 `package.json`：

| 字段 | 发布前应确认的内容 |
| --- | --- |
| `publishConfig.registry` | 新增并设为 `http://localhost:4873/`，明确发布目标 |
| `publishConfig.access` | 本例删除脚手架的 `public` 值，访问权限由 Verdaccio 配置管理 |
| `exports`、`imports` | 保留本地开发的入口与包内别名 |
| `publishConfig.exports`、`publishConfig.imports` | 保留脚手架指向 `dist/` 的映射，pnpm 打包时会应用它们 |
| `files` | 包含 `dist/`；有 Skills 或其他运行资源时，也要包含对应目录 |
| 依赖声明 | 服务端依赖、共享运行时与客户端 peer 依赖完整，版本与使用方兼容 |

**在现有 `publishConfig` 中补充源地址，不要用只包含 `registry` 的对象替换它。** 本地开发入口和发布入口的关系见[插件的结构](plugin-structure.md#packagejson包信息依赖与公开导出)。

如果插件依赖另一个工作区包，那个包也需要能被使用方安装。`workspace:*` 在打包时会转换为版本要求，并不会自动把另一个包的实现一起打进去；应先发布所依赖的共享包。

完善插件的 README 和变更记录，说明功能、需要注册的入口、兼容版本和必要配置。发布包必须能离开原 App 使用，不应依赖原 App 的私有源码或文件路径。

### 4. 检查并打包

在 **App 根目录**运行：

```bash
pnpm --filter @my-company/app-plugin-announcements check
pnpm --filter @my-company/app-plugin-announcements pack \
  --pack-destination ./artifacts
```

`check` 会检查代码、格式、类型、测试并构建插件；`pack` 生成发布包，尚未上传。以上命令会在 App 根目录下的 `artifacts/` 生成 `.tgz`，以终端输出的实际路径为准。打包规则见 [pnpm pack](https://pnpm.io/cli/pack)。

查看文件清单和包内声明：

```bash
tar -tzf artifacts/my-company-app-plugin-announcements-0.1.0.tgz
tar -xOf artifacts/my-company-app-plugin-announcements-0.1.0.tgz package/package.json
```

重点确认：

- `./client`、`./server` 等公开入口指向包内实际存在的编译文件。
- 客户端包内别名能解析，语言资源和其他运行文件完整。
- 包中不包含 App 配置、账号凭据或本地数据；打包产物不提交到源码仓库。

对于公告栏插件，包内应包含 `dist/client/`、`dist/server/` 和 `dist/shared/`。只检查原 App 中能运行还不够，最后还要在另一个 App 中验证发布的包。

### 5. 发布到私有源

确认改动已提交，并在团队约定的发布分支执行。仍在 App 根目录，先预览，再发布：

```bash
pnpm --filter @my-company/app-plugin-announcements publish --dry-run
pnpm --filter @my-company/app-plugin-announcements publish
```

这里只发布所选插件，目标由插件的 `publishConfig.registry` 决定。pnpm 会检查 Git 状态和发布分支；遇到不符合条件时，先处理提示。`--dry-run` 不上传包，正式发布默认使用 `latest` 标签。参见 [pnpm publish](https://pnpm.io/cli/publish)。

发布后查询指定版本：

```bash
npm view @my-company/app-plugin-announcements@0.1.0 version \
  --registry http://localhost:4873/
```

应返回 `0.1.0`。发布使其他 App 能安装这个版本，不会改变已经部署的应用。

### 6. 在另一个 App 中安装使用

进入**另一个已通过 create-app 创建的 App 根目录**。它不包含公告栏插件的本地源码，也不需要复制原 App 的 `packages/`。

先编辑**这个 App 根目录的 `.npmrc`**，没有该文件时创建它，追加团队插件的源配置：

```ini
@my-company:registry=http://localhost:4873/
```

将地址替换为使用方能够访问的私有源地址，保留文件中已有的默认源和 `@nocobase` 等配置。发布方 App 的 `.npmrc` 和插件的 `publishConfig.registry` 不会自动为这个 App 配置安装源。

在当前机器上使用有读取权限的账号登录；已登录同一个源时可以跳过：

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

`plugin register` 会在 App 根目录调用包管理器安装插件，由 pnpm 读取上述 `.npmrc`，因此注册命令不需要传 `--registry`；当前命令也不提供这个参数。

如果 pnpm 的新版本等待策略阻止安装刚发布的包，可以在 `pnpm-workspace.yaml` 的现有列表中追加自有 scope：

```yaml
minimumReleaseAgeExclude:
  - '@my-company/*'
```

保留文件中的其他设置和已有条目。这个例外仅适用于团队控制的包，相关说明见 [Verdaccio 的 pnpm 指南](https://www.verdaccio.org/docs/setup-pnpm/)。

预览安装计划，再安装并注册指定版本：

```bash
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0 --dry-run
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0
```

未安装时，预览主要展示安装计划；实际安装后，命令会读取公开入口，再写入 Client、Server 注册并同步 Skills。这里不使用 `--no-install`，因为使用方需要从私有源获取插件。

启动应用，验证公告页面与接口，再构建：

```bash
pnpm dev
# 在另一个终端执行
pnpm build
```

按[编写第一个插件](write-your-first-plugin.md#6-接入-app-并查看结果)检查菜单、公告内容、语言切换和接口。随后按 App 原有方式部署，见[选择部署方式](../deployment/choose-a-deployment-method.md)。

开发机和 CI 构建环境需要有私有源的读取权限。App 构建会保留源地址，但不会把项目中的认证 token 复制到部署产物；CI 通过用户级 npm 配置或受保护的凭据配置提供认证。若部署流程还会重新安装依赖，也要为该安装步骤提供读取权限。

### 7. 发布后续版本

修改插件并验证后，递增版本、更新变更记录，再重复检查和发布流程，不覆盖已经发布的版本。

使用方按需升级依赖并验证功能，具体操作见[管理插件](../developing-apps/manage-plugins.md#更新插件)。升级插件后仍需重新构建、部署 App，已部署的应用不会自动切换版本。原来维护插件的 App 则可以继续通过 `workspace:*` 使用本地源码。
