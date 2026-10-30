---
title: 连接 Git 平台
description: 以 GitHub 为例连接代码平台，让 Studio 创建仓库并提交代码。
---

连接 Git 平台后，Studio 可以创建仓库，Agent 可以提交代码和创建 PR。

本文以 GitHub 为例。GitLab、Gitee 等平台的接入方式，见[代码平台配置](../configure/git.md)。

## 连接 GitHub

1. 打开「设置 › 集成 › Git」，点「添加连接」，选择「GitHub」。
2. 选择「我的账号」或「组织」。使用组织时填写组织名称。
3. 本机试用关闭 Webhook，Studio 会定时查询 PR 和检查结果。
4. 点「在 GitHub 上创建」，为 App 命名并确认创建。
5. 将 App 安装到目标账号或组织。「Repository access」选择「All repositories」，以便访问接下来新建的仓库。
6. 返回 Studio。

![添加 GitHub 连接：选择组织，本机试用关闭 Webhook](https://static-docs.nocobase.com/studio-zh-setup-github-connection-full-1440x900-20261030.png)

「All repositories」覆盖当前和以后新建的仓库。安装时核对 GitHub 展示的权限；创建 App 和安装到组织，需要对应账号或组织的权限。

## 检查连接

连接卡片应显示「已连接」和可访问的仓库数量。

![GitHub App 已连接到组织](https://static-docs.nocobase.com/studio-zh-setup-github-connected-full-1440x900-20261030.png)

接着[接入运行环境](shared-runtimes.md)。

已有 App、仅授权选定仓库、Webhook 和其他 Git 平台的设置，见[代码平台](../configure/git.md)。
