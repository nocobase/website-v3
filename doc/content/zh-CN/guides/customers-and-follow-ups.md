---
title: "开发客户跟进功能"
metaDescription: 让 Agent 搭建客户列表、表单和详情，增加联系人与跟进记录，再用一次完整业务操作检查结果。
lesson: 3
---

先完成[创建应用](create-app.md)和[确定 CRM 需求](define-requirements.md)，在应用根目录继续使用 Agent，并保持开发服务器运行。这一课，我们先用管理员管理客户，销售与主管的职责划分留到第七课。

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">关联示例项目<span class="course-example-help"><button type="button" aria-label="示例项目使用说明"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#使用示例项目的-tag">示例项目的 tag 使用说明</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">开始</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-2"><code>lesson-2</code></a></td></tr>
<tr><th scope="row">完成</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-3"><code>lesson-3</code></a></td></tr>
<tr><th scope="row">本课说明</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-3/docs/lesson-3.md">安装与运行说明</a></td></tr>
<tr><th scope="row">学习模块</th><td><a href="../core/framework/database/overview.md">数据库</a> · <a href="../core/developing-apps/pages-and-interactions.md">页面路由</a> · <a href="../core/using-plugins/authorization/permissions.md">权限管理</a></td></tr>
</tbody>
</table>
</div>
</div>

## 按设计文档开始开发

确认应用仓库里已有第二课确认的 `docs/design.md` 和 `docs/prototype.html`，并已在 `AGENTS.md` 中登记。接下来按其中的交付计划开发，先完成客户管理，再增加联系人与跟进。

在 Agent 会话中引用或附上这两份文件，发出指令：

```prompt
按我们确认的需求和原型，先实现“客户管理”这一步，完成后运行起来给我检查。
```

业务规则以设计文档为准，页面布局与交互参考 HTML 原型；发现不一致时先确认并同步修改两份文件。原型的演示数据和模拟交互需要在应用中接入真实的数据保存与权限控制。

我们沿用第二课的第一版范围：管理员管理客户，客户不提供删除，停用保留资料；团队权限、商机、报价和自动提醒留到后续课程。如果 Agent 发现设计中还有未确定的规则，先和它确认并更新文档，再继续开发。页面沿用应用现有的组件和交互。

## 搭建客户列表、表单与详情

Agent 完成后，打开 **客户**。先新建一个客户，再点客户名称进入详情，通过 **编辑客户** 修改资料。

![客户列表支持按名称搜索、按状态筛选和分页。](/assets/guides/customers.png)

截图使用示例应用的英文界面和演示数据，自己的应用布局可能不同。页面背后用到的能力包括：

| 能力                               | 在这里做什么                               |
| ---------------------------------- | ------------------------------------------ |
| 数据表、关联和 Repository 数据访问 | 保存客户资料，支持查询和分页               |
| 应用路由和 UI 组件                 | 组织列表、表单与详情入口                   |
| 认证和权限                         | 拒绝未登录或未获授权的访问                 |
| 输入校验和提交保护                 | 拒绝无效内容，避免同一次提交重试时重复创建 |

开发业务功能时，也应能在 **系统设置** 中找到用户和权限管理入口。示例默认只有初始管理员能访问客户；给其他用户授予 **客户** 页面权限后，他们可以读写这套共享数据。本课还没有按销售负责人隔离客户，不要把它当成团队权限方案。

## 按设计继续实现联系人与跟进

客户列表、表单和详情可以使用后，在同一个 Agent 会话中继续引用设计文档和原型：

```prompt
继续按我们确认的需求和原型，实现“联系人与跟进”这一步，保留已完成的客户管理功能，完成后让我在客户详情里检查。
```

联系人和跟进都归属当前客户。在详情里应能用 **添加联系人** 添加联系人，用 **记录跟进** 记录沟通，不必离开客户另找入口。

![客户详情将基本资料、联系人和跟进记录放在一起。](/assets/guides/customer-detail.png)

