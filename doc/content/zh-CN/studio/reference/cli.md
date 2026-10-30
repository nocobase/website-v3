---
title: nb-studio 命令
description: 安装和使用 Studio CLI，查询当前版本提供的命令。
---

`nb-studio` 供本地 Coding Agent、脚本和 CI 调用 Studio。业务命令由登录的 Studio 提供，随服务端版本和调用身份变化。

## 安装与登录

在账户菜单打开「在 Agent 中使用 Studio」，把安装指令交给本地 Coding Agent，见[在本地 Agent 中使用](../join/local-agent.md)。需要 Node.js 24 或更高版本。

安装后登录，地址包含 `/main`：

```bash
nb-studio login --server https://studio.example.com/main
nb-studio whoami
nb-studio skills install
```

登录期间保持命令运行，在浏览器核对验证码并批准。无浏览器的机器可加 `--no-browser`，从另一台设备打开批准地址。

## 查找命令

```bash
nb-studio docs
nb-studio issue --help
nb-studio whoami --missing
```

`docs` 查看当前命令，`--help` 查看参数。`whoami --missing` 按所需权限列出不可用命令。加 `--json` 获取结构化输出。

| 分组 | 用途 |
| --- | --- |
| `issue`、`comment`、`attachment` | 任务、讨论和附件 |
| `project`、`label` | 项目、成员和标签 |
| `project-manager`、`agent`、`runtime` | 调度、Agent 与运行环境 |
| `skill`、`variable`、`run` | 技能、变量和运行记录 |
| `kb`、`memory` | 知识库与项目记忆 |
| `git`、`pr`、`commit` | 仓库、PR 和检查 |
| `quality` | 已启用的质量计划与后续工作 |
| `app`、`deploy`、`env`、`release`、`build` | 应用、环境、制品和交付 |
| `session`、`conversation` | 本机会话与 Runner 会话 |
| `user`、`access`、`api-key` | 授权范围内的管理操作 |

## 多个 Studio

```bash
nb-studio profile list
nb-studio profile use <profile-name>
nb-studio logout
```

脚本或 CI 可通过 `NB_STUDIO_SERVER` 和 `NB_STUDIO_API_KEY` 指定服务器与密钥，不需要浏览器登录。将密钥放在 CI 的密钥管理中，见[API 密钥](../admin/api-keys.md)。

## 更新

```bash
nb-studio update --check
nb-studio update
```

更新来自当前 Studio，并同步已安装的技能。CLI 登录批准和 Git 平台授权仍需在对应网页完成；Agent 运行身份不能替人验收或合并 PR。
