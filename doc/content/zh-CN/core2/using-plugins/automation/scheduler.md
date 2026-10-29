---
title: "定时任务"
description: "声明业务计划任务，检查执行记录，管理任务的启停。"
---

## 提供的能力

`@nocobase/app-plugin-scheduler` 用于在代码中声明计划任务，把调度交给宿主的 Jobs，并记录每一次触发的结果，适合定期同步、汇总报表和业务巡检等场景。

计划及其目标都由代码声明，管理页由应用接入；插件不提供任意 Cron 或代码的编辑器。

## 使用场景与示例

### 示例：每日业务汇总

每天 UTC 02:00 生成一份汇总报表。先实现目标，再声明计划；管理者通过列表检查触发记录，并按需停用。

**开发提示词**（交给当前应用目录中的 Coding Agent）：

```prompt
请使用定时任务插件，在每天 UTC 02:00 生成业务汇总。
先实现并注册 app.daily-report 目标，再用稳定 key 声明计划，接入宿主 Jobs。
增加受保护的任务列表、触发记录和启停入口，不提供任意代码执行编辑器。
使用独立测试数据和短周期检查时区、业务结果、失败状态与停用行为。
若目标异步完成，补充状态检查；不要用不完整清单执行 finalize。
```

**完成的标志**：计划按指定的时区触发，并产生真实的汇总结果；停用后，不再产生新的计划执行。

## 重要原理与实现

下表列出实现本例时的接入位置和预期的界面变化。这些是开发说明，具体的文件名沿用当前应用的结构。

| 接入位置 | 代码或配置的变化 | 界面与行为的变化 |
| --- | --- | --- |
| 服务端 Provider 与目标实现 | 注册目标、配置校验和稳定的计划 key | 启动时的同步能够识别业务计划 |
| Jobs 配置与关闭流程 | 选择执行器，保留 drain 所需的依赖 | 调度按部署环境运行，并能正确关闭 |
| 任务管理页面 | 查询计划和记录，接入启停权限 | 管理者能检查触发情况，并控制后续的执行 |

### 接入与配置

注册 Server、Client 以及需要的 CLI 入口，执行迁移，并确认应用已经组合了 `JobExecutorServiceProvider`。插件不会自动注册任务管理页，应用通过 `/api/scheduler` 接入列表、详情和启停操作。

调度默认使用 `jobs.default`，也可以通过 `scheduler.jobs` 或 `SCHEDULER_JOBS` 选择另一份 Jobs 配置。memory 执行器适用于单进程；多个实例共同调度时，请使用 Redis。所选配置的 `attempts` 需保持为 `1`，业务目标的失败和恢复由实际的业务处理。

### 定义任务

在 Provider 的 `register()` 或 `boot()` 阶段，从 `/server/tokens` 解析 `schedulerServiceToken`，然后：

1. 用 `registerTarget()` 声明目标的类型、配置校验和启动逻辑。
2. 用 `defineSchedule()` 声明一个稳定、在整个应用中唯一的 key，以及时间规则和目标。
3. 对于异步完成的目标，还要提供状态检查，并通过注册时返回的 handle 报告最终结果。

例如，在已经注册了 `app.daily-report` 目标之后，可以这样声明每天 UTC 02:00 的汇总任务：

```ts
scheduler.defineSchedule({
  key: 'daily-report',
  title: 'Daily report',
  schedule: { cron: '0 0 2 * * *', timezone: 'UTC' },
  target: { type: 'app.daily-report', config: {} },
});
```

`scheduler` 是解析得到的服务。这只是计划的声明，应用还需要实现报表目标本身。声明在启动同步时读取，不能把它当作一个在运行时随时新增任务的 HTTP 接口。

### 查看和管理

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/scheduler/schedules` |
| 详情 | `GET /api/scheduler/schedules/:id` |
| 触发记录 | `GET /api/scheduler/schedules/:id/occurrences` |
| 启用或停用 | `POST /api/scheduler/schedules/:id/enable` 或 `/disable` |

这些接口需要 `page:scheduler.schedules/access` 权限。API 不返回原始的目标配置，也不提供任意代码或 Cron 的编辑界面。

注册 CLI 之后，可以运行 `pnpm nocobase scheduler sync` 同步声明。只有在部署时确认持有完整的计划清单，才使用 `--finalize` 停用已从清单中消失的定义，避免把不完整的清单当作删除的依据。

## AI 开发的约束与验证

### 本插件的开发约束

- 声明了计划，并不等于实现了业务目标；请检查目标的注册、配置校验和真实的业务产物。
- 多实例部署要采用合适的 Jobs 配置，不能把单进程 memory 执行器上的验证当作分布式验收。
- 验证异步完成的通知丢失之后，状态能否恢复；`finalize` 只能配合完整的清单使用，以免误停任务。

### 验证结果

用短周期的测试任务检查时区、下一次执行时间、触发记录和业务结果，再验证停用后不会产生新的计划执行。对于异步目标，还需验证完成回调丢失之后，仍能通过状态检查恢复。

应用关闭时，依赖的服务应保持可用，直到 Scheduler 的 `drain()` 完成；它不会等待所有外部业务或人工任务结束。相关文档：[后台任务与执行器](../../framework/background/jobs.md)、[周期调度](../../framework/background/scheduling.md)、[管理插件](../../developing-apps/manage-plugins.md)。

以上检查是接入后的验收要求，并不表示本文已经完成了运行验证。请让 Agent 报告实际的改动、执行过的检查和未验证的部分；项目指引、Skills 和通用的检查流程见 [和 Agent 一起开发](../../developing-apps/develop-with-an-agent.md) 与 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件的公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler)。
