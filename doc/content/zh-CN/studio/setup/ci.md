---
title: 配置检查与预览
description: 以 GitHub 为例，设置仓库检查来源和 PR 预览构建方式。
---

每个仓库分别设置检查来源和预览构建方式。下面以 GitHub 为例，让 GitHub Actions 运行检查，由 Agent 构建 PR 预览。

## 选择检查方式

打开「项目设置 › 代码仓库」，在目标仓库的「检查」行点「修改」。已有 GitHub Actions 检查时，选「GitHub Actions」并保存。Studio 从 GitHub 读取结果。还没有 CI 时，可保留默认的「Agent 自检」。

![在仓库的「检查」中选择 GitHub Actions](https://static-docs.nocobase.com/studio-guide-zh-checks-20261127-10558ddc7784.webp)

## 选择预览构建方式

1. 回到同一张仓库卡片，修改「预览环境」。
2. 选择「Agent 构建」并保存。Agent 交付时按项目脚本构建部署包并发布预览。无需预览的仓库可以选「不构建」。
3. 打开有 PR 的任务，在「代码与预览」中查看检查结果。预览发布后，在同一处打开应用。

![在「预览环境」中单独选择构建方式](https://static-docs.nocobase.com/studio-guide-zh-preview-20261127-121d9c6618de.webp)

## 下一步

配置完成后，[邀请成员](invite.md)加入项目。外部 CI、其他触发方式和密钥维护可随时在[配置仓库检查与 CI](../configure/checks.md)中查阅。
