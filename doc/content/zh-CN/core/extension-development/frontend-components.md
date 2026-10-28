---
title: 前端组件
description: 使用 shadcn 和 NocoBase UI Library 编写插件前端组件，接入页面，并按需通过 UI Registry 分发源码资产。
---

开发应用和插件时，前端组件可以自由编写和组织，唯一约束是**基础组件使用 shadcn**。构建模块化界面时，优先参考 [NocoBase UI Library](https://ui.nocobase.com/) 中的组件和区块。

NocoBase UI Library 是 NocoBase 提供的 UI 源码资产库，基于 shadcn UI Registry 分发组件和区块，供 Agent 按需取用、修改和组合。可以在其网站查看组件示例和安装方式。

后续扩展的前端组件或区块，如果需要**作为源码资产发布，供 Agent 按需取用、修改和组合**，则通过 shadcn UI Registry 分发。是否发布取决于源码资产的交付需求；在插件内部复用组件，或通过插件的公开入口导出组件，都不要求发布 Registry。

本篇沿用[编写第一个插件](write-your-first-plugin.md)的公告栏，先编写列表组件并接入页面，再按需将它整理为独立的源码资产，通过本地路径安装到其他应用或插件。需要跨机器分发时，再使用已有静态站点。

## 使用 Agent

已有公告栏插件时，可以这样描述需求：

```prompt
请把 announcements 插件的公告列表提取为独立组件。
基础组件使用 shadcn，优先参考 NocoBase UI Library（https://ui.nocobase.com/）中的组件和区块。
列表接收公告数据和空状态文案，页面保留请求、加载和错误处理。
保留现有路由、菜单和多语言，验证列表、空状态及插件构建。
```

下面说明手动实现的过程。**除特别注明外，命令在 App 根目录执行。“编写和组织组件”一节的文件路径相对于 `packages/app-plugin-announcements/`；源码资产部分会写明独立 Registry 包的路径。**

## 编写和组织组件

### 准备目录与基础组件

前提是已有可以运行的公告栏插件。其页面、接口、语言资源和注册方式见[编写第一个插件](write-your-first-plugin.md)。本篇新增 `client/components/announcement-list.tsx`：

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

这是一种示例组织方式。可以按业务增加目录、提取 Hooks 或调整组件拆分粒度，保持导入路径和构建配置一致即可。

安装本例使用的 shadcn Card：

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add card
```

创建工具已为带客户端代码的插件生成 `components.json`、样式入口和包内别名。命令在所选插件中执行，因此组件写入插件自己的 `client/components/ui/`。已有组件时先检查差异，保留业务修改。

需要页面容器、标题或其他业务组件时，先查看 [NocoBase UI Library](https://ui.nocobase.com/)。例如，第一个插件教程已安装：

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

已有这些文件时无需重复安装。`components.json` 中的 `@nocobase` 对应 NocoBase UI Library 的源码分发地址；旧插件缺少时，将以下配置合并到现有 `registries` 中：

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

安装后检查 `package.json`：客户端运行时依赖应按插件约定声明为 `peerDependencies`，保留合适的版本范围，再运行 `pnpm install`。不要把服务端仍需直接使用的依赖一起移走。包内别名与发布映射见[插件的结构](plugin-structure.md#ui-组件与源码归属)。

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

这个组件只接收数据和文案，方便页面组合，也方便后续作为源码资产单独安装。这里声明组件所需的数据形状，避免它依赖插件私有的 `shared/` 文件；页面仍可传入原有的 `Announcement[]`。

插件构建需要生成类型声明，因此示例显式声明了 Props 和返回类型。安装 Card 后，也检查 `client/components/ui/card.tsx`：为缺少返回类型的 `Card`、`CardHeader`、`CardTitle`、`CardDescription`、`CardAction`、`CardContent` 和 `CardFooter` 函数补上 `: React.ReactElement`，保留原来的参数与实现。否则插件的 `isolatedDeclarations` 检查会报 `TS9007`。其他新安装的基础组件同样需要满足插件的声明生成要求。

### 在页面中接入

在 `client/pages/announcements.tsx` 中加入：

```tsx
import { AnnouncementList } from '#components/announcement-list';
```

保留原页面的 `useApiClient()`、`useTranslation()` 和请求逻辑，将页面的 `return` 替换为：

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

本例由页面负责请求、状态和翻译，列表负责展示。其他组件也可以根据业务直接使用客户端服务或 Hooks；前后端服务的注册与依赖注入见 [ServiceProvider](service-provider.md)。

组件在插件内部使用时，不必新增包导出。需要让 App 通过包导入时，再为组件添加公开入口，并同步源码导出与 `publishConfig.exports` 的构建映射，见[插件的结构](plugin-structure.md#packagejson包信息依赖与公开导出)。仅导入组件不会自动注册插件的路由、语言资源或服务。

## 按需分发 UI 源码资产

如果希望 Agent 把这个列表取到目标项目中，调整布局、增加操作或与其他区块组合，可以通过 shadcn UI Registry 分发它。插件包和 Registry 资产可以同时提供：前者维护公开运行时能力，后者交付可编辑源码。

**Registry 资产是独立的源码模块。** 本例在 App 的 `packages/` 下新增 `announcements-ui/`，与 `app-plugin-announcements/` 并列，使用自己的清单和构建配置。构建结果可以直接通过本地路径 Add，需要 URL 分发时再部署到静态站点。应用和插件通过安装资产获得源码，并在自己的项目中接入。一个 Registry 包可以提供多个插件或业务场景使用的资产。

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

将上面的[公告列表实现](#实现公告列表)保存为 `packages/announcements-ui/registry/components/announcement-list.tsx`。它接收数据和文案，已经具备独立分发的条件。相关目录如下：

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

确认 App 根目录的 `pnpm-workspace.yaml` 包含 `packages/*`，保留已有配置。两个包共享工作区，但 Registry 资产仍不能相对导入旁边插件包的内部文件。

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

本例固定已验证的构建工具版本。`check` 通过构建检查清单与源文件，也让该包参与 App 的工作区检查；组件类型与渲染还需在使用方验证。这个 `package.json` 管理 Registry 包的工具；安装资产时需要的 npm 包和其他 Registry 项，要在下面的资产清单中另行声明。Registry 包不需要注册到 App 的 Client、Server 或 CLI 插件列表。

准备发布的源码维护在这个独立包中。原插件自己的 `client/` 组件和其他项目安装后的副本都可以独立修改；需要采用资产更新时，比较并合并改动，或检查差异后重新安装。

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

本例的 `homepage` 是项目主页的占位值，可换成已有项目主页或仓库地址。当前构建工具要求根清单填写这一元数据，但它不决定资产的安装地址，也不要求在该地址搭建 Registry 服务；本地 Add 直接读取构建出的 JSON。字段说明见 [shadcn Registry 清单](https://ui.shadcn.com/docs/registry/registry-json#homepage)。清单中的两个文件路径分别表示：

- `path`：发布方的资产源文件，相对于 Registry 包的根目录。本例读取 `packages/announcements-ui/registry/components/announcement-list.tsx`。
- `target`：安装到目标 App 或插件后的文件位置。本例写入目标项目的 `client/components/announcement-list.tsx`。

因此，发布方的 `registry/` 目录结构与使用方的 `client/` 目录结构可以不同。`target` 描述安装位置，并不表示资产源码属于某个插件的 `client/` 模块。

`registryDependencies` 声明需要安装的其他 Registry 项，例如这里的 `card`；组件直接导入的 npm 包放入 `dependencies` 并声明兼容版本。本例除目标 NocoBase App 已有的 React 外，没有直接使用其他 npm 包。多文件区块可以使用 `registry:block`，列出全部文件及目标位置。字段说明见 [shadcn Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json)。

### 明确模块依赖边界

资产安装后会位于另一个 App 或插件中，因此每个导入都必须在使用方成立：

- **不能通过相对路径访问插件的内部文件**，也不能用只在发布方存在的私有别名绕过这一边界；组件、Hooks、服务、类型和语言资源都适用。
- 使用插件能力时，通过插件声明的公开包入口导入，并在资产中声明兼容依赖和注册前提；也可以由使用方页面通过 Props、回调或适配器传入。
- 使用 shadcn 基础组件时，通过 `registryDependencies` 声明，并使用接收方可解析的组件别名，例如本例的 `#components/ui/card`。
- 同一资产内部一起分发的文件可以使用相对导入，但文件必须全部列入清单，安装后的相对位置也必须保持有效。

本例通过 Props 接收数据和文案，不导入公告栏插件的内部文件。安装列表资产不需要公告栏后端；接入真实公告接口的页面仍需要对应的服务端插件。

### 构建源码资产

在 **App 根目录**安装工作区依赖，并单独构建 Registry 包：

```bash
pnpm install
pnpm --filter announcements-ui build
```

过滤器按 `package.json` 中的名称选择 `announcements-ui` 包，在该包内执行构建脚本，将组件源码写入 `packages/announcements-ui/public/r/announcement-list.json`。它可以独立构建和发布，不需要执行插件的构建。构建选项见 [shadcn CLI](https://ui.shadcn.com/docs/cli#build)。

本地开发时，直接把构建出的 JSON 文件交给 `shadcn add`，无需启动静态服务。安装的是包含 `files[].content` 的单个资产文件，不是源文件目录或用于构建的 `registry.json`。

### 在目标项目中安装与修改

在当前 **App 根目录**，可以直接将同一工作区的资产安装到 App：

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

安装到**同一台机器上的另一个 App** 时，在目标 App 根目录执行，使用相对于该目录的路径。例如两个 App 目录并列、发布方目录名为 `my-app`：

```bash
pnpm exec shadcn add ../my-app/packages/announcements-ui/public/r/announcement-list.json
```

若要把源码放进目标 App 的某个插件，则使用插件过滤器，并提供资产文件的**绝对路径**，避免过滤器切换工作目录后相对路径发生变化。替换实际包名和路径：

```bash
pnpm --filter @my-company/app-plugin-dashboard exec shadcn add \
  /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json
```

按源码归属选择安装位置。路径安装仍会处理 `registryDependencies`；缺少的基础组件和 npm 依赖可能需要联网获取。遇到已有组件时先检查差异，保留项目中的定制。安装后检查实际文件、依赖和类型声明，再在目标页面导入 `AnnouncementList`，传入数据与空状态文案。命令的本地路径支持见 [shadcn CLI](https://ui.shadcn.com/docs/cli#add)。

Agent 可以直接修改目标项目里的列表源码，例如把单列改为响应式网格，或增加业务操作。源码安装到 App 后由 App 维护，安装到插件后由插件维护。升级插件包不会自动更新这份源码；采用 Registry 新版时，应比较差异并保留项目中的定制。

### 按需发布到现有站点

需要让其他机器通过 URL 获取资产时，再把生成的 `packages/announcements-ui/public/r/` 内容部署到已有静态站点的 `/r/` 路径，或复用现有服务的静态资源托管。无需为 Registry 开发独立服务；确认资产 URL 返回包含 `files[].content` 的 JSON 即可，参见 [shadcn Registry 入门](https://ui.shadcn.com/docs/registry/getting-started)。

这一步可选。若已有可访问的资产 URL，目标 App 可将本地文件路径换成该 URL，例如：

```bash
pnpm exec shadcn add https://example.com/r/announcement-list.json
```

### 给 Agent 写使用说明

将资产接入方法写入插件维护的 Skill，具体位置和同步方式见[给插件写技能](write-plugin-skills.md)。说明应包含资产的本地构建与路径获取方式，或已发布的 URL，以及适用场景、输入、接入前提、可修改的位置及验证方法。无需先发布网站，例如为公告栏 Skill 增加以下本地安装说明：

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

Skill 描述实际可获取的本地资产或已发布资产，以及已实现的接口。Registry 的 `docs` 字段适合简短的安装提示；完整的业务接入过程和组合示例放在 Skill 或其引用文档中。

## 测试与验证

先在原插件中验证组件：公告标题和内容正确，空列表使用传入文案；页面仍能处理加载、失败和语言切换。沿用现有测试，并根据组件拆分调整测试位置，见[测试与验证](testing-and-verification.md)。

在 App 根目录运行插件检查与应用构建：

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm build
```

如果分发了源码资产，还要在目标项目中实际安装、渲染并构建：确认没有引用发布方的私有文件，所需组件与依赖齐全，Agent 可以根据说明完成修改。支持安装到插件的资产，也要验证插件的类型声明构建；Registry JSON 生成成功，只说明分发文件已生成。

插件包的发布流程见[发布插件](publish-plugin.md)。源码资产的分发可以独立安排，也可以与插件版本配套发布，并在说明中记录兼容关系。
