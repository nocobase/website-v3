---
title: NocoBase Core
description: NocoBase Core 是面向 AI 开发的开源应用底座。初始化即具备 30 多项基础能力、统一规范和 AI 接入，Agent 专注写业务，系统可独立起步、独立运行。
---

## 概览

NocoBase Core 是面向 AI 开发的开源应用底座——**让 Agent 专心写业务，底座已经就绪**。

它既可以搭配你手头的 Claude Code、Codex、Cursor 等编码工具独立起步，也是 NocoBase Studio 背后的工程支撑。初始化一个新应用后，用户与组织权限、登录与认证、流程管理、数据库、文件存储、消息通知与 AI 接入等 30 多项基础能力即刻可用，同时自带统一的项目结构和开发规范。

权限、审批、工作流引擎等复杂度高、对可靠性要求最高的底层部分不由 AI 从零生成，而是由应用底座直接提供并持续维护升级。Agent 只需要编写真正的业务源码，开发更快、更稳，人工测试和安全审查的范围也大幅缩小。业务代码保存在企业自己的 Git 仓库中，发布后独立运行。

<figure class="core-arch" aria-label="NocoBase Core 分层架构：上方为业务应用与业务 Agent，下方为 Core 开源底座的 30 多项基础能力与工程规范">
<div class="ca-layer">
<div class="ca-head"><b>业务层（你的业务系统）</b><span>Coding Agent 专注编写 · 源码归企业所有 · 发布后独立运行</span></div>
<div class="ca-biz-grid">
<div class="ca-biz-card"><b>业务界面与逻辑</b><p>页面、表单、列表、API 接口、数据模型与业务规则，标准 TypeScript / React / Node.js 源码。</p></div>
<div class="ca-biz-card"><b>业务 Agent（可选入驻）</b><p>按规则参与日常事务处理，继承负责人权限，关键操作附上依据请求人确认。</p></div>
</div>
</div>
<div class="ca-layer ca-base">
<div class="ca-head"><b>NocoBase Core · 开源应用底座</b><span>持续维护升级 · 30+ 基础能力开箱就绪</span></div>
<div class="ca-cap-grid">
<div class="ca-cap"><strong>用户、组织与权限</strong><small>部门架构、角色与行级数据范围</small></div>
<div class="ca-cap"><strong>登录与认证</strong><small>密码、OIDC、API 密钥、企业 SSO</small></div>
<div class="ca-cap"><strong>数据与文件</strong><small>多数据库、外部数据源、S3 存储</small></div>
<div class="ca-cap"><strong>流程与审批</strong><small>工作流、审批、待办中心、定时任务</small></div>
<div class="ca-cap"><strong>通知、邮件与打印</strong><small>站内信、邮件收发、飞书/钉钉、模板打印</small></div>
<div class="ca-cap"><strong>AI 与业务 Agent</strong><small>模型接入、业务 Agent 调度、AI 知识库</small></div>
</div>
<div class="ca-foot"><b>工程规范与独立运行：</b><span>统一项目结构</span><span>·</span><span>AGENTS.md &amp; 开发技能</span><span>·</span><span>插件扩展机制</span><span>·</span><span>Docker / PM2 / K8s 私有部署</span></div>
</div>
</figure>

## 核心特色

### 30 多项开箱即用的基础能力

新建应用即具备企业业务系统通用的基础能力，无需在每个项目里让 AI 从零造轮子和反复验证：

| 能力领域 | 包含的核心能力 |
| --- | --- |
| **用户、组织与权限** | 用户管理、部门与组织架构、基于角色的页面/操作/数据范围权限、默认数据范围、共享规则与限制规则 |
| **登录与认证** | 账号密码、社交登录、OIDC、API 密钥；专业版支持 SAML 2.0、LDAP 及企业微信、飞书、钉钉 SSO |
| **数据与文件** | SQLite、PostgreSQL、MySQL、SQL Server、Oracle（专业版支持达梦、人大金仓、OceanBase），外部数据源、数据库浏览、本地与 S3 兼容文件存储 |
| **流程与协作** | 工作流与记录生命周期、定时任务、待办中心、基础审批（专业版支持多级条件路由、会签或签等高级审批） |
| **通知、邮件与界面** | 站内信、邮件收发、飞书/钉钉/浏览器推送、多语言、主题、业务组件、DOCX/PDF 模板打印 |
| **AI 与业务 Agent** | 云端与本地模型接入、业务 Agent 调度、按权限访问且有版本的 AI 知识库 |

