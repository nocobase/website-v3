---
title: Agents
status: 待补充正文
description: 业务 Agent 的基础：Agent 定义、模型服务、运行和对话、技能，以及运行 Agent 的 Runner（注册、领取、并发）。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-agents` |
| 版本 | 1.0.0-beta.19 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag">已安装，未注册</span> |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md)、[文件](file.md) |
| 自带页面 | 「Agent」「运行环境」「技能」「用量」「模型」等页面（`/agents`、`/runtimes`、`/skills`、`/usage`、`/models`） |
| UI 组件 | UI 组件库的 `agent-chat`、`agent-queue`、`agent-run-history`、`agent-composer`、`agent-picker` |
| 数据表 | 有，迁移随插件提供，表名以 `ag` 开头 |
| 命令 | 通过应用的命令行使用 |
| 技能 | `nocobase-app-plugin-agents` |
| 所属能力 | [AI 与 Agent](../capabilities/ai-agents.md) |

## 计划包含

- 它怎样工作
- 默认模板已安装但未注册：怎样启用
- 配置模型服务
- 在应用里加一个业务 Agent：职责、可用的数据和操作、权限
- 在线 Agent 和通过 Runner 运行的 Agent
- 用量与费用
- 和 NocoBase 2 的 AI 员工对比
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
