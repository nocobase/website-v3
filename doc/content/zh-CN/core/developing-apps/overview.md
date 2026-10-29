---
title: 应用开发概览
description: 一个业务功能由哪些部分组成、写在哪里、怎样连起来，以及遇到具体问题时该读哪一篇。
---

开发 NocoBase 应用，就是在模板给出的结构和 Core 现成的能力上实现你自己的业务：数据怎样保存，谁能做什么，页面怎样把结果呈现给用户。

本篇先说明一个功能由哪些部分组成、各部分写在哪里、一次操作怎样经过它们，再按任务列出本节各篇，供开发时查阅。和 Agent 一起开发时，这也是 Agent 遵循的分工，你可以对照它检查改动。想先从头做完一个功能，看[搭建第一个应用](../tutorials/build-your-first-app.md)。

## 哪些代码由你修改

应用是一份归你所有的源码，但里面的代码来源不同，修改方式也不同：

| 部分 | 包括 | 怎样修改 |
| --- | --- | --- |
| 业务代码 | 你的页面、接口、数据表、业务服务、文案和测试 | 直接修改，随应用发布 |
| 模板代码 | `client/routing/`、`client/layouts/`、`client/theme/`、服务端入口、`package.json` 脚本和 tsconfig | 可以修改，但升级时要和新模板合并。优先用路由声明、组件组合和主题配置达到目的；确实要改时，注释原因，并把要点记到 `.agents/rules/` |
| Core 的包和插件 | `node_modules/` 中的 `@nocobase/*` 包 | 不直接修改。通过公开接口、插件选项和扩展方式定制，例如用插件选项或路由组件覆盖调整插件页面，用语言资源中的 `overrides` 调整插件文案 |

做新功能前，先看已有能力。默认模板已经注册了认证、用户、权限、文件、通知等插件，权限系统、通知发送、定时任务这类能力不要自己重写，先读对应插件的文档和技能，见[插件使用概览](../using-plugins/overview.md)。

业务功能默认直接写在应用里。需要在多个应用中复用，或者想把一块功能独立成模块来维护时，再做成插件，见[什么时候写插件](../extension-development/when-to-write-a-plugin.md)。

## 一个功能写在哪里

每类代码都有固定位置：

| 位置 | 放什么 |
| --- | --- |
| `database/main/migrations/` | 表结构变更。迁移是历史记录，合并后不再修改，新的变化写成新的迁移 |
| `database/main/seeds/` | 应用必需的初始数据 |
| `server/routes/` | HTTP 接口：校验输入，检查身份和权限，调用服务，返回结果 |
| `server/providers/` | 服务注册及生命周期；复杂业务实现可提取到 `server/services/` |
| `client/pages/` | 页面组件。页面有子页面或自己的文件时，用一个文件夹 |
| `client/routes.ts` | 声明页面路由、导航和页面访问权限 |
| `client/components/` | 自己的组件。`client/components/ui/` 放 shadcn 基础组件，用命令行添加，不要手写 |
| `client/locales/` | 所有用户看得到的文案，写在 `en-US.ts` 和 `zh-CN.ts` |
| `cli/commands/` | 应用自己的命令 |
| `tests/` | 测试，不和源码放在一起 |

一个带页面和接口的功能，通常要改五处：建表的迁移、`server/routes/` 里的接口、`client/pages/` 里的页面、`client/routes.ts` 里的路由和导航、`client/locales/` 里的文案。业务规则较多时再加一个服务，最后补上测试。

这是一张分工表，不是每次都要填满的清单。只改表单文案不需要迁移，只加一个字段也不用碰登录。先弄清需求改变了什么，再改对应的部分。各目录的完整说明见[项目结构](../getting-started/project-structure.md)。

### 新文件要接入应用

新文件放进目录后，还要在对应入口登记，应用才会加载它：

| 新增 | 写在 | 在哪里登记 |
| --- | --- | --- |
| 页面 | `client/pages/` | `client/routes.ts` |
| 接口 | `server/routes/` | `server/routes/index.ts` |
| 服务端服务 | `server/providers/` | `server/providers/index.ts` |
| 客户端服务 | 自己组织的文件 | `client/service-provider.ts` |
| 组件树上的上下文 | React Provider | `client/react-providers.ts` |

`client/runtime.ts` 和 `server/runtime.ts` 负责把路由、插件、配置和服务组合起来。上面这些入口模板都已经接好，新增业务功能通常不用改这两个文件。`server/services/`、`server/jobs/` 这类目录可以按需创建来组织代码，但不会被自动登记。

## 一次保存怎样到达数据库

以“把任务归入项目”为例。用户在“修改项目”弹窗里选好项目，点击保存后：

1. **页面提交。** 页面把任务 ID 和选中的项目 ID 发给接口，也可以请求解除关联。
2. **接口检查请求。** 确认用户已登录、有修改所属项目的操作权限、输入合法。
3. **服务处理业务。** 在当前用户的数据范围内查找任务和目标项目，确认任务可以修改、项目可以选择，再更新关联。
4. **数据库保存。** 字段和外键由迁移事先建好，数据库会拒绝指向不存在项目的关联。迁移只在结构变化时执行一次，不会在每次保存时运行。
5. **页面更新。** 接口返回结果，页面刷新任务列表并给出反馈。保存失败时保留用户的选择，把字段错误显示在选择框旁边；任务已经被删除时，停止编辑。

