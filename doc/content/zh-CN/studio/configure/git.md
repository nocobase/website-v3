---
title: 代码平台
description: 连接团队的 Git 平台，配置仓库访问和状态同步。
---

管理员在「设置 › Git」管理团队连接。项目通过连接访问仓库、创建 PR 和读取检查结果。成员的个人 Git 授权另见[登录与个人设置](../join/sign-in.md)。

![管理团队的代码平台连接](https://static-docs.nocobase.com/studio-zh-guide-git-20261031.png)

## GitHub

使用 GitHub App 连接 GitHub 或 GitHub Enterprise Server。创建和安装步骤见[连接 Git 平台](../setup/git.md)。

| 仓库访问范围 | 适用情况 |
| --- | --- |
| All repositories | 需要由 Studio 创建新仓库 |
| Only select repositories | 只接入指定的已有仓库 |

已有 GitHub App 可手动填写配置。同一个 App 的其他安装通过「添加安装」接入。新增仓库未出现在 Studio 时，先检查 App 的安装账号和仓库授权。

## GitLab

1. 在目标群组创建访问令牌，选择 `api` 范围和 Developer 角色。
2. 在 Studio 添加 GitLab 连接，填写服务器地址和凭据。
3. 保存后检查群组、权限和到期时间。

Developer 可推送分支、创建合并请求和读取流水线。自动创建 Webhook 需要 Maintainer；否则可使用定时查询。

## Gitee

使用有仓库权限的账号创建私人令牌，选择 `user_info`、`projects`、`pull_requests` 和 `hook`。在 Studio 添加 Gitee 连接并保存凭据。目前支持 gitee.com，合并使用 squash。

## Webhook 与轮询

代码平台能访问 Studio 的 HTTPS 地址时，可开启 Webhook 接收事件。只有内网或本机地址时关闭 Webhook，Studio 每分钟查询 PR 和检查结果。

连接卡片显示连接状态、仓库数和 Webhook 状态。凭据过期前更新连接；已有仓库的接入见[项目设置](../project/settings.md#接入已有仓库)。
