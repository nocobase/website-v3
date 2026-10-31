---
title: 创建首个项目
description: 为项目连接代码仓库，使用 NocoBase 应用模板初始化，准备接收业务需求。
---

先完成[Git 平台连接](git.md)和[Agent 配置](agents.md)。至少有一台在线运行环境，已安装 Node.js 24 和 pnpm 11。

团队成员都可以创建项目，创建者默认成为项目负责人。先确认 GitHub App 安装范围为「All repositories」，见[连接 GitHub](git.md#连接-github)。

## 填写项目信息

1. 打开「开发 › 项目」，点「新建项目」。
2. 填写名称和描述。例如名称为「供应商管理」，描述为「管理供应商档案、评分和采购审批」。
3. 「代码位置」选择「新建仓库」。
4. 选择已连接的 Git 账号或组织，填写仓库名称，保留「私有仓库」。
5. 初始化方式选择「NocoBase 应用」，应用模板保留「默认模板」。
6. 点「创建」。

![新建私有仓库，使用 NocoBase 默认模板初始化应用](https://static-docs.nocobase.com/studio-zh-setup-create-nocobase-app-full-1440x900-20261030.png)

Studio 会在所选 Git 连接对应的账号或组织下创建仓库。仓库名称需要尚未被使用。

## 等待初始化

Studio 自动创建「初始化项目」任务。调度 Agent 分派工作，执行 Agent 在运行环境上创建基于 Core 的应用、安装依赖并提交代码。

打开这个任务，可以查看执行进度、Agent 回复和检查结果。项目中的其他任务会等待初始化完成。

![项目概览显示初始化任务正在进行](https://static-docs.nocobase.com/studio-zh-setup-initializing-full-1440x900-20261030.png)

首次提交推送到默认分支。检查通过，或仓库未配置检查时，初始化任务自动完成。

初始化需要下载模板和依赖，耗时取决于网络、运行环境和模型。任务停在队列中时，先检查运行环境是否在线、调度 Agent 是否可用。

## 开始添加任务

确认以下结果：

- 「初始化项目」任务为「已完成」。
- 仓库默认分支包含应用代码。
- 项目概览不再提示「完成项目初始化」。

应用初始化已完成。接下来准备检查与预览，再邀请成员使用。

![初始化已完成，可以添加业务任务](https://static-docs.nocobase.com/studio-zh-setup-project-ready-full-1440x900-20261030.png)

## 下一步

[配置检查与预览](ci.md)，选择 Agent 自检、GitHub Actions 或外部 CI。然后[邀请成员](invite.md)，让团队加入项目。

项目资料、成员和默认技能在[项目设置](../project/settings.md)中管理。模型分工和执行资源分别在[Agent 配置](../configure/agents.md)和[运行环境](../configure/runtimes.md)中调整。
