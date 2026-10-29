---
title: "定时任务"
description: "声明业务计划任务，检查执行记录并管理启停。"
---

`@nocobase/app-plugin-scheduler` 用于在代码中声明计划任务，将调度交给宿主 Jobs，并记录每次触发结果。适合定期同步、汇总报表和业务巡检。

## 接入与配置

注册 Server、Client 和需要的 CLI 入口，执行迁移，并确认应用已组合 `JobExecutorServiceProvider`。插件不自动注册任务管理页，应用使用 `/api/scheduler` 接入列表、详情和启停操作。

调度默认使用 `jobs.default`，可通过 `scheduler.jobs` 或 `SCHEDULER_JOBS` 选择另一份 Jobs 配置。memory 适用于单进程；多实例共同调度使用 Redis。所选配置的 `attempts` 保持为 `1`，业务目标的失败与恢复由实际业务处理。

## 定义任务

在 Provider 的 `register()` 或 `boot()` 阶段，从 `/server/tokens` 解析 `schedulerServiceToken`：

1. 用 `registerTarget()` 声明目标类型、配置校验和启动逻辑。
2. 用 `defineSchedule()` 声明稳定且全应用唯一的 key、时间规则和目标。
3. 异步目标还要提供状态检查，并通过注册返回的 handle 报告最终结果。

例如，在已经注册 `app.daily-report` 目标后，可声明每日 UTC 02:00 的汇总任务：

```ts
scheduler.defineSchedule({
  key: 'daily-report',
  title: 'Daily report',
  schedule: { cron: '0 0 2 * * *', timezone: 'UTC' },
  target: { type: 'app.daily-report', config: {} },
});
```

`scheduler` 是解析后的服务。这只是计划声明；应用还需实现报表目标。声明在启动同步时读取，不能把它当作运行后随时新增任务的 HTTP 接口。

## 查看和管理

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/scheduler/schedules` |
| 详情 | `GET /api/scheduler/schedules/:id` |
| 触发记录 | `GET /api/scheduler/schedules/:id/occurrences` |
| 启用或停用 | `POST /api/scheduler/schedules/:id/enable` 或 `/disable` |

这些接口需要 `page:scheduler.schedules/access`。API 不返回原始目标配置，不提供任意代码或 Cron 编辑界面。

注册 CLI 后可运行 `pnpm nocobase scheduler sync` 同步声明。只有部署时确认持有完整清单，才使用 `--finalize` 停用已从清单消失的定义，避免把不完整清单当作删除依据。

## 验证结果

用短周期测试任务检查时区、下一次执行时间、触发记录和业务结果；再验证停用后不再产生新的计划执行。异步目标需验证丢失完成回调后仍可通过状态检查恢复。

应用关闭时，依赖服务应保持到 Scheduler 的 `drain()` 完成；它不等待所有外部业务或人工任务结束。相关文档：[后台任务](../../framework/background/jobs.md)、[定时调度](../../framework/background/scheduling.md)、[管理插件](../../developing-apps/manage-plugins.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler)。
