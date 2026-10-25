---
title: nb-studio 命令
description: nb-studio 是 Studio 的命令行，主要给你的 Agent 用，例如 Claude Code、Codex。装好之后，它们能替你查询项目、新建任务、跟进进展、配置 Studio。脚本和 CI 也用它。
---

命令行本身不带业务命令：登录后，它向 Studio 询问你能用哪些命令，所以命令总和 Studio 的版本、你的权限一致。

## 安装和登录

最省事的方式：在 Studio 右上角账户菜单点「在 agent 中使用 Studio」，把「连接本地 Coding Agent」的配置指令交给你的 Coding Agent，它会安装 `nb-studio`、请你在浏览器里批准登录、安装技能。见 [在本地 Coding Agent 里使用 Studio](../join/local-agent.md)。

自己安装时，需要 Node.js 24 或更高版本：

```bash
curl -fsSL https://studio.example.com/main/api/agents/dist/installScript | sh -s -- --token <下载凭证>
nb-studio login --server https://studio.example.com/main
```

下载凭证在上面那段配置指令里，30 分钟内有效。`nb-studio login` 会显示一个验证码并打开批准页，核对验证码后点「批准」。登录 7 天内有效，常用就会自动续期。

| 命令 | 做什么 |
| --- | --- |
| `nb-studio login --server <地址>` | 登录。没有浏览器的机器加 `--no-browser`，在别处打开地址批准 |
| `nb-studio login --server <地址> --api-key-stdin` | 用你自己的 API 密钥登录，从标准输入读入 |
| `nb-studio whoami` | 当前登录的身份、服务器和权限 |
| `nb-studio skills install` | 为 Claude Code、Codex 安装 `nb-studio-cli` 技能 |
| `nb-studio docs` | 查看可用的命令和用法 |
| `nb-studio update` | 更新到 Studio 提供的版本，技能一起更新 |
| `nb-studio logout` | 退出登录 |

同时用几个 Studio 时，每个服务器是一个 profile：`nb-studio profile list`、`nb-studio profile use <名字>`。CI 里不登录，直接用环境变量 `NB_STUDIO_SERVER` 和 `NB_STUDIO_API_KEY`。

## 查找命令

- `nb-studio docs`：可用的命令；`nb-studio <命令> --help`：一条命令的参数。
- 加 `--json`，输出机器可读的结果，适合脚本和 Agent。
- 你的权限不够时，命令会说明需要哪项权限，而不是“找不到命令”。`nb-studio whoami --missing` 列出你缺少权限的命令。

## 主要的命令分组

| 分组 | 管什么 |
| --- | --- |
| `issue`、`comment`、`attachment` | 任务：搜索、查看、新建、更新状态、评论、附件 |
| `project`、`label` | 项目、项目的初始化和成员、标签 |
| `project-manager` | 调度 Agent 的设置；把任务交给调度 Agent 开始 |
| `agent`、`runtime`、`skill`、`variable` | Agent、运行环境和注册凭证、技能、变量与密钥 |
| `run`、`report` | 运行记录、仪表盘指标和用量 |
| `kb`、`memory` | 知识库、项目记忆 |
| `git`、`pr`、`commit` | Git 连接、仓库、个人授权、PR |
| `preview`、`app`、`deploy`、`env`、`release`、`build`、`registry` | 预览、应用、部署和部署申请、部署环境、版本、CI、镜像仓库 |
| `inbox`、`follow-up` | 收件箱、关注的任务 |
| `session`、`conversation` | 会话 |
| `user`、`access`、`api-key` | 账号和邀请、角色、API 密钥 |

## 只能在网页上做的事

下面这些没有命令。Agent 遇到时，`nb-studio-cli` 技能会告诉它请你在网页上的哪里操作：

| 事情 | 在哪里 |
| --- | --- |
| 批准 `nb-studio login` | 它打开的批准页 |
| 登录、找回密码、接受邀请 | 登录页、邀请链接 |
| 添加 GitHub App 连接 | 「设置 › 集成 › Git」 |
| 修改自己的密码 | 「个人设置 › 账号与安全」 |
| 语言、主题、提示音 | 「个人设置 › 偏好设置」 |

另外，验收任务、合并 PR、批准部署申请只能由人来做，Agent 的运行不能做这些。
