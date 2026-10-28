---
title: 周期调度
---

`ScheduleExecutor` 按 Cron 或固定间隔触发任务，适合应用代码声明的清理、汇总和同步任务。需要可操作的定时任务列表、启停控制和执行记录时，接入定时任务插件。

## 声明规则

从宿主 `jobExecutorServiceToken` 解析服务，并在 Provider 中调用下面的启动函数：

```ts
import type { JobExecutorService } from '@nocobase/jobs';

export async function startOrderSchedule(
  service: JobExecutorService,
  runDigest: (signal: AbortSignal) => Promise<void>,
) {
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

`runDigest` 是调用方提供的业务函数。规则注册应先于 `setup()`，这样消费开始时对应处理函数已经可用。相同稳定名称用于更新已有规则；更名不会自动删除旧名称的规则。

## 时间参数

| 参数 | 含义 |
| --- | --- |
| `cron` | 五段或六段 Cron 表达式 |
| `every` | 固定间隔，毫秒；与 `cron` 二选一 |
| `tz` | Cron 时区，默认 UTC |
| `startDate` / `endDate` | 调度时间边界 |
| `limit` | 限制触发次数 |
| `immediately` | Cron 首次注册时立即触发的选项；受开始时间设置约束 |

显式声明业务时区，不要依赖部署机器的时区。周期调度不是实时保证：进程负载、暂停和重试都可能影响实际执行时间。汇总任务最好以业务时间窗口为输入，并能重复运行。

## 更新和关闭

`addJob()` 用稳定名称写入或更新规则；未变化的定义不会无故重置计划。修改规则可能重新安排后续执行，次数限制也会重新计算。需要明确处理旧规则的迁移。

应用关闭时调用 `shutdown()` 释放执行器，保留持久规则；`removeJob()` 用于业务上删除规则，不应在每次进程关闭时调用。配置并发、重试和保留策略时使用宿主的 jobs 配置。

任务处理应响应取消信号并保持幂等。本地执行事件不等于全局历史；需要历史、权限和管理页面时使用插件。参见[后台任务](jobs.md)。

## 接口与实现

- [Schedule executor](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
