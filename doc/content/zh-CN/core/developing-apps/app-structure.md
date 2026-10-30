---
title: 应用的代码结构
metaDescription: 应用的目录，一个功能改哪几处，一次请求怎样从页面到达数据库，新文件在哪里接入，以及哪些代码归应用所有。
---

用 Core 开发应用时，代码通常由 Agent 来写。想看懂它写了什么、判断改动是否合理，或者自己动手改，先要了解应用的代码怎样组织。

用 Core 创建的应用是一个 TypeScript 项目，页面、接口和数据表都在同一个仓库里，一个功能通常同时改到这三处。下面的例子都来自[开发第一个功能](../getting-started/build-your-first-app.md)里的客户管理。

## 目录

```tree
my-app/
├── client/              # 页面和交互
│   ├── routes.ts        # 页面路由和侧边栏入口
│   ├── pages/           # 页面组件
│   ├── components/      # 自己的组件；ui/ 是 shadcn 基础组件
│   ├── hooks/           # 共享的 Hooks
│   ├── locales/         # 界面文案
│   ├── layouts/         # 应用外框
│   ├── theme/           # 主题
│   └── plugins.ts       # 注册客户端插件
├── server/              # 接口和业务服务
│   ├── routes/          # HTTP 接口
│   ├── providers/       # 业务服务的注册和生命周期
│   ├── config/          # 配置定义
│   └── plugins.ts       # 注册服务端插件
├── database/main/       # 默认数据库连接 main
│   ├── migrations/      # 建表和修改表结构
│   └── seeds/           # 必需的初始数据
├── cli/
│   └── plugins.ts       # 注册命令行插件；自己的命令放在 commands/，按需创建
├── public/              # 静态资源
├── tests/               # 测试，按 client、server、database 等分目录
├── AGENTS.md            # Agent 的开发规则入口
├── .agents/             # rules/ 是项目规范，skills/ 是随依赖同步的 Skill
├── config.example.yml   # 配置示例
├── config.yml           # 本机配置，不提交到 Git
└── package.json         # 脚本和依赖
```

安装和运行后还会生成 `node_modules/`、`storage/`（运行数据）、`dist/`（构建产物）和 `database/main/collections/`（表结构快照），这些都不用手工修改。需要本地插件或共享包时放在 `packages/`，见[插件结构](../extension-development/plugin-structure.md)。完整的目录约定见[项目目录与文件约定](../reference/project-conventions.md)。

## 一个功能改哪几处

一个有页面和接口的功能，通常改下面这几处。右列是客户管理里对应的内容：

| 位置 | 做什么 | 客户管理中 |
| --- | --- | --- |
| `database/main/migrations/` | 新建或修改数据表 | `customers` 表 |
| `server/routes/` | 接收请求、校验输入、检查权限 | 列表、详情、新建、编辑、更新状态和删除 |
| `server/providers/` | 注册业务服务，集中处理业务规则 | `CustomerService` 和客户权限 |
| `client/pages/`，在 `client/routes.ts` 中声明 | 页面和交互；路由上声明侧边栏入口和访问权限 | 客户列表、详情抽屉和表单弹窗 |
| `client/locales/` | 用户能看到的文字 | 界面文案 |
| `tests/` | 测试 | 迁移、接口、页面和浏览器测试 |

每一处的代码见[一个功能的完整代码](customers-walkthrough.md)。

## 一次操作怎样到达数据库

以销售 Bob 把客户标记为成交为例：

1. **页面发出请求。** 页面读取客户的最新版本，再提交新的状态和读取时的更新时间。
2. **接口检查身份和权限。** 确认 Bob 已登录、有“更新状态”的权限，取得 Bob 能处理的数据范围，再校验输入。
3. **服务处理业务。** 在这个范围内找到客户，确认它没有被别人改过，再更新状态。
4. **数据库保存结果。** 表结构由迁移事先建好，保存时不会重新运行迁移。
5. **页面显示结果。** 接口返回更新后的客户，页面刷新这一行。失败时显示原因，例如客户已被删除，或已被别人修改。

接口负责接收和校验请求，服务集中处理业务规则。命令和后台任务也可以调用同一个服务，见[服务端业务服务](server-business-services.md)。

### 权限分三层

- **页面访问**：能不能打开客户页面。在路由的 `authz` 上声明。
- **操作权限**：能不能新建、编辑、更新状态或删除。服务端在每个接口上检查。
- **数据范围**：这次操作能处理哪些记录，比如销售只能处理自己负责的客户。

隐藏按钮只是界面上的提示，不能代替服务端检查。Bob 即使拿到别人客户的 ID 直接调用接口，服务端也会按 Bob 的数据范围拒绝。详见[认证、权限与数据范围](authentication-and-permissions.md)。

## 新文件在哪里接入

新写的页面、接口和服务要登记到对应的入口，才会随应用加载：

| 新增的 | 写在 | 登记到 |
| --- | --- | --- |
| 页面 | `client/pages/` | `client/routes.ts` |
| HTTP 接口 | `server/routes/` | `server/routes/index.ts` |
| 服务端业务服务 | `server/providers/`；业务实现可以放在 `server/tasks/` 这样按功能划分的目录 | `server/providers/index.ts` |
| 客户端业务服务 | 按功能组织 | `client/service-provider.ts` |
| React Provider | 按功能组织 | `client/react-providers.ts` |
| 插件 | `package.json` 中的依赖 | `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` |

`client/runtime.ts` 和 `server/runtime.ts` 把这些入口组合起来。新增业务功能时，通常不用修改这两个文件。

## 哪些代码归应用

| 部分 | 包含什么 | 怎样修改 |
| --- | --- | --- |
| 业务代码 | 页面、接口、数据表、业务服务和测试 | 直接修改，随应用发布 |
| 模板生成的代码 | 外框、登录页、首页、组件、主题和开发约定 | 同样可以修改。改动框架结构时记下原因，[升级 NocoBase Core](upgrade-nocobase-core.md) 时要和新版模板合并 |
| Core 的包和插件 | `node_modules/` 里的运行时、插件和基础库 | 不修改，通过公开的接口、组件和配置使用；新版本通过升级获得 |
| Skill | `.agents/skills/` | 随依赖同步，不修改；应用自己的约定写进 `.agents/rules/` |

业务功能默认直接写在应用里。需要在多个应用中复用，或希望单独维护和发布时，再做成插件，见[什么时候写插件](../extension-development/when-to-write-a-plugin.md)。

## 下一步

- [一个功能的完整代码](customers-walkthrough.md)：从数据表到页面，读一遍客户管理每一层的代码。
- [页面、路由与导航](pages-routes-and-navigation.md)、[路由与 HTTP 接口](apis-and-services.md)、[建表与数据初始化](data-models-and-migrations.md)：客户端、服务端和数据库各自的写法。
