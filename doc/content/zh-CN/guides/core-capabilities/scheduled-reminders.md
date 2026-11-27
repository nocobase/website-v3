---
title: "定时任务"
metaDescription: "在 CRM 中按团队时区每天凌晨生成销售活动日报，通过任务运行记录和午夜前后的跟进记录核对统计日期。"
---

销售主管每天早上打开 CRM，希望看到昨天新增了多少客户、多少商机，以及销售记录了多少条跟进。本例用定时任务每天生成一份团队日报，最近 30 个有日报的日期可以在 **Sales activity reports** 中查看。

在 [CRM 完整示例](https://github.com/nocobase/doc-demo-crm/tree/main) 中，销售主管可以查看团队日报，管理员还可以查看任务的运行记录。

**学习模块**

- [定时任务](../../core/using-plugins/automation/scheduler.md)

## 日报统计规则

先和销售团队约定“昨天”按哪里的一天计算。示例团队使用上海时间（`Asia/Shanghai`）。11 月 26 日凌晨 1 点生成 **11 月 25 日**的日报，统计范围从上海时间 25 日 00:00 开始，到 26 日 00:00 截止。恰好在 26 日 00:00 创建的记录归入 26 日。

三项指标各按自己的创建时间计数。一位老客户昨天新增了一条跟进，就给昨天的“新增跟进”加一；这位客户本身仍归入最初创建的那一天。

## 设置执行时间和时区

在 CRM 项目中，可以这样向开发 Agent 描述需求：

```prompt
请每天自动生成一份销售日报。我早上打开 CRM 时，想看到团队昨天新增了多少客户和商机、记录了多少条跟进，也能按日期翻看以前的日报。
```

示例的[日报实现](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/daily-reports.ts)把统计逻辑注册为调度目标，再声明运行时间：

```ts
schedule: { cron: '0 1 * * *', timezone: reportTimezone },
```

这里的 `reportTimezone` 是 `Asia/Shanghai`。调度器按这个时区解释“每天 01:00”，服务器设为 UTC 也会在上海凌晨 1 点触发。省略 `timezone` 时默认使用 UTC，同一表达式会在上海上午 9 点触发。

生成日报时，应用按同一个团队时区取前一个日历日，将那一天的起止时间分别换算成 UTC，再查询三类记录。例如上海时间 26 日凌晨 1 点对应 UTC 25 日 17 点，直接用 UTC 日期减一天会误算成 24 日。为其他地区的团队调整示例时，修改 `reportTimezone` 即可同时调整触发时间和统计范围。

## 查看运行记录

管理员打开 **System settings → Schedules**，选择 **Daily sales activity**。在 **Rule** 核对 Cron 和时区，在 **Next runs** 核对下一次执行时间。截图中的浏览器也使用上海时区；如果浏览器显示 UTC，上海凌晨 1 点对应前一天的 17:00。

任务执行后，在该任务的运行记录中打开对应的一次执行，查看结果里的 `reportDate`、`customers`、`opportunities` 和 `followUps`。再从侧栏打开 **Sales activity reports**，按同一个日报日期核对三项数字。如果在任务触发前已打开日报页，刷新页面即可看到新记录。

![Daily sales activity 任务的调度规则、时区、下次执行时间和运行记录](/assets/guides/crm-sales-activity-schedule.png)

## 核对午夜前后的数据

在独立测试数据中，为同一位客户准备下面两条跟进。它们的 UTC 日期相同，按团队时区却属于不同的日报。

| 跟进创建时间（上海） | 对应的 UTC 时间 | 计入哪份日报 |
| --- | --- | --- |
| 11 月 25 日 23:55 | 11 月 25 日 15:55 | 11 月 25 日 |
| 11 月 26 日 00:05 | 11 月 25 日 16:05 | 11 月 26 日 |

可以在示例项目根目录运行[跨午夜测试](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/daily-reports.test.ts)，立即验证这组数据：

```sh
pnpm exec vitest run tests/server/daily-reports.test.ts
```

测试还在 25 日 00:00 创建了一位客户，在 26 日 00:00 创建了一个商机。因此，25 日的日报应显示 **1 位新增客户、0 个新增商机、1 条新增跟进**。在隔离测试中再次生成 25 日的日报，仍应只有一行；26 日的日报则会计入那个商机和 00:05 的跟进。

![销售活动日报，11 月 25 日一行显示 1 位新增客户、0 个新增商机和 1 条新增跟进](/assets/guides/crm-sales-activity-report.png)

## 小结与下一步

**完成的标志**：任务按团队时区在凌晨 1 点生成前一天的日报，运行记录中的三项计数与日报一致。23:55 和次日 00:05 的两条跟进分别计入各自日期的日报。

定时任务也可以用来检查哪些跟进已到期。要向负责人发送提醒，参见[业务事件与站内通知](notifications.md)。
