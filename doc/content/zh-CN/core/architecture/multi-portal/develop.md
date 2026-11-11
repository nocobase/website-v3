---
title: 开发业务门户
metaDescription: 在已有多门户应用中创建门户，安装并进入，再添加页面、导航和布局，完成开发验证。
---

## 准备多门户应用

准备一个已配置并能正常启动的[多门户应用](create-app.md)，保持商业包源登录有效，并使用具有 `unrestricted` 权限的管理员账号完成以下操作。

本例创建“门户 1”（`portal-1`）：先得到一个可进入的空门户，再添加一个示例列表页面。门户是应用中的本地包，随应用一起构建和部署，不需要先发布到 npm。页面开发沿用 shadcn/ui 组件约定，优先复用已有组件和 NocoBase UI Library。

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

## 添加页面与导航

### 新增页面与路由

下面给门户 1 新增一个 **Examples（示例列表）** 页面，展示三条静态记录：基础页面、导航入口和多语言文案。页面沿用门户布局，仅管理员可访问，不需要数据库或接口。

可以向 Agent 描述需求：

```prompt
给门户 1 添加一个“示例列表”页面和导航入口，展示基础页面、导航入口、多语言文案三条静态记录，每条包含名称和简短描述，供管理员查看。
```

手动实现时，在 `client/pages/examples.tsx` 默认导出页面组件，沿用现有的 `Layout`：

```tsx
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import Layout from '../layout.js';

const examples = ['page', 'navigation', 'localization'] as const;

export default function ExamplesPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-portal-portal-1');
  return (
    <Layout>
      <section className='p-6'>
        <h1 className='text-2xl font-semibold'>{t('examples.title')}</h1>
        <p className='mt-2 text-muted-foreground'>
          {t('examples.description')}
        </p>
        <ul className='mt-6 divide-y rounded-xl border'>
          {examples.map((id, index) => (
            <li key={id} className='flex gap-4 p-4'>
              <span
                className='text-sm text-muted-foreground'
                aria-hidden='true'
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className='min-w-0'>
                <h2 className='font-medium'>
                  {t(`examples.items.${id}.title`)}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t(`examples.items.${id}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
