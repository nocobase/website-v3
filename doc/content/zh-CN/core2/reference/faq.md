---
title: 常见问题
description: 关于应用与插件的边界、UI 组件、配置、命令、数据库、依赖升级和部署的常见问题。
---

## 功能写在应用还是插件里？

只服务于当前业务、需要经常随页面调整的代码，可以直接放在应用的 `client/`、`server/`、`database/` 或 `cli/`。需要独立维护、提供明确扩展入口或供多个应用接入时，再考虑拆成 `packages/app-plugin-<name>/`。本地插件随应用一起构建，不必先发布 npm 包。见[什么时候写插件](../extension-development/when-to-write-a-plugin.md)。

## 安装插件以后，为什么没有页面或功能？

“依赖已安装”“运行时已注册”和“页面已接入”是三种不同的状态。请检查插件实际提供了哪些 Client、Server、CLI 入口，以及应用对应的 `plugins.ts` 是否已经注册。有些插件只提供服务或 Skills，也可能需要应用自己组合页面。数据库资源还需要完成相应的迁移。见 [插件使用概览](../using-plugins/overview.md) 和 [插件索引](plugins.md)。

## 应用和插件的前端组件必须遵循固定结构吗？

不需要。组件可以自由编写和组织，基础组件使用 shadcn；模块化的组件优先参考 [NocoBase UI Library](https://ui.nocobase.com/)。插件既可以提供运行时组件，也可以只提供服务、契约与示例，具体按业务决定。见[组件与样式](../extension-development/frontend-components.md)。

## 组件复用必须发布 UI Registry 吗？

不必。是否发布，取决于组件或区块是否需要作为源码资产，供 Agent 按需取用、修改和组合。通过普通的源码组织、共享包依赖和运行时插件，同样可以复用代码。

需要分发源码资产时，在 `packages/announcements-ui/` 这样的独立包中维护 Registry，与运行时插件并列；资产不能依赖发布者的私有插件相对路径或只有发布者才有的别名。资产内一起分发的文件可以相对引用，但安装目标也必须保持引用有效。见[按需分发 UI 源码资产](../extension-development/frontend-components.md#按需分发-ui-源码资产)。

## 本地使用 UI 资产需要启动 Registry 服务吗？

不需要。构建出 item JSON 后，直接把本地 JSON 文件的路径交给 `shadcn add` 即可。通过 `pnpm --filter` 在子包中执行时，使用绝对路径更明确。只有需要跨机器通过 URL 分发时，才需要静态托管，也可以复用已有的站点。完整的命令见 [在目标项目中安装与修改](../extension-development/frontend-components.md#在目标项目中安装与修改)。

## ServiceProvider 是服务端专用的吗？

不是。客户端和服务端都可以使用 ServiceProvider 注册服务并参与生命周期，两端的容器和实例各自独立。React Provider 负责 React 组件树中的上下文，不能与服务容器混为一谈。见 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md) 和 [API 参考](api.md)。

## 改了 config.yml 为什么没有生效？

请检查是否有环境变量覆盖了同一个路径，以及 `APP_CONFIG_FILE` 是否指向了另一份文件。YAML 中的 `${NAME}` 不会自动替换为环境变量。修改默认主题后，还要考虑浏览器中已经保存的个人选择。有些服务只在启动时读取配置，需要重新启动，或者实现专门的重新加载逻辑。见[配置项参考](configuration.md)。

## 改了初始管理员密码，为什么原账号密码没有变化？

`users.initialAdmin` 只在用户库为空时用于初始化，并不是已有用户的密码重置入口。已有的账号请通过应用提供的账号管理或恢复流程处理，不要为了修改密码而重置数据库。

## 为什么命令与其他教程中的不同？

先确认文档针对的是 NocoBase 3、命令是在目标应用中执行的，以及调用的是该应用安装的 CLI。源码使用 `pnpm nocobase`；部署产物使用 `node dist/cli/index.js`。执行 `commands --json` 和具体命令的 `--help` 查看当前版本。插件注册和开发命令不会全部保留到生产构建。见[命令行参考](cli.md)。

## 应用默认有哪些插件？

模板的依赖清单说明包含了哪些包，注册文件则决定哪些入口接入了运行时；版本升级之后，两者都可能发生变化。先查应用的 `package.json`、锁文件与三端注册文件，再参考[插件索引](plugins.md)中的核对基线。不要只根据 `node_modules/` 中存在某个包推断它已启用。

## 创建数据表后，会自动生成 API 吗？

不会。仅仅创建 Collection，并不会把它自动公开给客户端。应用或插件需要声明接口、校验输入、确定用户身份，并应用数据权限。客户端的远程 Repository 同样依赖相应的服务端接口。见[路由与 HTTP 接口](../developing-apps/apis-and-services.md)。

## 为什么迁移提示校验和不一致？

这说明已经执行过的迁移与当前源码中的内容不同。请先检查是否修改了历史迁移、切换到了错误的分支，或者部署了不匹配的构建。新的变化通常应写成新增的迁移。只有确认修改不会改变已部署结构的语义时，才考虑使用 `db repair`；不要通过重置数据库来消除检查结果。见[建表与数据初始化](../developing-apps/data-models-and-migrations.md)。

## 换了数据库方言，就能直接使用原来的数据吗？

不能。修改方言只改变连接方式，并不负责在数据库之间搬迁数据。还需要核对字段类型、索引、约束、查询、事务和插件在目标数据库上的行为，并安排数据迁移和验证。用于测试的数据库镜像版本，也不代表对所有版本的支持承诺。见[数据库支持与版本兼容](compatibility.md)。

## @nocobase 包版本不同，需要改成同一个版本吗？

不需要。运行时、库、插件和脚手架各自独立编号。请按照模板、包依赖和 peer dependency 的范围组合，并保留锁文件。升级之后，要同时检查模板结构、迁移和本地插件，不能只修改版本字符串。见[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)。

## 哪些目录可以重新生成？

`node_modules/` 和 `dist/` 可以根据源码和锁文件重新生成；同步得到的 Skills 也有各自维护的源文件。`storage/` 虽然由运行时生成，却可能包含 SQLite 数据库、上传的文件和日志，不能当作普通的构建缓存删除。部署时，请按实际的存储配置安排持久化和备份。见[项目目录与文件约定](project-conventions.md)。

## 开发预览和生产部署如何选择？

本地开发时使用开发命令；Studio 中的开发预览见 Studio 文档。独立的生产部署使用 Docker，或者 PM2 配合 app-installer，部署的是构建产物，并保留运行数据。见[选择部署方式](../deployment/choose-a-deployment-method.md)。

## 反馈问题时提供什么信息？

请提供最小的复现步骤、实际结果与预期结果、操作系统和架构、Node 与 pnpm 的版本，以及相关 `@nocobase` 包的版本，并说明问题发生在源码开发、构建还是部署运行的阶段；数据库相关的问题，请补充方言和数据库服务端的版本。贴出脱敏后的错误信息和命令即可，不需要提供密码、密钥、会话或完整的配置。
