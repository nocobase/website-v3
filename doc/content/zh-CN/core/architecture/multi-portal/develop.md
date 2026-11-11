---
title: 开发业务门户
metaDescription: 在已有多门户应用中创建门户，安装并进入，再添加页面、导航和布局，完成开发验证。
---

## 准备多门户应用

准备一个已配置并能正常启动的[多门户应用](create-app.md)，保持商业包源登录有效，并使用具有 `unrestricted` 权限的管理员账号完成以下操作。

本例创建“门户 1”（`portal-1`）：先得到一个可进入的空门户，再添加一个详情页面。门户是应用中的本地包，随应用一起构建和部署，不需要先发布到 npm。页面开发沿用 shadcn/ui 组件约定，优先复用已有组件和 NocoBase UI Library。

## 创建第一个门户

在已有应用的根目录操作。下面两种方式任选一种，不要重复生成同名门户。

### 使用 Agent 创建

在应用根目录打开开发 Agent，输入：

```prompt
在当前应用里新增一个“门户 1”，名称用 portal-1，先做好能进入的基础首页，不添加业务数据。
```

Agent 使用项目的 `AGENTS.md`、`.agents/rules/multi-portal.md` 和项目内的开发 Skills 完成生成与注册。完成后，确认存在 `packages/app-portal-portal-1/`，并且门户已注册到应用的 Client 和 Server。这里不需要重新创建应用。

### 使用命令创建

在应用根目录执行以下命令，创建门户并设置中英文名称和描述：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta portal-1 \
  --set-locale 'en-US.title=Portal 1' \
  --set-locale 'en-US.description=Explore pages and navigation.' \
  --set-locale 'zh-CN.title=门户 1' \
  --set-locale 'zh-CN.description=体验页面与导航。'
