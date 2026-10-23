---
title: 核心概念
description: 用一张图和十个概念说明一个 NocoBase 3 应用怎样构成：代码在哪里、Core 怎样进入应用、Agent 怎样学会使用它、上线后谁在哪里调整。
---

## 一张图看懂

<figure class="map" aria-label="一个 NocoBase 3 应用的构成">
<div class="row c2"><div class="box human"><b>人</b><span>提需求、验收；上线后在「系统设置」里管理</span></div><div class="box agent"><b>Agent</b><span>读技能，在应用的代码仓库里开发</span></div></div>
<div class="down">都在同一个应用里工作</div>
<div class="row"><div class="box brand"><b>应用 · 你的代码仓库</b><span>用模板创建。页面、接口、数据表、迁移、流程、「系统设置」里的管理页面都在这里，归你所有</span></div></div>
<div class="down">依赖 Core 的包</div>
<div class="row c3"><div class="box"><b>插件</b><span>登记在插件清单里，带来服务端能力、页面、组件、技能或命令</span></div><div class="box"><b>基础库</b><span>直接使用：数据库、记录生命周期、后台任务、存储</span></div><div class="box"><b>UI 组件库</b><span>复制进应用源码，之后归应用所有</span></div></div>
<div class="row c3"><div class="box"><b>技能</b><span>随包发布，同步到 <code>.agents/skills/</code>，教 Agent 怎样用</span></div><div class="box"><b>命令行</b><span><code>pnpm nocobase</code>：配置、数据库、插件、技能</span></div><div class="box"><b>运行时</b><span>应用的服务端和浏览器端框架</span></div></div>
<div class="down">部署后运行</div>
<div class="row"><div class="box"><b>运行中的应用</b><span>读取服务器上的 <code>config.yml</code>；「应用底座」显示它用到的 Core 能力</span></div></div>
</figure>

下面按这张图逐个说明。

## 应用

应用是一份代码仓库，用 NocoBase 的模板创建，部署后就是一个业务系统。它的主要目录：

| 目录 | 放什么 |
| --- | --- |
| `client/` | 浏览器端：路由、页面、组件、多语言文案；`client/plugins.ts` 登记浏览器端插件 |
| `server/` | 服务端：接口、服务；`server/plugins.ts` 登记服务端插件 |
| `database/` | 迁移和初始数据 |
| `cli/` | 应用自己的命令；`cli/plugins.ts` 登记带命令的插件 |
| `tests/` | 测试 |
| `AGENTS.md`、`.agents/` | 给 Agent 看的规则和技能 |
| `config.example.yml` | 配置项说明；真正的 `config.yml` 含密钥，不进仓库 |

**谁拥有什么：**页面、组件、接口、数据表、迁移、服务、翻译、测试、导航、主题和业务逻辑归应用。插件拥有自己的路由、组件、服务和内部数据表，应用只通过插件公开的接口使用它们，不改插件的代码，也不直接写插件的数据表。

## 模板

模板是创建应用的起点。默认模板生成的应用已经带有：

- 登录、注册、找回密码页面，以及命令行登录时用的设备确认页；
- 首页：介绍怎样和 Agent 一起开发，列出内置能力和提示词；
- 收件箱：站内信；
- 准备好但还没启用的管理页面：「用户管理」「角色与权限」「默认数据范围」，应用开始开发业务时由 Agent 启用；
- 「系统设置 › 应用底座」，只有拥有全部权限的管理员能看到；
- 16 个已注册的插件，以及 Agents、知识库两个已安装但未注册的插件。

::figure core-app-home | 新应用的首页：说明怎样和 Agent 一起开发，“内置能力”的每一项都附带可以复制的提示词

另有一个示例模板，带有可以运行的示例：文章管理、后台任务与队列、定时任务、记录生命周期和建在它上面的办公流程、实时更新、命令行、业务 Agent 等，给人和 Agent 参考。升级 NocoBase 时，应用对照新版本的模板合并变化，见 [升级 NocoBase](../develop/upgrade.md)。

## 插件

插件是名为 `@nocobase/app-plugin-*` 的包，登记在应用的三个插件清单里：`server/plugins.ts`、`client/plugins.ts`、`cli/plugins.ts`。出现在清单里就启用，删掉就停用。

一个插件可能给应用带来五样东西：服务端能力、自带的页面、UI 组件、技能和命令。大多数插件不带页面，这是 NocoBase 3 和 2 最大的不同之一，详见 [插件怎样工作](how-plugins-work.md)。

## 基础库

有些能力不需要注册，应用直接引用就能用，叫基础库。例如：

