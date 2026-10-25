---
title: NocoBase Core 文档
nav: Core 首页
description: Core 是开发和运行业务系统的开源底座。权限、审批、文件、通知这些每个系统都需要的能力已经就绪，Agent 直接使用，把开发集中在你自己的业务上。
---

在 NocoBase 3 里，应用是一份代码，由 Agent 基于 Core 编写。你说清要什么、做出判断、验收结果；Agent 读 Core 随包提供的技能，用 Core 的插件和组件写出应用；应用上线后，管理员在应用的「系统设置」里维护用户、权限和流程参数。

> [!TIP] 第一次来
> 先读 [Core 是什么](intro/what-is-core.md) 和 [插件怎样工作](intro/how-plugins-work.md)，再按 [快速开始](quickstart.md) 创建一个应用。

## 按角色阅读

| 你是 | 先读 | 再读 |
| --- | --- | --- |
| 正在评估 NocoBase 3 | [Core 是什么](intro/what-is-core.md) → [一个应用怎样做出来](intro/how-an-app-gets-built.md) | [能力总览](capabilities/index.md) → [插件目录](plugins/index.md) |
| 开发者、技术负责人 | 入门五篇，含 [快速开始](quickstart.md) | 开发应用 → 按需查能力和插件 |
| 业务负责人、业务专家 | [Core 是什么](intro/what-is-core.md) → [一个应用怎样做出来](intro/how-an-app-gets-built.md) | [能力总览](capabilities/index.md)，以及相关能力的“怎样提需求” |
| 应用管理员 | [核心概念](intro/concepts.md) | 系统设置 → 用户与组织 → 权限控制 |
| 运维 | [快速开始](quickstart.md) | 部署与运维 → 配置参考 |
| 用过 NocoBase 2 | [从 NocoBase 2 来](../start/from-v2.md) → [插件怎样工作](intro/how-plugins-work.md) | [插件目录](plugins/index.md) → [工作流与审批](capabilities/workflows.md) |
| 插件开发者 | [核心概念](intro/concepts.md) → [插件怎样工作](intro/how-plugins-work.md) | 扩展开发 |

## 文档包括什么

| 部分 | 内容 |
| --- | --- |
| [入门](intro/what-is-core.md) | Core 是什么、一个应用怎样做出来、核心概念、插件怎样工作、快速开始 |
| [开发应用](develop/working-with-agents.md) | 和 Agent 一起开发的通用方法：提需求、应用的结构、管理插件、页面、数据、接口、系统设置、验收、升级 |
| [能力](capabilities/index.md) | 按「应用底座」的 13 类，逐项说明开箱即有什么、Agent 要做什么、管理员能调整什么 |
| [插件目录](plugins/index.md) | 每个插件一页：它提供什么、在应用里是什么样子、怎样让 Agent 使用 |
| [部署与运维](operations/deployment.md) | 部署、配置、数据库、存储、后台任务、升级与回滚、备份、日志 |
| [扩展开发](extend/when-to-write-a-plugin.md) | 什么时候写插件，怎样创建、发布插件，给插件写技能 |
| [参考](reference/cli.md) | 命令行、配置项、HTTP 接口、包与版本、常见问题 |

## 关于这份文档

- 行为描述对照 NocoBase 仓库 `v3-develop` 分支（2026-10-23）的代码、默认模板和技能。各个包目前都是 beta 版本，以产品为准。
- 例子是一家企业的采购应用：供应商、采购订单、审批、到货。
- 模板和插件自带的界面名称写在「」里，例如「系统设置 › 应用底座」。Agent 按需求做出的页面每个应用不同，文档用描述的方式写，例如“采购订单详情里的附件区”。
