---
title: 让 Agent 搭建 Studio
description: 推荐这样搭建 Studio：把提示词交给你的 Agent，例如 Claude Code、Codex，由它照着文档部署 Studio、完成配置，你只在需要人的地方亲自操作。搭好后，它会问你要不要用一个几分钟就能做完的任务试运行一遍。
---

| | 做什么 | 用时 |
| --- | --- | --- |
| 搭建 | 部署 Studio，连接代码托管平台，接入运行环境，启用 Agent。做完就停下，把结果交给你，问你要不要试运行 | 约半小时，其中有几处要你亲自操作 |
| 试运行（可选） | 你同意后，新建一个试运行项目，提一个最简单的任务，看 Agent 团队把它推进到待验收 | 约 5 分钟 |

## 准备

| 准备什么 | 说明 |
| --- | --- |
| 一台服务器 | Linux，装有 Docker 和 Docker Compose，你的 Agent 能通过 SSH 登录，见 [安装 Studio](install.md) |
| NocoBase Pro token | 拉取 Studio 镜像用。Agent 需要时，会请你自己在服务器上登录镜像源 |
| 代码托管平台的账号 | GitHub、GitLab 或 Gitee。用 GitLab、Gitee 时，先准备好令牌，见 [连接 Git](git.md) |
| 一台运行环境 | 同一台服务器上的一个专用系统用户，或者另一台机器。装好 Node.js 24，装好并登录 Claude Code、Codex 等编码工具。其余要用的软件，Agent 会照 [接入共享运行环境](shared-runtimes.md) 补齐 |
| 你的 Agent | Claude Code、Codex 等编码工具都可以，由它执行下面的提示词 |

## 搭建

把下面尖括号里的内容换成你的，交给你的 Agent：

```prompt
请帮我搭建 NocoBase Studio。

参考文档：https://docs.nocobase.com/zh-CN/llms.txt 列出了 NocoBase 文档每一页的 Markdown 版。每一步先读 Studio 文档里对应的页面，按页面里的步骤做，按“完成的标志”检查：安装 Studio、连接 Git、接入共享运行环境、启用 Agent。

环境：
- 部署 Studio 的服务器：<SSH 登录方式>
- Studio 的访问地址：<https://studio.example.com>；还没有域名时，用 http://<服务器地址>:13000
- 代码托管平台：<GitHub、GitLab 或 Gitee>，仓库建在 <账号或组织> 下
- 共享运行环境：<SSH 登录方式>，用系统用户 <用户名> 运行执行机，上面已经装好并登录了 <Claude Code、Codex>

请按顺序完成：
1. 部署 Studio，版本用 <版本号>。需要 NocoBase Pro token 时，请我自己在服务器上登录镜像源，不要让 token 经过你。完成后告诉我访问地址，以及初始管理员的密码存在服务器的哪个文件里。
2. 等我登录 Studio 后，我会把「连接本地 Coding Agent」的配置指令交给你：照着它安装 nb-studio、登录、安装技能。登录要我在浏览器里批准，等我批准的时候，保持登录命令一直运行。之后在 Studio 里的操作都用 nb-studio。
3. 连接代码托管平台。
4. 生成共享运行环境的注册凭证，在共享运行环境上安装并注册执行机，按文档的准备一节补齐需要的软件。确认它在线、编码工具显示已登录。
5. 检查已启用的 Agent，按各自的长处写好「擅长什么」；为调度 Agent 选好首选和备选。
6. 做完就停下，给我一份结果：Studio 的地址，每一步的结果和在界面上哪里能看到，以及还需要我做的事。然后问我要不要用一个最简单的任务试运行一遍；我同意了，再按文档「让 Agent 搭建 Studio」一页「试运行」一节的提示词做。

要求：
- 需要我在网页上操作、提供令牌或回答问题时，停下来，告诉我在哪里、做什么。
- 密钥、密码和一次性凭证不要出现在命令历史、日志和你的回复里；需要交给我的，存进只有我能读的文件，告诉我路径。
- 不要改动服务器上与 Studio 无关的服务。
```

