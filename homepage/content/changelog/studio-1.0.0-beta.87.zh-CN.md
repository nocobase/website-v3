---
type: "release"
product: "studio"
tag: "v1.0.0-beta.87"
channel: "beta"
version: "1.0.0-beta.87"
title: "NocoBase Studio · v1.0.0-beta.87"
date: "2026-11-21"
publishedAt: "2026-11-21T14:26:15Z"
---

### 🎉 新特性

- **[质量]** {{edition:enterprise}} 项目测试报告显示核心场景清单相对上一次测试的变化（新增、修改、删除的场景和权限标记）以及场景 PR。

### 🚀 优化

- **[Agent]** Studio 在执行机上报时自动启用缺少的 GPT-6.2 Astra 和 Sol Agent，内置规范要求写出引用条目的名称，并确保拉取请求可供评审。

### 🐛 修复

- **[Agent]**
  - 执行期间继续显示每项自检结果，调度 Agent 在派工结束时集中核对通过的检查。
  - PR 的必需检查运行期间暂缓唤醒调度，调度结束满 60 分钟后恢复空闲巡检。
