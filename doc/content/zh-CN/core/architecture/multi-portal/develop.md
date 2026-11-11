---
title: 开发业务门户
metaDescription: 创建业务门户，了解生成的目录和注册方式，再扩展页面、布局、服务和数据库连接。
---

先准备一个已配置并能正常启动的[多门户应用](create-app.md)，并保持商业包源登录有效。门户是应用中的本地包，复用插件运行时，随应用一起构建和部署；开发自己的业务门户不需要先把它发布到 npm。

## 创建业务门户

可以使用 Agent 或命令生成门户，选择一种方式即可，然后完成安装验证。

### 使用 Agent 创建门户

在已有多门户应用的根目录打开 Agent。此时使用应用自带的开发指引：`AGENTS.md`、`.agents/rules/multi-portal.md`，以及项目内的应用开发和插件开发 Skills。创建整个应用的全局 `nocobase-create-app` Skill 不负责这一步，也不需要再创建一个应用。

```prompt
在当前应用里新增一个“库存管理”门户，名称用 inventory，先做好能进入的基础首页。
```

项目指引会引导 Agent 使用门户生成器，处理源码、依赖和 Client/Server 注册。完成后应能找到 `packages/app-portal-inventory/`，并在重启应用后从门户管理看到它。生成器默认不安装门户；管理员登录后按下方“安装并验证门户”操作。普通业务用户的入口和授权需要按[门户访问与权限](access.md)单独完成。

Agent 已生成门户时，跳过下面的生成命令，避免重复创建同名目录。

### 使用命令创建门户

在应用根目录执行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta inventory \
  --title 'Inventory management' --title-zh '库存管理'
```

`inventory` 是门户 ID，应以小写字母开头，只包含小写字母、数字和单个连字符分隔的片段，最长 40 个字符，例如 `inventory` 或 `quality-checks`。命令生成的包名为 `@nocobase/app-portal-inventory`。

| 参数 | 用途 |
| --- | --- |
| `--title` | 默认显示名称，本例为 `Inventory management` |
| `--title-zh` | 简体中文显示名称，本例为“库存管理” |
| `--dry-run --json` | 先查看生成计划，不写入文件 |

省略 `--title` 时，显示名称由 ID 生成；省略 `--title-zh` 时，简体中文沿用默认显示名称。

命令创建 `packages/app-portal-inventory/`，安装所需依赖，并把门户注册到应用的 Client 和 Server。它只生成最小门户，不创建库存业务表、样例记录或 CRUD 页面，也不会启动应用或修改数据库。

门户生成后仍是未安装状态。若命令报告安装依赖失败，保留已生成的源码，按输出的恢复命令处理；不要在已有目标目录上重新运行生成器。

### 安装并验证门户

生成完成后，启动或重启开发服务，让应用加载新注册的门户。使用管理员账号登录：

1. 打开 **系统设置 → 门户管理**。
2. 找到“库存管理”，此时状态应为未安装。
3. 点击 **安装**，等待数据库任务和门户启动完成。
4. 状态变为已安装后，进入门户，或回到管理员首页的工作台进入。

现在应看到库存管理的最小首页，刷新后仍可进入。这里还没有库存业务功能，接下来按下文扩展页面、服务和数据。安装失败时，按[管理门户](manage.md)检查失败阶段。

## 门户与应用各自负责什么

应用负责登录、用户权限、运行配置、数据库连接和部署，并提供侧边栏、账户菜单、页头等公共外壳。门户负责自己的业务入口、布局与导航、页面、语言资源、业务服务和数据定义。

`PortalLayoutHost` 由应用提供，门户通过 `PortalLayout` 把导航和页面内容交给这个外壳。添加一个门户菜单时，应修改门户的布局；只有需要改变所有门户共用的外壳时，才调整应用的 `client/layouts/portal-shell.tsx`。

## 找到需要修改的文件

以下是库存门户的主要文件，不是完整目录：

```text
packages/app-portal-inventory/
├── portal.ts
├── client/
│   ├── plugin.ts
│   ├── routes.ts
│   ├── layout.tsx
│   ├── pages/overview.tsx
│   └── locales/
├── server/
│   ├── plugin.ts
│   └── providers/portal.ts
└── database/main/
    ├── migrations/
    └── seeds/portal_inventory_installation.ts
