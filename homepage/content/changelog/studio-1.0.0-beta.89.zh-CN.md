---
type: "release"
product: "studio"
tag: "v1.0.0-beta.89"
channel: "beta"
version: "1.0.0-beta.89"
title: "NocoBase Studio · v1.0.0-beta.89"
date: "2026-11-23"
publishedAt: "2026-11-23T10:42:29Z"
---

### 🚀 优化

- **[部署]** 一键安装脚本把 `--lang` 指定的语言写入 Studio 的 `config.yml` 作为默认语言，之后可以直接在该文件里修改。

### 🐛 修复

- **[质量]** {{edition:enterprise}}
  - 质量测试运行提示说明授权范围，并要求派工保留规定的防御性检查。
  - 安全维度缺 ZAP 报告时不再整份拒收：已完成的检查照常显示，被动和主动扫描记为未验证（没有 ZAP 报告），结论不会是通过。
- **[部署]** 带 `--mirror` 再次运行一键安装脚本时，会保留已切换的 Studio 或 Studio EE 付费镜像，不再替换成 Studio CE。
