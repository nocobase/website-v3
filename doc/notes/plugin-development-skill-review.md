# 插件开发 Skill：文档写作验证记录

本记录用于逐篇对照教程与 `nocobase-app-plugin-development`，不属于公开文档菜单。页面和菜单及后续七篇均已完成中英文初稿。Skill 的正式改动维护在 NocoBase 源码 `packages/app/app-skills/skills/nocobase-app-plugin-development/`，统一提交 PR #11178；不修改本机安装副本，不提交到 #11175。

## 第一轮：页面和菜单

- 第一轮读取的是本机安装副本；第二轮以 NocoBase 源码 `v3-develop` 基线 `05f800ad8` 及 PR #11178 的 Skill 为准。以下引用均为 Skill 内相对路径。
- 文档：`doc/src/zh-CN/core/extension-development/pages-and-menus.md` 及英文对应页。
- 环境：独立 create-app 项目，模板 `@nocobase/app-template-default@1.0.0-beta.81`；插件位于 App 的 `packages/app-plugin-help-center/`。
- 创建工具：本地 NocoBase 分支 `feat/v3-create-plugin-in-app` 的 `015404ecd`，直接调用 `packages/tools/create-plugin/bin/run.js`；App CLI 使用此前打包的工作区支持版本。本次未重新证明 npm `@beta` 已发布相同改动，文档命令延续已约定的发布入口。
- 插件 API：`@nocobase/app-client@4.0.0-beta.3`、`@nocobase/i18n@2.0.0-beta.1`；测试：`@nocobase/app-testing@0.1.0-beta.6`。
- 验证结果：插件 `check` 通过，包含 3 个导航行为测试；插件注册成功，App `pnpm build` 通过。自动化测试覆盖父路径及末尾斜线、查询参数、子页面切换、后退、直接进入 FAQ 和中英文。测试使用真实路由声明加载组件，但不包含 App 的认证守卫与侧边栏生成；登录后的完整浏览器验收另列于教程，不宣称已由单元测试覆盖。

## 优先修正：独立 App 创建流程的过时描述

`SKILL.md` 要求目标工作区包含 `packages/tools/create-plugin/`、`packages/app/app-client/` 等源码目录，并使用 `pnpm plugin:create`。这本身属于旧 Skill 的适用范围限制，但以下参考文件进一步明确否认了现已支持的流程：

- `references/plugin-foundation.md` 的 Create the package：称创建工具不能在已安装 App 内生成本地插件。
- `references/registration.md` 的 Registration is several independent facts：同样称 Create Plugin 只能用于源码工作区。

实际验证：独立 App 内创建成功，包位于 `packages/`，根依赖使用 `workspace:*`，注册和 App 构建均通过。

建议：把独立 App 作为默认入口，使用 `pnpm create @nocobase/plugin@beta`；识别 App 根目录、工作区、本地依赖和目标注册文件。源码仓库流程保留为明确的另一种环境，不要求应用开发者下载源码。

## 需要补充：独立 App 获取页面组件的方法

`references/client-components.md` 的 Copy page and route components into the plugin 明确描述“Inside this repository”从 `ui-library/registry/components/registry.json` 查找文件并复制。这对源码仓库有上下文依据，但独立 App 中没有该路径。

实际验证：在 App 根目录执行 `pnpm --filter @nocobase/app-plugin-help-center exec shadcn add @nocobase/page-container @nocobase/page-header`，组件成功生成到插件的 `client/components/`。安装器新增 `cn` 后，按现有依赖约定将它移到 peers；页面使用的 `react`、`react-router` 也需作为运行时 peers。

建议：增加按环境选择组件安装方式的步骤，解释组件属于插件、package-local imports 的解析、安装后依赖分类及 `pnpm install`。不要把 UI Library 自身的组件源目录与插件是否维护 `registry/` 混为一谈。

## 需要清理：路由验收清单内部不一致

`references/client-child-routes.md` 的 Authentication and authorization 明确说没有 Settings/Dev 路由面；但 Verify 第 7 项仍要求验证 Settings/Dev 和 Dev 的生产排除。`client-pages-and-routes.md` 也已说明只使用 `defineAppRoutes()`。

建议：删除旧路由面遗留的验收项，保留普通 App 路由、菜单、权限、部署前缀和浏览器历史验证。系统设置的声明与页面边界应按其现有专门参考说明，不能继续用旧的 Settings/Dev 路由表述。

