---
title: 插件声明与公开入口
description: 声明插件的客户端、服务端和 CLI 能力，通过公开导出接入应用，并与其他插件协作。
---

插件内部的页面、接口、服务和命令，需要先通过插件声明汇总起来，再由应用接入。允许应用或其他插件直接使用的组件、类型和服务，还需要从包的公开入口导出。

[插件结构](plugin-structure.md) 介绍了各文件的职责；本篇解释入口、扩展声明、公开导出和调用之间是如何连接的。完整的页面和接口实践见 [编写第一个插件](write-your-first-plugin.md)。

下文沿用公告插件 `@nocobase/app-plugin-announcements`。示例用到了客户端的路由和语言资源、服务端的路由和 ServiceProvider，以及可选的 CLI 入口。首次创建时可以这样选择能力：

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales \
  --with server.routes --with server.service-providers --with cli
```

如果已经有同名的插件，请保留已有的实现，按需补齐本篇用到的模块即可，不必重新创建。下文中插件文件的路径都相对于 `packages/app-plugin-announcements/`；应用的注册文件则位于应用根目录。

## 运行端入口

同一个包可以按需提供三种运行端入口，由应用分别接入：

| 运行端 | 插件的公开路径 | 默认导出 | 应用的注册文件 |
| --- | --- | --- | --- |
| 客户端 | `@nocobase/app-plugin-announcements/client` | `defineClientPlugin()` 返回的工厂函数 | `client/plugins.ts` |
| 服务端 | `@nocobase/app-plugin-announcements/server` | `defineServerPlugin()` 返回的声明对象 | `server/plugins.ts` |
| CLI | `@nocobase/app-plugin-announcements/cli` | `defineCliPlugin()` 返回的声明对象 | `cli/plugins.ts` |

注册客户端时需要调用工厂，例如 `announcements()`；服务端和 CLI 则直接注册导入的对象。它们分别进入应用的 `defineClientPlugins()`、`defineServerPlugins()` 和 `defineCliPlugins()`。

客户端和服务端通常把声明写在 `plugin.ts` 中，再由同目录的 `index.ts` 转出：

```ts
export { default } from './plugin.js';
```

CLI 的声明直接写在 `cli/index.ts` 中，不需要额外的 `cli/plugin.ts`。

本地插件已经是应用的工作区依赖、并且可以被解析时，在应用根目录预览并执行注册：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

检查命令修改了哪些三端注册文件，并保留应用原有的插件。安装依赖让包可以被导入，运行端注册让应用加载它声明的功能，两者缺一不可。详细操作见 [管理插件](../developing-apps/manage-plugins.md)。

插件不必同时提供三端的入口。只导出组件的包，通过普通的 `import` 使用即可；只提供 Skills 的包，可以没有运行时入口。数据库资源则需要通过服务端入口来声明。不要为了凑齐目录而生成没有用途的入口。

## 扩展声明

### 客户端

`client/plugin.ts` 汇总公告页面的路由和语言资源：

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import locales from './locales/index.js';
import routes from './routes.js';

const announcements: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  routes,
  locales,
});

export default announcements;
```

`routes` 来自插件自己的路由声明，`locales` 是语言资源加载器的集合。页面组件和具体的语言文件，可以在各自的加载器中按需导入。新增页面后补充路由即可，应用不需要为每个页面再次注册这个插件。

根据功能需要，还可以声明 `serviceProviders` 和 `reactProviders`：前者注册客户端服务，后者挂载 React Provider，两者的职责不同。页面和组件的具体实现见 [页面、路由与菜单](pages-and-menus.md) 和 [组件与样式](frontend-components.md)；上下文与服务分别见 [React Context 与 Provider](react-context-and-providers.md) 和 [客户端服务](client-services.md)。

### 服务端

`server/plugin.ts` 汇总接口和服务的注册：

```ts
import path from 'node:path';
import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const announcements: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  baseDir: path.resolve(import.meta.dirname, '..'),
  serviceProviders,
  routes,
});

export default announcements;
```

`serviceProviders` 中放 Provider 的构造函数，`routes` 中放路由声明。不要在声明文件里实例化 Provider、连接数据库或启动任务，这些工作由应用的服务容器和生命周期管理。

