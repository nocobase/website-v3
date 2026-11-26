---
title: 快速安装 Studio
metaDescription: "用一条命令在自己的电脑上安装 Studio 社区版和首个项目，打开测试环境中的应用，再把第一个任务交给 Agent。"
---

用一条命令在自己的电脑上安装 Studio 社区版和首个项目，再把第一个任务交给 Agent。

## 前置依赖

- macOS、Linux，或 Windows 上的 WSL 加 Docker Desktop
- Docker，带 Compose v2，并已启动
- Node.js 24、Git 和 curl
- 至少一个已安装并登录的编码工具：Claude Code、Codex、OpenCode 或 Pi 等

## 运行安装命令

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang zh-CN --mirror registry.cn-shanghai.aliyuncs.com --npm-registry https://registry.npmmirror.com/
```

命令使用中文界面，并从国内镜像下载镜像和 npm 包。其他选项见[安装选项](../studio/setup/install.md#安装选项)。

安装程序会在这台电脑上准备：

- Studio 社区版，数据放在 `~/.nocobase-studio/`
- Gitea，存放项目仓库的本地 Git 服务
- 这台电脑作为[个人运行环境](../studio/join/personal-runtime.md)，Agent 在这里执行任务
- 首个项目 **My first project**，仓库里有一个 NocoBase 3 应用，已部署到测试环境

完成后，终端输出 Studio 的地址和登录账号。

## 登录 Studio

Studio 运行在 `http://127.0.0.1:13000/main`。打开终端输出的地址，用终端给出的账号和密码登录，进入首个项目的对话。登录后在「个人设置 › 账号与安全」修改密码。

对话中有 Agent 为这个项目整理的计划，以及一个带「开始」按钮的建议任务。

## 打开测试环境中的应用

Agent 在对话中的第一条回复以测试应用的地址和账号开头，地址是 `http://127.0.0.1:13000/my-first-project-staging/`。打开它，用回复中的账号和密码登录，就能访问初始化创建的 NocoBase 3 应用。应用 10 分钟无人访问会停止，下次打开时自动启动。

这个测试环境也显示在 Studio 的[托管环境](../studio/admin/environments.md)中。

## 开始第一个任务

在建议任务的卡片上点「开始」。调度 Agent 把任务交给你电脑上的 Agent 开发，这会消耗你的模型额度。

进展、改动和检查结果都记录在任务中，见[跟进进展](../studio/use/follow-progress.md)。开发和检查完成后，Agent 提交 PR，交给你[验收](../studio/use/accept.md)。

## 下一步

- 升级、停止或卸载 Studio：见[升级、停止和卸载](../studio/setup/install.md#升级停止和卸载)。
- 为团队部署 Studio：见[安装概览](../studio/setup/index.md)。
- 了解团队如何在 Studio 中提出需求、跟进开发和验收：见[使用 Studio 推进开发](collaborate-with-studio.md)。
