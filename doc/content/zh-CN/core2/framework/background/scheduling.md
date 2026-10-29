---
title: 周期调度
description: 用 ScheduleExecutor 按 Cron 或固定间隔触发任务，了解规则的声明、时间参数，以及规则的更新与关闭。
---

`ScheduleExecutor` 按 Cron 表达式或固定的间隔触发任务，适合由应用代码声明的清理、汇总和同步任务。需要一个可以操作的定时任务列表、启停控制和执行记录时，请接入定时任务插件。

## 声明规则

从宿主的 `jobExecutorServiceToken` 解析服务，并在 Provider 中调用下面的启动函数：

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';

export async function startOrderSchedule(
  container: ServiceResolver,
  runDigest: (signal: AbortSignal) => Promise<void>,
) {
  const service = container.resolve(jobExecutorServiceToken);
  const executor = service.getScheduleExecutor('@example/orders');
  await executor.addJob({
    name: 'daily-digest',
    payload: {},
    options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
    execute: async ({ signal }) => runDigest(signal),
  });
  await executor.setup();
  return executor;
}
```

`runDigest` 是调用方提供的业务函数。规则应在 `setup()` 之前注册，这样开始消费时，对应的处理函数已经可用。使用相同的稳定名称会更新已有的规则；改名并不会自动删除旧名称下的规则。

## 时间参数

| 参数 | 含义 |
| --- | --- |
| `cron` | 五段或六段的 Cron 表达式 |
| `every` | 固定的间隔，单位为毫秒；与 `cron` 二选一 |
| `tz` | Cron 使用的时区，默认为 UTC |
| `startDate` / `endDate` | 调度的时间边界 |
| `limit` | 限制触发的次数 |
| `immediately` | Cron 首次注册时立即触发一次；受开始时间设置的约束 |

请显式声明业务时区，不要依赖部署机器的时区。周期调度并不保证实时：进程负载、暂停和重试都可能影响实际的执行时间。汇总类任务最好以业务的时间窗口作为输入，并且可以重复运行。

## 更新与关闭

`addJob()` 使用稳定的名称写入或更新规则；定义没有变化时，不会无故重置计划。修改规则可能会重新安排之后的执行，次数限制也会重新计算，因此需要明确处理旧规则的迁移。

应用关闭时，调用 `shutdown()` 释放执行器，持久化的规则会保留下来；`removeJob()` 用于在业务上删除规则，不应在每次进程关闭时调用。并发、重试和保留策略，请通过宿主的 jobs 配置设置。

任务的处理应响应取消信号，并保持幂等。本地的执行事件不等于全局的执行历史；需要执行历史、权限控制和管理页面时，请使用插件。另见 [后台任务与执行器](jobs.md)。

## 接口与实现

- [Schedule executor](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
