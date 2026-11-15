---
title: 教程
---

<p class="course-intro">通过实际案例，全面学习 NocoBase 3 的使用。</p>

## 前言

用 AI Agent 开发业务应用，可以很快做出第一版。要让应用持续服务于业务，还需要可靠的数据与权限、清晰的开发规范，以及在多人协作中保留需求背景和业务规则的方法。NocoBase 3 提供 Core 和 Studio，分别支持应用开发运行与团队协作。

[NocoBase Core](../core/index.md) 是 AI 开发和运行业务系统的开源应用底座。它提供数据、用户与权限、文件、流程等通用能力，配合项目规范和开发 Skill，让 Agent 在已有基础上实现业务功能。[NocoBase Studio](../studio/index.md) 是人与 Agent 协同开发的治理平台，通过任务、检查与评审组织协作，并用知识库和项目记忆积累团队知识。使用 Core 即可开发和部署应用；需要团队协作时，再接入 Studio。

## 从示例项目开始

教程围绕一个 CRM 应用逐步展开：销售人员维护客户和跟进记录，继续记录商机、编制报价；团队通过角色权限控制客户访问，并逐步接入审批、附件、通知和 AI 等能力。

每课从具体业务需求出发，说明如何与 Agent 完成开发，以及如何检查结果。快速上手先完成一个可用的客户跟进应用，深入实战在同一个项目上扩展功能。首次学习建议按顺序实践；已有基础时，可以根据各课的前置条件选择主题，并把示例需求替换成自己的业务规则。

### 使用示例项目的 tag

[示例项目](https://github.com/nocobase/doc-demo-crm)的 `lesson-N` tag 对应第 N 课的完成状态，包括只修改需求或设计的课程。各课开头列出开始状态和完成状态：跟着开发时选择开始 tag，体验结果时选择完成 tag。第一课从空目录开始，没有开始 tag；连续开发自己的应用时，无需切换课程 tag。

在独立目录中获取示例。以下以 `lesson-1` 为例，按需要替换为对应课程的 tag：

```bash
git clone https://github.com/nocobase/doc-demo-crm.git my-crm-example
cd my-crm-example
git switch -c my-crm lesson-1
pnpm install --frozen-lockfile
```

让 Agent 按所选版本的 README 和 `docs/lesson-N.md` 准备配置、数据库和启动步骤。首次运行时，以下命令以 SQLite 为例；使用其他数据库时，按项目说明选择对应配置：

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

使用终端的完整 `Local:` 地址登录。`lesson-1` 只有应用底座，没有客户数据；其他课程的数据准备和特殊迁移限制见各课运行说明。

升级已有示例时，先停服并备份数据库、配置和文件存储，保留这些数据，再按目标课程的运行说明安装依赖、执行迁移并启动。不要重新初始化或重置数据库。Git tag 只保存源码，不包含配置、密钥、业务数据或上传文件；切换 tag 不会自动回退数据库。

## Core：开发业务应用

Core 课程从应用模板开始，逐步使用三类能力：数据模型、关联和迁移组织业务数据；页面与 UI 组件呈现操作界面；认证、权限及流程、文件、通知等通用能力支撑业务规则。应用自带的 `AGENTS.md` 和开发 Skill 为 Agent 提供实现指引，测试与实际操作用于验证结果。具体能力可结合 [Core 手册](../core/index.md)查阅。

<section class="course-section">

<div class="course-heading">

### 快速上手

<span class="course-range">第 1~4 课</span>

</div>

从创建项目到测试交付，完成一个可以使用的客户跟进应用。

<div class="course-grid">

[<span class="course-title">1. 创建应用</span><span class="course-description">从 Core 应用模板开始搭建。</span>](create-app.md)

[<span class="course-title">2. 确定 CRM 需求</span><span class="course-description">明确业务范围、规则和验收标准。</span>](define-requirements.md)

[<span class="course-title">3. 开发客户跟进功能</span><span class="course-description">使用数据与页面能力实现客户跟进。</span>](customers-and-follow-ups.md)

[<span class="course-title">4. 验收与交付应用</span><span class="course-description">对照需求验收功能，按团队流程发布并验证。</span>](test-and-deliver.md)

</div>

</section>

<section class="course-section">

<div class="course-heading">

### 深入实战

<span class="course-range">第 5~14 课</span>

</div>

围绕同一个 CRM，学习关联数据、团队权限、审批、通知与 AI 等能力。

<div class="course-grid">

[<span class="course-title">5. 商机与报价数据建模</span><span class="course-description">使用数据关联、查询与迁移能力。</span>](opportunities-and-quotes.md)

[<span class="course-title">6. 销售工作台 UI 搭建</span><span class="course-description">使用 UI Library 组合业务页面。</span>](sales-workspace.md)

[<span class="course-title">7. 角色权限与客户访问控制</span><span class="course-description">整合用户认证、数据权限与共享规则。</span>](team-permissions.md)

[<span class="course-title">8. 报价审批与待办</span><span class="course-description">整合流程、审批与待办能力。</span>](quote-approvals.md)

[<span class="course-title">9. 附件管理与报价单生成</span><span class="course-description">使用文件存储与模板打印能力。</span>](attachments-and-documents.md)

[<span class="course-title">10. 客户分配与报价结果的站内通知</span><span class="course-description">通过站内通知传递业务结果。</span>](notifications.md)

[<span class="course-title">11. 邮箱接入与客户邮件</span><span class="course-description">接入邮箱同步与邮件发送能力。</span>](email.md)

[<span class="course-title">12. 定时跟进与到期提醒</span><span class="course-description">结合定时任务与通知自动提醒。</span>](scheduled-reminders.md)

[<span class="course-title">13. AI 辅助客户跟进</span><span class="course-description">接入知识库、模型与业务 Agent。</span>](ai-assistant.md)

[<span class="course-title">14. 客户导入与 API 接入</span><span class="course-description">使用数据接口与 API 密钥接入业务。</span>](import-and-integrations.md)

</div>

</section>

## Studio：团队协作开发

<section class="course-section">

<span class="course-range">第 15~19 课</span>

在同一个 CRM 上继续开发报价版本对比与客户交接，由团队共同确认规则、验收并发布。

<div class="course-grid">

[<span class="course-title">15. 接入 Studio</span><span class="course-description">关联已有仓库，配置检查与 PR 预览。</span>](bring-into-studio.md)

[<span class="course-title">16. Agent 团队协作</span><span class="course-description">完成报价版本对比的开发与验收。</span>](agent-team-request.md)

[<span class="course-title">17. 业务同事参与</span><span class="course-description">由销售主管提出并验收客户交接需求。</span>](business-colleagues.md)

[<span class="course-title">18. 沉淀方法与经验</span><span class="course-description">维护业务规则、检查清单与项目记忆。</span>](capture-knowledge.md)

[<span class="course-title">19. 发布到生产</span><span class="course-description">验证测试环境，升级生产并登记版本。</span>](release.md)

</div>

</section>

## 最佳实践

待编写。
