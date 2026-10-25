---
title: 定时任务
status: 待补充正文
description: 在代码里定义定时任务，记录每次执行；管理员在应用的任务页面里查看计划和执行记录，按授权启用或停用任务。
---

> [!PENDING] 正文待编写
> 档案由脚本从 NocoBase 仓库 `v3-develop` 分支（商业插件为 `nocobase3-pro` 的 `develop` 分支）生成；正文按[文件](file.md)一页的写法补充。

## 档案

| | |
| --- | --- |
| 包名 | `@nocobase/app-plugin-scheduler` |
| 版本 | 1.0.0-beta.19 |
| 版本范围 | <span class="tag">开源</span> |
| 默认模板 | <span class="tag ok">已启用</span> 服务端、浏览器端、命令行 |
| 依赖的插件 | [认证](authentication.md)、[权限](authorization.md) |
| 自带页面 | 无；任务列表和执行记录页面由应用基于它的接口实现 |
| UI 组件 | 无 |
| 数据表 | 有，迁移随插件提供，表名以 `schedule` 开头 |
| 命令 | `pnpm nocobase scheduler sync` |
| 技能 | `nocobase-app-plugin-scheduler` |
| 所属能力 | [工作流与审批](../capabilities/workflows.md) |

## 计划包含

- 它怎样工作
- 计划怎样定义（时间规则、时区、执行的目标）
- 执行由 `jobs` 配置决定：内存或 Redis，多实例必须用 Redis
- 管理员能看到和操作什么
- 部署后同步计划：`scheduler sync --finalize`
- 和 NocoBase 2 工作流定时触发的对比
- 怎样让 Agent 使用，怎样检查结果
- 管理员能调整什么、部署配置
- 限制与尚未支持
- 与 NocoBase 2 的对应
- 开发参考
