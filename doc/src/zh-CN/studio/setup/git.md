---
title: 连接 Git
description: 在「设置 › 集成 › Git」连接 GitHub、GitLab 或 Gitee，Studio 才能新建和读取代码仓库，Agent 才能开 PR。
---

Studio 通过 Git 连接访问代码托管平台：新建仓库、读取仓库、跟踪 PR 和检查结果、在 Studio 里合并。没有 Git 连接时，项目也能建，但没有 PR、检查和预览。

## 连接 GitHub

Studio 会在 GitHub 上替你创建一个 GitHub App，所需的权限都已经填好。你在 GitHub 上确认创建，再把它安装到你的账号或组织上。

1. 打开「设置 › 集成 › Git」，点「添加连接」，选「GitHub」。
2. 「App 的所有者」选「我的账号」或「组织」。用自己部署的 GitHub Enterprise Server 时，选它并填写服务器地址。
3. 设置「Webhook」，见下文 [要不要开 Webhook](#要不要开-webhook)。
4. 点「在 GitHub 上创建」。在 GitHub 上为 App 命名，确认创建。
5. 接着把 App 安装到账号或组织上。「Repository access」选「All repositories」，Studio 才能访问它新建的仓库。
6. 安装完成后回到 Studio，「设置 › 集成 › Git」里会出现这个连接。

已经有 GitHub App 的，点「已有 GitHub App？手动填写」。一个 App 可以安装到多个账号或组织上，在连接里点「添加安装」。

> [!NOTE] 只给 App 部分仓库的权限
> 安装时选了「Only select repositories」，Studio 新建的仓库它访问不到，新建项目时会提示“仓库已创建，但尚未确认 App 的访问权限”。这时到 GitHub 上 App 的安装设置里，把新仓库加进去，再新建项目，选「已有仓库」。

## 连接 GitLab

1. 在 GitLab 上，为要使用的群组创建一个群组访问令牌：权限范围选 `api`，角色选 Developer。
2. 在「设置 › 集成 › Git」点「添加连接」，选「GitLab」，填写实例地址（默认是 gitlab.com）和这个令牌。

Studio 保存时会检查令牌的权限、到期时间、群组和角色，有问题会直接指出。Developer 角色的令牌，Agent 能在群组的所有项目里推送分支、开合并请求、查看和重跑流水线，不能改项目设置和受保护的分支。要让 Studio 自动创建项目的 Webhook，角色需要 Maintainer；用 Developer 时，Studio 改为定时查询。

令牌到期后，以这个连接身份进行的运行都会失败，记得在到期前更换。

## 连接 Gitee

Studio 支持 gitee.com。用个人账号或专门的机器人账号生成一个私人令牌，勾选 `user_info`、`projects`、`pull_requests` 和 `hook` 权限，这个账号还要有对应仓库和组织的权限。在「设置 › 集成 › Git」点「添加连接」，选「Gitee」，填入令牌。

Studio 在 Gitee 上合并 PR 时，总是使用压缩合并（squash）。

## 要不要开 Webhook

| 你的 Studio | Webhook | 效果 |
| --- | --- | --- |
| 有公网能访问的 HTTPS 地址 | 打开 | 代码托管平台把 PR 和检查结果实时推送给 Studio |
| 只在内网，或者还在试用，地址是 `localhost` | 关闭 | Studio 不创建 Webhook，每分钟查询一次 PR 和检查结果 |

Studio 只在内网时一定要关掉。GitHub 不接受它访问不到的 Webhook 地址，开着 Webhook 创建 App，GitHub 会报错 “Hook url is not supported because it isn't reachable over the public Internet”。之后 Studio 有了公网地址，可以再打开。

## 成员用自己的账号

每位成员可以在「个人设置 › Git」连接自己在代码托管平台上的账号。连接后，Agent 为这位成员开的 PR、这位成员在 Studio 里的合并，都以本人的身份进行；没有连接时，使用这里的 Git 连接。见 [连接自己的 Git 账号](../join/sign-in.md#连接自己的-git-账号)。

- GitHub 上，成员可以登录授权，也可以用验证码连接。用验证码需要在 GitHub 上 App 的设置里开启 “Enable Device Flow”。
- 每个连接都可以设置是否允许成员使用个人令牌，默认允许。

## 确认连接成功

「设置 › 集成 › Git」里出现这个连接，显示「已连接」、它能访问的仓库数，以及 Webhook 的状态，例如「Webhook 已关闭，Studio 轮询」。

> [!NOTE] 记得保护默认分支
> Studio 不替你保护分支。请在 GitHub、GitLab 或 Gitee 上为默认分支开启保护规则，例如合并前必须通过检查。

接着 [接入共享运行环境](shared-runtimes.md)。
