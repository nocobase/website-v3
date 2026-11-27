---
title: 安装并使用 Studio
metaDescription: "用一条命令在本机安装免费的 Studio 社区版和首个项目，提出需求，跟进 Agent 分工、检查评审与验收，走完一次完整交付。"
---

用一条命令在自己的电脑上安装免费的 Studio 社区版和首个项目，并在 Studio 中完整走完一次需求提出、Agent 分工开发、检查评审与验收交付。

## 前置依赖

- macOS、Linux，或 Windows 上的 WSL 加 Docker Desktop
- Docker（带 Compose v2），且已启动
- Node.js 24、Git 和 curl
- 至少一个已安装并登录的 Coding Agent：Claude Code、Codex、OpenCode 或 Pi 等

## 一键安装并登录 Studio

在终端运行：

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang zh-CN --mirror registry.cn-shanghai.aliyuncs.com --npm-registry https://registry.npmmirror.com/
```

命令使用中文界面，并从国内镜像拉取镜像和 npm 包。其他选项见[安装选项](../studio/setup/install.md#安装选项)。

安装程序会自动在这台电脑上准备好：

- Studio 社区版，数据保存在 `~/.nocobase-studio/`
- 本地 Git 服务（Gitea），用于存放项目代码仓库
- 将这台电脑接入为[个人运行环境](../studio/join/personal-runtime.md)，由这里的 Coding Agent 执行任务
- 首个项目 **My first project**，仓库内含一个基于 Core 的 NocoBase 3 应用，并已部署到测试环境

安装完成后，终端会输出 Studio 的访问地址和登录账号。打开 `http://127.0.0.1:13000/main`，用终端输出的账号和密码登录（登录后可在「个人设置 › 账号与安全」修改密码），进入首个项目的对话。

对话里包含 Agent 为这个项目整理的初始计划，以及一张带「开始」按钮的建议任务卡片。你可以直接点「开始」试用，也可以按下面步骤亲自提出一个新需求。

## 打开测试环境中的应用

Agent 在对话中的第一条回复以测试应用的地址和账号开头，默认地址为 `http://127.0.0.1:13000/my-first-project-staging/`。

打开这个地址并用回复里的账号密码登录，即可看到初始化生成的 NocoBase 3 应用。测试环境 10 分钟无人访问会自动休眠，下次打开时自动启动，也可在 Studio 的[托管环境](../studio/admin/environments.md)中查看。

## 提出需求并确认方案

进入项目页点「新建任务」，向 Agent 描述业务目标和验收方式。例如：

```prompt
加一个供应商页面，记录名称、联系人、电话和合作状态。采购员可以新增、编辑和查看供应商。

做好后，我要能新增一家供应商，把状态改为暂停，并在列表中按状态筛选。
```

Agent 会先针对不清楚的规则提问，确认后整理成任务描述。核对无误后点「开始执行」（也可切到「手动填写」直接建任务）。

![新建任务时，通过会话补充目标和业务规则](https://static-docs.nocobase.com/studio-en-new-task-20261111-normal-2x.webp)

开始后，任务进入「进行中」，由调度 Agent 分派设计、开发、测试和评审。如果有现成的业务制度或字段说明，可以直接附到任务或放入[知识库](../studio/project/knowledge-base.md)供 Agent 参考。

## 跟进开发、检查与评审

任务顶部实时显示当前负责的 Agent、运行环境和下一步安排。「动态」记录每次交接、回复和评审意见，「运行记录」保留具体执行过程。

![任务详情显示当前执行步骤及后续安排](https://static-docs.nocobase.com/studio-en-req-now-20261111-normal-2x.webp)

执行 Agent 会在独立分支上修改代码并创建 PR（合并请求），检查与评审结果都会关联回同一任务。如果检查未通过或评审发现问题，调度 Agent 会自动安排修复并重新检查，全部通过后再交给你验收。检查与评审机制见[检查与评审](../studio/project/checks-and-review.md)。

## 回答提问与验收结果

遇到需要人拍板的业务规则时，任务会变为「阻塞中」，并自动排在「我的任务 › 等你处理」最前面。点开「需要你」卡片回复决定，调度 Agent 会继续推进。

任务进入「待验收」后：

1. 阅读交付报告，核对改动内容、验证结果与未验证项。
2. 点「看改动」查看 PR；有预览或测试环境时，按验收场景亲自试用。
3. 满足要求后点「合并」，确认目标分支和合并方式。
4. 需要调整时点「退回修改」，写明问题和预期结果。

![通过交付报告和验收标准确认任务结果](https://static-docs.nocobase.com/studio-en-req-accept-20261111-normal-2x.webp)

任务变为「已完成」且默认分支包含此次改动，即完成本次开发交付。

## 发布改动与积累项目经验

合并代码不等于已经上线到生产环境。配置了自动部署的项目会由 CI 自动更新测试环境，负责人确认版本包含的任务、完成生产部署后在 Studio 中记录生产版本，详见[发布管理](../studio/release/overview.md)。

本次确认的业务规则和设计约定可以沉淀为[项目记忆](../studio/project/project-memory.md)，原始业务资料保存在知识库中，后续提新需求或换人、换 Agent 时都会自动沿用。

## 接入已有的 Core 应用

如果你已经按[用 Core 开发第一个应用](develop-your-first-app.md)在本地开发出了应用，并将代码推送到了 Git 仓库，不需要重新初始化项目。装好 Studio 后（一键安装已同时装好命令行工具 `nb-studio`），在应用目录里直接对 Coding Agent 说：

```prompt
用 nb-studio 在 Studio 里新建一个项目，关联当前仓库，不初始化。做完告诉我项目地址。
```

完整步骤与 PR 预览配置见[把项目接入 Studio](../guides/bring-into-studio.md)。

## 下一步

- 升级、停止或卸载本机 Studio：[升级、停止和卸载](../studio/setup/install.md#升级停止和卸载)
- 在服务器上为团队部署 Studio：[安装概览](../studio/setup/index.md)
- 日常处理决策与验收：[我的任务](../studio/use/my-tasks.md)
- 跟随从 Core 开发到 Studio 团队协作的完整案例：[基于 NocoBase 3 开发可靠的企业应用](../guides/build-reliable-enterprise-apps.md)