## 已验证成立，不作为问题

- 单个 `AppClientRouteContribution` 与数组两种导出都受 `defineClientPlugin` 支持；单对象形式接入生成的 `client/plugin.ts` 后类型检查通过。教程采用数组只是保持脚手架风格。
- 父页面精确匹配后使用 `Navigate`、`replace` 和保留 `search` 的方案通过导航测试。
- 子页面由父页面显式放置 `Outlet`，没有 `navigation` 时不声明侧边栏入口；菜单和面包屑是独立声明。
- 子页面不再放第二层 `PageContainer`，页面文案通过插件语言命名空间解析。

## 第一轮待核对项（结果见第二轮）

- 多语言章节：是否清楚说明生成的其他语言资源也受英文键结构约束。新增英文键但保留其他语言的空对象会导致类型检查失败；教程已明确提供补译或移除未支持语言的步骤。这是教程完整性检查项，不据此断言 Skill 完全没有相关说明。
- 插件结构与发布章节：清理 `plugin-foundation.md` 中插件 `registry` 能力及 `registry/` 目录的旧假设；需对照移除该能力后的源码版本验证，不以本次旧分支的生成结果作为最终依据。
- 测试与验证章节：区分插件组件测试、注册结果、App 构建与登录后的真实交互，避免将其中一项当成全部完成。

## 第二轮：其余七篇与独立示例

- 文档：服务端接口、ServiceProvider、数据库与迁移、多语言、扩展命令行、测试与验证、给插件写技能；中英文各七篇。
- 示例分别为 `notice-api`、`notice-services`、`notice-data`、`notice-i18n`、`notice-cli`，均位于独立测试 App 的 `packages/`。先用综合 fixture 验证，再按各篇列出的能力单独创建五个插件，避免只有组合环境可用。
- 创建工具来自 #11175 的 `cea0999310beb2368072f1eff6c1122ec0f1e067`，仍为源码执行；App CLI 使用带本地工作区支持的打包版本。本轮没有声称 npm beta 已发布这些能力，也未执行整个 `unreleased:prepare` 流程。
- 五个独立插件的 `check` 通过，分别运行 6、3、2、3、5 个测试，共 19 个；含类型检查、lint、格式、声明构建。数据库测试顺序执行，验证真实迁移的应用、回滚与重放。
- 五个插件均实际注册到 App；`db apply --dry-run` 后执行迁移成功，App 构建通过。开发 CLI 和构建产物 CLI 都返回 `Hello`、长度 5。
- 构建后的 App 已启动并通过真实 HTTP 验证预览接口：成功返回 200，非法输入返回标准 400/INVALID_INPUT；部署 CLI 加载编译迁移的 dry-run 也成功。`pnpm pack` 已确认 CLI 产物和示例 Skill 进入 tarball。
- `notice-cli` 的示例 Skill 已同步到 App，按其中的命令实际调用成功；验证的是说明内容与调用契约，没有另外开启 Agent 会话测试自动触发。
- Client 测试覆盖实际注册的插件、服务解析、中英文、已挂载组件语言切换及公共组件显式命名空间。没有将这些测试当成真实登录后浏览器流程的证明。

## 第二轮确认并修正到 #11178 的 Skill 问题

| 位置 | 证据与影响 | 修正 |
| --- | --- | --- |
| `references/cli.md` | 原文称派生 topic 不会与其他插件冲突；实际去掉 npm scope 后，同名插件共享 topic；直接调用 `runtime/assemble.ts` 验证两种 scope 的同名插件会被拒绝 | 说明不同 scope 的相同短名会冲突，且 `topic` 不能任意改名 |
| `references/i18n.md`、`testing.md` | 不加环境限定地要求 `pnpm i18n:check`；独立 App 没有该源码仓库脚本 | 区分源码脚本和 App 自有检查，使用插件类型检查和行为测试 |
| `references/http-api.md` | 新增导出输入 schema 时，省略显式注解会触发 TS9010；给 `z.ZodObject` 明确形状后插件 typecheck/build 通过 | 补充输入 schema 的声明构建示例，保留 `apiValidator()` 类型推导；属于使用细节补充，不是接口 API 错误 |
| `references/server.md` | Jobs 示例创建命令省略必填插件名，且只给源码命令 | 补齐名称，并分别写 App 与源码命令 |
| `references/database.md` | 迁移例外规则实际位于 `.agents/rules/database-migrations.md`，不在根 AGENTS 正文 | 更正查阅位置并限定为源码仓库规则 |
| `references/plugin-skills.md` | 只有 `@nocobase` 的命名前缀例子，独立 App 可使用自定义 scope | 补充 `@acme` 到 `acme-...` 的所有权前缀例子 |

