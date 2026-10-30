---
title: 把项目接入 Studio
metaDescription: 把 itam-lite 接入 NocoBase Studio，让 Agent 团队接着推进。
---

当一个系统已经搭建出初始的版本之后，接下来就会进入一个持续迭代的阶段：

1. 已经搭建的功能，需要迭代功能、修复存在的 bug
2. 需要给系统增加新的功能模块

如果一个人并行开发多个任务，就需要在多个 Agent 会话之间来回跳转；Agent 输出速度越快，对人的要求就越高。 如果多人开发，需求背景、业务资料、项目经验可能散落在各个角落。不同的人或者不同的 Agent 接手，很可能就丢失这些上下文。 为此，NocoBase 推出了 NocoBase Studio，它是为了治理人与 Agent 协同开发而生的。

![Studio 的「我的任务」：等你处理的排在最前面](https://static-docs.nocobase.com/20261028173135810.png)

> [!NOTE] Studio 仅专业版和企业版提供
> 见 [版本与价格](https://www.nocobase.com/zh-CN/pricing/)。安装时需要 NocoBase Pro token。

## 1. 让 Agent 搭建 Studio

把 [让 Agent 搭建 Studio](../studio/setup/with-agent.md) 里的提示词填好交给 Coding agent，它会完成部署 Studio、连接 Git、接入共享运行环境、启用 Agent 这四步。登录镜像源、第一次登录 Studio、批准 `nb-studio` 登录、在 GitHub 上创建 App 这几处需要你亲自操作。

**完成的标志**：[搭建完成后](../studio/setup/with-agent.md#搭建完成后) 表格里的各项都满足。

## 2. 新建项目，关联 itam-lite

在 itam-lite 的目录里对 Coding agent 说：

```prompt
用 nb-studio 在 Studio 里新建项目 itam-lite，关联当前仓库，不初始化。做完告诉我项目地址。
```

其他选项见 [新建项目](../studio/setup/new-project.md)。

**完成的标志**：项目页能打开，「项目设置 › 代码仓库」里是 itam-lite。

## 3. [可选] 接入 CI，集成 PR 预览

接入后，每个 PR 都会部署成预览，验收时在任务页点开就能试。

打开项目的「设置 › 代码仓库」，在 itam-lite 的「检查」一行点「编辑」：

![项目设置里的代码仓库，「检查」一行可以编辑](https://static-docs.nocobase.com/20261030-studio-code-repositories.webp)

可以点「查看提示词」，复制给 Coding agent，它会提交 CI 文件、保存密钥并开一个 PR。详细说明见 [连接 CI](../studio/setup/ci.md)。

![配置检查：选好触发方式和应用，把提示词交给自己的 Agent](https://static-docs.nocobase.com/20261030-studio-checks-dialog.webp)

**完成的标志**：合并这个 PR 后，「检查」一行显示已连接；之后再开 PR，任务页上能打开它的预览。
