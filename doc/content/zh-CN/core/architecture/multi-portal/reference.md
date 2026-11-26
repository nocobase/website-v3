---
title: 门户开发参考
metaDescription: 门户清单字段、生成命令参数、definePortalRoutes 与路由字段、PortalLayout 属性、共用组件与 Hook、接口以及门户接口的工具。
---

## 门户清单

门户信息写在门户包 `package.json` 的 `nocobase` 字段中，应用启动时会校验。

| 字段 | 说明 |
| --- | --- |
| `name` | 门户包名，如 `@nocobase/app-portal-inventory`。它是门户的 ID，也是翻译命名空间和授权范围 |
| `nocobase.title` | 名称，字符串或按语言的对象，如 `{ "en-US": "Inventory", "zh-CN": "库存" }`。不能为空 |
| `nocobase.description` | 说明，写法同上，可以为空 |
| `nocobase.portal.key` | 可选，门户地址 `/portals/<key>` 的最后一段。省略时使用包名去掉 scope 和 `app-portal-` 前缀后的部分 |
| `nocobase.portal.icon` | 图标，可选 `FlaskConical`、`ShieldAlert`、`Monitor`、`ClipboardCheck`、`Leaf`、`Package`、`Warehouse`、`Bot`、`LayoutGrid`、`ShoppingCart`、`Users`、`Boxes` |
| `nocobase.portal.tone` | 配色，1 到 5 的整数，对应主题的 `--chart-<tone>` |

- `key` 以小写字母开头，由小写字母、数字和单个连字符组成，最长 40 个字符，在应用内唯一。发布后保持不变，否则旧链接会失效；修改 `key` 不影响已有授权。
- 名称和说明按当前语言、英文的顺序回退；名称最后回退到包名。说明在当前语言和英文中都没有时，界面不显示说明。
- 门户管理、我的门户、切换器和角色页都读取这里的名称和说明。

## 生成命令参数

在应用根目录执行 `pnpm create @nocobase/portal@beta <name> [选项]`。`<name>` 决定包名 `@nocobase/app-portal-<name>`。

| 参数 | 说明 |
| --- | --- |
| `--title <locale=text>` | 名称，每种语言写一次。不写语言时视为英文。省略时根据 `<name>` 生成英文名称 |
| `--description <locale=text>` | 说明，写法同上，可以为空 |
| `--key <key>` | 门户地址的最后一段，规则同清单中的 `key` |
| `--icon <name>` | 图标，默认 `LayoutGrid` |
| `--tone <1-5>` | 配色，默认 `1` |
| `--dry-run --json` | 只预览生成结果，不写入文件；最终的清单字段在 `result.nocobase` 中 |
| `--no-install` | 只生成源码，不安装依赖，输出需要继续执行的命令 |

- 支持的语言：`en-US`、`zh-CN`、`zh-TW`、`ja-JP`、`de-DE`、`es-ES`、`fr-FR`、`pt-BR`、`vi-VN`、`id-ID`。
- 第一个 `=` 分隔语言和文字；英文文字中含有 `=` 时写成 `en-US=A=B`。
- 名称须为非空单行文字。同一参数重复设置同一语言、使用不支持的语言、`key` 已被占用或参数不合法时，命令在写入文件前报错。
- 生成器不会覆盖已有目录，也不会启动服务或修改数据库。

## definePortalRoutes

在 `client/routes.ts` 中调用，返回值作为门户 Client 插件的 `routes`：

| 参数 | 说明 |
| --- | --- |
| `manifest` | 门户的 `package.json` |
| `layout` | 布局组件的懒加载，如 `() => import('./layout.js')`；省略时使用插件的默认 `PortalLayout` |
| `routes` | 门户的页面路由，字段见下表 |

它生成门户的根路由 `/portals/<key>`：需要登录，不使用应用的布局，检查门户访问，并且至少有一个页面能打开；首页显示在门户地址上，其他页面作为子路由，并检查页面授权或 **所有页面** 授权。服务端注册门户时不需要页面路由。

### 路由字段

| 字段 | 说明 |
| --- | --- |
| `name` | 页面名，在门户内唯一，只能包含字母、数字、`.`、`_`、`-`。`portal` 为保留名。也是默认的授权键 |
| `path` | 相对路径。顶层页面相对门户地址，子页面相对父页面。`''` 是门户首页，只能有一个，且不能有子页面 |
| `componentLoader` | 页面组件的懒加载，模块默认导出组件 |
| `navigation` | `{ title, icon? }`，页面进入门户菜单。`title` 是翻译键，`icon` 是 `lucide-react` 图标组件 |
| `breadcrumb.title` | 标题的翻译键，显示在门户头部；没有 `navigation.title` 时也用作权限配置中的名称 |
| `group` | 授权键。使用同一个 `group` 的页面共用一个授权项 |
| `access: 'own'` | 子页面使用自己的授权项；省略时跟随父页面 |
| `authz: 'skip'` | 不检查页面授权，能进入门户就能打开；该页面不出现在权限配置中 |
| `children` | 子页面数组 |

