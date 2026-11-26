---
title: "教程"
description: "通过真实业务场景实践 NocoBase 3：用 Studio 推进团队协作与持续交付，按独立能力专题掌握 Core 应用开发。"
---

通过真实业务场景实践 NocoBase：[Studio](../studio/index.md) 组织 Agent 与团队推进需求、验收和发布，[Core](../core/index.md) 提供数据、界面、权限与流程等应用底座。

<section class="course-section">

<div class="course-section-head">

## 首次上手

</div>

刚接触 NocoBase 3 时，先通过下面两篇上手指南完成首次体验，再进入下方的团队协作或专题实战系列：

<div class="course-grid">

[<span class="course-title">开发第一个应用</span><span class="course-description">在本地创建并启动 Core 应用，让 Agent 开发客户管理功能并检查权限。</span>](../getting-started/develop-your-first-app.md)

[<span class="course-title">使用 Studio 推进开发</span><span class="course-description">在 Studio 中提出需求，跟进 Agent 分工、检查与评审，完成验收并合并代码。</span>](../getting-started/collaborate-with-studio.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [在 Studio 中协作](team-delivery/index.md)

[进入学习](team-delivery/index.md)

</div>

把 Studio 用到多人日常开发中：接入已有项目仓库，让业务同事直接参与需求与验收，沉淀项目知识，并稳定管理质量与发布。

<div class="course-grid">

[<span class="course-title">接入已有项目</span><span class="course-description">连接已有 Core 代码仓库并配置检查与 PR 预览，直接进入多人协作迭代。</span>](team-delivery/open-crm-project.md)

[<span class="course-title">让业务同事参与</span><span class="course-description">邀请业务负责人直接在 Studio 提需求、确认规则并在预览环境验收，减少信息转述。</span>](team-delivery/business-colleagues.md)

[<span class="course-title">沉淀知识与经验</span><span class="course-description">把业务规则、设计决定与评审清单录入项目知识库，换人或换 Agent 也能保持一致。</span>](team-delivery/capture-knowledge.md)

[<span class="course-title">管理交付质量</span><span class="course-description">结合持续测试、核心场景检查与问题跟踪，把控多人与 Agent 并行开发时的交付质量。</span>](team-delivery/enterprise-management.md)

[<span class="course-title">发布到生产</span><span class="course-description">经预览与测试环境验证后发布版本，在保留已有业务数据的前提下升级生产应用。</span>](team-delivery/release.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [专题实战](core-capabilities/index.md)

[进入学习](core-capabilities/index.md)

</div>

围绕完整可运行的 CRM 示例按能力专题学习 NocoBase Core：从商机与报价建模、工作台界面、权限、审批、附件打印、通知定时、邮箱到业务 AI 与集成，末尾补充跨业务域的复杂进阶专题。

<div class="course-grid">

[<span class="course-title">数据建模与表结构变更</span><span class="course-description">以 CRM 商机、产品与报价为例，梳理 ER 模型与数据字典，通过迁移脚本（Migration）增量建表并验证事务一致性。</span>](core-capabilities/data-modeling.md)

[<span class="course-title">工作台与业务页面搭建</span><span class="course-description">基于 UI Library 与 shadcn 约定搭建 CRM 销售工作台、客户列表筛选与详情标签页。</span>](core-capabilities/pages-and-ui.md)

[<span class="course-title">角色权限与数据范围控制</span><span class="course-description">为 CRM 销售与主管配置操作权限、按负责人隔离的客户数据范围与只读共享，验证页面与接口边界。</span>](core-capabilities/roles-and-permissions.md)

[<span class="course-title">审批流程与待办中心</span><span class="course-description">为 CRM 报价配置超额折扣审批流，在待办中心完成通过、退回、拒绝与报价状态锁定。</span>](core-capabilities/approval-workflows.md)

[<span class="course-title">定时任务与到期提醒</span><span class="course-description">通过定时任务扫描 CRM 客户跟进计划与报价回复期限，到期后自动向当前负责人发送站内提醒。</span>](core-capabilities/scheduled-reminders.md)

[<span class="course-title">业务附件与文件管理</span><span class="course-description">在 CRM 客户详情接入需求材料上传、预览与下载，落实按客户权限校验访问并清理超时暂存文件。</span>](core-capabilities/file-management.md)

[<span class="course-title">模板打印与单据生成</span><span class="course-description">基于固定模板从 CRM 已确认报价生成内容不变的 DOCX 正式报价单，验证快照一致性与下载权限。</span>](core-capabilities/template-print.md)

[<span class="course-title">业务事件与站内通知</span><span class="course-description">在 CRM 客户分配或报价审批结果更新时自动发送站内通知，核对投递记录与访问边界。</span>](core-capabilities/notifications.md)

[<span class="course-title">邮件接入与业务收发</span><span class="course-description">为销售连接个人邮箱，在 CRM 客户详情按联系人地址匹配往来邮件，并直接发送正式报价单附件。</span>](core-capabilities/email.md)

[<span class="course-title">搭建知识库</span><span class="course-description">在 CRM 中接入知识库插件，管理产品手册、报价政策与销售话术文档，支持版本审阅与检索。</span>](core-capabilities/ai-assistant.md)

[<span class="course-title">接入业务 Agent</span><span class="course-description">在 CRM 中接入遵守角色权限的销售助手 Agent，查询客户与商机记录、生成沟通摘要并推进业务操作。</span>](core-capabilities/business-agent.md)

[<span class="course-title">数据批量导入与后台处理</span><span class="course-description">结合后台任务与事务校验，实现 CRM 客户与联系人表格数据的批量导入、冲突处理与错误报告。</span>](core-capabilities/data-import.md)

[<span class="course-title">外部 API 与系统集成</span><span class="course-description">使用 API 密钥与标准化接口打通外部线索来源和 ERP/财务系统，处理数据同步、幂等与异常重试。</span>](core-capabilities/external-integrations.md)

[<span class="course-title is-pending">复杂数据范围与授权配置</span><span class="course-description">结合默认数据范围、限制规则与运行时授权界面，设计跨部门、多条件叠加与撤销的复杂权限判定。</span>](core-capabilities/index.md#课程列表)

[<span class="course-title is-pending">复杂审批与多流程协调</span><span class="course-description">结合采购、费用报销等场景，设计条件分支、会签、超时转交及多子流程汇聚协调。</span>](core-capabilities/index.md#课程列表)

</div>

</section>
