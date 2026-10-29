---
title: 组件与样式
description: 组织插件组件，接入宿主的样式与主题，公开组件，并按需通过 UI Registry 分发源码资产。
---

开发应用和插件时，前端组件可以自由编写和组织，唯一的约束是**基础组件使用 shadcn**。构建模块化界面时，优先参考 [NocoBase UI Library](https://ui.nocobase.com/) 中的组件和区块。

NocoBase UI Library 是 NocoBase 提供的 UI 源码资产库，基于 shadcn UI Registry 分发组件和区块，供 Agent 按需取用、修改和组合。你可以在它的网站上查看组件示例和安装方式。

以后扩展的前端组件或区块，如果需要**作为源码资产发布，供 Agent 按需取用、修改和组合**，也通过 shadcn UI Registry 分发。是否发布取决于源码资产的交付需求：在插件内部复用组件，或者通过插件的公开入口导出组件，都不要求发布 Registry。

本篇沿用 [编写第一个插件](write-your-first-plugin.md) 中的公告栏：先编写列表组件并接入页面，再按需把它整理为独立的源码资产，通过本地路径安装到其他应用或插件中。需要跨机器分发时，再借助已有的静态站点。

## 使用 Agent

已经有公告栏插件时，可以这样描述需求：

```prompt
请把 announcements 插件的公告列表提取为独立组件。
基础组件使用 shadcn，优先参考 NocoBase UI Library（https://ui.nocobase.com/）中的组件和区块。
列表接收公告数据和空状态文案，页面保留请求、加载和错误处理。
保留现有路由、菜单和多语言，验证列表、空状态及插件构建。
```

下文说明手动实现的过程。**除非特别注明，命令都在 App 根目录执行。组件开发部分的文件路径相对于 `packages/app-plugin-announcements/`；源码资产部分会写明独立 Registry 包的路径。**

## 组件的组织方式

前提是已经有一个可以运行的公告栏插件，它的页面、接口、语言资源和注册方式见 [编写第一个插件](write-your-first-plugin.md)。本篇新增 `client/components/announcement-list.tsx`：

```tree
packages/app-plugin-announcements/
├── client/
│   ├── components/
│   │   ├── ui/                      # shadcn 基础组件
│   │   └── announcement-list.tsx    # 公告列表
│   ├── pages/
│   │   └── announcements.tsx        # 请求数据并组合组件
│   ├── locales/                     # 页面文案
│   └── styles.css                   # shadcn 样式配置入口
├── components.json                 # shadcn 配置
└── package.json                     # 依赖、别名和公开入口
```

这只是一种示例组织方式。你可以按业务增加目录、提取 Hooks，或调整组件拆分的粒度，只要保持导入路径和构建配置一致即可。

## 使用 shadcn 与 NocoBase UI Library

安装本例用到的 shadcn Card：

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add card
```

创建工具已经为带有客户端代码的插件生成了 `components.json`、样式入口和包内别名。命令在所选的插件中执行，因此组件会写入插件自己的 `client/components/ui/`。如果组件已经存在，先检查差异，保留业务上的修改。

需要页面容器、标题或其他业务组件时，先查看 [NocoBase UI Library](https://ui.nocobase.com/)。例如，第一个插件的教程中已经安装了：

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

已有这些文件时，无需重复安装。`components.json` 中的 `@nocobase` 对应 NocoBase UI Library 的源码分发地址；旧插件中缺少这一项时，把以下配置合并到现有的 `registries` 中：

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

安装后检查 `package.json`：客户端的运行时依赖，应按插件的约定声明为 `peerDependencies`，并保留合适的版本范围，然后运行 `pnpm install`。不要把服务端仍要直接使用的依赖一起移走。包内别名与发布映射见 [插件结构](plugin-structure.md#ui-组件与源码的归属)。

## 编写和使用组件

### 实现公告列表

新增 `client/components/announcement-list.tsx`：

```tsx
import type { ReactElement } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

export interface AnnouncementListItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}

export interface AnnouncementListProps {
  readonly items: readonly AnnouncementListItem[];
  readonly emptyMessage: string;
}