```

`portal.ts` 声明门户标识和入口。生成的库存门户使用：

```ts
import type { PortalDescriptor } from '@nocobase/app-plugin-multi-portal/shared';

const portal: PortalDescriptor = {
  id: 'inventory',
  namespace: '@nocobase/app-portal-inventory',
  entry: '/portals/inventory',
  icon: 'LayoutGrid',
  tone: 1,
};

export default portal;
```

显示名称来自 `client/locales/` 中的 `title`，不是门户 ID。需要改名时优先改翻译，保留已经使用的 ID、包名和路由标识；安装记录和权限可能引用它们。入口不包含 `/main` 等部署基础路径。

## 添加页面与导航

继续使用 Agent 开发时，直接说明业务需求，例如：

```prompt
给库存管理门户加一个库存列表，记录商品、仓库和数量，支持新增、修改以及按商品名称搜索，先供管理员使用。
```

这类需求同时涉及页面、服务和数据。Agent 应按应用与门户的现有规范实现；下面的文件说明可用于理解和检查它的改动。完成后按文末的检查步骤验证实际操作。

修改首页时，从 `client/pages/overview.tsx` 开始；新增页面放在 `client/pages/`，通过 `client/routes.ts` 注册。生成的首页路由是：

```ts
{
  name: 'inventoryOverview',
  path: '/portals/inventory',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'title' },
  componentLoader: () => import('./pages/overview.js'),
}
```

新页面沿用 `/portals/inventory/...` 路径，并在 `client/layout.tsx` 的 `navigation` 中添加菜单。路由控制页面匹配与访问，导航控制入口展示，两者需要同时维护。页面默认导出组件，并使用门户的 Layout；用户可见文字放到门户自己的语言资源中。

UI 使用 shadcn/ui，优先复用包内已有组件和 NocoBase UI Library。具体写法见[页面与菜单](../../extension-development/pages-and-menus.md)和[国际化](../../extension-development/localization.md)。默认生成页面只允许管理员访问，面向普通用户时还需完成[门户访问与权限](access.md)。

## 添加服务与数据库资源

业务逻辑放在门户的 Server 服务中；HTTP 接口按插件的服务端路由机制注册。每个接口独立执行登录检查、业务授权和门户安装状态检查，不能仅依赖页面不可见。接口组织见[服务端 API](../../extension-development/server-apis.md)。

生成器已经在 `server/plugin.ts` 声明主连接：

```ts
database: {
  connections: {
    main: {},
  },
},
```

在 `database/main/migrations/` 添加业务表结构迁移，在 `database/main/seeds/` 添加必要的初始化数据。保留生成的安装 seed；不要用每次启动重新赋值的方式覆盖管理员选择的安装状态。

门户也支持多个连接。先在宿主应用配置连接和驱动，再在门户声明同名连接，例如增加 `analytics: {}`，并将对应资源放到 `database/analytics/migrations/` 与 `database/analytics/seeds/`。连接由应用持有，不在门户中另建一套配置。安装时会协调该门户所需连接的数据库任务，全部成功后才开放门户。

多个连接之间不是一个跨库原子事务；某个连接失败时，已经完成的迁移不会自动回滚。保留执行历史，修复失败原因后重试。迁移规则见[数据库与迁移](../../extension-development/database-and-migrations.md)，连接配置见[数据库连接](../../framework/database/connections.md)。

## 检查与交付

在应用根目录检查修改的门户，并构建应用验证集成：

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm build
```

检查首页和新增页面是否可进入，菜单与路由是否一致，并用管理员、授权业务用户和无权用户分别验证页面与接口。生成的最小包可能还没有业务测试，检查命令成功不等于业务行为已经覆盖。

本地门户随宿主应用交付。需要部署包时执行 `pnpm build --tar`，后续流程见[发布应用版本](../../deployment/publish-app-release.md)。门户安装、卸载及升级行为见[管理门户](manage.md)。
