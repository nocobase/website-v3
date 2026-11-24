---
type: "release"
product: "studio"
tag: "v1.0.0-beta.86"
channel: "beta"
version: "1.0.0-beta.86"
title: "NocoBase Studio · v1.0.0-beta.86"
date: "2026-11-20"
publishedAt: "2026-11-20T14:59:01Z"
---

### 🎉 新特性

- **[Git]** Git 连接可以用 Studio 生成的部署密钥通过 SSH 拉取和推送，并可随时在 HTTPS 和 SSH 之间切换。

### 🚀 优化

- **[Agent]** OpenCode、Pi 的模型显示服务商前缀；运行失败时显示编码工具的原始报错。
- **[技能]** 项目设置的技能页不再提示在线 Agent 不会执行技能脚本。
- **[任务]** 任务详情的 PR 行始终显示在「需要你」上方，预览休眠时也显示「账号」，行末的 PR 标记点击后切到「代码与预览」。

### 🐛 修复

- **[授权]** {{edition:professional}} 新版本没有适用于当前 Studio 的变更时，不再显示更新提示图标。
- **[项目]** 在手机上，发布、质量等标签在页面打开后才出现时，项目页当前选中的标签仍保持在可见区域内。
