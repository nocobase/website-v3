---
title: Studio 是什么
description: NocoBase Studio 是团队与 Agent 协同开发的治理平台。Agent 完成执行，人只拍板；每个人都能带领一支 Agent 团队，同时推进更多任务和项目。
---

开发中的大部分工作，从整理需求、提出方案到写代码、测试和评审，已经可以交给 Agent。Studio 把团队的 Claude Code、Codex 等接进来统一调度，让它们日夜推进任务，并且**像管理员工一样管理这支 Agent 团队**：分好工，定好规范和流程，每一步都有记录，关键的决定由人来做。

## Studio 提供什么

<div class="pillars">
<div class="pillar"><div class="k">组织</div><b>一支共用的 Agent 团队</b><p>成员电脑和团队服务器上的 Claude Code、Codex 等接入后，组成一支 Agent 团队。调度 Agent 按每个 Agent 擅长的事分派工作，多个任务同时推进，团队下班后也能继续。</p></div>
<div class="pillar"><div class="k">制度</div><b>按团队的方法做事</b><p>Agent 按内置的 NocoBase 开发技能和团队的规范工作，读知识库里的业务规则；工作中学到的经验，Agent 自己记进项目记忆，下次开工前先读。</p></div>
<div class="pillar"><div class="k">流程</div><b>每次交付走同一条路</b><p>每个任务在独立分支上开发，经过团队定义的检查和另一个模型的评审，再交给负责人验收；发布上线由人批准。</p></div>
<div class="pillar"><div class="k">记录</div><b>每一步都有据可查</b><p>每次运行、每个决定、每次交付都留有记录：谁发起、哪个 Agent、在哪台机器上、做了什么、用了多少。</p></div>
<div class="pillar wide"><div class="k">决策</div><b>判断留给人</b><p>需要判断的事，调度 Agent 会写清问题、附上依据，交给任务负责人。验收和合并由人完成。Agent 完成执行，人只拍板。</p></div>
</div>

## 团队里的分工

Studio 里有两类角色：人做决定，Agent 做执行。

::figure roles

人主要在三个时刻出现：

1. **交代目标**：说清要什么，可以是一段话、一份资料，或者一次讨论的结论。
2. **回答提问**：方案取舍、业务规则和例外情况，由人决定。
3. **验收**：看交付报告和改动，确认结果。通过就合并，不通过就退回修改。

其余时间，Agent 团队在运行环境上持续推进。「我的任务」把等你处理的事放在最前面，你不需要盯着 Agent 工作。

## 与 NocoBase Core 的关系

NocoBase 是用 AI 开发和运行业务系统的开源平台。Agent 写代码、做执行，NocoBase 提供底座和流程，人来做决策。

<figure class="map" aria-label="团队在 Studio 中带领 Agent 团队，基于 Core 开发业务应用">
<div class="row"><div class="box human"><b>你的团队</b><span>交代目标、回答提问、验收</span></div></div>
<div class="down">任务</div>
<div class="row c2"><div class="box brand"><b>NocoBase Studio</b><span>组织 Agent 团队，管理任务、流程和记录</span></div><div class="box agent"><b>Agent 团队</b><span>在团队服务器和成员电脑上开发、测试、评审</span></div></div>
<div class="down">开发</div>
<div class="row"><div class="box"><b>你的业务应用 · 建在 NocoBase Core 上</b><span>直接使用 Core 的权限、工作流、文件等能力；上线后独立运行</span></div></div>
</figure>

Core 是开发和运行业务系统的开源底座，数据、权限、工作流、文件等通用能力已经内置。Studio 带领 Agent 基于 Core 开发和改进你的应用，Agent 直接使用这些能力，只写业务。**应用上线后独立运行，日常业务请求不经过 Studio。**

## 适合哪些团队

- **中大型企业的 IT 与数字化团队**：业务系统多，需求不断，希望用 AI 扩展交付能力，同时满足安全、合规和长期维护的要求。懂业务、不写代码的专家，也可以主导一项需求，从提出到验收。
- **为企业交付系统的软件公司与伙伴**：用同一套底座和方法为不同客户开发，把行业经验整理成技能和知识库。

Studio 和开发用的 Agent 都部署在企业自己的环境中，模型与编码工具由企业选择。Studio 在 NocoBase 商业版（Professional 与 Enterprise）中提供。

一个完整的例子见 [一个需求怎样完成](how-a-task-gets-done.md)。
