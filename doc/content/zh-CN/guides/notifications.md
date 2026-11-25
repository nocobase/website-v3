---
title: "业务事件与站内通知"
metaDescription: 为客户分配和报价结果接入站内通知，验证接收范围、投递记录、已读状态和业务访问权限。
---

为业务状态变更接入站内通知：客户负责人转交给另一位销售，或报价有了处理结果时，相关人员可以在收件箱看到消息并直达对应记录。

在完整示例中体验时，准备：

- 管理员、销售 Alex 和 Taylor、主管 Morgan 四个独立账号（见[角色权限与数据范围控制](team-permissions.md#配置用户与角色)）。
- 由 Morgan 在产品目录中准备 **CRM implementation**，单价 `12000 USD`（如示例已有可直接复用）。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="core-capabilities/index.md#示例项目说明">完整示例使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">示例项目</th><td><a href="https://github.com/nocobase/doc-demo-crm"><code>nocobase/doc-demo-crm</code></a>（最新完整 CRM 示例）</td></tr>
<tr><th scope="row">运行说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/main/README.MD">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/using-plugins/notifications/notification.md">通知</a> · <a href="../core/using-plugins/notifications/in-app.md">站内信</a></td></tr>
</tbody>
</table>
</div>
</div>

## 确定何时通知、通知谁

| 业务事件 | 接收人 | 不发送的情况 |
| --- | --- | --- |
| 客户负责人实际变更 | 新负责人 | 负责人未变、取消分配、只读共享 |
| 报价确认、拒绝或退回 | 原申请人 | 提交等待审批、撤回 |

低折扣报价直接确认后，也通知原申请人。通知只提醒业务变化，具体内容需打开业务页面查看。

## 准备站内通知

本专题使用[站内通知](../core/using-plugins/notifications/in-app.md)，不需要外部账号或密钥。让 Agent 按已安装版本的说明，将 `inbox` 配置为 `in-app` 渠道，并提供收件箱入口。[通知服务](../core/using-plugins/notifications/notification.md)负责发送、记录结果和重试。

其他渠道需另外配置，详见[邮件与群机器人](../core/using-plugins/notifications/providers.md)及[浏览器推送](../core/using-plugins/notifications/web-push.md)。本例未验证这些渠道；配置时不要把密钥写进提示词或截图。

## 接入客户分配与报价结果通知

向开发 Agent 发送：

```prompt
给 CRM 接上站内通知，按下面的规则发送：
- 客户负责人实际变更为另一位有效用户时，通知新负责人。负责人没变、取消分配或只读共享时不发送。
- 报价确认、拒绝或退回时，通知原申请人，包括低折扣自动确认。等待审批和撤回时不发结果通知。
- 不通知无关销售或只读共享用户，同一次业务变化只发一次消息。

通知用简短英文，不包含客户名称、报价金额或审批意见。打开通知能进入对应客户或报价，失去权限后不能查看业务内容。标记已读不会结束审批待办。

发送失败时，恢复后补发，不撤销已完成的业务操作。管理员能查看通知场景、待发送记录和实际投递结果，区分“已交给通知服务”和“投递完成”。模板预览用虚构数据，不真的发送。
```

按下面步骤新建练习记录并验证收件箱通知：

1. Morgan 新建客户 **Harbor Services**，先保留自己为负责人，再将负责人改为 Alex。这次实际变更应让 Alex 的 **收件箱** 出现 **Customer assigned to you**；再次保存同一负责人不增加消息。
2. Alex 在该客户下新建商机 **Customer service rollout**，再新建草稿报价 **Service rollout proposal**。选择产品 **CRM implementation**，数量 `2`、单价 `12000`、折扣 `15%`，保存后总额为 `20400.00 USD`。
3. Alex 提交草稿并选择 Morgan；Morgan 在 **我的待办** 批准。Alex 收到 **Quotation confirmed**，打开消息中的业务链接进入该报价。
4. 退回、拒绝和低折扣直接确认分别使用另外新建的草稿报价；不要修改已经确认或拒绝的报价。

![Alex 的收件箱显示客户分配与报价确认通知](/assets/guides/crm-notification-inbox.png)

在 **系统设置 → 通知管理** 查看实际模板、业务事件和投递记录。预览模板不会实际发送消息。

## 检查通知送达与业务跳转

业务保存时会同时记录待发送通知。暂时发送失败不会撤销业务操作。查看记录时，注意区分两种状态：

| 状态 | 含义与后续处理 |
| --- | --- |
| 等待提交（`queued`） | 等待交给通知服务。应用启动时或每 15 秒检查一次，恢复后补交 |
| 已交给通知服务（`submitted`） | 通知服务已接收，是否送达要查看关联投递记录。后续重试由通知服务处理 |

完整示例中的[客户分配](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-access.ts)和[报价处理](https://github.com/nocobase/doc-demo-crm/blob/main/server/lifecycles/quote-approval.ts)会保存待发送记录，[CRM 通知服务](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-notifications.ts)负责提交。已提交记录不会重复发送。

![实际通知投递记录](/assets/guides/crm-notification-logs.png)

用独立账号检查：

- 只有指定接收人收到消息，已读和未读状态可切换。
- 标记已读不关闭审批待办。
- 转交客户后，原负责人不能通过旧通知或已打开的页面继续查看业务内容。
- 系统设置中的业务事件和实际投递记录能对应，预览模板不增加消息。

重复请求、越权、保存失败，以及通知暂时无法提交的情况，由 Agent 自动检查。通知服务已接收、业务记录却未更新时，重试也应只送达一次。查看 Agent 报告中的实际结果和未完成的检查。

管理页面只能查看投递结果。投递已终止失败时，先修复配置，再通过通知服务的授权重试功能处理。外部渠道和多个应用实例共同运行的部署方式，需要在对应环境另行验证。

**完成的标志**：客户分配和报价结果通知已送达正确接收人的收件箱，业务事件与实际投递记录可对应；重复请求不增加消息，旧通知不能绕过当前客户权限，标记已读不关闭审批待办，暂时失败后的补发已验证。

如果需要按时间周期扫描待跟进事项并自动提醒，可继续查看[定时任务与到期提醒](scheduled-reminders.md)。