export function AnnouncementList({
  items,
  emptyMessage,
}: AnnouncementListProps): ReactElement {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul className='grid gap-4'>
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardHeader>
              <CardTitle><h2>{item.title}</h2></CardTitle>
            </CardHeader>
            <CardContent>
              <p className='whitespace-pre-wrap text-muted-foreground'>
                {item.content}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
```

这个组件只接收数据和文案，既方便页面组合，也方便以后作为源码资产单独安装。组件在这里自行声明所需的数据形状，避免依赖插件私有的 `shared/` 文件；页面仍然可以传入原有的 `Announcement[]`。

插件构建需要生成类型声明，所以示例显式声明了 Props 和返回类型。安装 Card 之后，还要检查 `client/components/ui/card.tsx`：为缺少返回类型的 `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardAction`、`CardContent` 和 `CardFooter` 函数补上 `: React.ReactElement`，保留原有的参数和实现；否则插件的 `isolatedDeclarations` 检查会报 `TS9007`。其他新安装的基础组件，同样需要满足插件生成声明的要求。

### 在页面中接入

在 `client/pages/announcements.tsx` 中加入：

```tsx
import { AnnouncementList } from '#components/announcement-list';
```

保留原页面中的 `useApiClient()`、`useTranslation()` 和请求逻辑，把页面的 `return` 替换为：

```tsx
return (
  <PageContainer>
    <PageHeader title={t('title')} />
    {failed ? (
      <p role='alert'>{t('error')}</p>
    ) : items === null ? (
      <p role='status'>{t('loading')}</p>
    ) : (
      <AnnouncementList items={items} emptyMessage={t('empty')} />
    )}
  </PageContainer>
);
```

本例中，页面负责请求、状态和翻译，列表负责展示。其他组件也可以根据业务直接使用客户端服务或 Hooks；插件服务的接入见 [客户端服务](client-services.md)，共用的容器机制见 [ServiceProvider 与服务生命周期](service-provider.md)。

## 样式与主题适配

### 区分组件生成配置与运行时样式

`components.json` 中的 `tailwind.css` 指向插件的 `client/styles.css`。脚手架中的这个文件是给 shadcn 生成组件用的，包含 Tailwind、动画和 shadcn 样式的导入，并注明主题变量由宿主应用提供。生成的 `client/index.ts` 只导出插件工厂，不会自动导入这个 CSS 文件。

默认应用在 `client/index.tsx` 中导入应用自己的 `client/styles.css`，由它加载主题、生成工具类。插件组件使用 `bg-card`、`text-muted-foreground` 等语义类，最终的样式由应用的客户端构建产生。插件的 TypeScript 构建只负责 JavaScript 和类型声明，不会单独生成一套完整的应用 CSS。

因此，在插件这份用于生成的 `styles.css` 中添加规则，并不代表页面已经加载了这些规则。也不要为了让某条规则生效，就把包含 Tailwind 入口的整份生成样式再导入一次应用。

### 让宿主构建扫描插件组件

默认模板通过应用样式中的 `@config "../tailwind.config.mjs"` 引用扫描配置。本文核对的 Core 基线 `7fb8311` 会解析 `@nocobase/app-plugin-*` 包的真实路径，同时扫描源码 `client/` 和发布产物 `dist/client/` 等目录，以适配 pnpm 的软链接和已编译的插件。

如果插件使用了自定义的 scope（例如 `@my-company`），需要在目标应用的扫描配置中显式纳入相应的包，保留原有的扫描项，并覆盖本地源码和安装包的编译目录。不能以为改了包名之后，仍会被默认的 `@nocobase` 扫描规则覆盖；也不能只凭一个跨软链接的通配路径，就判断扫描已经生效。

组件中的工具类要写成完整的静态字符串；需要不同的状态时，使用包含完整类名的映射，避免拼接出 `bg-${color}` 这类构建器无法直接发现的值。源码开发环境中显示正常之后，还要检查安装发布包的应用构建。

### 使用宿主主题并限制样式范围

沿用 `bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border` 等语义类，颜色、圆角和字体都从宿主主题取得。公告列表已经使用了 `text-muted-foreground`，不需要为它另外定义一套颜色。主题预设和明暗模式由应用管理，具体约定见 [主题与样式](../developing-apps/themes-and-styles.md)。

需要自定义 CSS 时，用插件专属的类名或属性限定组件的范围，不要对全局的 `body`、所有的 `button` 或 `:root` 编写覆盖规则。弹窗等 Portal 内容可能不在页面根节点之下，需要给实际的内容节点设置对应的限定类。不要通过重新初始化 shadcn，或者增加第二套主题 Provider 来改变宿主的外观。

自定义的运行时样式应作为单独的资源维护，并明确由插件的客户端模块还是应用的样式入口导入。对外分发时，需要同时处理 CSS 资源的复制、公开导出、包的文件清单以及构建工具的加载方式；`tsc` 不会自动复制 CSS。接入说明中要写清楚使用方需要导入什么，避免出现源码环境中能找到文件、发布包中却缺少样式的情况。如果只使用本篇的公告列表示例，不需要新增这类资源。

## 对外提供组件

组件只在插件内部使用时，不必新增包导出。需要让 App 通过包导入时，再为组件添加公开入口，并同步源码导出和 `publishConfig.exports` 中的构建映射，见 [插件声明与公开入口](plugin-declarations.md#公开导出)。仅仅导入组件，并不会自动注册插件的路由、语言资源或服务。

在组件的使用说明中，列出 Props、公开的类型、所需的样式和运行环境。如果组件依赖插件的服务或语言资源，要说明使用方必须注册哪个入口；对外的组件，其翻译应显式绑定插件的命名空间，见 [客户端多语言](localization.md)。上下文在插件中的接入示例见 [React Context 与 Provider](react-context-and-providers.md)，挂载机制见 [React Provider 的注册与挂载](../framework/runtime/react-providers.md)。

## 按需分发 UI 源码资产

如果希望 Agent 把这个列表取到目标项目中，调整布局、增加操作，或者与其他区块组合，可以通过 shadcn UI Registry 分发它。插件包和 Registry 资产可以同时提供：前者维护公开的运行时能力，后者交付可以编辑的源码。

**Registry 资产是一个独立的源码模块。** 本例在 App 的 `packages/` 下新增 `announcements-ui/`，与 `app-plugin-announcements/` 并列，使用自己的清单和构建配置。构建结果可以直接通过本地路径添加；需要通过 URL 分发时，再部署到静态站点。应用和插件通过安装资产获得源码，并在自己的项目中接入。一个 Registry 包可以提供多个插件或业务场景使用的资产。

### 使用 Agent 准备源码资产

```prompt
请将公告列表整理为可通过 shadcn UI Registry 分发的源码资产。
在 packages/announcements-ui/ 独立包中维护资产，与插件包并列。
资产不能通过相对路径或私有别名引用插件源码；插件能力通过公开入口或参数接入。
声明组件文件和依赖，说明如何传入数据、修改布局和接入公告接口。
先在另一个应用或插件中通过本地路径 Add 构建结果并验证。
无需搭建 Registry 网站；需要通过 URL 分发时，再发布到已有静态站点。
```

### 组织资产源码

在 App 根目录创建 Registry 包的源码目录：

```bash
mkdir -p packages/announcements-ui/registry/components
```

把上面的 [公告列表实现](#实现公告列表) 保存为 `packages/announcements-ui/registry/components/announcement-list.tsx`。它只接收数据和文案，已经具备独立分发的条件。相关的目录如下：

```tree
my-app/
├── packages/
│   ├── app-plugin-announcements/    # 插件包
│   │   ├── client/                 # 插件自身的前端实现
│   │   ├── server/                 # 插件服务端能力
│   │   └── package.json
│   └── announcements-ui/           # 独立的 UI Registry 包
│       ├── registry/
│       │   └── components/
│       │       └── announcement-list.tsx
│       ├── registry.json           # 分发清单
│       ├── package.json            # 独立构建工具和脚本
│       └── public/
│           └── r/                  # Registry JSON 构建产物
└── pnpm-workspace.yaml             # 工作区包配置
```

确认 App 根目录的 `pnpm-workspace.yaml` 包含 `packages/*`，并保留已有的配置。两个包共享同一个工作区，但 Registry 资产仍然不能用相对路径导入旁边插件包的内部文件。

新增 `packages/announcements-ui/package.json`：

```json
{
  "name": "announcements-ui",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "shadcn build registry.json --output public/r",
    "check": "pnpm build"
  },
  "devDependencies": {
    "shadcn": "4.18.0"
  }
}
```

本例固定使用已验证的构建工具版本。`check` 通过构建来检查清单和源文件，也让这个包参与 App 的工作区检查；组件的类型和渲染还需要在使用方验证。这个 `package.json` 管理的是 Registry 包自己的工具；安装资产时需要的 npm 包和其他 Registry 项，要在下面的资产清单中另行声明。Registry 包不需要注册到 App 的 Client、Server 或 CLI 插件列表中。

准备发布的源码，就维护在这个独立的包中。原插件自己 `client/` 中的组件，以及其他项目安装后得到的副本，都可以各自独立修改；需要采用资产的更新时，比较并合并改动，或者检查差异后重新安装。

### 声明资产与依赖

新增 `packages/announcements-ui/registry.json`：

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "announcements-ui",
  "homepage": "https://example.com",
  "items": [
    {
      "name": "announcement-list",
      "type": "registry:component",
      "title": "Announcement List",
      "description": "An editable announcement list with data and empty-state text supplied by its page.",
      "registryDependencies": ["card"],
      "files": [
        {
          "path": "registry/components/announcement-list.tsx",
          "type": "registry:component",
          "target": "client/components/announcement-list.tsx"
        }
      ],
      "docs": "Render AnnouncementList with items and emptyMessage. Keep data loading in the consuming page. This item does not register routes or install the announcements backend."
    }
  ]
}
```

本例的 `homepage` 是一个项目主页的占位值，可以换成已有的项目主页或仓库地址。当前的构建工具要求根清单填写这项元数据，但它并不决定资产的安装地址，也不要求在该地址上搭建 Registry 服务；本地添加时，直接读取构建出的 JSON。字段说明见 [shadcn Registry 清单](https://ui.shadcn.com/docs/registry/registry-json#homepage)。清单中的两个文件路径分别表示：

- `path`：发布方的资产源文件，相对于 Registry 包的根目录。本例读取 `packages/announcements-ui/registry/components/announcement-list.tsx`。
- `target`：安装到目标 App 或插件之后的文件位置。本例写入目标项目的 `client/components/announcement-list.tsx`。

因此，发布方的 `registry/` 目录结构和使用方的 `client/` 目录结构可以不同。`target` 描述的是安装位置，并不表示资产源码属于某个插件的 `client/` 模块。

`registryDependencies` 声明需要一起安装的其他 Registry 项，例如这里的 `card`；组件直接导入的 npm 包放进 `dependencies`，并声明兼容的版本。本例除了目标 NocoBase App 已有的 React 之外，没有直接使用其他 npm 包。多文件的区块可以使用 `registry:block`，并列出全部文件及其目标位置。字段说明见 [shadcn Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json)。

### 明确模块依赖边界

资产安装后会位于另一个 App 或插件中，因此其中的每一个导入，都必须在使用方那里成立：

- **不能通过相对路径访问插件的内部文件**，也不能用只在发布方存在的私有别名绕过这条边界；组件、Hooks、服务、类型和语言资源都是如此。
- 使用插件的能力时，通过插件声明的公开包入口导入，并在资产中声明兼容的依赖和注册前提；也可以由使用方的页面通过 Props、回调或适配器传入。
- 使用 shadcn 基础组件时，通过 `registryDependencies` 声明，并使用接收方能够解析的组件别名，例如本例的 `#components/ui/card`。
- 同一个资产内部一起分发的文件可以相互使用相对导入，但这些文件必须全部列入清单，并且安装后的相对位置仍然有效。

本例通过 Props 接收数据和文案，不导入公告栏插件的内部文件。安装这个列表资产并不需要公告栏的后端；但接入真实公告接口的页面，仍然需要对应的服务端插件。

### 构建源码资产

在 **App 根目录** 安装工作区依赖，并单独构建 Registry 包：

```bash
pnpm install
pnpm --filter announcements-ui build
```

过滤器按 `package.json` 中的名称选中 `announcements-ui` 包，在该包内执行构建脚本，把组件源码写入 `packages/announcements-ui/public/r/announcement-list.json`。它可以独立地构建和发布，不需要执行插件的构建。构建选项见 [shadcn CLI](https://ui.shadcn.com/docs/cli#build)。

本地开发时，直接把构建出的 JSON 文件交给 `shadcn add` 即可，不需要启动静态服务。安装时使用的是包含 `files[].content` 的单个资产文件，而不是源文件目录，也不是用于构建的 `registry.json`。

### 在目标项目中安装与修改

在当前的 **App 根目录** 中，可以直接把同一工作区的资产安装到 App：

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

要安装到**同一台机器上的另一个 App** 时，在目标 App 的根目录执行，并使用相对于该目录的路径。例如，两个 App 的目录并列，发布方的目录名为 `my-app`：

```bash
pnpm exec shadcn add ../my-app/packages/announcements-ui/public/r/announcement-list.json
```

如果要把源码放进目标 App 中的某个插件，使用插件过滤器，并提供资产文件的**绝对路径**，以免过滤器切换工作目录后相对路径失效。请替换为实际的包名和路径：

```bash
pnpm --filter @my-company/app-plugin-dashboard exec shadcn add \
  /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json
```

请按源码的归属选择安装位置。通过路径安装时，仍然会处理 `registryDependencies`；缺少的基础组件和 npm 依赖，可能需要联网获取。遇到已有的组件时，先检查差异，保留项目中的定制。安装后检查实际的文件、依赖和类型声明，再在目标页面中导入 `AnnouncementList`，传入数据和空状态的文案。命令对本地路径的支持见 [shadcn CLI](https://ui.shadcn.com/docs/cli#add)。

Agent 可以直接修改目标项目中的列表源码，例如把单列改成响应式网格，或者增加业务操作。源码安装到 App 后由 App 维护，安装到插件后由插件维护。升级插件包不会自动更新这份源码；采用 Registry 的新版本时，应比较差异，并保留项目中的定制。

### 按需发布到现有站点

需要让其他机器通过 URL 获取资产时，再把生成的 `packages/announcements-ui/public/r/` 中的内容部署到已有静态站点的 `/r/` 路径下，或者复用现有服务的静态资源托管。不需要为 Registry 开发一个独立的服务，只要确认资产 URL 返回的是包含 `files[].content` 的 JSON 即可，参见 [shadcn Registry 入门](https://ui.shadcn.com/docs/registry/getting-started)。

这一步是可选的。如果已经有可以访问的资产 URL，目标 App 可以把本地文件路径换成这个 URL，例如：

```bash
pnpm exec shadcn add https://example.com/r/announcement-list.json
```

### 给 Agent 写使用说明

把资产的接入方法写进插件维护的 Skill 中，具体的位置和同步方式见 [插件 Skill](write-plugin-skills.md)。说明应包括：资产的本地构建与路径获取方式，或已发布的 URL；适用的场景、输入、接入前提、可以修改的位置，以及验证方法。不需要先发布网站，例如可以为公告栏的 Skill 增加下面这段本地安装说明：

```markdown
## Compose an announcement list

Use the announcement-list source asset when the App needs an editable
announcement list. In the source App root, run
`pnpm --filter announcements-ui build`.

Locate packages/announcements-ui/public/r/announcement-list.json and resolve
its absolute path. From the receiving App root, run
`pnpm exec shadcn add /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json`.
To install into a plugin, run the same add command with
`pnpm --filter <plugin-package> exec shadcn add <absolute-item-path>`.
No Registry server is needed. If the asset is already published, its URL
can be used instead of the local file path.

Render AnnouncementList with items containing id, title and content,
and pass translated emptyMessage text. The component does not fetch data.
Keep loading and error handling in the page. To use the announcements API,
first install and register the backend plugin that provides it.

Edit the installed source to change the layout or add business interactions.
Verify populated and empty lists, loading and request failures, translations,
and the receiving project's type checks and build.
```

Skill 描述的应是实际可以获取的本地资产或已发布资产，以及已经实现的接口。Registry 的 `docs` 字段适合放简短的安装提示；完整的业务接入过程和组合示例，放在 Skill 或它引用的文档中。

## 测试与验证

先在原插件中验证组件：公告的标题和内容正确，列表为空时使用传入的文案；页面仍能正常处理加载、失败和语言切换。沿用现有的测试，并根据组件的拆分调整测试的位置，见 [测试与验证](testing-and-verification.md)。

在实际的应用中，检查浅色和深色模式、不同的主题、窄屏、键盘焦点和 Portal 内容，并确认插件没有改变其他页面的样式。使用自定义的 scope 或安装包时，核对宿主的扫描配置和构建后的 CSS；组件测试和类型检查都不能证明样式已经加载。

在 App 根目录运行插件的检查和应用的构建：

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm build
```

如果分发了源码资产，还要在目标项目中实际安装、渲染并构建：确认没有引用发布方的私有文件，所需的组件、依赖和样式都齐全，并且 Agent 能根据说明完成修改。对于支持安装到插件中的资产，也要验证插件的类型声明构建；Registry JSON 生成成功，只能说明分发文件已经生成。

插件包的发布流程见 [构建与发布](publish-plugin.md)。源码资产的分发可以单独安排，也可以与插件的版本配套发布，并在说明中记录两者的兼容关系。
