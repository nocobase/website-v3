---
title: 开发工具
status: 待补充正文
description: 创建应用和插件、命令行、测试、部署安装、模板和全局技能。
---

> [!PENDING] 正文待编写
> 下表来自 NocoBase 仓库 `v3-develop` 分支（2026-10-23）。

| 工具 | 做什么 | 谁用 |
| --- | --- | --- |
| `@nocobase/create-app` | `pnpm create @nocobase/app`：用模板创建应用 | 开发者、Agent |
| `@nocobase/app-template-default` | 默认模板：带标准产品能力 | 创建应用 |
| `@nocobase/app-template-examples` | 示例模板：可运行的示例 | 学习、参考 |
| `@nocobase/app-cli` | 应用的命令行 `pnpm nocobase`：配置、数据库、插件、技能、构建 | 开发者、Agent、运维 |
| `@nocobase/app-cli-client` | 应用自己的命令行：登录后运行应用发布的业务命令 | 业务用户、业务 Agent |
| `@nocobase/app-skills` | 应用开发、升级、部署三个技能 | Agent |
| `@nocobase/app-testing` | 测试工具：隔离的测试数据库、命令、页面渲染 | 开发者、Agent |
| `@nocobase/app-installer` | 在服务器上安装、升级、回滚部署包 | 运维、Agent |
| `@nocobase/app-host`、`@nocobase/app-host-docker` | 独立运行一个或多个应用的宿主；Docker 方式每个应用一个容器 | 运维 |
| `@nocobase/agent-runner` | 在机器上运行 Agent：注册到应用、领取运行、驱动 Claude Code、Codex、OpenCode 等 | 运维、Studio |
| `@nocobase/create-plugin` | 创建插件 | 插件开发者 |
| `@nocobase/dev-config` | 共用的 TypeScript、ESLint、Vitest、Vite 配置 | 开发者 |

## 全局技能

创建应用之前，Agent 需要先全局安装技能：

```bash
npx skills@latest add nocobase/skills-v3 --skill '*' -g
```

| 技能 | 做什么 |
| --- | --- |
| `nocobase-create-app` | 创建、配置并启动应用 |
| `nocobase-app-installer` | 在本机或通过 SSH 在服务器上安装、升级、回滚部署包 |
| `nocobase-app-plugin-development` | 开发 NocoBase 3 插件 |
