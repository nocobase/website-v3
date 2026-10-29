---
title: 插件 Skill
description: 为 App 中的 Agent 描述插件的公开能力，并维护、同步和验证插件 Skill。
---

插件 Skill 是写给使用插件的 Agent 看的说明：插件有哪些已经实现的能力、从哪个公开入口调用、数据由谁维护，以及如何判断操作是否成功。它不负责实现功能，也不会自动注册插件。

本文介绍的是插件自身的使用说明。开发插件时使用的 `nocobase-app-plugin-development` 由 `@nocobase/app-skills` 提供；不要把它复制进业务插件，也不要占用这个保留的名称。

修改和维护插件源码时使用的 `AGENTS.md`，见 [插件开发指引（AGENTS.md）](plugin-development-guidance.md)。本篇面向的是使用插件能力的应用 Agent，介绍调用示例、分发与同步，以及实际的验证。

## 使用 Agent

```text
请为 notice-cli 插件编写 Skill，让 App 中的 Agent 能预览公告文本。
只描述已经实现的 preview 命令，写清输入、输出、错误和注册前提。
把 Skill 放在插件源码中，验证同步和实际调用，不要修改 App 里生成的副本。
```

## 哪些插件需要 Skill

当 Agent 需要经常调用接口、组装公开的组件、使用服务或诊断配置时，Skill 会很有帮助。如果插件只有一个普通页面，没有额外的接入步骤，就不必为了让目录齐全而写 Skill。

下面为 [命令行扩展](extend-command-line.md) 中的 `notice-cli` 添加说明。已有的插件直接增加 `skills/` 目录即可，不需要重新运行创建工具。新建插件时可以选择 `--with skills`，但生成的内容只是草稿，必须替换为真实的能力说明。

## 维护在插件源码中

Skill 在 App 中的位置为：

```text
packages/app-plugin-notice-cli/
├── cli/
├── skills/
│   └── nocobase-app-plugin-notice-cli/
│       └── SKILL.md
└── package.json
```

名称遵循包的归属：`@nocobase/app-plugin-notice-cli` 对应 `nocobase-app-plugin-notice-cli`。自定义的 scope 也保留在前缀中，例如 `@acme/app-plugin-notice-cli` 对应 `acme-app-plugin-notice-cli`。多个相互独立的任务，可以使用同一个前缀加不同的后缀，但不要占用其他包的名称。

请确保插件 `package.json` 的 `files` 包含 `skills`，同时保留 `dist`、README 等已有的条目。Skills 不需要经过 TypeScript 编译，但发布时必须被打进包中。

## 一份可执行的 Skill

新增 `skills/nocobase-app-plugin-notice-cli/SKILL.md`：

````markdown
---
name: nocobase-app-plugin-notice-cli
description: Preview notice text with the installed notice-cli plugin when checking whitespace or character counts. Does not save, publish or send notices.
---

# Preview notice text

Work from the target App root. This Skill describes the public CLI of the installed plugin; do not import its private source files.

## Prerequisites

The App depends on `@nocobase/app-plugin-notice-cli` and registers its `./cli` export in `cli/plugins.ts`. If the command is unavailable, check the installed package exports and registration before retrying.

## Preview

Run:

```bash
pnpm nocobase notice-cli preview --text "Hello" --json
```

The command trims surrounding whitespace, accepts 1–200 UTF-16 code units after trimming, and returns `result.text` plus `result.length` counted in Unicode code points. It creates no records and starts no App background services. For deployment-only use, run the built CLI entry instead of pnpm.

A successful result has `ok: true`, `result.text: "Hello"` and `result.length: 5`. Blank or oversized text returns `error.code: "INVALID_TEXT"` and a nonzero exit status. Report the error and correct the input; do not retry unchanged input.

This capability does not store, publish or send notices. Those actions need a separate implemented capability and the user’s request.
````

`description` 决定什么时候使用这项能力，正文说明最短的调用流程和结果。不要把插件源码的整套设计说明都搬进来；需要较长的 API schema 或排错表时，把它们拆到同目录的 `references/` 中，并在 `SKILL.md` 中链接过去。

## 写清公开入口和边界

| 应该说明 | 不应要求 App Agent 去做 |
| --- | --- |
| 公开的包导出、API 和 CLI 命令 | 导入插件私有的源码路径 |
| 认证身份、资源、操作和数据范围 | 用隐藏按钮代替服务端授权 |
| App 需要准备的数据、配置和注册 | 因为文件存在，就假设功能已经启用 |
| 稳定的错误码和结果 | 靠日志里的某一句话猜测操作是否成功 |
| 实际支持的能力 | 把尚未实现的设计写成可以调用的功能 |

公开组件被导入，并不代表 Client 插件工厂已经注册；Server 的 Token 必须从公开入口导入原始对象。这类容易出错的接入条件，应写在相应的 Skill 中，而不是让每个 App 去猜。

## 说明 UI 源码资产的用法

如果插件通过 shadcn UI Registry 提供源码资产，Skill 应说明：资产的本地构建方式和路径，或已发布的 URL；安装到 App 或插件中的方式；输入与依赖；以及如何接入插件的公开能力。本地资产可以直接添加，不需要先搭建 Registry 网站。Skill 还应给出可以修改的布局或交互示例和验证方法，让 Agent 能在目标项目中完成组合。

组件文件安装成功，并不代表服务端插件、语言资源或路由已经注册。请把这些前提写清楚，并说明安装后的源码由目标项目维护，升级插件包不会自动更新它。完整的示例见 [给 Agent 写使用说明](frontend-components.md#给-agent-写使用说明)。

## 同步到 App

在 App 根目录执行：

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-notice-cli
```

注册插件时，默认也会同步它的 Skills。同步结果位于 App 的 `.agents/skills/` 中，这里是生成的副本，而不是维护的源头；修改之后再次同步，会覆盖它。已有的 Agent 会话是否会自动重新加载，取决于所用的客户端，必要时请重新开始一个会话。

## 验证两件事

先确认同步的副本已经存在，再让 Agent 依据 Skill 执行 `preview --text Hello --json`，检查实际结果为 `Hello` 和长度 5。还要检查空文本会返回明确的错误，并且 Agent 不会把“预览”说成已经保存或发送了公告。

文件同步成功，只能证明说明已经送达，并不能证明其中的指令是正确的。发布时，用 `pnpm --filter @nocobase/app-plugin-notice-cli pack` 检查 tarball 中是否包含 `skills/` 和公开的运行时入口；跨 App 的安装见 [构建与发布](publish-plugin.md)。

以后公开的命令、参数、权限或返回值发生变化时，源代码、测试和插件 Skill 要一起更新。应用通过升级包并重新同步获得新版的说明，不要逐个去修补生成的副本。
