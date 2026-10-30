---
title: 代码平台
description: 连接 GitHub、GitLab 或 Gitee，让 Studio 访问仓库、跟踪 PR 和检查结果。
---

管理员在「设置 › 集成 › Git」添加连接。项目使用这个连接访问代码仓库，Agent 通过它提交改动和创建 PR。

## 连接 GitHub

Studio 使用 GitHub App 访问仓库。创建 App 和安装到组织，分别需要对应账号或组织的权限。

1. 点「添加连接」，选择「GitHub」。
2. 选择 App 的所有者。使用组织时填写组织名称；使用 GitHub Enterprise Server 时填写服务器地址。
3. 设置 Webhook。Studio 只有内网或 `localhost` 地址时，关闭 Webhook。
4. 点「在 GitHub 上创建」，在 GitHub 页面为 App 命名并确认创建。
5. 将 App 安装到目标账号或组织。「Repository access」选择「All repositories」，让 Studio 能访问随后创建的新仓库。
6. 返回 Studio，确认连接显示「已连接」。

![添加 GitHub 连接：选择组织，本机试用关闭 Webhook](https://static-docs.nocobase.com/studio-zh-setup-github-connection-full-1440x900-20261030.png)

「All repositories」允许 App 访问该账号或组织当前及以后新建的仓库。请在安装时核对 GitHub 展示的权限。

只接入已有仓库时，可以选择「Only select repositories」。这种范围不能直接完成本文后续的新建仓库流程，已有项目的接入方式见[项目设置](../project/settings.md#接入已有仓库)。

已经创建过 GitHub App，可以选择「已有 GitHub App？手动填写」。同一个 App 的其他安装，通过「添加安装」接入。

> [!NOTE] 仓库已创建，但项目没有创建成功
> 如果 App 只被授权访问选定仓库，Studio 可能无法访问它刚创建的新仓库。先修正 App 的访问范围。已经创建的仓库可以按[接入已有仓库](../project/settings.md#接入已有仓库)处理；不要用同名仓库重复创建。

## 连接 GitLab

1. 在目标群组创建访问令牌，权限范围选择 `api`，角色选择 Developer。
2. 在 Studio 点「添加连接」，选择「GitLab」。
3. 填写 GitLab 地址和访问凭据，保存。

Studio 会检查凭据的群组、权限和到期时间。Developer 可以推送分支、创建合并请求和查看流水线。自动创建 Webhook 需要 Maintainer；使用 Developer 时，Studio 定时查询状态。

## 连接 Gitee

1. 使用有仓库访问权限的账号创建私人令牌。
2. 勾选 `user_info`、`projects`、`pull_requests` 和 `hook` 权限。
3. 在 Studio 点「添加连接」，选择「Gitee」，填写凭据并保存。

目前支持 gitee.com。Studio 在 Gitee 上使用压缩合并（squash）。

## Webhook 与轮询

| Studio 的访问地址 | 设置 | 状态更新方式 |
| --- | --- | --- |
| 代码平台可访问的 HTTPS 地址 | 开启 Webhook | 接收 PR 和检查结果的事件通知 |
| 内网或 `localhost` 地址 | 关闭 Webhook | 每分钟查询一次 PR 和检查结果 |

GitHub 创建 App 时会检查 Webhook 地址是否可达。本机试用必须关闭；以后有了可访问的地址，再开启。

## 检查连接

连接卡片应显示「已连接」、可访问的仓库数和 Webhook 状态。创建项目时，应能选到目标仓库。

![GitHub App 已连接到组织](https://static-docs.nocobase.com/studio-zh-setup-github-connected-full-1440x900-20261030.png)

GitLab 和 Gitee 的凭据有有效期时，需要在到期前更新。成员也可以[连接自己的 Git 账号](../join/sign-in.md#连接自己的-git-账号)，让 Agent 以成员身份提交 PR。

