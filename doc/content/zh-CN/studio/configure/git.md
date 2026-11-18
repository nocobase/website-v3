---
title: 代码平台
description: 连接团队的 Git 平台，配置仓库访问和状态同步。
---

管理员在「设置 › Git」管理团队连接。项目通过连接访问仓库、创建 PR 和读取检查结果。成员的个人 Git 授权另见[登录与个人设置](../join/sign-in.md)。

![管理团队的代码平台连接](https://static-docs.nocobase.com/studio-zh-git-20261111-normal-2x.webp)

## 接入并验证仓库

1. 在「设置 › Git」添加平台连接。保存后，检查连接卡片上的组织或群组。
2. 打开项目的「设置 › 代码仓库」，从这条连接选择仓库。多个群组共用一台 Git 服务器时，可展开连接卡片上的仓库列表，核对项目用了哪条连接。
3. 打开初始化任务或下一次开发任务。执行机成功检出仓库后，检查任务关联的 PR 或 MR 是否指向预期仓库。使用平台 CI 时，再打开一次流水线和作业日志。

## GitHub

使用 GitHub App 连接 GitHub 或 GitHub Enterprise Server。创建和安装步骤见[连接 Git 平台](../setup/git.md)。

| 仓库访问范围 | 适用情况 |
| --- | --- |
| All repositories | 需要由 Studio 创建新仓库 |
| Only select repositories | 只接入指定的已有仓库 |

已有 GitHub App 可手动填写配置。同一个 App 的其他安装通过「添加安装」接入。新增仓库未出现在 Studio 时，先检查 App 的安装账号和仓库授权。

## GitLab

以仓库 `https://git.example.com/gitlab/inventory-team/warehouse.git` 为例：

| Studio 字段 | 填写示例 |
| --- | --- |
| 主机 | `https://git.example.com/gitlab`，保留 GitLab 的部署路径 |
| 群组 | `inventory-team`，使用仓库所属群组的 URL 路径。子群组填写完整路径，如 `inventory-team/apps` |
| 连接名称 | 取一个便于识别的名称，如“库存团队” |

创建群组令牌需要该群组的 Owner 权限。使用 GitLab.com 时，此功能需要 Premium 或 Ultimate 套餐。[GitLab 群组访问令牌](https://docs.gitlab.com/user/group/settings/group_access_tokens/)

1. 在 GitLab 打开目标群组，进入 **Settings › Access tokens**，点 **Add new token**。令牌名称可自定。

   ![在目标群组的访问令牌页添加令牌](/assets/studio/group-token-settings.webp)

2. 选择 `api` 范围。推送开发分支、创建 MR 和读取流水线可用 Developer 角色。需要 Studio 自动创建仓库 Webhook 时，选择 Maintainer。

   ![自动创建 Webhook 时选择 Maintainer，同时勾选 api](/assets/studio/group-token-permissions.webp)

3. 在 Studio 添加 GitLab 连接，填入实例地址、群组路径和刚创建的令牌。保存后核对群组及到期时间，再到项目中关联仓库。

   ![填写 GitLab 主机地址与群组的完整路径](/assets/studio/studio-gitlab-zh.webp)

成员需要以自己的身份操作时，可在个人设置中连接 Git 账号。已连接的个人账号也需要相应的仓库权限。

## Gitee

使用有仓库权限的账号创建私人令牌，选择 `user_info`、`projects`、`pull_requests` 和 `hook`。在 Studio 添加 Gitee 连接并保存凭据。目前支持 gitee.com，合并使用 squash。

## Gitea

添加 Gitea 连接，填写实例地址和专用账号的个人访问令牌。地址包含部署路径，不包含 `/api/v1`。

令牌需要 `write:user`、`write:organization`、`write:repository` 和 `write:issue`。账号还必须有目标仓库的访问权限；创建 Webhook 需要仓库管理员权限。仓库需启用 squash 合并。

成员可在「个人设置 › Git」填写个人令牌。需要浏览器授权时，在 Gitea 创建 OAuth2 应用，并将 Studio 表单显示的回调地址、客户端 ID 和密钥配好。执行机使用官方 `gt` CLI。

## Webhook 与轮询

代码平台能访问 Studio 的 HTTPS 地址时，可开启 Webhook 接收事件。只有内网或本机地址时关闭 Webhook，Studio 每分钟查询 PR 和检查结果。

连接卡片显示连接状态、仓库数和 Webhook 状态。凭据过期前更新连接；已有仓库的接入见[项目设置](../project/settings.md#接入已有仓库)。
