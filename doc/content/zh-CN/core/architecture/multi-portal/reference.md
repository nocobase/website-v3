---
title: 门户开发参考
metaDescription: 门户清单与生成命令参数，多门户插件各导入入口的 API，HTTP 接口和错误码。
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

## client/routes

从 `@nocobase/app-plugin-multi-portal/client/routes` 导入。

| 名称 | 说明 |
| --- | --- |
| `definePortalRoutes({ manifest, layout?, routes })` | 声明门户的页面，返回值作为门户 Client 插件的 `routes`。参数和路由字段见下文 |
| `placePortalActions(manifest, resources)` | 把业务资源放进角色的 **多门户** 页签，加入 Client 插件的 `serviceProviders`；服务端对应 `placeActions` |

### definePortalRoutes

| 参数 | 说明 |
| --- | --- |
| `manifest` | 门户的 `package.json` |
| `layout` | 布局组件的懒加载，如 `() => import('./layout.js')`；省略时使用插件的默认 `PortalLayout` |
| `routes` | 门户的页面路由 |

生成的根路由为 `/portals/<key>`，页面作为它的子路由。进入门户和打开页面的条件见[页面授权](develop.md#页面授权)。

### 路由字段

| 字段 | 说明 |
| --- | --- |
| `name` | 页面名，在门户内唯一，只能包含字母、数字、`.`、`_`、`-`。`portal` 为保留名。也是默认的授权键 |
| `path` | 相对路径。顶层页面相对门户地址，子页面相对父页面。`''` 是门户首页，只能有一个，且不能有子页面 |
| `componentLoader` | 页面组件的懒加载，模块默认导出组件 |
| `navigation` | `{ title, icon?, order? }`，页面进入门户菜单。`title` 是翻译键，`icon` 是 `lucide-react` 图标组件，`order` 决定同级页面的顺序。门户页面不会出现在应用的菜单中 |
| `breadcrumb.title` | 标题的翻译键，显示在门户头部；没有 `navigation.title` 时也用作权限配置中的名称 |
| `group` | 授权键。使用同一个 `group` 的页面共用一个授权项 |
| `access: 'own'` | 子页面使用自己的授权项；省略时跟随父页面 |
| `authz` | 替换这个页面的默认授权检查，该页面不出现在权限配置中。`'skip'` 表示能进入门户就能打开 |
| `presentation` | 页面的显示方式，与 `defineAppRoutes` 一致 |
| `children` | 子页面数组 |

- `name`、`path`、`componentLoader`、`navigation`、`breadcrumb`、`presentation`、`children` 与 `defineAppRoutes` 一致。门户页面都要求登录，不能声明 `auth`。
- 路径不能以 `/` 开头，不能包含 `..`、`?query`、`#` 或 `*`；页面不能声明 `parent`、`layout` 或 `auth`。
- 菜单链接使用不带参数的地址：`stock/:warehouse?` 的菜单项打开 `stock`。
- 参数加 `?` 表示可选，如 `stock/:warehouse?` 同时注册 `stock/:warehouse` 和 `stock`。多个可选参数只传一个值时，绑定到最左边的参数。
- 子页面除了自己的授权，还要满足所有上级页面的授权。
- 门户发布后，修改 `name` 或 `group` 会让已有授权失效；`module` 已不再推荐，改用同值的 `group` 可以保留原有授权。

## client/layout

从 `@nocobase/app-plugin-multi-portal/client/layout` 导入。

### PortalLayout 属性

| 属性 | 说明 |
| --- | --- |
| `logo` | 门户的 Logo，显示在侧栏顶部，没有侧栏时显示在头部 |
| `navigation` | 菜单位置：`'sidebar'`（默认）为侧栏，桌面端可收起，手机上为抽屉；`'top'` 为头部横向导航。菜单由路由的 `navigation` 生成 |
| `sidebar` | 自定义侧栏菜单项 `{ path, title, icon?, end? }`，替换由路由生成的菜单 |
| `topNav` | 自定义头部横向导航，菜单项写法同 `sidebar` |
| `switcher` | 门户切换器，通常为 `<PortalSwitcher />` |
| `headerActions` | 应用的头部按钮：省略时全部显示，`{ include: [...] }`、`{ exclude: [...] }` 或 `false` |
| `userMenu` | 头像菜单，默认为 `PortalUserMenu`；可以传自己的节点，或 `false` 不显示 |
| `children` | 内容区，默认显示当前页面；包装所有页面时在其中使用 `<PortalOutlet />` |

自定义菜单项中，`path` 是完整的门户路径，不含应用基础路径；`title` 是已翻译的文字；`icon` 是 `lucide-react` 图标组件；`end` 表示只在地址完全一致时高亮。成员无权打开的页面，菜单项自动隐藏。

### 组件

| 名称 | 说明 |
| --- | --- |
| `PortalLayout` | 门户布局，属性见上表 |
| `PortalOutlet` | 当前页面，在 `PortalLayout` 的 `children` 中包装内容区时使用 |
| `PortalSwitcher` | 门户切换器：列出成员的门户，标出当前门户，提供 **返回我的门户** |
| `PortalUserMenu` | 头像菜单：头像、语言切换、个人设置、退出登录 |
| `PortalHeaderActions` | 应用的头部按钮，按页面权限过滤 |
| `MyPortals` | 我的门户页面，包含加载、空、无权限和出错状态 |
| `PortalCard`、`PortalIcon` | 门户卡片和门户图标 |

### Hook 与函数

| 名称 | 说明 |
| --- | --- |
| `usePortal()` | 当前门户、它的页面和成员已获得的授权 |
| `usePortalText(portal)` | 门户在当前语言下的名称和说明 |
| `useMyPortals()` | `{ portals, status, retry }`：成员至少能打开一个页面的门户。`status` 为 `loading`、`ready`、`denied` 或 `error`；`retry` 只在重试可能成功时提供；每个门户带有 `isCurrent` 和 `href`（能打开首页时为首页，否则为第一个不带参数的页面） |
| `usePortalApi(manifest?)` | 门户接口客户端，提供 `request`、`stream` 和 `portalQueryKey(...parts)`，路径相对 `/api/portals/<key>`。门户外使用时传入门户的 `package.json`。不支持 `repository()` |
| `isPortalAccessFailure(error)` | 错误是否为门户接口入口检查的拒绝 |
| `portalAccessFailureKind(error)` | 拒绝的类型：登录过期、无门户访问或门户未安装 |

`portalQueryKey(...parts)` 返回 `['portal', <key>, <用户 ID>, ...parts]`。用法见[在页面中调用接口](develop.md#在页面中调用接口)。

## shared、server、server/http

导入路径均以 `@nocobase/app-plugin-multi-portal/` 开头。

| 名称 | 导入自 | 说明 |
| --- | --- | --- |
| `portalFromPackage(manifest)` | `shared` | 校验门户的 `package.json`，返回门户描述，供注册门户和 seed 使用 |
| `portalCenterServiceToken` | `server` | 多门户服务的令牌，用 `app.container.resolve()` 取得服务，方法见下表 |
| `seedPortalInstallation(context, manifest, false)` | `server` | 在门户的初始化 seed 中写入安装状态记录 |
| `definePortalApiRoutes({ manifest, createRouter })` | `server/http` | 定义门户接口，返回值加入服务端插件的 `routes`。路径和命名规则见[定义门户接口](develop.md#定义门户接口) |
| `PortalApiEnv` | `server/http` | 门户接口的 Hono 环境类型。处理函数中 `c.var.portal` 是当前门户，`c.var.authz` 用于检查业务权限 |

### 多门户服务的方法

| 方法 | 说明 |
| --- | --- |
| `register({ ...portal, defaultInstalled, dependencies? })` | 注册门户。`portal` 为 `portalFromPackage(manifest)` 的结果；`dependencies` 为必须先安装的门户包名。在服务提供者的 `register()` 中调用 |
| `placeActions(manifest, resources)` | 把业务资源 `[{ type, id }]` 放进角色的 **多门户** 页签。在服务提供者的 `boot()` 中调用 |
| `requirePortalAccess(context, portalId)` | 检查门户访问和安装状态，供 `/api/portals/<key>` 以外、只为某个门户服务的接口使用 |
| `registerPolicy(policy)` | 注册宿主门户策略，返回值见下表。供托管或集成多门户的应用使用 |
| `ensureInstalled(portalId)` | 在服务端安装门户；已安装时直接返回。失败时查看返回的 `status` 和 `errorStep`，修复后再次调用会从执行历史继续 |
| `setEnabled` | 在服务端启用或停用门户，与 `accessState` 接口作用相同 |

宿主门户策略的返回值：

| 字段 | 说明 |
| --- | --- |
| `entitled` | 门户是否出现在门户管理和角色、API 密钥的选项中，成员能否访问。为 `false` 时门户访问关闭，已有授权记录保留 |
| `canInstall` | 能否新安装门户，默认同 `entitled` |
| `canManage` | 能否在界面上安装、启用或停用门户、修改门户设置，默认同 `entitled` |

没有注册策略时，门户管理和安装的行为不变。宿主集成的完整说明见多门户插件附带的集成文档（`docs/integration.md`）。

## HTTP 接口

### 门户接口

`/api/portals/<key>/…` 是门户自己的接口，由 `definePortalApiRoutes` 定义。请求到达门户接口前依次检查：已登录、门户已安装、有门户访问权限、门户已启用并且宿主策略允许访问，不满足时返回的错误见[错误码](#错误码)。页面授权不参与检查。

`/api/portals` 由多门户专用，其他插件不能在它下面注册接口。

### 多门户的接口

| 接口 | 说明 |
| --- | --- |
| `GET /api/portalCenter/myPortals` | 已安装、已启用，并且当前成员开启了门户访问的门户（`portalsListMyPortals`）。不按页面过滤，也不返回 `href`；面向成员的列表使用 `useMyPortals()` |
| `PUT /api/portalCenter/portals/{id}/accessState` | 启用或停用门户，请求体为 `{ enabled, revision }`，并带 `Idempotency-Key`。需要门户管理的安装权限，记录操作人 |
| 其他管理接口 | 门户管理使用，需要对应的查看、安装、卸载权限。请求格式以应用的 API 文档为准 |

`{id}` 为门户包名，用 `encodeURIComponent` 编码。管理接口需要用户会话，不能用 API 密钥调用。

## 错误码

| 状态码 | `domain` / 原因码 | 含义 |
| --- | --- | --- |
| `401` | `portalCenter` / `PORTAL_AUTHENTICATION_REQUIRED` | 未登录，或登录已过期 |
| `404` | `portalCenter` / `PORTAL_NOT_AVAILABLE` | 门户不存在或未安装 |
| `403` | `portalCenter` / `PORTAL_ACCESS_DENIED` | 没有门户访问权限，API 密钥范围不包含这个门户，或门户已停用、宿主策略不允许访问 |
| `404` | `app` / `ROUTE_NOT_FOUND` | 门户没有定义这个接口 |

门户接口自定义的错误也使用 `domain` `portalCenter`，原因码取一个不与多门户和其他门户冲突的名称，如 `INVENTORY_MATERIAL_NOT_FOUND`。
