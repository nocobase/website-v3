---
title: 接入 Studio
metaDescription: 将已有 CRM 仓库接入 Studio，准备 Agent、检查与 PR 预览，让团队继续开发同一套应用。
lesson: 15
---

CRM 已有客户、跟进、商机和报价，接下来，我们用 Studio 组织持续开发：把销售反馈变成任务，由 Agent 团队实现，再由人验收。继续使用自己的 CRM 仓库、配置和业务数据，不重新创建应用。

后续练习需要[商机与报价](../../guides/opportunities-and-quotes.md)和[客户访问控制](../../guides/team-permissions.md)，并保留已有客户与报价用于回归检查。尚未具备这些功能时，先完成对应课程。Studio 中的项目和任务管理开发工作，与 CRM 内的客户、商机等业务记录分别管理。

可以先在 [Studio demo](https://studio.demo.nocobase.com/main) 查看界面。demo 的 **CRM System** 展示协作过程，不能保存修改；实际练习使用自己的 Studio 和 CRM 仓库，截图中的任务编号与版本号无需照搬。

## 准备 Studio 与 Agent

按[安装概览](../../studio/setup/index.md)准备 Studio，再完成 [Git 平台连接](../../studio/setup/git.md)和 [Agent 配置](../../studio/setup/agents.md)。已有 Studio 时，检查自己能访问目标仓库、有在线运行环境和可用的调度及执行 Agent。

Studio 的许可和安装凭据要求见安装指南。需要个人登录或 Git 授权时，由账号持有人完成。运行环境还需具备 CRM 的依赖安装与测试条件；涉及外部服务的配置沿用该应用的要求。

**步骤检查**：可以登录 Studio，运行环境在线，Agent 可用，Git 连接能访问自己的 CRM 仓库。

## 关联已有 CRM 仓库

在本地 CRM 目录中，向已接入 Studio 的 Coding Agent 提出：

```prompt
我想在 Studio 中和团队一起继续完善现有 CRM，项目名称用 CRM。保留已经完成的功能和资料。项目说明里记录它管理客户、跟进、商机和报价，完成后给我项目地址。
```

本地工具尚未接入时，先按[在 Agent 中使用 Studio](../../studio/join/local-agent.md)安装和登录。也可以从 **项目 → 新建项目** 创建项目，选择已有仓库。关联方式见[项目设置](../../studio/project/settings.md)。

打开项目的 **设置 → 代码仓库**，核对仓库和默认分支。仓库中保留已有 `AGENTS.md`、开发 Skills 和需求文档，让接手的 Agent 能读到业务规则。不要将创建新应用的初始化流程应用到已有 CRM。

![CRM 项目的代码仓库设置，集中展示默认分支、检查、分支规则、版本线与预览。](/assets/guides/studio/repositories.png)

**步骤检查**：项目关联的是自己的 CRM 仓库，默认分支与当前开发基线一致，已有代码和数据未被重置。

## 配置检查与 PR 预览

在仓库的 **检查** 一行点 **编辑**，按团队环境选择检查来源：

| 来源 | 需要完成的配置 |
| --- | --- |
| Agent 自检 | 由 Agent 执行项目检查、上报结果并发布预览 |
| GitHub Actions | 在仓库中接入工作流与 CI 密钥 |
| 外部 CI | 由已有流水线上报检查与发布预览 |

只有所选来源的结果计入检查。使用 GitHub Actions 时，触发方式选 **拉取请求**，选择预览环境；应用位于仓库根目录时，**目录** 填 `.`。从 **查看提示词** 获取配置要求，交给本地 Agent 完成工作流。网络可达性、密钥和手动配置见[配置检查与预览](../../studio/setup/ci.md)。

![检查面板提供三种检查来源，并配置触发方式、应用目录和预览环境。](/assets/guides/studio/checks.png)

让一个小改动产生 PR，检查报告是否对应最新提交，并从任务的 **代码与预览** 打开预览。使用独立的预览数据，不把生产数据库接到 PR 环境。确认能登录、打开客户及报价，并按测试角色验证访问范围。

**完成的标志**：Studio 已关联自己的 CRM 仓库和正确的默认分支，已有代码与数据保留，运行环境与 Agent 可用；PR 有最新提交的检查结果和可访问的预览，负责人已确认客户、报价及测试角色的访问范围符合预期。

通用接入方式见[将已有项目接入 Studio](../../guides/open-crm-project.md)。