按已确认的设计，联系人姓名和跟进内容必填，下一步安排选填；跟进按时间倒序显示，保存后不能修改或删除。记录人和时间由服务端根据当前登录用户生成，不能让调用者填写别人的姓名作为记录人。下一步安排在这里是一段文字，还不会自动创建提醒。

## 体验录入、查询与修改

我们用管理员账号按第二课确认的规则走一遍完整流程。以下操作对应教程的默认设计；如果我们调整过需求，也要按自己的设计调整检查步骤。操作时对照 `docs/prototype.html`，检查列表、表单和详情的布局、入口及反馈是否符合已确认的交互。数据保存和权限检查必须在实际应用中完成。

1. 在 **客户 → 新建客户** 新建 `Summit Analytics`，行业填 `Data services`，状态选 **潜在客户**。
2. 搜索 `summit`，打开该客户，在 **编辑客户** 中补充备注并保存。
3. 添加联系人 `Alex Morgan`，职位填 `Sales Lead`，邮箱填 `alex@example.com`。
4. 记录一次 **电话**，内容填 `Discussed the sales team requirements.`，下一步填 `Prepare a product walkthrough.`。
5. 刷新详情，确认备注、联系人、跟进内容、记录人和时间都还在。
6. 返回列表，筛选 **暂停跟进**，刚才的潜在客户不应出现。清除筛选后应能再次找到它。
7. 将这个客户改为 **暂停跟进**，再按该状态筛选，确认可以找到它；打开详情，原有资料、联系人和跟进记录应仍然保留。

如果直接运行示例，首次启动完成后，可以在另一个终端、同一应用目录执行 `pnpm nocobase db sample --json`，加载 Northstar Labs、Harbor Design 和 Willow Retail 三个演示客户。演示数据是可选的，不影响我们自行新建客户。

## 检查业务规则并反馈问题

对照 `docs/design.md` 中的验收标准，再检查以下边界：

- 客户名称、联系人姓名或跟进内容留空时，不能保存；填写无效联系人邮箱时，应提示错误。
- 新增一条跟进，填写内容但将下一步安排留空，应能保存，并显示在上一条跟进之前；记录人应是当前用户，时间应与录入时间相符。
- 保存后的跟进不能修改或删除，客户没有删除入口。页面没有按钮只是界面检查，接口是否拒绝这些操作在下一课继续验证。
- 打开另一个客户，确认没有出现刚才客户的联系人和跟进。
- 退出登录后不能读取客户数据；没有客户访问权限的普通用户不能读取或修改客户。

遇到问题时，把操作、实际结果和期望告诉 Agent。例如，如果我们实际遇到了刷新后数据丢失，可以这样反馈：

```prompt
我在 Summit Analytics 的详情里添加了 Alex Morgan，保存后能看到，刷新页面后却不见了。
联系人应该保存下来，刷新后仍然显示在这个客户下面。请检查并修复。
```

修复后重复原来的操作，并检查已经保存的客户和跟进没有受影响。如果期望的行为改变了已确认的业务规则，先更新 `docs/design.md` 及其验收标准；涉及界面交互时同步更新 `docs/prototype.html`，再让 Agent 修改实现。自动化测试和接口权限检查在[下一课](test-and-deliver.md)继续完成。

## 保存阶段版本

```prompt
保存这一版客户、联系人和跟进功能，告诉我哪些已经可以使用，还有哪些问题没解决。
```

**完成的标志**：设计文档中“客户管理”和“联系人与跟进”的界面验收已完成，布局与交互符合已确认的原型，并已检查数据保存、停用保留资料、跟进顺序与修改限制，以及输入和访问检查；尚未验证的接口行为已记录，留到下一课继续检查。

从示例开始时，先对照[第二课的需求](define-requirements.md)核对 `docs/design.md` 和 `docs/prototype.html`，按自己的业务调整开发与验收。

接下来，我们一起[验收与交付应用](test-and-deliver.md)。
