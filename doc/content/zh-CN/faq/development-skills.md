---
title: "开发时需要指定 Skill 吗？与自己的 Skills 冲突怎么办？"
---

通常可以直接描述业务需求，不必每次手动指定 Skill。前提是所用 Coding Agent 支持技能发现，且能读取项目里的技能。自动选择并非保证；发现 Agent 没有遵循项目约定时，可以明确要求它读取项目 `AGENTS.md` 和相关 Skill，并检查实际执行记录。

V3 应用以项目内的 `nocobase-app-development` 为主要开发入口。`nocobase-data-modeling`、`nocobase-ui-builder` 等无代码平台技能不能直接套用到 V3 Core 应用；当前应用模板也明确要求不使用全局安装的 NocoBase 2 Skills。开始方式见[开发第一个应用](../getting-started/develop-your-first-app.md)。

自有 Skills 可以补充业务规则、设计规范和验收要求。发生冲突时，先确认两者适用的版本和任务范围，再按所用 Agent 的指令优先级处理；没有通用于所有工具的“NocoBase Skills 永远优先”规则。应把已确认的团队规则维护在项目自己的指引中，避免直接修改会由依赖同步生成的 Skills。

Studio 的全局、项目和仓库技能可以叠加，同名技能以更具体的范围为准。这是挂载规则，不代表不同技能之间的矛盾内容会自动消解，见 [Studio 技能](../studio/project/skills.md)。
