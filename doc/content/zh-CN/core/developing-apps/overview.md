---
title: 应用开发概览
description: 认识应用代码、模板和插件的关系，理解一个业务功能如何连接页面、接口、服务与数据库。
---

开发一个 NocoBase 应用，就是在已有的应用结构和能力上实现业务规则：数据怎样保存，谁可以执行操作，页面怎样把结果呈现给用户。本节按主题介绍这些工作，供你开发时查阅；如果想先从头完成一个功能，可以阅读[搭建第一个应用](../tutorials/build-your-first-feature.md)。

以下用“把任务归入项目”说明各部分职责，阅读本篇不需要运行示例。

> **运行专题示例前：** 项目与任务专题沿用默认模板 `1.0.0-beta.78` 的历史示例，准备步骤需要访问私有仓库 `nocobase/app-tutorials` 的 `04-task-due-date` 标签。它使用 `tutorialTasks` 和 `tutorialProjects`，与当前入门教程的 `tasks` 表、接口和测试配置不同，不能直接接着入门教程运行。具备仓库访问权限后，按[建表与数据初始化](data-models-and-migrations.md#准备示例应用)准备独立的示例应用；没有访问权限也可以阅读各篇的职责说明和代码。

## 应用代码、模板和插件

创建应用后，你得到的是一份可以修改和独立维护的应用源码。模板提供初始结构，Core 的包提供运行与开发能力，插件提供可复用的功能。

| 部分 | 提供什么 | 开发时怎样使用 |
| --- | --- | --- |
| 应用代码 | 自己的页面、接口、数据模型、业务服务和测试 | 在应用仓库中直接修改，随应用发布 |
| 应用模板 | 启动入口、页面布局、组件、配置和开发约定 | 创建时生成到项目中；以后升级时合并模板变化 |
| Core 的基础包 | 客户端和服务端运行时、数据访问、配置等 | 通过公开 API 使用，由项目依赖管理版本 |
| 插件 | 认证、用户、权限、文件等可复用能力 | 使用应用已注册插件的公开接口、组件和扩展方式 |

例如，项目名称和任务归属是应用自己的业务；登录和角色权限可以使用已有插件。默认模板已经带有多种插件，开发功能时先检查现有能力，无需把“安装插件”当作每个功能的第一步。

业务功能通常直接写在应用中；需要跨应用复用，或希望将某项能力独立维护、发布时，再考虑提取为插件，见[什么时候写插件](../extension-development/when-to-write-a-plugin.md)。通过插件的公开接口定制应用，保留 `node_modules/` 中的依赖原样。

模板生成的布局和主题同样属于应用源码。优先使用路由声明、组件组合和主题配置；确实需要改动框架结构时，记录原因，方便以后[升级 NocoBase Core](upgrade-nocobase-core.md)时保留业务定制。

## 一个功能由哪些部分组成

以“把任务归入项目”为例，完整交付不只有一个选择框：

| 部分 | 要解决的问题 | 示例中的位置 |
| --- | --- | --- |
| 数据模型 | 任务怎样保存项目，旧任务怎样保留，项目不存在时怎么办 | `database/main/migrations/` |
| 业务服务 | 能否修改这条任务，目标项目是否可选，怎样保存关联 | `server/providers/tutorial-project-service.ts` |
| HTTP 接口 | 谁在调用，输入是否合法，返回什么结果 | `server/routes/tutorial-projects.ts` |
| 权限声明与服务注册 | 有哪些业务操作，服务怎样供接口使用 | `server/providers/tutorial-projects.ts` |
| 页面路由与导航 | 从哪里进入，哪些用户可以打开页面 | `client/routes.ts` |
| 页面与交互 | 展示当前项目，选择候选项，处理加载和保存结果 | `client/pages/tasks/[taskId]/project.tsx` |
| 文案 | 中英文名称、字段提示和错误反馈 | `client/locales/` |
| 验证 | 数据是否保留，允许的操作能否成功，越权是否被拒绝 | `tests/` |

这些位置是一份分工表，不是每次都要新增一套文件。只调整表单文案不需要迁移，只增加字段也不必重新编写登录模块。先找出需求改变了什么，再修改对应部分。完整目录说明见[项目结构](../getting-started/project-structure.md)。

实际开发时，先写清业务结果，例如“用户可以把任务归入有权选择的项目，旧任务保留原样，保存失败时不丢失输入”。然后确定数据变更与权限规则，实现接口和页面，最后用独立测试数据验证正常操作、拒绝操作和原有功能。和 Agent 合作时，由你明确业务要求，Agent 按项目约定实现并验证，见[和 Agent 一起开发](develop-with-an-agent.md)。

## 一次保存怎样到达数据库

用户在“修改项目”弹窗中选好项目并点击保存后，请求沿着下面的路径处理：

1. **页面提交选择。** 页面发送任务 ID 和选中的项目 ID，也可以请求解除关联。
2. **接口校验请求。** 检查用户是否登录、是否有修改归属的操作权限、输入是否合法，并取得可操作的任务与项目范围。
3. **服务处理业务。** 在允许的范围内查找任务和目标项目，确认任务可以修改、项目可以选择，再更新关联。
4. **数据库保存结果。** 迁移已经建立字段和外键，数据库拒绝指向不存在项目的关联。迁移负责事先改变结构，不会在每次保存时重新运行。
5. **结果返回页面。** 接口返回保存结果，页面更新任务列表并给出反馈。失败时保留用户输入，把字段错误放回选择框；任务已经不存在时停止编辑。

接口负责接收和校验请求，服务集中处理可复用的业务规则。服务如何注册、接口如何调用，以及事务怎样保证这一组操作共同成功或回退，见[路由与 HTTP 接口](apis-and-services.md)。页面请求与错误反馈见[UI 组件与交互](pages-and-interactions.md)，字段和外键的建立方式见[建表与数据初始化](data-models-and-migrations.md)。

### 权限贯穿整条路径

页面访问权限决定能否进入页面；业务操作权限决定能否执行动作；数据范围决定这次操作可以处理哪些记录。隐藏按钮只是界面反馈，不能替代服务端检查。

“修改任务项目”尤其需要检查两边：用户既要能修改这条任务，也要能把任务分配到目标项目。能查看项目不代表能进行分配。外键只能证明项目存在，不能证明当前用户有权使用它。

### 文件需要接入应用

新增页面、接口或服务时，按需修改对应的注册入口：

- **页面：** 在 `client/pages/` 编写组件，通过 `client/routes.ts` 声明路由及导航。
- **接口：** 在 `server/routes/` 编写路由，通过其中的 `index.ts` 接入应用。
- **客户端服务：** 通过 `client/service-provider.ts` 注册业务服务；面向组件树的上下文通过 `client/react-providers.ts` 接入。
- **服务端服务：** 用 Provider 注册业务服务，并通过 `server/providers/index.ts` 接入应用。

`client/runtime.ts` 和 `server/runtime.ts` 负责组合应用的路由、插件、配置和服务。模板已经接入上述注册入口时，新增业务功能通常无需修改这两个 runtime 文件。

## 客户端章节怎么读

客户端章节从页面开发展开：[页面、路由与导航](pages-routes-and-navigation.md)说明入口与访问条件，[UI 组件与交互](pages-and-interactions.md)说明组件组织、UI Library 源码资产、React Context 与 Provider，以及列表和表单交互。[多语言](localization.md)与[主题与样式](themes-and-styles.md)分别处理文案和外观。

[数据请求与状态管理](data-requests-and-state.md)说明远程数据、URL 状态、表单草稿和共享状态；[页面布局](page-layouts.md)说明 `client/layouts/` 与页面容器的组合；[客户端业务服务](client-business-services.md)说明服务实现、`client/service-provider.ts` 注册与 React 订阅。运行时装配、Provider 层级与依赖注入机制统一见[客户端运行时](../framework/runtime/client.md)、[React Providers](../framework/runtime/react-providers.md)和[客户端服务](../framework/services/integration.md#客户端服务)。

## 服务端章节怎么读

[路由与 HTTP 接口](apis-and-services.md)说明接口声明、注册、Repository 数据接口与 API 文档；[服务端业务服务](server-business-services.md)说明业务类、依赖注册和事务边界；[请求校验与错误处理](request-validation-and-errors.md)说明输入、响应和失败合同；[认证、权限与数据范围](authentication-and-permissions.md)说明身份、操作授权与记录范围。

需要异步或周期执行时阅读[后台任务与定时执行](background-tasks.md)，生成邮件、通知等服务端文案时阅读[服务端多语言](server-localization.md)。项目与任务示例保留前述历史基线；后台任务和服务端多语言以默认模板 `1.0.0-beta.84` 为参照，可独立阅读。

`server/services/`、`server/jobs/` 是按需创建的组织目录，不会自动注册。应用配置继续见[应用配置（config.yml）](configuration-and-settings.md)，启动装配与公共机制见[服务端运行时](../framework/runtime/server.md)，插件的安装与接入见[管理插件](manage-plugins.md)。

## 数据库章节怎么读

[建表与数据初始化](data-models-and-migrations.md)围绕 `defineMigration()`、`defineSeed()` 和各自的 Context，介绍建表、默认记录与后续变更；[查询与操作数据](querying-data.md)处理业务运行时的数据访问；[事务与数据一致性](transactions-and-consistency.md)处理多步写入、失败回滚和并发约束。

需要第二个连接时阅读[多数据库连接](multiple-databases.md)；结构由其他系统维护时阅读[接入已有数据库](existing-databases.md)。`database/` 保存结构、初始化资源与元数据，运行时查询通常写在服务端业务服务中。具体 API 与共享机制继续查阅[框架数据库](../framework/database/overview.md)。

## 命令行章节怎么读

[编写应用命令](application-commands.md)从 `cli/commands/` 开始，介绍参数、服务访问、输出与测试；[接入插件命令](plugin-commands.md)说明 `cli/plugins.ts` 的注册、命名空间和开发钩子；[为应用提供 CLI 客户端](cli-client.md)说明如何让用户与 Agent 登录已运行的应用，通过 HTTP 调用业务接口。

前两篇的命令在应用环境中执行，第三篇的客户端可以在使用者的电脑上运行。共用运行机制和完整内置命令继续见框架与参考章节。

## 按当前问题继续阅读

| 当前要处理的问题 | 文档 |
| --- | --- |
| 建表、初始化默认记录或调整已有结构 | [建表与数据初始化](data-models-and-migrations.md) |
| 声明与注册 API，选择 Repository 数据接口 | [路由与 HTTP 接口](apis-and-services.md) |
| 复用业务规则与组织服务依赖 | [服务端业务服务](server-business-services.md) |
| 校验输入、定义响应与处理错误 | [请求校验与错误处理](request-validation-and-errors.md) |
| 接入认证、操作权限与记录范围 | [认证、权限与数据范围](authentication-and-permissions.md) |
| 投递后台任务与声明周期规则 | [后台任务与定时执行](background-tasks.md) |
| 按请求或接收人语言生成文案 | [服务端多语言](server-localization.md) |
| 实现列表、表单、弹窗及加载和错误反馈 | [UI 组件与交互](pages-and-interactions.md) |
| 编写查询、关联读取与批量操作 | [查询与操作数据](querying-data.md) |
| 保证多步写入一致，处理失败和并发 | [事务与数据一致性](transactions-and-consistency.md) |
| 增加连接或读取外部系统的数据 | [多数据库连接](multiple-databases.md)、[接入已有数据库](existing-databases.md) |
| 组织页面、菜单与访问条件 | [页面、路由与导航](pages-routes-and-navigation.md) |
| 定义、覆盖和读取应用配置 | [应用配置（config.yml）](configuration-and-settings.md) |
| 组织文案、添加语言和设置默认语言 | [多语言](localization.md) |
| 调整样式、主题预设和默认外观 | [主题与样式](themes-and-styles.md) |
| 查看、更新或扩展已注册能力 | [管理插件](manage-plugins.md) |
| 编写应用维护命令或接入插件命令 | [编写应用命令](application-commands.md)、[接入插件命令](plugin-commands.md) |
| 让用户或 Agent 从终端调用业务 API | [为应用提供 CLI 客户端](cli-client.md) |
| 选择验证方式并完成验收 | [测试与验收](testing-and-acceptance.md) |
| 想先跑通一个完整功能 | [搭建第一个应用](../tutorials/build-your-first-feature.md) |
