---
title: "Agents"
description: "接入 Agent、运行环境、模型服务、对话和执行记录。"
---

`@nocobase/app-plugin-agents` 为应用提供 Agent 运行与对话能力，包括 Runner 管理、任务执行记录、Skills、变量、模型服务及用量。业务对象、可执行动作和访问范围由应用接入。

## 先确定使用方式

Runner Agent 在连接的运行环境中调用编码工具执行工作。OnlineAgent 在服务端通过模型服务和已注册工具完成在线对话。两者的执行路径不同：配置了模型服务不等于已经连接 Runner，安装 Runner 也不会自动配置在线模型服务。

应用可只接入需要的能力；普通在线对话不要求先创建一个 Runner Agent。

## 接入与页面

注册 Client、Server 插件并执行迁移与种子数据；使用命令行能力时注册 CLI 入口。模型密钥和变量依赖宿主持久的 secrets 配置。默认模板中即使已安装该包，也要检查是否实际注册。

插件不自动注册管理页面。应用可从 `/client/routes` 组合以下路由，并配置导航：

| 导出 | 默认路径与用途 |
| --- | --- |
| `agentsRoute` | `/agents`：查看、启用或停用 Agent |
| `runtimesRoute` | `/runtimes`：连接和管理 Runner |
| `modelsRoute` | `/models`：配置模型服务、模型及连接测试 |
| `skillsRoute` | `/skills`：维护 Skills 文件及版本 |
| `usageRoute` | `/usage`：查看用量和成本信息 |

路径可以由应用组合，但要保留相应权限条件。页面访问不等于管理所有数据：模型服务使用 `agents.services` 等设置权限，Runner 操作还受所有者身份约束。

## 使用 Runner Agent

1. 在应用接入的运行环境页创建连接，选择个人或共享用途及允许的工具。
2. 按该页生成的注册指引连接机器，并确认工具已安装、登录且可用。
3. 从上报的可用模型中添加 Agent，填写擅长处理的工作并启用。
4. 从应用的对话或已接入的业务入口发起工作，查看排队原因、执行记录和结果。

个人 Runner 只承接符合其所有者与本地策略的工作；共享 Runner 的注册和管理需要相应权限。排队不一定表示故障，还可能是没有合适环境、没有空闲槽位或工具尚未登录。

## 使用在线对话

在模型服务页配置提供方、地址和密钥，选择并测试相应类型的模型，再启用服务。新在线对话要求有可用的 chat 模型；embedding 或 rerank 模型不能作为聊天模型使用。

应用可从 `/client/chat` 使用 `ChatProvider` 和对话 hooks，配合 NocoBase UI Library 的 `agent-chat` 源码组件构建界面。服务端通过 `/server/tokens` 的 `agentsToken.onlineAgent` 接入在线执行；业务工具、上下文和授权由应用提供。

## 验证与扩展

在一项小任务上验证连接、权限、模型可用性、运行状态和结果，再接入业务。缺少模型价格时，用量记录不能直接当作完整成本。Skills 文件、变量与业务工具的可用范围也应分别验证。

与知识检索结合时，继续阅读[知识库](knowledge.md)。通用注册与更新见[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-agents)。
