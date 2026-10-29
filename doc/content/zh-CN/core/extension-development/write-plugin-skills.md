---
title: 插件 Skill
description: 为 App Agent 描述插件的公开能力，维护、同步并验证插件 Skill。
---

插件 Skill 是给使用插件的 Agent 的说明：有哪些已经实现的能力、从哪个公开入口调用、由谁维护数据，以及如何判断操作成功。它不负责实现功能，也不会自动注册插件。

本文编写的是插件自身的使用说明。开发插件时使用的 `nocobase-app-plugin-development` 由 `@nocobase/app-skills` 提供；不要把它复制进业务插件，也不要占用这个保留名称。

修改和维护插件源码时使用的 `AGENTS.md`，见[插件开发指引（AGENTS.md）](plugin-development-guidance.md)。本篇继续面向使用插件能力的应用 Agent，介绍调用示例、分发同步和实际验证。

## 使用 Agent

```prompt
请为 notice-cli 插件编写 Skill，让 App 中的 Agent 能预览公告文本。
只描述已经实现的 preview 命令，写清输入、输出、错误和注册前提。
把 Skill 放在插件源码中，验证同步和实际调用，不要修改 App 里生成的副本。
```

## 哪些插件需要 Skill

需要 Agent 经常调用接口、拼装公开组件、使用服务或诊断配置时，Skill 很有帮助。只有一个普通页面、没有额外接入步骤的插件，不必为了目录齐全而写 Skill。

下面为[命令行扩展](extend-command-line.md)中的 `notice-cli` 添加说明。已有插件直接增加 `skills/`，不需要重新运行创建工具。新建时可以选择 `--with skills`，但生成内容只是草稿，必须替换成真实能力。

## 维护在插件源码里

在 App 中的位置为：

```text
packages/app-plugin-notice-cli/
├── cli/
├── skills/
│   └── nocobase-app-plugin-notice-cli/
│       └── SKILL.md
└── package.json
```

名称遵循包归属：`@nocobase/app-plugin-notice-cli` 对应 `nocobase-app-plugin-notice-cli`。自定义 scope 也保留在前缀里，例如 `@acme/app-plugin-notice-cli` 对应 `acme-app-plugin-notice-cli`。多个独立任务可以使用同一前缀加后缀，但不要占用其他包的名称。

确保插件 `package.json` 的 `files` 包含 `skills`，同时保留 `dist`、README 等已有条目。Skills 不需要 TypeScript 编译，但发布时必须进入包。

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

`description` 决定什么时候使用这项能力，正文说明最短调用流程和结果。不要把整个插件源码设计说明搬进去；需要较长 API schema 或排错表时，拆到同目录的 `references/`，并从 `SKILL.md` 链接过去。

## 写清公开入口和边界

| 应说明 | 不应要求 App Agent 做 |
| --- | --- |
| 公开包导出、API、CLI 命令 | 导入插件的私有源码路径 |
| 认证身份、资源、操作和数据范围 | 通过隐藏按钮代替服务端授权 |
| App 要准备的数据、配置和注册 | 根据文件存在就假设功能已启用 |
| 稳定错误码和结果 | 靠日志中某一句话猜操作成功 |
| 实际支持的能力 | 将尚未实现的设计写成可调用功能 |

公开组件被导入，不代表 Client 插件工厂已注册；Server Token 必须从公开入口导入原始对象。这类容易出错的接入条件应放在相应 Skill，而不是让每个 App 猜测。

## 说明 UI 源码资产的用法

插件通过 shadcn UI Registry 提供源码资产时，Skill 应说明本地构建与资产路径，或已发布的 URL，以及安装到 App 或插件的方式、输入与依赖、如何接入插件的公开能力。本地资产可以直接 Add，无需先搭建 Registry 网站。还应给出可修改的布局或交互示例和验证方法，让 Agent 能在目标项目中完成组合。

组件文件安装成功，不代表服务端插件、语言资源或路由已经注册。把这些前提写清楚，并说明安装后的源码由目标项目维护，升级插件包不会自动更新它。完整示例见[发布 UI 源码资产](frontend-components.md#给-agent-写使用说明)。

## 同步到 App

在 App 根目录执行：

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-notice-cli
```

注册插件默认也会同步其 Skills。同步结果位于 App 的 `.agents/skills/`，这里是生成副本，不是维护源；修改后再次同步会覆盖它。已有 Agent 会话是否自动重新加载取决于客户端，需要时重新开始会话。

## 验证两件事

先确认同步副本存在，再让 Agent 依据 Skill 执行 `preview --text Hello --json`，检查实际结果为 `Hello` 和长度 5。还要检查空文本返回明确错误，并且 Agent 不把“预览”说成已经保存或发送公告。

文件同步成功只证明说明送达，不证明指令正确。发布时用 `pnpm --filter @nocobase/app-plugin-notice-cli pack` 检查 tarball 中的 `skills/` 和公开运行时入口；跨 App 安装见[构建与发布](publish-plugin.md)。

以后公开命令、参数、权限或返回值变化时，源代码、测试和插件 Skill 一起更新。应用通过升级包并同步获得新版说明，不要逐个修补生成副本。