接口负责接收和校验请求，服务集中处理可复用的业务规则；需要几步操作一起成功或一起回退时，用事务包起来。具体写法见[路由与 HTTP 接口](apis-and-services.md)、[服务端业务服务](server-business-services.md)、[事务与数据一致性](transactions-and-consistency.md)、[UI 组件与交互](pages-and-interactions.md)和[建表与数据初始化](data-models-and-migrations.md)。

### 每一层都要检查权限

| 层 | 决定什么 | 注意 |
| --- | --- | --- |
| 页面路由 | 能不能打开这个页面 | 路由上的 `auth` 只控制浏览器里的跳转，不是服务端的安全措施 |
| 接口 | 是否已登录，能不能执行这个操作 | 挂在 `/api` 下不会自动检查身份，每个接口要自己加上认证和授权检查 |
| 服务和查询 | 这次操作能处理哪些记录 | 查询带上当前用户的权限策略，即使拿到别人的记录 ID 也查不到 |
| 页面按钮 | 是否显示操作入口 | 只是界面反馈，不能代替上面三层 |

“修改任务所属项目”要检查两边：用户既要能修改这条任务，也要能把任务放进目标项目。能查看一个项目，不代表能往里面分配任务；外键只能证明项目存在，不能证明当前用户有权使用它。详见[认证、权限与数据范围](authentication-and-permissions.md)。

## 按任务查找文档

> [!NOTE]
> 部分专题沿用较早模板版本的示例，示例的版本和准备步骤写在各页里。只阅读说明和代码时，不需要运行这些示例。

### 客户端

| 要做的事 | 文档 |
| --- | --- |
| 增加页面、菜单，设置谁能打开 | [页面、路由与导航](pages-routes-and-navigation.md) |
| 实现列表、表单、弹窗，处理加载和错误反馈 | [UI 组件与交互](pages-and-interactions.md) |
| 读取远程数据，管理 URL 状态、表单草稿和共享状态 | [数据请求与状态管理](data-requests-and-state.md) |
| 调整页面外框和页面容器 | [页面布局](page-layouts.md) |
| 组织文案、增加语言、设置默认语言 | [多语言](localization.md) |
| 调整样式、主题预设和默认外观 | [主题与样式](themes-and-styles.md) |
| 在客户端实现和注册业务服务 | [客户端业务服务](client-business-services.md) |

### 服务端

| 要做的事 | 文档 |
| --- | --- |
| 声明和注册接口，选择 Repository 数据接口，生成接口文档 | [路由与 HTTP 接口](apis-and-services.md) |
| 复用业务规则，组织服务依赖和事务边界 | [服务端业务服务](server-business-services.md) |
| 校验输入，定义响应和错误 | [请求校验与错误处理](request-validation-and-errors.md) |
| 接入认证、操作权限和数据范围 | [认证、权限与数据范围](authentication-and-permissions.md) |
| 投递后台任务，声明周期执行的规则 | [后台任务与定时执行](background-tasks.md) |
| 按请求或接收人的语言生成邮件、通知等文案 | [服务端多语言](server-localization.md) |

### 数据库

| 要做的事 | 文档 |
| --- | --- |
| 建表、写入默认记录、调整已有结构 | [建表与数据初始化](data-models-and-migrations.md) |
| 查询、读取关联、批量操作 | [查询与操作数据](querying-data.md) |
| 保证多步写入一致，处理失败和并发 | [事务与数据一致性](transactions-and-consistency.md) |
| 增加第二个数据库连接 | [多数据库连接](multiple-databases.md) |
| 读取由其他系统维护结构的数据库 | [接入已有数据库](existing-databases.md) |

### 命令行

| 要做的事 | 文档 |
| --- | --- |
| 编写在应用环境里运行的维护命令 | [编写应用命令](application-commands.md) |
| 接入插件提供的命令 | [接入插件命令](plugin-commands.md) |
| 让用户或 Agent 在自己的电脑上登录应用、调用业务接口 | [为应用提供 CLI 客户端](cli-client.md) |

### 配置、插件与交付

| 要做的事 | 文档 |
| --- | --- |
| 定义、覆盖和读取应用配置 | [应用配置（config.yml）](configuration-and-settings.md) |
| 查看、注册、更新插件 | [管理插件](manage-plugins.md) |
| 选择验证方式，完成验收 | [测试与验收](testing-and-acceptance.md) |
| 描述需求，检查 Agent 的改动 | [和 Agent 一起开发](develop-with-an-agent.md) |
| 升级到新版本，合并模板变化 | [升级 NocoBase Core](upgrade-nocobase-core.md) |

运行时怎样组装、服务容器、数据库等底层机制，见[框架概览](../framework/overview.md)。
