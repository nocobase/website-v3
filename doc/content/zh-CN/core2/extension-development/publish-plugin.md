---
title: 构建与发布
description: 本地插件可以随 App 一起构建和部署；需要在多个应用之间共享时，再发布到私有 npm 源。
---

**插件不发布，也可以一直在 App 中使用。** 本地插件放在 `packages/` 下，通过工作区依赖和运行时注册接入应用。App 构建时会构建它依赖的本地包，把需要交付的插件产物收集到 `dist/vendor/` 中，并处理部署所需的依赖。按正常流程构建、部署 App 即可，不需要先搭建 npm 源。

当多个 App 或多个团队需要共享插件，并希望各自选择版本、安排升级时，再考虑发布。本篇沿用 [编写第一个插件](write-your-first-plugin.md) 中的公告栏示例，把它发布到团队的私有 npm 源，再由另一个 App 安装使用。

发布之后，插件的源码仍然可以留在原 App 的工作区中维护：原 App 继续使用本地源码，其他 App 使用发布的版本。

本篇介绍的是插件包的发布。如果还需要把前端组件或区块作为源码资产发布，供 Agent 按需取用、修改和组合，可以同时通过 shadcn UI Registry 分发，见 [按需分发 UI 源码资产](frontend-components.md#按需分发-ui-源码资产)。插件包和源码资产可以分别独立发布；复用组件本身并不要求发布 Registry。

## 本地构建与随应用交付

先在应用根目录检查并构建插件，再构建整个应用：

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm build
```

核对插件 `dist/` 中的公开入口、类型声明和实际的资源，再检查应用产物中的本地依赖。按插件提供的能力，验证页面、接口或命令；涉及迁移和 Seed 时，确认编译后的资源和校验清单都完整。组件的样式由宿主构建处理，需要检查的事项见 [组件与样式](frontend-components.md#样式与主题适配)。

插件只用于当前 App 时，完成应用的验证之后，就可以按 [选择部署方式](../deployment/choose-a-deployment-method.md) 交付。下面的私有源流程，适用于需要独立分发插件包的情况。

## 使用 Agent

已经有私有源时，可以这样描述需求，请把地址换成团队实际使用的地址：

```text
请把当前 App 的公告栏插件准备为 @my-company/app-plugin-announcements，
检查并构建后发布 0.1.0 到 https://npm.example.com/。
再在另一个 App 中安装、注册并验证这个版本。
```

如果还没有私有源，可以先让 Agent 协助搭建。登录信息通过包管理器的登录或 CI 的凭据配置提供，不要写进需求或插件源码中。下面说明手动操作的步骤。

## 不使用 Agent

### 1. 准备私有 npm 源

如果团队已经有私有 npm 源，直接使用它提供的地址和账号，跳到下一步。如果没有，可以使用 [Verdaccio](https://www.verdaccio.org/docs/docker/) 搭建一个。下面以本机的 `http://localhost:4873/` 演示完整的流程。

在一个独立的目录中创建 `config.yaml`：

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

这份配置只托管 `@my-company/*` 下的包：登录用户可以读取，名为 `publisher` 的用户可以发布。它不代理其他的 npm 包，App 原有的依赖仍然从各自配置的源获取。

在该目录中启动服务，并用 Docker volume 保存包和账号的数据：

```bash
docker run -d --name team-npm --restart unless-stopped \
  -p 127.0.0.1:4873:4873 \
  -v "$PWD/config.yaml:/verdaccio/conf/config.yaml:ro" \
  -v team-npm-storage:/verdaccio/storage \
  verdaccio/verdaccio:6
```

创建发布用的账号，按提示输入用户名 `publisher`、密码和邮箱：

```bash
npm adduser --registry http://localhost:4873/ --auth-type=legacy
```

按需为使用方创建账号。账号都准备好之后，把 `max_users` 改为 `-1`，再执行 `docker restart team-npm`，关闭自行注册；已有的账号仍然可以登录。账号和包权限的配置见 [Verdaccio 认证说明](https://www.verdaccio.org/docs/authentication/)。

这种启动方式只供本机访问。在团队中共享时，请通过 HTTPS 入口提供服务，并把本文中所有的 `http://localhost:4873/` 换成实际的地址；在其他机器上，`localhost` 并不会指向这台服务器。请保留并备份配置和 volume，删除容器时不应删除这些数据。

### 2. 配置源并登录

在维护插件的那个 **App 根目录** 的 `.npmrc` 中追加：

```ini
@my-company:registry=http://localhost:4873/
```

请保留已有的配置，尤其是 `@nocobase` 的源设置。使用自己组织的 scope，可以让团队的插件和 NocoBase 的依赖分别解析到正确的源。

创建账号的那台机器已经登录；在其他开发机上执行：

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

发布时应使用具有发布权限的账号，本例中为 `publisher`。登录凭据保存在用户级的配置中，不要放进项目的提交里。

### 3. 准备插件包

以下操作仍在维护插件的 App 中进行。公告栏插件的目录可以保持为 `packages/app-plugin-announcements/`，只把包名调整为 `@my-company/app-plugin-announcements`。

如果沿用了前篇中的 `@nocobase/app-plugin-announcements`，需要同时修改这些位置：

| 位置 | 调整内容 |
| --- | --- |
| 插件的 `package.json` | `name` 改为新的包名，`version` 设为 `0.1.0`，删除 `private: true` |
| 插件的 Client、Server 定义 | `packageName` 改为同一个新包名 |
| 插件的测试和说明 | 同步包名，以及测试中语言资源的命名空间 |
| App 的 `package.json` | 本地依赖的键改为新的包名，继续使用 `workspace:*` |
| App 的插件注册文件 | 把对应的 import 改为新的包名，并保留注册 |

完成后运行 `pnpm install`，同步工作区链接和锁文件。新建一个准备共享的插件时，可以直接使用完整的包名创建，见 [创建插件](create-plugin.md#名称与常用选项)。

`private: true` 的含义是禁止把包发布到任何 npm 源，包括私有源。删除它并不会让包自动公开，谁能读取或发布，由私有源的权限配置决定。参见 [npm 的 private 字段](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#private)。

继续检查插件的 `package.json`：

| 字段 | 发布前需要确认的内容 |
| --- | --- |
| `publishConfig.registry` | 新增，并设为 `http://localhost:4873/`，明确发布的目标 |
| `publishConfig.access` | 本例删除脚手架中的 `public` 值，访问权限交由 Verdaccio 配置管理 |
| `exports`、`imports` | 保留本地开发用的入口和包内别名 |
| `publishConfig.exports`、`publishConfig.imports` | 保留脚手架中指向 `dist/` 的映射，pnpm 打包时会应用它们 |
| `files` | 包含 `dist/`；有 Skills 或其他运行时资源时，也要包含相应的目录 |
| 依赖声明 | 服务端依赖、共享运行时和客户端 peer 依赖都完整，版本与使用方兼容 |

**在现有的 `publishConfig` 中补充源地址，不要用一个只包含 `registry` 的对象把它整个替换掉。** 本地开发入口与发布入口之间的关系，见 [插件结构](plugin-structure.md#packagejson包信息依赖与公开导出)。

如果插件依赖另一个工作区包，那个包也必须能被使用方安装。`workspace:*` 在打包时会被转换为版本要求，并不会把另一个包的实现一起打进来；应先发布它所依赖的共享包。

完善插件的 README 和变更记录，说明功能、需要注册的入口、兼容的版本和必要的配置。发布的包必须能够离开原 App 单独使用，不能依赖原 App 的私有源码或文件路径。

### 4. 检查并打包

在 **App 根目录** 运行：

```bash
pnpm --filter @my-company/app-plugin-announcements check
pnpm --filter @my-company/app-plugin-announcements pack \
  --pack-destination ./artifacts
```

`check` 会检查代码、格式、类型和测试，并构建插件；`pack` 生成发布包，但尚未上传。以上命令会在 App 根目录下的 `artifacts/` 中生成 `.tgz` 文件，具体路径以终端输出为准。打包规则见 [pnpm pack](https://pnpm.io/cli/pack)。

查看文件清单和包中的声明：

```bash
tar -tzf artifacts/my-company-app-plugin-announcements-0.1.0.tgz
tar -xOf artifacts/my-company-app-plugin-announcements-0.1.0.tgz package/package.json
```

重点确认：

- `./client`、`./server` 等公开入口，指向包中实际存在的编译文件。
- 客户端的包内别名能够解析，语言资源和其他运行时文件都完整。
- 包中不包含 App 的配置、账号凭据或本地数据；打包产物不要提交到源码仓库。

对于公告栏插件，包中应包含 `dist/client/`、`dist/server/` 和 `dist/shared/`。只在原 App 中检查能运行还不够，最后还要在另一个 App 中验证发布的包。

### 5. 发布到私有源

确认改动都已提交，并在团队约定的发布分支上执行。仍然在 App 根目录中，先预览，再发布：

```bash
pnpm --filter @my-company/app-plugin-announcements publish --dry-run
pnpm --filter @my-company/app-plugin-announcements publish
```

这里只发布选中的插件，发布目标由插件的 `publishConfig.registry` 决定。pnpm 会检查 Git 状态和发布分支，遇到不满足的条件时，请先按提示处理。`--dry-run` 不会上传包；正式发布时，默认使用 `latest` 标签。参见 [pnpm publish](https://pnpm.io/cli/publish)。

发布后，查询指定的版本：

```bash
npm view @my-company/app-plugin-announcements@0.1.0 version \
  --registry http://localhost:4873/
```

应返回 `0.1.0`。发布让其他 App 可以安装这个版本，但不会改变已经部署的应用。

### 6. 在另一个 App 中安装使用

进入**另一个通过 create-app 创建的 App 的根目录**。它不包含公告栏插件的本地源码，也不需要复制原 App 的 `packages/`。

先编辑**这个 App 根目录下的 `.npmrc`**（没有这个文件就创建一个），追加团队插件的源配置：

```ini
@my-company:registry=http://localhost:4873/
```

请把地址替换为使用方能够访问的私有源地址，并保留文件中已有的默认源和 `@nocobase` 等配置。发布方 App 的 `.npmrc` 和插件的 `publishConfig.registry`，都不会自动为这个 App 配置安装源。

在当前机器上，用有读取权限的账号登录；已经登录过同一个源时，可以跳过这一步：

```bash
npm login --registry http://localhost:4873/ --auth-type=legacy
npm whoami --registry http://localhost:4873/
```

`plugin register` 会在 App 根目录调用包管理器安装插件，由 pnpm 读取上面的 `.npmrc`，因此注册命令不需要传 `--registry`，当前的命令也不提供这个参数。

如果 pnpm 新版本的发布时间等待策略阻止安装刚发布的包，可以在 `pnpm-workspace.yaml` 的现有列表中追加自己的 scope：

```yaml
minimumReleaseAgeExclude:
  - '@my-company/*'
```

请保留文件中的其他设置和已有的条目。这个例外只适用于团队自己控制的包，相关说明见 [Verdaccio 的 pnpm 指南](https://www.verdaccio.org/docs/setup-pnpm/)。

先预览安装计划，再安装并注册指定的版本：

```bash
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0 --dry-run
pnpm nocobase plugin register @my-company/app-plugin-announcements \
  --version 0.1.0
```

还没有安装时，预览主要展示安装计划；实际安装之后，命令会读取公开入口，再写入 Client 和 Server 的注册，并同步 Skills。这里不使用 `--no-install`，因为使用方需要从私有源获取插件。

启动应用，验证公告页面和接口，然后构建：

```bash
pnpm dev
# 在另一个终端执行
pnpm build
```

按 [编写第一个插件](write-your-first-plugin.md#6-接入-app-并查看结果) 检查菜单、公告内容、语言切换和接口。之后按 App 原有的方式部署，见 [选择部署方式](../deployment/choose-a-deployment-method.md)。

开发机和 CI 的构建环境，都需要具备私有源的读取权限。App 构建会保留源地址，但不会把项目中的认证 token 复制到部署产物中；CI 通过用户级的 npm 配置或受保护的凭据配置提供认证。如果部署流程还会重新安装依赖，也要为这个安装步骤提供读取权限。

### 7. 发布后续版本

修改插件并验证之后，递增版本号、更新变更记录，再重复检查和发布的流程；不要覆盖已经发布的版本。

使用方按需升级依赖并验证功能，具体操作见 [管理插件](../developing-apps/manage-plugins.md#更新插件)。升级插件之后，仍需重新构建和部署 App，已经部署的应用不会自动切换版本。原来维护插件的 App，则可以继续通过 `workspace:*` 使用本地的源码。
