---
title: "定时任务"
description: "声明业务计划任务，检查执行记录并管理启停。"
---

## 提供的能力

`@nocobase/app-plugin-scheduler` 用于在代码中声明计划任务，将调度交给宿主 Jobs，并记录每次触发结果。适合定期同步、汇总报表和业务巡检。

计划和目标由代码声明，应用接入管理页；插件不提供任意 Cron 或代码编辑器。

## 使用场景与示例

### 示例：每日业务汇总

每天 UTC 02:00 生成汇总报表。先实现目标，再声明计划，管理者通过列表检查触发记录并按需停用。

**开发提示词**（交给当前应用目录中的 Agent）：

```text
请使用定时任务插件，在每天 UTC 02:00 生成业务汇总。
先实现并注册 app.daily-report 目标，再用稳定 key 声明计划，接入宿主 Jobs。
增加受保护的任务列表、触发记录和启停入口，不提供任意代码执行编辑器。
使用独立测试数据和短周期检查时区、业务结果、失败状态与停用行为。
若目标异步完成，补充状态检查；不要用不完整清单执行 finalize。
```

**完成标志**：计划按指定时区触发并产生真实汇总，停用后不再产生新的计划执行。

## 重要原理与实现

以下是实现本例时的接入位置与预期界面变化；它们是开发说明，具体文件名沿用当前应用结构。

| 接入位置 | 代码或配置变化 | 界面与行为变化 |
| --- | --- | --- |
| 服务端 Provider 与目标实现 | 注册目标、配置校验和稳定的计划 key | 启动同步能识别业务计划 |
| Jobs 配置与关闭流程 | 选择执行器，保留 drain 所需依赖 | 调度按部署环境运行并正确关闭 |
| 任务管理页面 | 查询计划与记录，接入启停权限 | 管理者能检查触发情况并控制后续执行 |

### 接入与配置

注册 Server、Client 和需要的 CLI 入口，执行迁移，并确认应用已组合 `JobExecutorServiceProvider`。插件不自动注册任务管理页，应用使用 `/api/scheduler` 接入列表、详情和启停操作。

调度默认使用 `jobs.default`，可通过 `scheduler.jobs` 或 `SCHEDULER_JOBS` 选择另一份 Jobs 配置。memory 适用于单进程；多实例共同调度使用 Redis。所选配置的 `attempts` 保持为 `1`，业务目标的失败与恢复由实际业务处理。

### 定义任务

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

### 查看和管理

| 操作 | 接口 |
| --- | --- |
| 列表 | `GET /api/scheduler/schedules` |
| 详情 | `GET /api/scheduler/schedules/:id` |
| 触发记录 | `GET /api/scheduler/schedules/:id/occurrences` |
| 启用或停用 | `POST /api/scheduler/schedules/:id/enable` 或 `/disable` |

这些接口需要 `page:scheduler.schedules/access`。API 不返回原始目标配置，不提供任意代码或 Cron 编辑界面。

注册 CLI 后可运行 `pnpm nocobase scheduler sync` 同步声明。只有部署时确认持有完整清单，才使用 `--finalize` 停用已从清单消失的定义，避免把不完整清单当作删除依据。

## AI 开发的约束与验证

### 本插件的开发约束

- 声明计划不等于实现业务目标；检查目标注册、配置校验和真实业务产物。
- 多实例采用适合的 Jobs 配置，不能将单进程 memory 验证视为分布式验收。
- 验证异步完成通知丢失后的状态恢复；finalize 仅使用完整清单，避免误停任务。

### 验证结果

用短周期测试任务检查时区、下一次执行时间、触发记录和业务结果；再验证停用后不再产生新的计划执行。异步目标需验证丢失完成回调后仍可通过状态检查恢复。

应用关闭时，依赖服务应保持到 Scheduler 的 `drain()` 完成；它不等待所有外部业务或人工任务结束。相关文档：[后台任务](../../framework/background/jobs.md)、[定时调度](../../framework/background/scheduling.md)、[管理插件](../../developing-apps/manage-plugins.md)。

上述检查是接入后的验收要求，不表示本文已完成运行验证。让 Agent 报告实际改动、执行过的检查和未验证项；项目指引、Skill 与通用检查流程见[使用 Agent 开发](../../getting-started/develop-with-an-agent.md)和[测试与验收](../../developing-apps/testing-and-acceptance.md)。

源码依据：[插件公开入口与实现](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler)。
