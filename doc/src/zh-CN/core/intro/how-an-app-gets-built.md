---
title: 一个应用怎样做出来
description: 以采购应用为例，从创建到上线，再到下一次改进：每一步人做什么、Agent 做什么、Core 提供什么。
---

采购负责人周航提出：**“建立供应商档案，采购员提交采购订单，金额超过 5 万元要财务审批，到货后上传签收单；每天提醒审批人处理积压的订单。”**下面是这个应用从无到有的全过程。

<ol class="flow">
<li class="human"><div class="step"><div class="step-head"><strong>创建应用</strong><span class="who human">开发者</span><span class="who agent">Agent</span></div><p>用默认模板创建应用，得到一份代码仓库和一个能登录的空应用。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>说清需求</strong><span class="who human">周航</span></div><p>谁用、记录什么、流程怎么走、谁能看谁能改、上线后谁来调整。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>开发</strong><span class="who agent">Agent</span></div><p>读技能，用上已有的插件，写数据表、接口、页面、流程和管理页面，跑测试。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>试用和验收</strong><span class="who human">周航</span><span class="who human">开发者</span></div><p>用不同的账号走一遍流程，对照验收清单检查。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>配置</strong><span class="who human">应用管理员</span></div><p>在「系统设置」里添加用户、分配角色、设定审批人和金额阈值。</p></div></li>
<li class="human"><div class="step"><div class="step-head"><strong>部署上线</strong><span class="who human">运维</span><span class="who agent">Agent</span></div><p>构建部署包，安装到服务器，上线后应用独立运行。</p></div></li>
<li class="agent"><div class="step"><div class="step-head"><strong>继续改进和升级</strong><span class="who human">周航</span><span class="who agent">Agent</span></div><p>新需求照同样的方式做；NocoBase 有新版本时，Agent 对照新版模板升级。</p></div></li>
</ol>

## 1. 创建应用

开发者在一个空目录里让 Agent 创建应用，或者自己执行 `pnpm create @nocobase/app`。几分钟后得到：

- 一份代码仓库：`client/`（浏览器端）、`server/`（服务端）、`database/`（迁移）、`tests/`，以及给 Agent 看的 `AGENTS.md` 和 `.agents/skills/`。
- 一个能登录的应用。首页写着“说出需求，由 Agent 来构建”，列出 Core 的内置能力，每项能力附带可以复制的提示词。
- 默认模板已经注册了认证、权限、用户、文件、通知、邮件、定时任务等 16 个插件，「系统设置 › 应用底座」可以看到它们。

步骤见 [快速开始](../quickstart.md)。

## 2. 说清需求

周航把需求讲给 Agent，或者写成一段话交给开发者。好的需求说清这几件事：

| 要说清的 | 采购应用里 |
| --- | --- |
| 谁用 | 采购员、部门经理、财务、仓库收货员 |
| 记录什么 | 供应商：名称、联系人、资质到期日；采购订单：编号、事项、供应商、金额、申请人 |
| 流程 | 草稿 → 待审批 → 待采购 → 已到货 → 已完成；驳回要写原因，退回申请人修改 |
| 谁能看、谁能改 | 采购员只看自己的订单；经理看本部门；财务看全部 |
| 上线后谁来调整 | 财务审批的金额阈值由管理员调整 |
| 怎样算完成 | 用四个账号各走一遍，结果符合上面的规则 |

不需要说用哪个插件、写在哪个文件里，这些由 Agent 按技能决定。更多写法见 [和 Agent 一起开发](../develop/working-with-agents.md)。

## 3. Agent 开发

Agent 在应用目录里工作。它按应用的 `AGENTS.md` 和 `.agents/skills/` 里的技能做事，大致是这样：

1. **先查已有的能力。** 应用开发技能要求 Agent 先看已安装的插件，权限、通知、定时任务这些能力不自己重写。
2. **补上缺的插件。** 审批是商业插件。如果应用还没有安装，Agent 会告诉你需要相应的授权，确认后用 `pnpm nocobase plugin register` 注册，再读这个插件的技能。
3. **写业务部分。** 供应商和采购订单的数据表（迁移文件）、带权限检查的接口、列表和详情页面、订单的流程（记录生命周期）、每天 9 点的提醒（定时任务）。
4. **做管理页面。** 应用开发技能要求 Agent 默认交付管理页面：启用模板备好的「用户管理」「角色与权限」，加上「流程管理」，把金额阈值做成管理员可以调整的流程参数。
5. **验证。** 运行类型检查、测试，用不同角色的账号确认页面和接口的权限。

你在代码仓库里能看到它改了什么：新的迁移文件、`server/routes/` 下的接口、`client/pages/` 下的页面、插件清单里多出的一行。

## 4. 试用和验收

刷新应用就能试用。周航和开发者用不同的账号走一遍：

- 采购员提交一笔 6 万元的订单，确认它进入财务审批；
- 换成另一位采购员，确认看不到这笔订单；
- 直接调用接口修改订单状态，确认被拒绝（状态只能通过流程操作改变）；
- 财务驳回，确认订单退回申请人，驳回原因记在处理历史里；
- 打开「系统设置 › 应用底座」，确认用到的能力都已点亮：数据建模、权限控制、工作流与审批、消息通知……

不符合的地方，照同样的方式告诉 Agent，再看一遍。

## 5. 管理员配置

应用管理员在「系统设置」里完成上线前的配置，这些不需要改代码：

- 「用户管理」：添加采购员、经理、财务和收货员的账号；
- 「角色与权限」：给每个人分配角色，检查数据范围；
- 「流程管理」：查看采购订单的流程图，把财务审批的金额阈值设为 5 万元。

## 6. 部署上线

运维（或交给 Agent）构建部署包，用 PM2 或 Docker 安装到服务器，在服务器的 `config.yml` 里配置数据库、对外地址和密钥。上线后应用独立运行。见 [部署与运维](../operations/deployment.md)。

用 Studio 时，这一步由 Studio 的发布流程完成：构建、审批、部署、出问题时回滚。

## 7. 继续改进和升级

一个月后，周航想给供应商分级。新需求照第 2 到第 6 步再走一遍，Agent 在现有代码上继续开发，已有的数据表通过新的迁移调整，不影响已有数据。

NocoBase 发布新版本时，开发者让 Agent 升级：Agent 按 `nocobase-app-upgrade` 技能对照新版模板合并变化，不回退应用自己的修改，再跑一遍测试。见 [升级 NocoBase](../develop/upgrade.md)。

> [!NOTE] 用 Studio 做同样的事
> 第 2 到第 4 步在 Studio 里是一个任务：你在会话里说清需求，调度 Agent 安排执行 Agent 开发、检查、评审，最后交给你验收。见 [一个需求怎样完成](../../studio/intro/how-a-task-gets-done.md)。

下一篇 [核心概念](concepts.md)，把这里出现的应用、模板、插件、技能、系统设置逐个讲清。
