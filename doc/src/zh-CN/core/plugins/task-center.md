---
title: 任务中心
status: 待补充正文
description: 个人任务中心：把各个业务来源的待办汇总到一处，自带「任务中心」页面。审批插件依赖它。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-task-center` |
| 版本 | 0.1.0-beta.1 |
| 版本范围 | <span class="tag pro">商业版</span> 需要相应授权 |
| 默认模板 | 不在默认模板中 |
| 依赖的插件 | [认证](authentication.md) |
| 自带页面 | 「任务中心」（`/task-center`） |
| UI 组件 | UI 组件库的 `task-center-ui` |
| 数据表 | 有，迁移随插件提供 |
| 命令 | 无 |
| 技能 | `nocobase-app-plugin-task-center` |
| 所属能力 | [工作流与审批](../capabilities/workflows.md) |

## 计划包含

- 它怎样工作
- 业务怎样把待办写进任务中心
- 它不负责业务的完成、审批决定和通知发送
- 和站内信收件箱的区别
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
