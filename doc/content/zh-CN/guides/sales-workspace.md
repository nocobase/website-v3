---
title: "使用 UI Library 搭建工作台界面"
metaDescription: 使用 UI Library 组合销售工作台、客户列表与详情，将跟进、商机和报价连接起来，并验证筛选和跳转体验。
---

在包含客户、跟进、商机和报价数据的 CRM 应用中搭建销售工作台。你可以直接在自己的应用中实践，或运行最新完整的 `doc-demo-crm` 示例对照体验。

界面遵循应用现有的 shadcn 组件规范，优先使用已安装的 UI Library 组件和业务区块。UI Library 提供表格、卡片和标签页等常用界面。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="core-capabilities/index.md#示例项目说明">完整示例使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">示例项目</th><td><a href="https://github.com/nocobase/doc-demo-crm"><code>nocobase/doc-demo-crm</code></a>（最新完整 CRM 示例）</td></tr>
<tr><th scope="row">运行说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/main/README.MD">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/developing-apps/pages-and-interactions.md">UI Library</a></td></tr>
</tbody>
</table>
</div>
</div>

## 明确工作台、列表与详情的分工

销售开始一天的工作时，需要知道最近与谁沟通过、哪些商机正在推进，以及去哪里查看报价。进入客户详情后，则需要在资料、联系人和业务记录之间切换。

| 入口       | 要解决的问题                           |
| ---------- | -------------------------------------- |
| 销售工作台 | 看客户、商机和报价概况，继续最近的跟进 |
| 客户列表   | 用名称和状态找到要处理的客户           |
| 客户详情   | 在资料、联系人、跟进和商机之间切换     |
| 商机与报价 | 沿客户业务关系打开报价，查看和维护明细 |

工作台中的数量和记录来自已有业务数据。最近跟进表示已经记录的沟通，不是待办，也不会因为打开记录而标记为完成。

## 使用 UI Library 搭建页面

在应用根目录向 Agent 发送：

```prompt
帮我把现有 CRM 整理成销售日常使用的工作台，保留现有的新增和编辑功能。

- 打开工作台就能看到客户、商机和报价概况，以及最近的跟进。点击记录能打开对应客户或商机。
- 客户列表能按名称搜索、按状态筛选。
- 客户详情用标签页分别展示资料、联系人、跟进和商机，并能继续查看报价。
- 加载中、没有记录和加载失败时，都有清楚的提示。在手机上也能查看记录和返回列表。
```

提示词只需描述业务需求。应用自带的 `AGENTS.md` 会引导 Agent 阅读开发 Skills 和组件规范，其中说明了如何复用现有组件、从 UI Library 添加所需组件，以及如何组合页面。因此，Agent 可以根据“查看客户列表”“切换客户资料”等需求选择合适的标准组件，你不必提前知道组件名称或在提示词中指定 UI Library。

页面完成后，检查这些行为：

| 页面 | 使用的组件 | 应有行为 |
| --- | --- | --- |
| 工作台 | `Card`、`DataTable`、`RecordLink` | 数量与实际记录一致；点击跟进进入所属客户的跟进标签页 |
| 客户列表 | `DataTable`、搜索、筛选和分页控件 | 名称和状态条件同时生效；刷新后保留条件与页码 |
| 客户详情 | `PageHeader`、`Tabs` 和已有表单 | 显示当前客户名称；刷新、保存或取消后仍在原标签页 |

这些组件负责展示。Agent 还需接入业务数据和页面跳转，并在筛选条件变化时重置页码。实现方法见[页面布局](../core/developing-apps/page-layouts.md)、[页面路由](../core/developing-apps/pages-and-interactions.md)及[数据请求与状态](../core/developing-apps/data-requests-and-state.md)。

![工作台集中显示业务数量、最近跟进及商机和报价入口。](/assets/guides/sales-workspace.png)

## 继续跟进客户并查看报价

从工作台打开 **Northstar Labs**，依次查看详情中的标签页（若需要一份包含明细的练习报价，可先按[多表关联建模与历史快照](opportunities-and-quotes.md#创建商机与报价连接产品和报价明细)准备 **Annual rollout proposal**，或直接使用示例数据中已有的客户和报价）：

1. 在资料页查看客户名称、行业和状态，编辑一项资料并保存。
2. 打开联系人，确认原来的联系人仍在，再添加一位联系人。
3. 打开跟进，记录 `Reviewed Annual rollout proposal with Emma`，下一步填写 `Confirm rollout schedule`，确认新记录排在已有记录前面，保存后仍停留在跟进标签页。
4. 打开 **Northstar sales workspace**，再进入 **Annual rollout proposal**，核对两行产品和报价单价，总额仍为 `1150.00`。
5. 返回客户列表，重新打开同一客户，确认保存的内容仍然存在。

保存跟进后回到工作台，应能找到新记录。修改报价后重新打开，金额应与保存结果一致。没有记录的标签页应显示说明，并在用户有权限时提供新增入口。

![客户详情用标签页组织业务记录，新增跟进保存后仍留在当前标签页。](/assets/guides/customer-workspace.png)

## 检查筛选、跳转与保存结果

准备不同状态的客户，用下列场景验收。搜索与筛选应一起生效，筛选结果的总数也要与当前条件一致。

| 操作                         | 应有结果                                 |
| ---------------------------- | ---------------------------------------- |
| 输入部分客户名称并搜索       | 只展示名称匹配的客户                     |
| 在搜索结果上选择客户状态     | 同时满足名称和状态条件                   |
| 输入不存在的名称，再清除条件 | 先显示空结果，再恢复客户列表             |
| 切换筛选后翻页               | 不显示旧条件留下的数据或错误页码         |
| 从工作台打开客户、商机和报价 | 每个入口指向对应记录，刷新详情仍能打开   |
| 保存联系人、跟进或报价后返回 | 列表、详情和工作台显示更新后的数据       |
| 在浏览器中模拟断网后请求数据 | 显示可理解的失败反馈，恢复网络后可重试   |
| 缩窄浏览器宽度               | 关键操作可见，内容不会遮挡返回或保存入口 |

让 Agent 增加筛选组合、空结果和跳转目标的测试，再用浏览器完成上述操作。检查加载与错误反馈时，可用浏览器开发者工具降低网速或临时断网；仅看到加载图标不代表请求最终成功。

**完成的标志**：工作台数量与业务记录一致，搜索和状态筛选同时生效，各入口打开正确的客户、商机和报价；保存并刷新后数据与标签页状态保留，手机宽度下可操作，加载失败后可重试。

接下来，可以进一步查看[角色权限与数据范围控制](team-permissions.md)，按角色限制不同销售看到的业务数据。