## 不误判为 Skill 问题

- `generateApiDocument()` 的路径默认带 `/api`，直接 `router.request()` 使用贡献内部路径。测试已按真实文档前缀断言，这是测试实现修正，不是框架缺陷。
- 新增 CLI 命令后，脚手架“只有 info 命令”的断言需要更新；服务改为 preview 后，旧 getMessage 断言同理。文档已明确替换，保留真实行为测试。
- 最新 Skill 已要求官方插件补齐十种语言；新多语言示例保留全部资源，不能把旧安装副本当作当前规范。早期页面教程的中英文示例不作为十种语言均已验证的证据。
- #11173 已删除插件 registry 能力，本次保持其源码改动，不重复删除或恢复。

## 发布状态

源码 Skill 更新集中在 #11178。#11175 已合并，相关创建工具、App CLI 与项目 Skill 的兼容发布仍需协调和验证。根 Skill 合并就会同步到分发仓库，因此源码 PR 保留发布依赖说明；文档在独立网站 PR 中提交，合并前须确认教程所依赖的 npm 包能力已发布。

## 项目级 Skill 迁移

保留 `nocobase-app-plugin-development` 名称，完整内容迁入 `@nocobase/app-skills`；旧全局入口仅转交到明确的项目路径。同步器为共享包保留这个确切名称，源码仓库链接完整包内指导。升级 Skill 增加全局副本检查、项目同步验证、精准清理、自定义内容保留及新会话验证。创建插件、插件技能和 Core 升级文档的中英文入口同步调整。全局分发的 README 属于 `nocobase/skills-v3`，需配套独立 PR，源码改动继续提交 #11178。

迁移提交为 `6e446690e`，补充的软链接回归修复为 `67b233c36`，已推送 #11178。配套分发文档 PR：https://github.com/nocobase/skills-v3/pull/1。同步器验证覆盖保留名称、冒用拒绝、升级与移除、旧前缀清理，以及将指向全局的项目软链接转换为真实副本且不改动全局目标。CLI 的 710 项测试、脚手架 94 项测试、完整示例 12 项测试、仓库脚本 12 项测试已通过；实际 tarball 包含 66 个插件指导资源，不含依赖与构建/存储目录，已通过编译后的 CLI 同步并验证引用、归属和 Claude 链接。中英文页面构建及六个受影响页面预览通过。发布仍需先协调暂停全局镜像同步，再合并和发布兼容包，确认后恢复同步；本轮未发布 npm 包、暂停镜像或清理真实用户的全局安装。

最终消费者验证完成：Default 模板 443 项测试、Examples 模板 839 项测试及两者的完整部署构建通过；两套模板已通过编译后的 CLI 同步完整 Skill。Demo Mode 的指导路径引用检查及 lint、format、typecheck、build、187 项测试通过。源码和分发文档 PR 均保留草稿，等待工具依赖发布和镜像切换窗口；网站文档保留在当前工作区预览。

#11175 在本轮验证期间已合并，已通过 `e4a529548` 合入最新基线并解决同步器、包版本和脚手架指导的冲突，保留自定义 scope 支持。随后发现源码工作区中的示例依赖被同步进 Skill，导致重复同步 EISDIR；`3b382c344` 排除嵌套 `node_modules` 并清理旧副本。最新提交已推送 #11178。合并后的 CLI 全套 716 项、脚手架 129 项、两模板项目检查 26/27 项、完整示例 12 项测试通过；两模板连续两次真实同步、包产物同步、归属和软链接检查通过。前述模板完整运行时测试与部署构建在合并基线前完成，PR 中已区分验证轮次。

## 文档提交检查

文档已同步网站最新 `main`，保留英文 README，并整理完整中英文开发插件章节、菜单、代码块样式和项目 Skill 迁移说明。`npm ci` 与文档构建通过，共 164 页；已在预览站检查插件结构页及目录树样式。源码 PR #11178 的依赖检查修复 `683c07fc8` 已推送，84 个包的依赖检查和 408 项仓库脚本测试通过；该结果不代表远端 CI 或 npm 发布已完成。
