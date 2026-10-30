---
title: 上线后继续迭代
metaDescription: 新会话靠仓库里的 AGENTS.md、设计文档和提交记录接上进度；应用自己的约定写进 .agents/rules/；用应用自带的升级技能升级 Core；其他团队按设计文档的方式提需求。
---

itam-lite 上线后，还要加功能、修问题、升级 NocoBase。每次都可以开新会话，进度和约定都在仓库里。

## 1. 新会话接上进度

Agent 不记得上一个会话，它需要的都在仓库里：

| 位置 | 内容 |
| --- | --- |
| `AGENTS.md` | 开发规则和索引，每次开工自动读 |
| `docs/design.md` | 业务设计：角色、对象、流程、权限、范围 |
| `git log` | 每一步做了什么 |

开新会话时先让它读一遍：

```prompt
先读 AGENTS.md、docs/design.md 和最近的提交，告诉我这个应用做到哪了、还有什么没做。然后做：<需求>。
```

需求的写法见 [之后每个需求说清五件事](write-a-design-doc.md#3-之后每个需求说清五件事)。

## 2. 把约定写进规则

第 9 篇的日期显示问题，出在 Agent 把只有日期的字段当成了时间点。纠正过一次的问题，写成规则，之后的会话就不会再犯：

```prompt
把这条约定写进 .agents/rules/business-dates.md，并在 AGENTS.md 里登记：
采购日期、期望到货日期这类字段只有日期、没有时间；“今天”按上海时间算；页面上只显示日期，没填显示“—”。
```

`AGENTS.md` 的索引多了一行：

```markdown
| [.agents/rules/business-dates.md](.agents/rules/business-dates.md) | Adding, validating or showing a calendar date (purchase date, needed-by date), or anything that depends on "today" |
```

什么值得写成规则、`AGENTS.md` 和规则文件怎样分工，见 [让 Agent 记住项目约定](../core/developing-apps/develop-with-an-agent.md#让-agent-记住项目约定)。规则文件和代码一起提交：

```bash
git add -A && git commit -m "docs: record the business date convention"
```

## 3. 升级 NocoBase Core

升级由应用自带的 `nocobase-app-upgrade` 技能完成：比较新旧两版模板的差异，逐个文件合并进应用，保留业务代码。

```prompt
把 NocoBase 升级到最新版本。先给我升级计划，我确认后再改；改完跑全部测试，确认设备和申请数据都还在。
```

计划里列出模板改动了哪些文件、应用自己也改过的文件怎样合并、依赖和数据库迁移的变化，以及回退方式（升级前的提交和数据库备份）。确认后，Agent 在新分支上合并、安装依赖、同步技能，跑完测试和构建，核对数据，再合并回主分支。

手动升级的步骤和验证清单见 [升级 NocoBase Core](../core/developing-apps/upgrade-nocobase-core.md)。升级后上线和发布新版本一样：构建新镜像，备份部署目录后替换，见 [部署新版本](../core/tutorials/deploy-with-docker.md#部署新版本)。

## 4. 其他团队怎样提需求

行政、财务等团队来提需求时，请他们也按设计文档的方式准备：谁在什么地方用、要完成什么、规则和边界、失败时怎么办、怎样算完成。页面说不清时，附一个 HTML Demo。他们可以把这段交给自己的 Agent：

```prompt
我要给 IT 部门提一个需求：<一句话>。先问我几个问题，写成需求文档，再做一个单文件的 HTML Demo 展示主要页面。
```

收到后，先和 Agent 对照 `docs/design.md` 更新设计，再开发。

**完成的标志**：新会话里 Agent 能说出 itam-lite 的现状；`.agents/rules/business-dates.md` 已在 `AGENTS.md` 的索引里登记；`package.json` 的 `nocobase.defaultTemplateVersion` 是新版本，测试和构建通过，升级前的数据都在。