```

在门户的 `client/locales/en-US.ts` 的 `messages` 中添加以下 `examples` 字段，并在其他语言文件中补充对应翻译：

```ts
examples: {
  "title": "Examples",
  "description": "Static records for this portal page.",
  "items": {
    "page": {
      "title": "Basic page",
      "description": "A page rendered inside the portal layout."
    },
    "navigation": {
      "title": "Navigation entry",
      "description": "A sidebar link that opens a portal page."
    },
    "localization": {
      "title": "Localized text",
      "description": "Page labels loaded from the portal’s locale files."
    }
  }
},
```

向 `client/routes.ts` 的路由数组追加：

```ts
{
  name: 'portal1Examples',
  path: '/portals/portal-1/examples',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'examples.title' },
  componentLoader: () => import('./pages/examples.js'),
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
  path: `${portal.entry}/examples`,
  title: tPortal('examples.title'),
  icon: ChartNoAxesCombined,
}
```

此时点击 **Examples** 应显示三条示例记录，直接访问 `/main/portals/portal-1/examples` 并刷新也应正常；若应用基础路径不是 `/main`，使用实际路径。路由决定页面匹配与访问，导航提供入口，两处都需要维护。

![门户 1 中新增的 Examples 导航入口和示例列表页面](/assets/core/multi-portal/develop/examples.png)

## 调整门户布局

### 应用外壳与门户布局

前面的 Examples 页面使用 `Layout` 包裹内容。生成的 `client/layout.tsx` 再将门户信息、导航和页面内容交给 `PortalLayout`，由应用的共用外壳显示侧边栏、页头和账户菜单。

先根据要改的范围选择文件：

| 想调整什么 | 修改哪里 | 影响范围 |
| --- | --- | --- |
| Examples 列表的间距、列数或内容 | 门户的 `client/pages/examples.tsx` | 这个页面 |
| 门户的导航、多个页面共用的内容容器 | 门户的 `client/layout.tsx` | 使用此布局的门户页面 |
| 共用侧边栏、页头和账户菜单 | 应用的 `client/layouts/portal-shell.tsx` | 使用该外壳的所有门户 |

### 自定义门户的页面组织

例如，希望门户 1 的页面内容居中，并限制最大宽度。将门户 `client/layout.tsx` 的返回内容改为：

```tsx
return (
  <PortalLayout portal={portal} navigation={navigation}>
    <div className='mx-auto w-full max-w-5xl'>{children}</div>
  </PortalLayout>
);
```

`children` 是当前页面内容。修改后，Overview 和 Examples 都会使用这个居中容器；侧边栏和页头保持原样。只想调整 Examples 时，把容器放在 `examples.tsx` 中即可。

宽屏下，Examples 列表会居中显示，两侧留出空白；窗口变窄时，内容随可用宽度收缩。

![门户布局：Examples 页面内容居中并限制最大宽度](/assets/core/multi-portal/develop/layout.png)

如果某个门户需要顶部导航或完全不同的页面结构，需要在它的 `client/layout.tsx` 中实现独立布局。默认 `PortalLayout` 只有门户信息、导航和内容这三个输入，并不提供切换侧栏与顶部导航的配置项。独立布局仍应保留所需的账户、退出和门户切换入口，并沿用页面路由的认证与权限要求。相关用法见[页面与菜单](../../extension-development/pages-and-menus.md)。

## 添加服务与数据

当前 Examples 的三条记录直接写在前端代码和语言资源中，不会从数据库读取。只有需要保存、修改或共享记录时，才需要添加服务端接口和数据库资源。

例如，要把它扩展成“可新增并保存示例记录”的列表，可以按以下分工实现。下面是需要新增的文件示意，不是生成器已经提供的功能：

```text
packages/app-portal-portal-1/
├── client/pages/examples.tsx         # 调用接口，显示和提交记录
├── server/
│   ├── routes/examples.ts           # 查询、新增接口及访问校验
│   ├── services/examples.ts         # 业务规则和数据读写
│   └── providers/examples.ts        # 注册需要注入的业务服务
└── database/main/
    ├── migrations/<迁移文件>.ts      # 创建示例记录表
    └── seeds/<初始化文件>.ts         # 可选：初始化记录
```

1. **定义数据结构。** 在迁移中创建记录表，例如包含名称和描述。需要初始化记录时再添加 seed；不要修改生成的门户安装状态 seed。
2. **实现服务和接口。** 接口处理输入、登录、业务权限和门户安装状态检查，业务服务负责规则与数据读写。在 `server/plugin.ts` 中注册新增的路由贡献；需要依赖注入的服务通过 Provider 注册，并加入 `server/providers/index.ts`。
3. **让页面调用接口。** 将 Examples 的静态记录替换为接口返回的数据，补充加载、空列表、失败和保存反馈。
4. **验证保存结果。** 新增记录后刷新页面仍能看到它，并验证无权用户无法直接调用接口读取或修改数据。

门户的 `server/plugin.ts` 已声明使用主连接：

```ts
database: {
  connections: {
    main: {}, // 加载 database/main/migrations 和 database/main/seeds
  },
},
```

`main` 是宿主应用配置的连接名，`{}` 表示使用约定目录，不是新建一个数据库。数据库地址、凭据和驱动由应用配置。同一连接上的各门户应使用不会冲突的业务表名；使用同一个连接也不等于自动授予彼此数据访问权限。

接口与数据读写的具体实现见[服务端 API](../../extension-development/server-apis.md)和[数据库与迁移](../../extension-development/database-and-migrations.md)。需要额外连接时，先在应用中配置连接和驱动，再在门户中声明同名连接，详见[数据库连接](../../framework/database/connections.md)。安装时各连接的数据库任务都需要成功；多个连接之间不提供跨库原子事务，失败后保留执行历史并修复重试。

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
