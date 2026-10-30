---
title: 创建应用
metaDescription: 让 Agent 在空目录里创建一个用 SQLite 的 NocoBase 应用，登录，认识它带来的 AGENTS.md、规则、技能和应用底座，做第一次 Git 提交。
---

这一篇创建 ITAM 应用 `itam-lite`，后面每一篇都在它上面继续开发。

## 1. 安装创建应用的技能

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

按提示选上你用的编码工具。这个技能只负责创建应用，应用创建好后由应用自带的开发技能接手。

## 2. 让 Agent 创建应用

新建一个空目录 `itam-lite`，在里面开启 Coding agent 会话：

```prompt
在当前目录创建一个 NocoBase 3 应用，数据库用 SQLite。启动后告诉我访问地址和登录账号。
```

Agent 检查 Node.js 和 pnpm 的版本，创建项目、安装依赖、生成配置，然后启动应用，给出地址（例如 `http://127.0.0.1:13000/main/`）和账号。手动创建的方式和遇到的问题见 [Core 的创建应用](../core/getting-started/create-app.md)。

用 `nocobase` / `admin123` 登录，看到首页。

![登录后的首页](https://static-docs.nocobase.com/20261030-itam-lite-create-app-home.webp)

## 3. 认识项目里的四样东西

| 位置 | 是什么 | 谁维护 |
| --- | --- | --- |
| `AGENTS.md` | Agent 每次开工先读的规则和索引：代码放哪、哪些能力直接用插件 | 人和 Agent，保持精简 |
| `.agents/rules/` | 这个应用自己的约定，例如业务规则、命名 | 人和 Agent，随代码提交 |
| `.agents/skills/` | 随依赖包同步来的开发技能，和安装的版本配套 | 自动同步，不要手改 |
| 应用底座 | 「系统设置 › 应用底座」页面，列出应用用到了哪些 Core 能力 | NocoBase |

现在打开「应用底座」，能看到数据建模、用户与组织、权限、通知、工作流与审批等能力。后面做设备台账、领用审批、角色权限时，Agent 直接用它们，不从头写。

![应用底座](https://static-docs.nocobase.com/20261030-itam-lite-create-app-foundation.webp)

## 4. 第一次提交

```prompt
初始化 Git 仓库，做第一次提交。
```

`config.yml`（含密钥）、SQLite 数据库、`node_modules/` 和 `.agents/skills/` 已被 `.gitignore` 排除。之后 Agent 每完成一步就提交一次，改了什么一目了然。

**完成的标志**：用管理员登录后看到首页，`git log` 里有第一个提交。
