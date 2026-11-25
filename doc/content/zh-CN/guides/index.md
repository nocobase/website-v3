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

[<span class="course-title">使用 Studio 协作开发</span><span class="course-description">在 Studio 中提出需求，跟进 Agent 分工、检查与评审，完成验收并合并代码。</span>](../getting-started/collaborate-with-studio.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [团队协作与持续交付](team-delivery/index.md)

[进入学习](team-delivery/index.md)

</div>

把 Studio 用到多人日常开发中：接入已有项目仓库，让业务同事直接参与需求与验收，沉淀项目知识，并稳定管理质量与发布。

<div class="course-grid">

[<span class="course-title is-pending">将已有项目接入 Studio</span><span class="course-description">连接已有 Core 代码仓库并配置检查与 PR 预览，直接进入多人协作迭代。</span>](open-crm-project.md)

[<span class="course-title">让业务同事直接参与需求</span><span class="course-description">邀请业务负责人直接在 Studio 提需求、确认规则并在预览环境验收，减少信息转述。</span>](business-colleagues.md)

[<span class="course-title">沉淀业务规则与开发经验</span><span class="course-description">把业务规则、设计决定与评审清单录入项目知识库，换人或换 Agent 也能保持一致。</span>](capture-knowledge.md)

[<span class="course-title is-pending">使用 Studio 管理质量</span><span class="course-description">结合持续测试、核心场景检查与问题跟踪，把控多人与 Agent 并行开发时的交付质量。</span>](enterprise-management.md)

[<span class="course-title">发布更新并维护已有应用</span><span class="course-description">经预览与测试环境验证后发布版本，在保留已有业务数据的前提下升级生产应用。</span>](release.md)

</div>

</section>

<section class="course-section">

<div class="course-section-head">

## [专题实战](core-capabilities/index.md)

[进入学习](core-capabilities/index.md)

</div>

按独立业务能力直接学习 Core 的实战用法。常规专题配有最新状态的完整 CRM 示例项目供对照运行，复杂专题结合采购、费用等场景展开。

<div class="course-grid">

[<span class="course-title">多表关联建模与历史快照</span><span class="course-description">组织一对多与明细关联，通过 Migration 建表并在主数据更新后保留历史金额快照。</span>](opportunities-and-quotes.md)

[<span class="course-title">使用 UI Library 搭建工作台界面</span><span class="course-description">借助 UI Library 组合列表、筛选、表单与详情标签页，提升高频业务页面的日常操作体验。</span>](sales-workspace.md)

[<span class="course-title">角色权限与数据范围控制</span><span class="course-description">按角色配置操作权限与数据范围，实现按负责人隔离、只读共享与主管查看团队数据。</span>](team-permissions.md)

[<span class="course-title is-pending">可配置授权界面</span><span class="course-description">面向运行时需要灵活调整权限的业务，设计供管理员或业务负责人使用的授权配置界面。</span>](core-capabilities/index.md#课程列表)

[<span class="course-title is-pending">复杂数据范围与授权规则</span><span class="course-description">设计跨部门、多条件组合的数据范围，以及多条授权叠加与撤销时的判定规则。</span>](core-capabilities/index.md#课程列表)

[<span class="course-title">审批流程与待办中心</span><span class="course-description">为业务单据配置审批流，在待办中心完成审核、退回、拒绝与状态回写。</span>](quote-approvals.md)

[<span class="course-title is-pending">复杂审批规则</span><span class="course-description">结合采购、费用报销等场景，设计条件分支、会签、退回重提、超时与转交代理。</span>](core-capabilities/index.md#课程列表)

[<span class="course-title">业务附件与文件管理</span><span class="course-description">为业务记录接入附件上传、预览与下载，并落实权限校验与暂存文件清理。</span>](file-management.md)

[<span class="course-title">模板打印与单据生成</span><span class="course-description">基于固定模板从已确认业务单据生成内容不变的 DOCX 文件，支持预览与下载。</span>](template-print.md)

[<span class="course-title">业务事件与站内通知</span><span class="course-description">在记录归属变更或审批结果更新时自动发送站内通知，并核对投递记录与访问边界。</span>](notifications.md)

[<span class="course-title">定时任务与到期提醒</span><span class="course-description">使用定时任务扫描临期事项与待处理单据，按规则自动向当前负责人发送提醒。</span>](scheduled-reminders.md)

[<span class="course-title">邮件接入与业务收发</span><span class="course-description">连接个人邮箱，按联系人地址匹配往来邮件，并直接在业务工作台中发送带附件的邮件。</span>](email.md)

[<span class="course-title is-pending">应用内业务 Agent 接入</span><span class="course-description">在应用内接入遵守角色权限的业务 Agent，直接协助查询记录并推进日常业务任务。</span>](business-agent.md)

[<span class="course-title is-pending">知识库与 AI 业务辅助</span><span class="course-description">结合业务资料与历史记录，用知识库和 AI 生成沟通摘要与下一步处理建议。</span>](ai-assistant.md)

[<span class="course-title is-pending">数据批量导入</span><span class="course-description">支持从表格文件批量校验与导入外部业务数据，妥善处理冲突、错误报告与回滚。</span>](data-import.md)

[<span class="course-title is-pending">外部 API 与系统集成</span><span class="course-description">通过标准化接口与 ERP、财务或第三方系统联动，设计数据同步、幂等与异常处理。</span>](external-integrations.md)

</div>

</section>
