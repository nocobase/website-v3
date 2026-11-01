---
title: 升级 NocoBase Core
metaDescription: 用应用自带的升级技能把 NocoBase Core 升级到最新版本：先出计划，确认后合并，跑完测试并核对数据。
---

升级由应用自带的 `nocobase-app-upgrade` 技能完成：比较新旧两版模板的差异，逐个文件合并进应用，保留业务代码。

```prompt
把 NocoBase Core 升级到最新版本。先给我升级计划，我确认后再改。
```

计划里会列出模板改动了哪些文件、应用自己也改过的文件怎样合并、依赖和数据库迁移的变化。确认后，Agent 在新分支上合并、安装依赖、同步技能，跑完测试和构建，核对数据，再合并回主分支。

手动升级的步骤和验证清单见 [升级 NocoBase Core](../core/developing-apps/upgrade-nocobase-core.md)。升级后上线和发布新版本一样：构建新镜像，备份部署目录后替换，见 [部署新版本](../core/tutorials/deploy-with-docker.md#部署新版本)。

**完成的标志**：`package.json` 的 `nocobase.defaultTemplateVersion` 是新版本，测试和构建通过，升级前的数据都在。
