---
title: "定时任务与到期提醒"
metaDescription: 在 CRM 中通过定时任务扫描客户跟进计划和已确认报价回复期限，到期后复用站内通知向当前负责人发送提醒。
---

在 CRM 应用中为客户安排跟进时间、为已确认报价设置回复期限，到期后通过定时任务向当前负责人发送站内提醒。

在完整示例中体验时，准备管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（角色配置见[角色权限与数据范围控制](roles-and-permissions.md#配置用户与角色)），并确保站内通知可用（见[业务事件与站内通知](notifications.md)）。

**学习模块**

- [定时任务](../../core/using-plugins/automation/scheduler.md)
- [通知](../../core/using-plugins/notifications/notification.md)
- [站内信](../../core/using-plugins/notifications/in-app.md)

## 明确跟进时间、报价期限与提醒规则

提醒计划包含名称、到期时间和类型。时间按浏览器本地时区填写，保存为 UTC；报价回复期限是内部跟进计划，不修改正式报价文件，也不使报价自动失效。

| 检查时的情况 | 处理方式 |
| --- | --- |
| 到期、尚未提醒，客户及负责人有效 | 向当前负责人发送一次站内提醒 |
| 未到期、已完成、已取消或已经提醒 | 不发送 |
| 客户停用、没有负责人或负责人停用 | 暂不发送，恢复后再检查 |
| 报价所属商机已赢单或输单 | 不发送报价提醒 |

只读共享者可以查看计划，不能安排、完成或取消。改期时取消旧计划再新建；消息已读不代表完成跟进。已经排队的通知不会因随后完成或取消计划而撤回。

## 整合定时任务与已有通知能力

[Core Scheduler](../../core/using-plugins/automation/scheduler.md)保存调度定义及执行记录，并提供暂停、恢复入口；[通知服务](../../core/using-plugins/notifications/notification.md)负责实际投递。本专题每分钟检查一次，复用站内通知渠道（详见[业务事件与站内通知](notifications.md)），不要求外部邮箱。

### 交给 Agent 开发

将第一节的规则表和权限说明连同下面的提示词交给开发 Agent：

```prompt
给 CRM 客户详情增加跟进计划，也能为已确认报价设置回复期限。按前面的提醒规则表和权限说明实现，时间按我的本地时区填写；报价提醒不改变已发文件或报价效力。

每分钟检查，向当前负责人提醒一次，重试和重启不能重复提醒。让我体验安排、收取提醒、完成或取消计划，并在系统设置查看执行记录、暂停和恢复任务。复用已有站内通知，保留现有数据。
```

### 理解实现

完整示例中的[提醒 Provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-reminders.ts)先用 `registerTarget` 注册 `crm.reminder-scan`，执行入口调用业务方法 `scan()`；再用 `defineSchedule` 把目标绑定到每分钟的调度：

```ts
scheduler.defineSchedule({
  key: 'crm.reminders',
  title: 'Customer follow-up reminders',
  description: 'Check due plans and queue notifications; delivery has separate logs.',
  schedule: { cron: '* * * * *', timezone: 'UTC' },
  target: { type: 'crm.reminder-scan', config: {} },
});
```

Core Scheduler 提供触发、执行记录、暂停和恢复，底层执行见 [Jobs](../../core/framework/background/jobs.md)。CRM 的 `scan()` 判断到期、客户及当前负责人是否有效，在同一事务中保存提醒状态和事件；[CRM 通知逻辑](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-notifications.ts)继续负责补发，再交给 Core Notification 投递。调度成功与通知送达是两项结果。

### 实际体验

1. Alex 打开自己负责的客户，在 **提醒计划** 填写 **Call Casey about the implementation proposal**，选择 **客户跟进**，时间设为几分钟后。
2. 如需验证报价提醒，选择 **报价回复期限**，再选择该客户的一份已确认报价。没有可选报价时可先按[审批流程与待办中心](approval-workflows.md)确认一份报价。
3. 保存后等待到期和下一次分钟检查，在 **收件箱** 查看提醒，再打开客户详情处理计划。

![客户详情中的跟进计划及提醒状态](/assets/guides/crm-reminders.png)

## 查看任务执行记录与提醒结果

管理员打开 **系统设置 → 定时提醒**，查看任务时区、下次执行时间和启用状态，点击 **Customer follow-up reminders** 查看执行记录。销售与销售主管默认不能管理调度。

![实际任务执行时间、状态和检查数量](/assets/guides/crm-reminder-schedules.png)

执行记录中的检查数表示本轮读取的到期计划，排队数表示新建提醒事件，跳过数表示本轮未满足条件。**成功**表示检查已完成；提醒计划的 **已提交提醒事件** 也只表示事件已保存。最终送达结果仍在 **通知管理** 中查看。

暂停不取消已经开始的执行。恢复后，下一次检查处理过期但尚未提醒的计划。收到提醒后点击计划的 **完成**，页面刷新后应仍为 **已完成**，不要用收件箱已读代替这一步。

## 验证到期判断、重复执行与失败处理

通过界面检查：

| 操作 | 预期结果 |
| --- | --- |
| 到期前完成或取消计划 | 后续不提醒 |
| 到期前移交客户 | 新负责人收到提醒 |
| 暂停调度，等计划过期后恢复 | 下一轮补查，不重复提醒 |
| 标记通知已读，再打开计划 | 计划仍需手动完成 |

时间边界、重复扫描、通知故障恢复、停用账号、关闭商机和迁移回滚由 Agent 在隔离数据库中自动检查，并报告实际结果。无需修改自己的数据或主动中断通知服务。

本次验证为单进程运行。多实例部署需要共享 Jobs 与并发锁，并另行验证调度和投递；停止所有应用进程时不会执行检查，重新启动后下一轮处理仍待提醒的计划。

## 小结与下一步

**完成的标志**：到期计划只向当前负责人发送一次提醒，完成或取消的计划不再提醒；暂停恢复、重复执行和失败补发的检查符合预期，任务执行记录与实际投递结果均可查看，完成跟进后刷新仍显示**已完成**。

如果还需要连接个人邮箱、在客户详情查看往来邮件并发送正式报价单，继续查看[邮件接入与业务收发](email.md)。
