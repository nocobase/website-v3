---
title: 安装概览
description: 管理员部署 Studio，准备项目、Agent 和检查方式，再邀请团队成员使用。
---

推荐使用 Claude Code、Codex 等本地 Coding Agent 安装和配置 Studio。

如果你已收到团队邀请，请前往[开始使用](../join/index.md)。

## 交给 Agent

```prompt
请按照 https://docs.nocobase.com/zh-CN/studio/setup/ 安装 NocoBase Studio，并完成首个项目的配置。
```

Agent 先检查目标环境，询问缺少的信息，再按下方步骤完成配置和验证。需要本人登录或授权时，按提示操作。

## 开始前

本指南使用 Docker Compose、GitHub 和一台共享运行环境。请准备：

- **镜像授权**：Studio 为商业版本，请[联系我们](https://www.nocobase.com/zh-CN/contact/)获取镜像和访问授权。
- **部署环境**：服务器访问方式和 Studio 访问地址。本机试用无需域名。
- **Git 账号**：可创建仓库、安装 GitHub App 的账号或组织。
- **编码工具与模型账号**：如 Claude Code 或 Codex，可以继续使用已有账号。

软件安装和配置可由 Agent 完成。已有数据库、反向代理、存储或邮件服务时，优先沿用现有配置；缺少必要信息时，由 Agent 询问。

建议将运行环境部署在独立的容器或虚拟机中，与 Studio 隔离。编码工具和执行机都安装在该环境内。

## 准备团队环境

| 步骤 | 结果 |
| --- | --- |
| 1. [部署 Studio](install.md) | 管理员可以登录 |
| 2. [连接 Git 平台](git.md) | Studio 可以创建仓库、提交代码 |
| 3. [接入运行环境](shared-runtimes.md) | 编码工具在线，可以执行任务 |
| 4. [配置 Agent](agents.md) | 调度 Agent 可以分派工作 |
| 5. [创建首个项目](new-project.md) | 应用代码初始化完成 |
| 6. [配置检查与预览](ci.md) | 选择 Agent 自检或 CI，准备验证改动 |
| 7. [邀请成员](invite.md) | 成员收到邀请，可以加入项目 |

## 成员开始工作

成员[接受邀请并登录](../join/sign-in.md)后，按[走完第一个需求](../../getting-started/collaborate-with-studio.md)提交需求、跟进开发并验收结果。使用团队已准备好的运行环境即可，不必连接自己的电脑。

## 调整配置

| 要调整的内容 | 文档所在板块 |
| --- | --- |
| 模型分工、执行机器、团队技能 | Agent 管理：[Agent 配置](../configure/agents.md)、[运行环境](../configure/runtimes.md)、[技能](../project/skills.md) |
| 检查来源、CI 流水线 | 质量管理：[检查与 CI](../configure/checks.md) |
| 项目资料、成员、默认技能 | 项目管理：[项目设置](../project/settings.md) |
| Git 连接、其他代码平台 | 系统管理：[代码平台](../configure/git.md) |
| 数据库、访问地址等部署参数 | 参考：[配置项](../reference/config.md) |