```

此命令需要支持 `--set-locale` 的生成器版本，可用 `pnpm create @nocobase/portal@beta --help` 确认；旧版本请省略这些参数，生成后修改语言文件。

每个 `--set-locale` 设置一个 `语言.字段=值`，`title` 是名称，`description` 是描述。只填写需要修改的字段，其余保留默认值。

这些文案直接写入 `packages/app-portal-portal-1/client/locales/` 下的对应语言文件，如 `en-US.ts` 和 `zh-CN.ts`。创建后直接修改文件中的 `title`、`description`，保留原有导入、类型和导出即可，无需重新运行生成命令，也不需要更改门户 ID、包名或路由。

<details>
<summary>语言参数规则与生成预览</summary>

- `portal-1` 是门户 ID。ID 以小写字母开头，由小写字母、数字和单个连字符分隔的片段组成，最长 40 个字符。

- 支持 `en-US`、`zh-CN`、`zh-TW`、`ja-JP`、`de-DE`、`es-ES`、`fr-FR`、`pt-BR`、`vi-VN`、`id-ID`。
- 名称须为非空单行文字，描述可以为空。
- 按第一个 `=` 分隔，文案中可以包含 `=`。
- 同一语言的同一字段不能重复设置；不支持的语言或字段会报错。
- 在命令末尾添加 `--dry-run --json`，可查看生成计划，不写入文件。

</details>

执行成功后，应用中会新增 `packages/app-portal-portal-1/`，并完成依赖安装及 Client、Server 注册。此时门户仍是**未安装**状态，下一步启动应用并安装门户。生成器不创建业务表或 CRUD 页面，也不启动服务或修改数据库。

如果依赖安装失败，保留已生成的源码，按输出的恢复步骤处理，不要在已有目录上重复运行生成器。

## 安装并进入门户

生成完成后，启动或重启应用，让它加载新注册的门户：

```bash
pnpm dev
```

### 在门户管理中安装

使用管理员账号打开 **系统设置 → 门户管理**，找到“门户 1”。初始状态为 **未安装**，打开行末的 **…** 菜单，选择 **安装**。

![在门户管理的操作菜单中安装 Portal 1](/assets/core/multi-portal/develop/install.png)

等待状态变为 **已安装**，再从同一菜单选择 **进入**。安装过程中会执行门户的数据库任务并启动门户；失败时按[管理门户](manage.md)检查失败阶段，不要删除迁移记录重新开始。

### 从工作台进入门户

管理员也可以从 **工作台** 点击已安装的门户卡片进入。**首页**展示应用的起始内容，**工作台**提供门户入口，**门户管理**负责安装与卸载。

![独立工作台中的 Portal 1 入口](/assets/core/multi-portal/develop/workbench.png)

> [!NOTE]
> 独立工作台的截图来自预览版模板。若当前安装的模板尚未提供独立的“工作台”菜单，请从首页的门户列表进入；门户管理中的安装与进入方式相同。

进入后应看到门户自己的 **Overview** 导航和基础首页。刷新页面后仍能进入，就完成了最小门户的安装验证。这里还没有业务功能。

![Portal 1 的默认导航和基础首页](/assets/core/multi-portal/develop/portal.png)

### 切换门户与返回工作台

点击门户左上角的名称，打开切换菜单。安装并授权其他门户后，可以从这里切换；当前只有一个门户时，可使用 **返回工作台**。

![门户切换菜单与返回工作台入口](/assets/core/multi-portal/develop/switcher.png)

默认生成的门户页面只允许管理员访问。普通用户的入口、门户列表和页面授权需要按[门户访问与权限](access.md)配置，不能仅通过显示导航来授予访问权。

## 了解门户目录结构

### 目录结构

门户代码位于 `packages/app-portal-portal-1/`。以下省略工具配置和构建产物：

```text
packages/app-portal-portal-1/
├── portal.ts                  # 门户标识、入口和外观
├── package.json               # 包信息、依赖和脚本
├── client/                    # 客户端
│   ├── index.ts               # 客户端入口
│   ├── plugin.ts              # 注册路由和语言资源
│   ├── routes.ts              # 页面路由与访问要求
│   ├── layout.tsx             # 布局与导航
│   ├── styles.css             # 门户样式
│   ├── pages/
│   │   └── overview.tsx       # 默认首页
│   └── locales/               # 名称、描述和页面文案
│       ├── index.ts           # 语言资源加载
│       ├── en-US.ts           # 英文
│       ├── zh-CN.ts           # 简体中文
│       └── …
├── server/                    # 服务端
│   ├── index.ts               # 服务端入口
│   ├── plugin.ts              # 注册服务与数据库资源
│   └── providers/
│       ├── index.ts           # 服务提供者列表
│       └── portal.ts          # 注册门户，默认未安装
└── database/
    └── main/                  # 宿主应用的 main 连接
        ├── migrations/        # 表结构迁移，初始为空
        └── seeds/             # 初始化数据
            └── portal_portal_1_installation.ts
                               # 初始化门户安装状态
```

### 门户定义与注册

下面摘录三个文件的关键配置。

**`portal.ts`：**

```ts
const portal: PortalDescriptor = {
  id: 'portal-1',                              // 稳定标识
  namespace: '@nocobase/app-portal-portal-1',    // 语言资源命名空间
  entry: '/portals/portal-1',                   // 入口，不含 /main 等基础路径
  icon: 'LayoutGrid',                          // 门户图标
  tone: 1,                                    // 配色标识
};
```

名称和描述在 `client/locales/` 中修改。不要为了改显示名称更换 ID 或包名，安装记录和权限可能引用它们。

**`client/plugin.ts`：**

```ts
const plugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-portal-portal-1',
  locales, // 来自 ./locales/index.js
  routes,  // 来自 ./routes.js
});
```

**`server/plugin.ts`：**

```ts
const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-portal-portal-1',
  baseDir: path.resolve(import.meta.dirname, '..'), // 门户包根目录
  serviceProviders, // 包含注册门户的 PortalProvider
  database: {
    connections: {
      main: {}, // 使用 database/main/ 下的 migrations 和 seeds
    },
  },
});
```

`main` 引用宿主应用的连接，空对象表示沿用约定目录；数据库地址和凭据由宿主应用配置。

## 添加页面与导航

### 新增页面与路由

可以继续向 Agent 描述需求：

```prompt
给门户 1 添加一个“详情”页面，在导航里加入口，页面先展示一段介绍文字，供管理员查看。
```

手动实现时，在 `client/pages/details.tsx` 默认导出页面组件，沿用现有的 `Layout`：

```tsx
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import Layout from '../layout.js';

