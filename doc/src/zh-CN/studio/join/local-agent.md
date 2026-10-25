---
title: 在本地 Coding Agent 里使用 Studio
nav: 在本地 Coding Agent 里使用
status: 待改写
description: 安装 nb-studio 命令行，让你终端里的 Claude Code、Codex 帮你查询项目、创建任务、分析问题。
---

`nb-studio` 是 Studio 的命令行。装好并登录后，你在终端里使用的 Claude Code、Codex 等就能以你的身份操作 Studio：查任务、建任务、写评论、读知识库。

它和 [我的会话](../use/sessions.md) 里的「我的 Agent」的区别：「我的 Agent」是在 Studio 页面里和你电脑上的 Agent 对话；`nb-studio` 是留在终端里，让 Agent 通过命令行操作 Studio。两者可以同时使用，连接电脑时也会装好 `nb-studio`。

## 安装与登录

1. 在 Studio 右上角点头像，选择「用本地 Coding Agent 管理 Studio」。
2. 复制页面生成的配置指令，交给你常用的编码工具（如 Claude Code、Codex）。
3. Agent 会按指令完成这些事：
   - 检查 Node.js 24 或更高版本和 npm，缺少时先征得你同意再安装；
   - 从你的 Studio 下载并安装 `nb-studio`；
   - 运行 `nb-studio login --server <Studio 地址>`，把登录地址和验证码告诉你，等你在浏览器里确认；
   - 运行 `nb-studio whoami` 确认身份，运行 `nb-studio docs` 了解可用命令；
   - 运行 `nb-studio skills install`，为编码工具安装使用 `nb-studio` 的技能。

配置指令里的安装链接 30 分钟内有效。`nb-studio` 只从你自己的 Studio 安装，版本和 Studio 保持一致。

> [!NOTE] 权限和你一样
> `nb-studio` 以你的身份工作，能用的命令由你在 Studio 里的权限决定。登录需要你在浏览器里确认。

## 可以让它做什么

装好之后，直接用自然语言告诉编码工具要做什么，它会调用 `nb-studio` 完成。几个例子：

```text
https://studio.example.com/main/issues/PUR-23
帮我分析一下这个任务卡在哪里，要怎么处理。只分析，不要改动。
```

```text
看看我在 Studio 里有哪些等我处理的任务，按紧急程度列出来。
```

```text
读一下 docs/supplier-rating.md，把里面的需求拆成任务，建到“供应商管理”项目里，先不要开始。
```

```text
在知识库里找一下采购审批的规定，告诉我 C 级供应商下单需要谁批准。
```

## 常用命令

一般不需要自己敲命令，了解几个有助于看懂 Agent 在做什么：

| 命令 | 作用 |
| --- | --- |
| `nb-studio whoami` | 当前登录的身份和权限 |
| `nb-studio docs` | 可用命令的说明 |
| `nb-studio <命令> --help` | 某个命令的详细用法 |
| `nb-studio issue get <任务>` | 读一个任务 |
| `nb-studio issue progress <任务>` | 任务现在在等什么 |
| `nb-studio issue comment add <任务>` | 在任务上发评论 |
| `nb-studio follow-up list` | 你负责和关注的任务，以及各自在等什么 |
| `nb-studio kb read <文档>` | 读一篇知识库文档 |

命令的完整列表见 [nb-studio 命令](../reference/cli.md)。
