---
title: 在本地 Coding Agent 中使用 Studio
description: 通过 nb-studio，让本地 Claude Code、Codex 查询项目、创建任务和跟进结果。
---

安装 `nb-studio` 后，你可以留在本地 Claude Code、Codex 等工具中管理 Studio。Agent 通过命令行查询任务、读取资料、创建需求和添加评论。任务开发仍可交给 Studio 的运行环境。

## 安装与登录

1. 在 Studio 右上角头像菜单中，选择「用本地 Coding Agent 管理 Studio」。
2. 复制配置指令，交给常用的 Coding Agent。
3. Agent 安装 CLI 后，打开它提供的地址，在浏览器中确认登录。
4. Agent 确认当前身份，并安装 CLI 使用技能。

![复制 Studio 生成的配置指令，交给本地 Coding Agent](https://static-docs.nocobase.com/studio-zh-guide-local-agent-20261031.png)

需要 Node.js 24 或更高版本和 npm。安装包从自己的 Studio 下载，与服务器版本保持一致。安装链接有效期为 30 分钟，过期后重新获取。

`nb-studio` 使用你的账号权限。登录命令需保持运行，直到浏览器授权完成。

## 发出请求

```prompt
看看我在 Studio 里有哪些等我处理的任务，按紧急程度列出来。
```

```prompt
阅读 docs/supplier-rating.md，把其中的需求建到“供应商管理”项目，先不要开始。
```

```prompt
看看 PUR-23 现在卡在哪里，告诉我需要补充什么信息。
```

也可以把 Studio 的任务链接直接交给 Agent。

## 检查连接

```bash
nb-studio whoami
nb-studio docs
```

`whoami` 显示当前身份，`docs` 列出当前服务器提供的命令。完整用法见 [nb-studio 命令](../reference/cli.md)。

若想在 Studio 网页中与 Agent 对话，使用 [Runner Agent](runner-agent.md) 或[连接自己的电脑](connect-computer.md)。
