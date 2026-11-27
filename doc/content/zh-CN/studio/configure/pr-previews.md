---
title: 配置仓库的 PR 预览
description: 为仓库选择由 Agent 或 CI 构建 PR 预览，按需接入流水线。
---

打开「项目设置 › 代码仓库」，在目标仓库的「预览环境」行点「修改」。构建方式和[检查来源](checks.md)可分别选择。例如，GitHub Actions 运行检查，开发 Agent 构建预览。

## 选择构建方式

- **Agent 构建**：Agent 按项目脚本构建部署包，交付时发布 PR 预览。
- **CI 构建**：流水线构建部署包，用仓库 CI 密钥发布预览。
- **不构建**：这个仓库的 PR 无需预览。

选好后点「保存」。

![在「预览环境」中单独选择构建方式](https://static-docs.nocobase.com/studio-guide-zh-preview-20261127-121d9c6618de.webp)

## 通过 CI 发布预览

1. 选择「CI 构建」。如果流水线已配置这个仓库的 CI 密钥，可以继续使用。首次接入时，在面板中生成密钥，存为流水线的保密变量 `NB_STUDIO_API_KEY`。将 `NB_STUDIO_URL` 设为 CI 执行机能访问的 Studio 地址。
2. 使用代码平台自带的 CI 时，选择 PR 触发、用于预览的托管环境和应用目录（仓库根目录填 `.`）。将生成的配置加入仓库。使用其他 CI 时，将面板里的构建和发布命令加入已有流水线。
3. 提交一个 PR。流水线发布成功后，在仓库的「构建记录」中核对应用和提交，再从任务打开 [PR 预览](../release/previews.md)。

![在「CI 构建」中查看仓库密钥和流水线配置](https://static-docs.nocobase.com/studio-guide-zh-ci-build-20261127-83f163c60fa7.webp)