服务端还可以声明语言资源和数据库资源。下面两项是在插件具备了相应文件之后，再添加到定义中的配置：

| 字段 | 声明方式 | 接入后的作用 |
| --- | --- | --- |
| `locales` | 导入 `server/locales/index.ts` 中的加载器集合 | 向应用提供插件的语言资源 |
| `database` | `{ migrations: './database/migrations', seeds: './database/seeds' }` | 提供迁移和 Seed 的资源目录 |

数据库目录相对于绝对路径 `baseDir`。上面的写法在源码中指向插件根目录，编译后则指向插件的 `dist/`，对应编译后的数据库资源。请保留脚手架的构建脚本和资源清单。添加一个目录并不会自动注册它；声明并构建了资源，也不等于已经执行了迁移。具体步骤见 [数据库资源与迁移](database-and-migrations.md)。

后台任务需要通过相应的 ServiceProvider 注册执行器，不能只把任务文件放进 `server/jobs/` 就等着被自动发现。接口的实现见 [路由与 HTTP 接口](server-apis.md)，服务的接入见 [业务服务与 ServiceProvider](server-services.md)，任务执行器的注册与关闭见 [后台任务与执行器](background-jobs.md)。

### CLI

选择 `cli` 能力后，脚手架会提供 `cli/info.ts`，并在 `cli/index.ts` 中把它声明为插件命令：

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';

const announcements: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  commands: { info: PluginInfo },
});

export default announcements;
```

应用接入这个入口后，就可以运行 `pnpm nocobase announcements info`。命令模块导出命令类，业务操作放在命令的执行阶段完成；只有需要应用服务时，才启动相应的能力。开发命令、构建钩子和命令测试见 [命令行扩展](extend-command-line.md)。

## 插件配置

插件提供配置的契约，应用负责选择具体的值并接入运行时。需要可复用的服务端配置时，从插件的公开入口导出配置工厂和类型，由应用在 `server/config/<module>.ts` 中调用，再加入 `server/config/index.ts` 的 `defaultAppConfigs()`。配置工厂维护默认值、环境变量映射、校验和允许公开的字段；应用则通过 `config.yml` 等方式覆盖各环境的值。

例如，认证插件公开了 `defineAuthConfig()`，应用用它创建自己的 `auth` 配置分区。新的插件也可以采用同样的组织方式，并在 README 中说明分区的名称和接入步骤。`defineServerPlugin()` 中的运行时贡献声明，不能代替应用配置分区的注册；也不要凭空增加一个 `config` 字段，期待它被自动加载。

客户端工厂可以接收插件自己声明的选项；工厂选项、服务端配置和浏览器可见的公开值，需要分别说明。敏感的值请留在服务端，不要通过组件 Props 或客户端配置传给浏览器。完整的配置定义和覆盖方式见 [应用配置（config.yml）](../developing-apps/configuration-and-settings.md)。

## 公开导出

### 把入口映射为包路径

`index.ts` 决定导出哪些符号，`package.json` 中的 `exports` 决定使用方可以使用哪些包路径。下面是三端入口相关字段的摘录，请合并到已有的清单中，并保留其他的导出、依赖和构建配置：

```json
{
  "exports": {
    "./client": { "types": "./client/index.ts", "import": "./client/index.ts" },
    "./server": { "types": "./server/index.ts", "import": "./server/index.ts" },
    "./cli": { "types": "./cli/index.ts", "import": "./cli/index.ts" }
  },
  "publishConfig": {
    "exports": {
      "./client": { "types": "./dist/client/index.d.ts", "import": "./dist/client/index.js" },
      "./server": { "types": "./dist/server/index.d.ts", "import": "./dist/server/index.js" },
      "./cli": { "types": "./dist/cli/index.d.ts", "import": "./dist/cli/index.js" }
    }
  }
}
```

开发时，通过源码入口使用工作区中的插件；发布包以及应用构建收集本地包时，则使用对应的构建产物映射。新增导出时，要确保相关的源码参与编译，并且声明的 `.js` 和 `.d.ts` 文件确实存在。

客户端入口只导出浏览器中可用的内容，服务端入口则可以使用 Node.js 的能力。前后端共用的数据类型，可以放在一个独立的共享模块中，并按需增加公开的子路径；不要通过一个混杂的根入口，把服务端依赖带进浏览器。

### 对外提供服务

下文沿用 [业务服务与 ServiceProvider](server-services.md) 中的公告预览服务。请先按该篇定义 `AnnouncementPreviewService`、`AnnouncementPreview`、原始的 Token 和 Provider，并把 Provider 加入 Server 声明。预览服务返回 `{ text, length }`；这里只集中说明使用方用到的公开入口，不再重复服务的实现。

在 `server/index.ts` 中保留插件的默认导出，并增加服务的公开导出：

```ts
export { default } from './plugin.js';
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