- `name`、`path`、`componentLoader`、`navigation`、`breadcrumb`、`children` 与 `defineAppRoutes` 一致；门户页面不写 `auth`，也不写 `authz: { resource, action }` 形式的页面授权。
- 路径不能以 `/` 开头，不能包含 `..`、`?query`、`#` 或 `*`；页面不能声明 `parent` 或 `layout`。
- 参数加 `?` 表示可选，如 `stock/:warehouse?` 同时注册 `stock/:warehouse` 和 `stock`。多个可选参数只传一个值时，绑定到最左边的参数。
- 子页面除了自己的授权，还要满足所有上级页面的授权。
- 门户发布后，修改 `name` 或 `group` 会让已有授权失效；`module` 已不再推荐，改用同值的 `group` 可以保留原有授权。

## PortalLayout 属性

从 `@nocobase/app-plugin-multi-portal/client/layout` 导入。

| 属性 | 说明 |
| --- | --- |
| `logo` | 门户的 Logo，显示在侧栏顶部，没有侧栏时显示在头部 |
| `navigation` | 菜单位置：省略时为侧栏（桌面端可收起，手机上为抽屉），`'top'` 为头部横向导航。菜单由路由的 `navigation` 生成 |
| `sidebar` | 自定义侧栏菜单项 `{ path, title, icon?, end? }`，替换由路由生成的菜单 |
| `topNav` | 自定义头部横向导航，菜单项写法同 `sidebar` |
| `switcher` | 门户切换器，通常为 `<PortalSwitcher />` |
| `headerActions` | 应用的头部按钮：省略时全部显示，`{ include: [...] }`、`{ exclude: [...] }` 或 `false` |
| `userMenu` | 头像菜单，默认为 `PortalUserMenu`；可以传自己的节点，或 `false` 不显示 |
| `children` | 内容区，默认显示当前页面；包装所有页面时在其中使用 `<PortalOutlet />` |

自定义菜单项中，`path` 是完整的门户路径，不含应用基础路径；`title` 是已翻译的文字；`icon` 是 `lucide-react` 图标组件；`end` 表示只在地址完全一致时高亮。成员无权打开的页面，菜单项自动隐藏。

## 共用组件与 Hook

以下内容都从 `@nocobase/app-plugin-multi-portal/client/layout` 导入：

| 名称 | 说明 |
| --- | --- |
| `usePortal()` | 当前门户、它的页面和成员已获得的授权 |
| `usePortalText(portal)` | 门户在当前语言下的名称和说明 |
| `useMyPortals()` | 返回 `{ portals, status, retry }`。`status` 为 `loading`、`ready`、`denied` 或 `error`；只有可以重试时才有 `retry`；每个门户带有 `href` 和 `isCurrent` |
| `PortalOutlet` | 当前页面，用于在 `children` 中包装内容区 |
| `PortalSwitcher` | 门户切换器 |
| `PortalUserMenu` | 头像菜单：头像、语言切换、个人设置、退出登录 |
| `PortalHeaderActions` | 应用的头部按钮，可单独用于自己组合的头部 |
| `MyPortals` | 完整的我的门户页面，包含加载、空、无权限和出错状态 |
| `PortalCard`、`PortalIcon` | 门户卡片和门户图标 |

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /api/portalCenter/myPortals` | 当前成员可以进入的门户列表（`portalsListMyPortals`）。每项的 `entry` 是门户地址，`href` 是成员可进入的页面 |
| `portalCenter` 管理接口 | 门户管理使用，需要用户会话和对应的查看、安装、卸载权限。具体请求格式以应用的 API 文档为准 |

| `/api/portals/<key>/…` | 门户自己的接口，由 `definePortalApiRoutes` 定义。依次检查登录（`401`，`PORTAL_AUTHENTICATION_REQUIRED`）、门户已安装（`404`，`PORTAL_NOT_AVAILABLE`）和门户访问权限（`403`，`PORTAL_ACCESS_DENIED`）；门户未定义的路径返回 `404`，`ROUTE_NOT_FOUND` |

### 门户接口的工具

| 名称 | 导入自 | 说明 |
| --- | --- | --- |
| `definePortalApiRoutes({ manifest, createRouter })` | `server/http` | 定义门户接口，返回值加入服务端插件的 `routes`。`createRouter` 返回 `Hono<PortalApiEnv>`，路径相对 `/api/portals/<key>`；处理函数中 `c.var.portal` 为当前门户 |
| `placeActions(manifest, resources)` | `portalCenterServiceToken` 解析出的服务 | 把业务资源放进角色的 **多门户** 页签 |
| `placePortalActions(manifest, resources)` | `client/routes` | 前端对应的放置，加入 Client 插件的 `serviceProviders` |
| `usePortalApi(manifest?)` | `client/layout` | 返回 `request`、`stream` 和 `portalQueryKey(...parts)`，路径相对 `/api/portals/<key>`；不支持 `repository()` |
| `isPortalAccessFailure(error)` | `client/layout` | 判断错误是否为分发入口的拒绝 |
| `requirePortalAccess(context, portalId)` | `portalCenterServiceToken` 解析出的服务 | 供 `/api/portals/<key>` 以外、只服务某个门户的接口检查门户访问和安装状态 |

- 导入路径均以 `@nocobase/app-plugin-multi-portal/` 开头。
- `operationId` 以门户 key 的驼峰形式开头；门户自定义错误使用 `domain` `portalCenter` 和不冲突的原因码。
- 写法见[定义门户接口](develop.md#定义门户接口)和[在页面中调用接口](develop.md#在页面中调用接口)。