详细清单与使用方式见[内置能力与插件](using-plugins/overview.md)。

### 统一的项目结构与开发规范

用 AI 从零写代码，换人、换模型甚至换一个会话，都可能出现不同的目录结构和代码风格，系统很快变得难以维护。

Core 提供标准应用脚手架、项目规则文件 `AGENTS.md` 以及随底座包一起发布的开发技能。页面、接口、数据模型、迁移脚本和测试各有固定位置，不管使用哪家模型或哪款编码工具，Agent 写出的都是同一套结构的标准 TypeScript、React 和 Node.js 源码。系统可以在统一架构下长期迭代，也随时支持开发团队人工接手维护。见[应用开发概览](developing-apps/overview.md)与[项目结构](developing-apps/project-structure.md)。

### 业务系统内置 AI 能力

Core 不只是给 Coding Agent 用来写代码的底座，它本身内置了模型接入、业务 Agent 调度和 AI 知识库。

系统上线后，业务 Agent 可以直接入驻业务系统，按负责人的权限 24 小时主动参与处理日常事务（例如调研线索、核对台账、整理邮件、分派工单），遇到需要决策的事项附上依据交给人拍板。见 [Agents](using-plugins/agents-and-knowledge/agents.md) 与[知识库](using-plugins/agents-and-knowledge/knowledge.md)。

### 开源、独立起步与独立运行

- **开源免费、持续维护**：Core 开源免费，源码公开且可以审查；基础能力的缺陷修复与新能力由 NocoBase 持续维护，随版本升级同步给每个业务应用。
- **不绑定工作台和工具**：使用 Core 不需要先安装 Studio，直接搭配你熟悉的 Claude Code、Codex、Cursor 等编码工具即可开始开发。
- **私有部署与独立运行**：应用源码和数据完全归企业所有，部署在企业自己的服务器上，支持 Docker、PM2、多实例与 Kubernetes 等多种部署方式，发布后独立运行，日常业务请求不经过 Studio。

## 开始使用

首次使用建议直接完成[开发第一个应用](../getting-started/develop-your-first-app.md)，用几分钟初始化新应用并让编码工具开发第一个业务功能；如果想跟随一个涵盖台账、审批、权限和部署的完整案例，可以阅读[基于 NocoBase 3 开发可靠的企业应用](../guides/build-reliable-enterprise-apps.md)。

## 学习

<div class="learn">

- [**开发应用**](developing-apps/overview.md)
  了解应用组成与项目结构，开发页面、接口、数据、权限、工作流、后台任务、命令和测试。
- [**内置能力与插件**](using-plugins/overview.md)
  查阅用户与认证、权限规则、文件、通知、邮件、Agents、知识库、审批与定时任务等现成能力。
- [**部署与运维**](deployment/choose-a-deployment-method.md)
  选择部署方式，用 Docker、应用安装器、多实例或 Kubernetes 部署，发布新版本与升级 Core。
- [**多应用架构**](architecture/overview.md)
  了解多门户、多应用与多租户架构，按业务入口、独立应用或租户边界组织系统。
- [**开发插件**](extension-development/when-to-write-a-plugin.md)
  判断何时将能力抽成插件，了解插件结构、前后端扩展与发布方法。
- [**框架原理**](framework/overview.md)
  理解运行时、服务容器、HTTP、数据库、客户端渲染等底层机制。
- [**配置与命令参考**](reference/configuration.md)
  查阅应用配置项、命令行工具、错误码、默认插件索引和编码工具提示词参考。
- [**数据库支持与版本兼容**](developing-apps/compatibility.md)
  查阅支持的开源与商业数据库驱动、连接配置和运行环境要求。

</div>
