---
title: 连接自己的电脑
status: 待改写
description: 把自己的电脑连接到 Studio，在「我的会话」里和自己电脑上的编码工具讨论。
---

## 连接

使用「我的 Agent」之前，先把电脑连接到 Studio：

1. 打开「我的会话」，点「连接你的电脑」。
2. 复制页面上的配置指令，交给这台电脑上的编码工具（如 Claude Code、Codex）执行。它会安装 `nb-studio` 命令行、请你在浏览器里确认登录，并运行 `nb-studio acp service install`，让电脑开机后自动保持连接。
3. 回到 Studio，确认这台电脑显示在线。

::figure connect-computer | 把配置指令交给这台电脑上的编码工具执行

- 支持 Codex、Claude Code、Gemini CLI、GitHub Copilot、Cursor、OpenCode 等编码工具；电脑可以是 macOS、Linux 或 Windows。
- 默认允许 Agent 访问整个用户目录，可以在「我的电脑」里改成指定的目录。Agent 在这些目录里的权限，和你在自己终端里使用它时一样。
- 配置指令里的安装链接 30 分钟内有效，过期后重新生成即可。

## 计划包含

- 连接：复制配置指令交给电脑上的编码工具执行
- 允许访问的目录：「我的电脑」
- 临时连接与保持在线
- 断开和移除电脑