- **记录生命周期**（`@nocobase/lifecycle`）：采购订单从草稿到完成的流程就用它写；
- **数据库**（`@nocobase/db`）：数据表、查询、迁移，以及 SQLite、PostgreSQL、MySQL 等数据库方言；
- **后台任务和队列**（`@nocobase/jobs`、`@nocobase/queue`）：定时和后台执行；
- **存储**（`@nocobase/drive`）：本地、S3 兼容存储和阿里云 OSS。

## UI 组件库

UI 组件库（[ui.nocobase.com](https://ui.nocobase.com)）发布 NocoBase 的业务组件，例如数据表格、看板、富文本编辑器、流程图、「流程管理」页面、收件箱、审批进度。Agent 安装一个组件时，它的源码被复制进应用（`client/components/` 或 `client/extensions/`），之后归应用所有：可以改，也不会被自动更新。

所以应用的界面有三个来源：插件自带的页面、UI 组件库的组件、Agent 为你的业务写的页面。三者用同一套样式，看起来是一个整体。

## 技能

技能是教 Agent 做事的说明（`SKILL.md`）。NocoBase 的包随附各自的技能，例如应用开发技能 `nocobase-app-development`、权限插件的 `nocobase-app-plugin-authorization`。安装依赖后，模板会自动运行 `pnpm nocobase skills sync`，把技能同步到应用的 `.agents/skills/`，Claude Code 等编码工具在新会话里读取它们。

- `.agents/skills/` 是生成的，下次同步会整体替换，不要修改。
- 应用自己的约定写在 `.agents/rules/` 里，由 `AGENTS.md` 索引，提交到代码仓库。
- 创建应用之前用的两个技能（`nocobase-create-app`、`nocobase-app-installer`）需要先全局安装，见 [快速开始](../quickstart.md)。

技能是给 Agent 的，文档是给人的。想知道 Agent 为什么这样做，可以直接读对应的技能。

## 命令行

应用自带命令行 `pnpm nocobase`，Agent 和人都用它：

| 要做的事 | 命令 |
| --- | --- |
| 生成和检查配置 | `pnpm nocobase config init`、`config set`、`config check` |
| 执行迁移 | `pnpm nocobase db apply` |
| 注册、更新、移除插件 | `pnpm nocobase plugin register`、`plugin update`、`plugin unregister` |
| 同步技能 | `pnpm nocobase skills sync` |

完整列表见 [命令行参考](../reference/cli.md)。

## 配置

部署相关的设置写在应用目录的 `config.yml` 里：对外地址、数据库连接、密钥、存储、邮件服务商、后台任务用内存还是 Redis 等。它含有密钥，不进代码仓库；`config.example.yml` 说明每一项的作用。用 `pnpm nocobase config` 命令生成和检查，敏感值从环境变量读取。

## 系统设置

「系统设置」是应用里的管理入口。Agent 交付一个完整的应用时，默认会把管理页面做进这里，你不需要单独提出：

- 「用户管理」和「权限管理」（「角色与权限」「默认数据范围」）；
- 用到流程时，「流程管理」：流程列表、执行记录、流程图和流程参数；
- 用到定时任务、通知时，对应的任务列表、执行记录和投递记录；
- 「应用底座」。

::figure core-settings | 采购应用的侧边栏：业务页面在上，「系统设置」里是管理页面。具体有哪些，取决于应用用到的能力

只有首页的新应用不显示这些页面，开始开发业务后由 Agent 按需启用。

## 应用底座

「系统设置 › 应用底座」列出这个应用实际用到的 Core 能力，按 13 类点亮：在用、已就绪待配置、尚未使用。点开一项，可以看到它在本系统里做了什么、关联哪些业务模块、由哪些包提供。页面下方还有“业务模块与底座能力”的对照表。

::figure core-foundation | 「应用底座」：13 类能力里有 9 类在用。选中“工作流与审批”，看到它支撑采购订单的流程和每日提醒

判断依据是应用实际的接入情况：只安装了包不算在用，配置了、被页面或接口用到才算。只有拥有全部权限的管理员能打开这个页面。

## 四层分工

一项能力落到应用里，分四层。读能力页、写需求、做验收时，都按这四层想：

| 层次 | 谁负责 | 采购应用里的例子 |
| --- | --- | --- |
| 开箱即有 | Core | 权限检查、流程运行时、文件存储、通知发送 |
| 在应用里实现 | Agent | 采购订单的流程、“采购员只看自己的订单”、订单详情里的附件区 |
| 上线后调整 | 应用管理员，在「系统设置」里 | 给人分配角色、调整数据范围、改审批金额阈值、暂停某个定时任务 |
| 部署时配置 | 运维，在 `config.yml` 里 | 数据库、对象存储、邮件服务商、后台任务用 Redis |

第二层的改动要改代码、重新部署；第三层的改动在应用里保存就生效。哪些值放在第三层，是需求的一部分：上线后可能要调的，提需求时说出来，Agent 会把它做成管理员可以调整的参数。
