---
title: 连接 Git
status: 待改写
description: 在「设置 › 集成 › Git」连接团队的 GitHub 或 GitLab，Studio 和 Agent 才能访问代码仓库。
---

## 添加连接

1. 打开「设置 › 集成 › Git」，点「添加连接」。
2. 选择 GitHub 或 GitLab：
   - **GitHub**：Studio 会替你创建一个 GitHub App。选择 App 属于你的账号还是某个组织（GitHub Enterprise Server 需要填写服务器地址），在 GitHub 上确认创建，再把 App 安装到需要的仓库或整个组织。
   - **GitLab**：填写实例地址（默认 gitlab.com）和一个群组访问令牌，令牌需要 `api` 权限，角色建议为 Developer。
3. 确认「Webhooks」设置。GitHub 或 GitLab 能访问到你的 Studio 时保持开启；Studio 只在内网时关掉，Studio 会每 60 秒轮询一次。


> [!NOTE] 记得保护默认分支
> Studio 不替你保护分支。请在 GitHub 或 GitLab 上为仓库的默认分支开启保护规则。


**完成的标志**：「设置 › 集成 › Git」里的连接显示已连接。

## 计划包含

- 添加 GitHub App 连接
- 添加 GitLab 连接
- Webhook 与轮询
- 需要的权限与常见错误