外部从 `@nocobase/app-plugin-announcements/server` 导入 Token 和类型。默认导出用于应用的注册，命名导出用于服务的调用；Provider 和实现可以继续作为内部细节。导出 Token 并不等于注册了实现，应用仍然需要接入 Server 插件。

[客户端服务](client-services.md) 同样通过自己的 Token、Provider 和公开入口接入，两端的容器相互独立。组件的公开方式及样式前提见 [组件与样式](frontend-components.md#对外提供组件)，可编辑源码的分发见 [按需分发 UI 源码资产](frontend-components.md#按需分发-ui-源码资产)。

## 插件之间的协作

### 声明依赖并完成接入

假设报表插件需要调用公告预览服务，它应先声明对公告插件的依赖。对于由应用统一提供、需要共享服务身份的插件，使用兼容的 peer 依赖。在本地工作区中可以这样声明，下面只是使用方 `package.json` 中相关字段的摘录：

```json
{
  "peerDependencies": {
    "@nocobase/app-plugin-announcements": "workspace:^"
  }
}
```

`workspace:^` 用于同一个工作区中的包；独立安装或发布时，应使用包管理工具转换后的实际版本范围。请保留脚手架中 `@nocobase/service-provider` 等共享运行时的 peer 声明，普通的运行依赖和开发工具仍按各自的用途声明。

应用需要安装兼容的版本，并在服务端注册公告插件，以及使用方实际需要的运行时入口。npm 依赖不会自动修改应用的 `server/plugins.ts`，也不能代替服务的注册。如果使用方只是导出一个由应用主动调用的函数，就不必额外制造一个运行时入口。

### 通过公开服务调用

在使用方的 `server/services/announcement-preview.ts` 中，通过公开的 Token 使用服务：

```ts
import { announcementPreviewToken, type AnnouncementPreview } from '@nocobase/app-plugin-announcements/server';
import type { ServiceContainer } from '@nocobase/service-provider';

export function previewAnnouncement(
  container: ServiceContainer,
  text: string,
): AnnouncementPreview {
  return container.resolve(announcementPreviewToken).preview(text);
}
```

应用或使用方的路由，把当前应用的 `app.container` 传给这个函数。公告插件内部可以自由调整预览的实现，只要保留公开路径、原始的 Token 和接口语义，调用方就不需要知道实现文件在哪里。

调用必须发生在服务完成注册之后。使用方的 Provider 在 `register()` 中先注册自己的工厂，把依赖的解析留到工厂中或之后的生命周期里；对于需要异步初始化的依赖，还要遵守相应的生命周期和应用中的声明顺序。包依赖并不会自动推导出 Provider 的启动顺序，具体机制见 [应用启动与生命周期](../framework/runtime/lifecycle.md)。

调用方应从公开入口取得原始的 Token，不能用同一个字符串重新创建 Token，也不应跨包用相对路径导入另一个插件的内部实现。服务接口与 Token 的身份规则见 [服务契约与 Token](../framework/services/tokens.md)。

### 验证公开入口

在插件的测试中从公开入口导入，验证服务注册后能够调用、缺少注册时会明确失败。然后在目标应用中检查页面、接口和实际的命令，最后验证插件和应用的构建：

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm nocobase announcements info --json
pnpm build
```

除了源码可以导入，还要核对构建产物中的公开路径、类型声明和资源是否完整。注册成功，或者 `info` 命令执行成功，都只能证明相应的入口可用，不能代替业务功能的测试。插件的验证方法见 [测试与验证](testing-and-verification.md)，交付前的检查见 [构建与发布](publish-plugin.md)。