### 你要亲自做的几步

Agent 做到下面这几步时，会停下来告诉你。按它说的做，做完告诉它继续：

| 什么时候 | 你做什么 |
| --- | --- |
| 拉取镜像前 | 在服务器上登录镜像源：运行 Agent 给你的 `docker login` 命令，在提示处输入 NocoBase Pro token |
| 部署完成后 | 用初始管理员登录 Studio，修改密码。在右上角账户菜单点「在 agent 中使用 Studio」，把「连接本地 Coding Agent」的配置指令交给 Agent |
| Agent 登录 nb-studio 时 | 在浏览器里打开它给的地址，核对验证码，点「批准」 |
| 连接 GitHub 时 | 在「设置 › 集成 › Git」创建 GitHub App：「App 的所有者」选好账号，关掉「Webhook」（Studio 没有公网地址时），在 GitHub 上确认创建，安装时选「All repositories」。GitLab、Gitee 只需要提供令牌 |

### 搭建完成后

Agent 最后给你的结果里，下面几项都应该是完成的。你也可以在 Studio 里逐一看到：

| 完成的事 | 在哪里看 |
| --- | --- |
| Studio 能登录，界面是团队使用的语言，登录页上没有「注册」 | 登录页 |
| 代码托管平台已连接 | 「设置 › 集成 › Git」 |
| 共享运行环境在线，编码工具显示「已登录」 | 「Agent 管理 › 运行环境」 |
| 至少两个已启用的 Agent，各自写好了擅长什么 | 「Agent 管理 › Agent」 |
| 调度 Agent 设置了首选和备选 | 「Agent 管理 › Agent」上方的「调度 Agent」一栏 |

到这里，Studio 就搭好了。Agent 问你要不要试运行时，可以让它试一遍；也可以不试，直接 [新建项目](new-project.md)、[邀请成员](invite.md)。

## 试运行

你同意试运行后，Agent 按下面的提示词做。以后想再试，也可以把它交给同一个 Agent：

```prompt
请在 NocoBase Studio（<访问地址>）里，用一个最简单的任务把 Agent 团队的流程试运行一遍。nb-studio 已经登录。

1. 新建项目“Studio 试运行”：新建仓库 <仓库名>，初始化方式选空仓库，不用 NocoBase 应用模板。
2. 在这个项目里新建一个任务并开始执行，任务描述：“在仓库根目录新建 hello.md，写一句：这个仓库用来试运行 NocoBase Studio。这个仓库没有接 CI，不需要等检查结果，评审通过后直接交给我验收。”
3. 跟进到任务进入「待验收」。调度 Agent 提问时，把问题转给我回答。
4. 告诉我任务和 PR 的地址，以及每一步用了多长时间。

验收和合并由我在 Studio 里做，不要替我合并 PR。
```

几分钟后，任务进入「待验收」。这几分钟里，Agent 团队会做完这些事：调度 Agent 把这一步交给擅长小改动的 Agent；它改好文件、开出 PR；调度 Agent 再把 PR 交给另一个模型评审；评审通过后，附上交付报告，交给你验收。

打开任务，看交付报告，点「合并」。试运行项目没有检查结果，按钮是「仍然合并」。合并后任务变为「已完成」，整个流程就走通了。

试运行项目用完可以删掉。正式的业务系统，按 [新建项目](new-project.md) 用 NocoBase 应用模板新建。

## Agent 卡住时

看它停在哪一步，读对应的分步说明，也可以把那一页直接交给它：

| 步骤 | 分步说明 |
| --- | --- |
| 部署 | [安装 Studio](install.md) |
| 连接代码托管平台 | [连接 Git](git.md) |
| 接入运行环境 | [接入共享运行环境](shared-runtimes.md) |
| Agent 和调度 Agent | [启用 Agent](agents.md) |
| 新建项目和初始化 | [新建项目](new-project.md) |
| 预览和部署 | [连接 CI](ci.md) |
| 第一个正式的需求 | [走完第一个需求](first-request.md) |
