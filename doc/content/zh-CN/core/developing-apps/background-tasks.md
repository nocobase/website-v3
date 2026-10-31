---
title: 后台任务与定时执行
description: 在应用中定义和投递后台任务，配置定时执行、失败重试与关闭恢复，并选择合适的执行后端。
---

通过 `JobExecutor` 在后台生成报表，让业务入口先返回受理结果；通过 `ScheduleExecutor` 按固定间隔或每天指定时间触发。业务代码负责生成报表、处理重复执行和保存结果。

[订单报表示例](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks)使用固定订单数据生成真实 CSV 文件。这是单独的服务端 App，通过命令运行，无需页面、数据库或商业插件。安装步骤见[示例源码与运行](#示例源码与运行)。

## 选择执行方式

| 需求 | 使用方式 |
| --- | --- |
| 当前请求必须拿到业务结果 | 直接调用业务服务 |
| 提交一次工作，允许稍后完成 | `Job` 与 `JobExecutor` |
| 应用代码声明周期清理、汇总或同步 | `ScheduleExecutor` |
| 管理员需要启停规则、查看执行记录 | [定时任务插件](../using-plugins/automation/scheduler.md) |

通过 `@nocobase/app-server/jobs` 的 `jobExecutorServiceToken` 获取应用已有的服务。普通任务和周期调度使用 `jobs` 配置；需要延迟投递、优先级等消息处理能力时，参见使用独立配置的[队列](../framework/background/queues.md)。

## 定义和投递后台任务

### 定义任务与参数

在 `server/jobs/report-job.ts` 中定义任务。`jobs/` 只是应用自己的目录，不会自动扫描或注册：

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export interface ReportPayload {
  readonly reportId: string;
  readonly stepMs: number;
  readonly failure: 'none' | 'first' | 'always';
}

export type GenerateReport = (
  payload: ReportPayload,
  context: JobExecutionContext,
) => Promise<void>;

export function createReportJob(generateReport: GenerateReport) {
  return class ReportJob extends Job<ReportPayload> {
    static readonly jobName: string = 'reports.generate';

    async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      await generateReport(this.payload, context);
    }
  };
}
```

`reportId` 标识一份业务报表。`stepMs` 和 `failure` 是示例的慢执行、失败开关，实际业务不必提供这些参数。生成函数处理三条固定订单，每处理一条上报进度，最后写入文件。

载荷只包含 JSON 数据，不要传函数、数据库连接、请求对象或 `Date`；日期可以转为 ISO 字符串。投递时执行器保存载荷快照，每次尝试都重新创建任务实例，实例字段不能用来保存重试次数或恢复进度。

`createReportJob()` 是示例自己的工厂函数，用闭包绑定业务依赖，并非框架的注入 API。任务构造函数仍然只接收载荷。`jobName` 必须稳定，不能包含空白或冒号；所有消费进程都要注册对应任务类。

[查看任务定义](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/jobs/report-job.ts) · [查看报表生成逻辑](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

### 在 Provider 中注册和启动

在 `server/providers/reports.ts` 中，`register()` 把报表服务绑定到 `reportJobsToken`：

```ts
override register(): void {
  this.app.container.singleton(reportJobsToken, () => new ReportJobs());
}
```

`start()` 创建任务类并启动执行器。以下是启动部分的代码；完整 Provider 包含导入、字段声明和失败清理：

```ts
const executors = this.app.container.resolve(jobExecutorServiceToken);
const reports = this.app.container.resolve(reportJobsToken);
const config = this.app.config.get<ReportsConfig>('reports')!;
const ReportJob = createReportJob((payload, context) =>
  generateReport(this.app.paths.storage('reports'), payload, context),
);

this.jobs = executors.getJobExecutor('app.reports');
this.schedules = executors.getScheduleExecutor('app.reports.schedule');
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));

