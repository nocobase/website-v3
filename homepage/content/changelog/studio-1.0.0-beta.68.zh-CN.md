---
type: "release"
product: "studio"
tag: "v1.0.0-beta.68"
channel: "beta"
version: "1.0.0-beta.68"
title: "NocoBase Studio · v1.0.0-beta.68"
date: "2026-10-29"
publishedAt: "2026-10-29T02:29:26Z"
---

### 🚀 优化

- **[技能]** 全新安装会获得更新后的内置工作方法技能，未改动的原始版本也会升级一次。

### 🐛 修复

- **[我的会话]** 让 My Agent 侧栏与 Runner Agent 保持一致，并统一收起和展开行为。
- **[发布]**
  - 修复 PostgreSQL 上版本列表、待发布任务和版本进度加载失败的问题。
  - 发布页区分未配置版本线与尚无版本的项目，并可从发布弹窗直接配置版本线。
  - 生产部署指引默认选择最新 tag，并明确提示尚未上传产物的版本。
- **[质量]** {{edition:enterprise}} 会话未预选项目或预选项目不同时，也能为明确指定的项目创建、启动和继续质量计划。
