---
title: "可以继续使用自己习惯的 Coding Agent 和模型吗？"
---

可以。NocoBase 不要求绑定单一模型厂商。使用 Core 时，你可以在应用目录中使用 Claude Code、Codex 等编码工具，并让 Agent 按项目提供的开发指引和 Skills 工作。创建与开发流程见[开发第一个应用](../getting-started/develop-your-first-app.md)。

使用 Studio 时，需要在接入的运行环境中安装受支持的编码工具，并完成相应账号登录。Studio 根据运行环境上报的“编码工具 · 模型”组合提供可选 Agent；能否使用某个模型，取决于工具支持、账号权限和运行环境状态，并非任意模型名称都能直接添加。

首次接入见[接入运行环境](../studio/setup/shared-runtimes.md)和[配置 Agent](../studio/setup/agents.md)。已有团队需要添加模型或调整分工时，见[Agent 配置](../studio/configure/agents.md)。

## Codex CLI 可以使用 DeepSeek 模型吗？

可以。Codex 支持配置自定义模型提供方，DeepSeek 已提供官方 Codex 接入指南，并原生支持其使用的 Responses API。按指南配置提供方、模型和 DeepSeek API Key，不是只安装 Codex 或更换模型名称。配置方法及版本要求见 [DeepSeek 接入指南](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/)和 [Codex 自定义提供方配置](https://developers.openai.com/codex/config-advanced/)。

工具和模型的兼容性由所用版本决定，不能将这个组合的支持推广为任意模型都能接入。先在项目目录确认模型可用、能够读取项目指引并执行开发任务；使用 Studio 时，还需确认连接的运行环境能正确报告和使用这一组合。
