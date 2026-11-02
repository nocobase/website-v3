---
title: 连接自己的电脑
description: 在 Studio 的我的 Agent 中使用自己电脑上的编码工具。
---

连接电脑后，可以在 Studio 的「My Agent」中与这台电脑上的编码工具对话，访问允许的本地目录。

如果只想通过本地终端管理 Studio，使用 [nb-studio](local-agent.md)。要让机器领取任务队列中的工作，应[接入运行环境](personal-runtime.md)。

## 连接

1. 在自己的电脑上安装并登录编码工具，例如 Claude Code 或 Codex。
2. 打开 Studio「我的会话」，切换到「My Agent」。
3. 点「连接你的电脑」，将配置指令交给这台电脑上的 Coding Agent。
4. 按 Agent 给出的地址完成浏览器登录确认。
5. 返回 Studio，在「我的电脑」中确认连接和可用工具。

![连接电脑后，可在我的 Agent 中使用本机编码工具](https://static-docs.nocobase.com/studio-zh-guide-connect-computer-20261031.png)

配置指令安装 `nb-studio` 和后台连接服务，需 Node.js 24 或更高版本。支持 macOS、Linux 和 Windows。安装链接 30 分钟后失效，过期可重新生成。

## 选择允许的目录

在「我的电脑」中设置 Agent 可以使用的目录。默认允许整个用户目录，可缩小到指定的工作目录。开始会话时，再选择实际使用的目录和编码工具。

Agent 在这些目录中的访问权限与运行它的系统用户一致。需要隔离项目时，使用单独的系统用户或虚拟机。

## 连接中断时

电脑休眠、关机或服务停止后，会话无法继续执行。先恢复网络和后台服务，再回到会话检查状态。关闭浏览器不会替你停止电脑上的执行。

不再使用某台电脑时，在「我的电脑」中移除连接，并让本地 Agent 卸载后台服务。已有会话记录仍可查看。