export default function DetailsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-portal-portal-1');
  return (
    <Layout>
      <section className='p-6'>
        <h1 className='text-2xl font-semibold'>{t('detailsTitle')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('detailsDescription')}</p>
      </section>
    </Layout>
  );
}
```

在门户的 `client/locales/en-US.ts` 中添加 `detailsTitle: 'Details'` 和 `detailsDescription: 'A page inside Portal 1.'`，并在对应语言文件中补充翻译。随后向 `client/routes.ts` 的路由数组追加：

```ts
{
  name: 'portal1Details',
  path: '/portals/portal-1/details',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'detailsTitle' },
  componentLoader: () => import('./pages/details.js'),
}
```

### 添加导航入口

在 `client/layout.tsx` 中读取门户自己的翻译：

```ts
const { t: tPortal } = useTranslation('@nocobase/app-portal-portal-1');
```

保留原有 Overview 菜单，向 `navigation` 数组追加以下条目。`ChartNoAxesCombined` 已由生成的布局导入，可替换为其他受支持的图标。

```ts
{
  path: `${portal.entry}/details`,
  title: tPortal('detailsTitle'),
  icon: ChartNoAxesCombined,
}
```

此时点击 **Details** 应显示介绍文字，直接访问 `/main/portals/portal-1/details` 并刷新也应正常；若应用基础路径不是 `/main`，使用实际路径。路由决定页面匹配与访问，导航提供入口，两处都需要维护。

## 调整门户布局

### 应用外壳与门户布局

应用负责登录、用户权限、运行配置、连接和部署；门户负责自己的页面、导航、业务服务与数据定义。

生成的门户使用 `PortalLayout`，通过应用提供的 `PortalLayoutHost` 显示侧边栏、页头和账户菜单。门户布局在 `client/layout.tsx`，共用外壳在应用的 `client/layouts/portal-shell.tsx`。

### 自定义门户的页面组织

只调整某个门户的菜单、页面排列或内容区域时，从该门户的布局和页面修改。需要独立的顶部导航或不同页面结构时，可以在门户内实现自己的布局；应保留所需的账户、退出和门户切换入口，并沿用应用的认证与权限机制。

修改应用的共用外壳会影响使用它的其他门户，不要为了一个门户的特殊排版直接改全局外壳。页面与菜单的完整用法见[页面与菜单](../../extension-development/pages-and-menus.md)，界面文案见[国际化](../../extension-development/localization.md)。

## 添加服务与数据

需要保存业务记录时，在门户的 Server 中实现业务逻辑和 HTTP 接口。接口必须独立检查登录、业务权限和门户安装状态；隐藏菜单不能保护数据。具体做法见[服务端 API](../../extension-development/server-apis.md)。

表结构迁移放在 `database/main/migrations/`，必要的初始化数据放在 `database/main/seeds/`。保留生成的安装 seed，不要在每次启动时覆盖管理员选择的安装状态。

额外数据库连接由应用配置并提供驱动，再由门户声明同名连接及其迁移、seed。安装需要等待各连接的数据库任务成功；多个连接之间不是跨库原子事务，失败时保留执行历史、修复后重试。详见[数据库连接](../../framework/database/connections.md)和[数据库与迁移](../../extension-development/database-and-migrations.md)。

## 验证与交付

在应用根目录执行：

```bash
pnpm --filter @nocobase/app-portal-portal-1 check
pnpm build
```

再检查实际操作：

- 安装后能从门户管理和门户列表进入，刷新后仍可访问。
- 新增页面的导航与直接访问结果一致，门户切换和返回入口正常。
- 配置普通用户权限后，分别用管理员、有权用户和无权用户检查页面与接口。

生成的最小包可能没有业务测试，检查命令通过不代表业务行为已经覆盖。本地门户随应用交付；需要部署包时运行 `pnpm build --tar`，后续步骤见[发布应用版本](../../deployment/publish-app-release.md)。