this.jobs.registerJob(ReportJob);
await this.jobs.setup({ consume: config.consume });
reports.attach(this.jobs, ReportJob, this.schedules);
if (config.schedule) await reports.schedule(config.schedule);
await this.schedules.setup({ consume: config.consume });
```

`reports` 配置默认使用 `consume: true`。普通任务先注册，再 `setup()`，最后接受投递，以便处理之前留下的任务。仅负责投递的进程可以使用 `setup({ consume: false })`，首次 `setup()` 决定是否消费，后续调用不会切换模式。运行 `pnpm test` 中的投递端用例，可以观察任务在投递端关闭后由新的消费端执行；[查看该用例](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/tests/reports.test.ts)。

`app.reports` 是执行器的业务范围（scope）。保持应用命名空间、scope 和任务类型名称稳定，避免升级后无法找到旧任务。

接入默认模板应用时，把 `ReportsProvider` 追加到现有 `server/providers/index.ts` 数组，并添加它读取的 `reports` 配置。沿用模板已有的 Jobs 服务，保留 `SubmissionProvider` 等原有 Provider；模板 beta.85 已注册每小时清理过期回执的任务，无需重复添加。Provider 的通用用法见[服务端服务](server-business-services.md)。

[查看完整 Provider](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [查看示例应用入口](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### 投递任务与查看进度

在 `server/reports/service.ts` 的 `ReportJobs.enqueue()` 中，先准备并校验载荷，再通过 `addJob()` 投递：

```ts
const payload: ReportPayload = {
  reportId,
  stepMs: 30,
  failure: 'none',
  ...options,
};
validatePayload(payload);
if (!this.jobs || !this.ReportJob)
  throw new Error('Report jobs are not ready.');
return this.jobs.addJob(new this.ReportJob(payload));
```

`this.jobs` 和 `this.ReportJob` 由 Provider 在启动后通过 `attach()` 传入。命令在应用启动后解析此服务：

```ts
const reports = app.container.resolve(reportJobsToken);
const receipt = await reports.enqueue('order-summary');
console.log('Accepted:', receipt.jobId);
```

每次 `addJob()` 都会得到新的任务 ID；相同 `reportId` 不会让执行器自动去重。

回执包含 `jobId`、`jobName` 和 `enqueuedAt`，只表示后端已经接收。HTTP 入口可以返回 `202` 和任务 ID，但必须自行检查身份、权限和输入。后台任务不继承浏览器请求身份；用户任务需要明确可信的操作者和执行时的权限范围。示例的本地命令由本机操作者执行，没有开放 HTTP 接口。

运行 `pnpm demo manual`，命令先打印任务 ID，完成后显示 CSV 内容，文件位于命令打印目录下的 `storage/reports/order-summary.csv`：

```csv
orderId,customer,total
ORD-1001,Cedar Books,120
ORD-1002,Harbor Supply,75
ORD-1003,Maple Market,210
```

[查看投递服务](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts) · [查看命令入口](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

业务函数通过执行上下文报告 0–100 的进度。示例处理每条订单后调用：

```ts
await context.reportProgress((index + 1) * 30);
```

文件写入完成后报告 `100`。Provider 在消费开始前订阅事件：

```ts
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));
```

`JobStart`、`JobProgress`、`JobEnd` 和 `JobError` 描述当前实例的一次执行尝试。使用 `jobId` 关联同一任务，用 `attempt` 区分执行次数。`JobError` 后仍可能重试，进度也会从头开始。

`pnpm demo manual` 的事件输出如下：

```text
JobStart attempt=1
JobProgress attempt=1 progress=30
JobProgress attempt=1 progress=60
JobProgress attempt=1 progress=90
JobProgress attempt=1 progress=100
JobEnd attempt=1
```

示例把事件保存在有长度限制的内存数组中，仅供命令观察；重启后数组清空。需要跨实例查询状态或展示历史时，应持久化业务记录，不能把事件数组或进度百分比当作持久结果。

[查看进度上报](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts) · [查看事件记录](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## 配置定时执行

### 固定间隔

`ScheduleExecutor.addJob()` 用稳定名称注册处理函数和规则。`server/reports/service.ts` 中的 `ReportJobs.schedule()` 如下，`scheduleName` 固定为 `order-summary`，参数类型 `ScheduleJobOption` 来自 `@nocobase/jobs`：

```ts
async schedule(options: ScheduleJobOption) {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.addJob({
    name: scheduleName,
    options,
    payload: {},
    execute: async ({ scheduledAt, signal }) => {
      signal.throwIfAborted();
      await this.enqueue(`scheduled-${scheduledAt.getTime()}`);
    },
  });
}
```

Provider 先声明规则，再调用定时执行器的 `setup()`；规则在启动消费前写入后端。`scheduledAt` 是计划触发时间，实际开始时间可能更晚。示例把它放进报表 ID，让同一计划时间的重复投递得到同一份业务结果。

使用固定间隔时传入 `every`，单位为毫秒：

```ts
await reports.schedule({ every: 200, limit: 2 });
```

运行 `pnpm demo interval`，规则触发两次，生成两份报表后输出 `Completed reports: 2`。`limit` 限制计划触发次数，不是普通任务的重试次数。

一次调度执行成功只说明报表已投递；报表仍可能在稍后失败。示例命令等待报表任务完成后才计数。短小的周期操作也可以在调度处理函数中直接调用业务服务，不必再投递任务。

[查看规则与处理函数](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

### Cron 与时区

每天当地时间 02:00 生成报表，可使用：

```ts
await reports.schedule({ cron: '0 2 * * *', tz: 'Asia/Shanghai' });
```

时区应替换为业务使用的 IANA 时区；省略时默认为 UTC，不是服务器本地时区。Cron 支持五段或六段表达式，与 `every` 二选一。

运行 `pnpm demo cron`，示例使用加速规则 `{ cron: '*/1 * * * * *', tz: 'UTC', limit: 2 }` 实际触发两次，便于观察。每日规则则由 `pnpm demo rules` 注册并显示下次执行时间，无需等待到次日。

[查看两种 Cron 演示](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

### 更新和删除规则

沿用相同规则名称再次调用 `addJob()` 就是更新。定义未变化时保留已有计划；更名会留下旧规则，需要显式迁移或删除。

`ReportJobs` 的查询和删除方法调用执行器的公开 API，继续使用同一个 `scheduleName`：

```ts
async getSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.getJob(scheduleName);
}

async removeSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.removeJob(scheduleName);
}
```

示例服务分别调用定时执行器的 `getJob('order-summary')` 和 `removeJob('order-summary')`。运行 `pnpm demo rules` 会创建间隔规则、更新为每日 Cron、显示 `nextRunAt`，再删除规则；删除回执为 `Job removed`，之后查询返回 `undefined`。

`removeJob()` 删除规则和待触发计划，当前进程仍保留处理函数。应用退出应调用 `shutdown()`，不要在每次关闭时删除规则。重启时仍需注册处理函数，后端保存的规则不包含可执行代码。

[查看规则管理方法](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## 处理失败与重复执行

`attempts` 来自执行器选用的 `jobs` 配置，默认 `1`，包含首次执行。示例在 `server/config.ts` 中设置：

```ts
import type { AppJobsConfig } from '@nocobase/app-server/jobs';

export const jobs: AppJobsConfig = {
  default: 'memory',
  memory: { adapter: 'memory', concurrency: 1, attempts: 3 },
};
```

这允许普通失败最多执行三次。`concurrency` 是每个执行器工作实例的并发数，不是整个部署的全局限制。在默认模板中，应将对应值加入已有的 `server/config/jobs.ts` 或部署配置。

投递时用示例参数触发首次失败：

```ts
await reports.enqueue('order-summary', { failure: 'first', stepMs: 30 });
```

生成函数读取 `context.attempt`，在第一次尝试处理完首条订单后抛错；`failure: 'always'` 则每次都抛错。

- `pnpm demo retry`：第一次在 30% 进度处抛错，第二次重新生成并完成。
- `pnpm demo failure`：每次都抛错，记录三次 `JobError`，不生成 CSV。命令验证这是预期结果后正常退出。

`context.attempt` 统计实际开始执行的次数，包含中断恢复，不等同于已消耗的普通失败次数。

[查看重试配置](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/config.ts) · [查看失败触发条件](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

重试、恢复和重复提交都可能再次执行业务，因此业务操作需要幂等：同一报表重复生成，也只保留一份结果。示例先写完整的临时文件，再通过硬链接原子创建目标 CSV；相同 `reportId` 的文件已存在时不覆盖。

文件发布的完整实现见下方源码链接。数据库写入、扣库存或外部请求应使用各自的事务、唯一约束或幂等键。同一报表 ID 表示同一份数据快照，数据范围变化时应使用新的 ID。

运行 `pnpm demo repeat`，两次投递得到不同任务 ID，但只保留一份未被覆盖的 CSV。业务数据写入和任务投递也不是同一个事务；不能遗漏的后续工作需要持久化待投递记录及恢复逻辑，见[服务端服务](server-business-services.md)。

[查看完整文件发布逻辑](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## 关闭执行器与恢复任务

先停止周期触发，再停止接受业务投递，最后关闭普通任务执行器。事件订阅保留到任务关闭完成，避免丢失最后的中断事件：

```ts
override async shutdown(): Promise<void> {
  try {
    await this.schedules?.shutdown();
  } finally {
    this.app.container.resolve(reportJobsToken).stopAccepting();
    try {
      await this.jobs?.shutdown();
    } finally {
      this.unsubscribe?.();
    }
  }
}
```

`shutdown()` 向运行中的任务发出取消信号，并等待任务退出，不会强制终止业务代码。长任务应分批执行，检查 `signal`，并把它传给支持取消的操作。

如果任务尚未完成，收到取消后调用 `signal.throwIfAborted()`，或在信号已取消时抛出 `JobInterruptedError`，可以让普通任务作为中断保留，等待下次执行，不消耗普通失败预算。业务函数正常返回仍被视为完成；不要在已提交完整业务结果后再声明中断。

示例使用可取消的等待模拟耗时操作。Node 定时器抛出的 `AbortError` 会转换为 `signal.reason`，使执行器识别为中断，而不是普通失败。

运行 `pnpm demo recovery`，命令在第一次进度事件后关闭应用，再用同一存储目录创建新应用。输出包含：

```text
Interrupted during shutdown; reopening the same storage.
JobEnd, attempt 2
```

相同任务 ID 会在第二次尝试中重新生成报表，进度从头开始。这验证正常关闭后的恢复，不代表强制杀进程或机器故障后也能恢复。

[查看关闭逻辑](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [查看取消处理](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## 配置执行后端

### 单进程 memory

Jobs 核心内置 memory。未指定配置且没有 `jobs.default` 时，也会使用内置 memory；显式选择 `jobs.default: memory` 可以表明部署选择。

memory 在启动时读取状态，运行时保留在内存，正常关闭时写入 `storage/jobs/`。强制退出可能丢失新任务，也可能在下次启动时重放旧任务。多个进程不能共享它来分配工作，也不应同时写同一份状态文件。

示例每次运行创建独立存储目录；只有恢复演示在关闭后重新使用同一目录。[查看配置与路径设置](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### Redis 商业插件与多实例部署

> [!NOTE]
> Redis 执行后端由商业插件 `@nocobase/app-plugin-jobs-redis` 提供。基础任务、定时执行和本页的 memory 示例不需要该插件。

使用 Redis 前，需要取得插件使用权限，在每个生产者和消费者中安装并注册其 Server 插件，再定义并选用包含 `adapter: redis` 的 Jobs 配置。连接和保留策略按所安装版本的插件说明配置。

仅填写 `jobs.default: redis` 或连接地址不能完成接入。当前 Jobs 核心不内置 Redis；选中的实现没有注册时会抛出 `JobsBackendNotRegisteredError`，不会自动降级为 memory。旧应用升级时也要显式保留 `adapter: redis`，以及原有连接、命名空间和 scope。

多实例消费和故障恢复需要在实际 Redis 部署中验证，不能用 memory 的结果代替。采用 Redis 后仍需保证业务幂等。后端接入契约见[对应版本的 Jobs 源码说明](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/jobs/README.md)。

## 示例源码与运行

[完整示例与验证说明](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks)。使用 Node.js 24、pnpm 11.7.0，依赖版本由锁文件固定：App Server `3.0.0-beta.5`、Jobs `1.0.0-beta.5`、ServiceProvider `0.0.2-beta.2`。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3cfe5c53612d783d038a7b2a46c7b05fda1e1c26
cd apps/background-tasks
pnpm install --frozen-lockfile
pnpm demo manual
```

文中的 `pnpm demo` 和检查命令都在 `apps/background-tasks` 目录运行。其他场景使用相应小节中的命令。每次命令都会输出独立的结果目录并正常关闭应用，无需启动 Web 服务。

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

示例使用真实 NocoBase Application，输出目录所在文件系统需要支持硬链接。`pnpm build` 编译 TypeScript，不生成部署归档。详细的用法、源码和检查对应关系见[示例 README](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/README.md)。
