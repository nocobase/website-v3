---
title: 配置仓库的 PR 预览
description: 为仓库选择由 Agent 或 CI 构建 PR 预览，按需接入流水线。
---

打开「项目设置 › 代码仓库」，在目标仓库的「预览环境」行点「修改」。构建方式和[检查来源](checks.md)可分别选择。例如，GitHub Actions 运行检查，开发 Agent 构建预览。

## 选择构建方式

- **Agent 构建**适合由开发 Agent 交付预览的仓库。确保仓库的 README 或 `AGENTS.md` 写明应用目录、构建命令和产物路径。Agent 会按这些说明构建关联 PR 最新提交的部署包，再用 `nb-studio deploy --preview --file <部署包路径>` 发布。任务首次创建预览应用时，发起人需要创建应用的权限。
- **CI 构建**适合已有构建流水线的仓库。流水线为每个 PR 构建并发布预览，使用该仓库的 CI 密钥。
- **不构建**适合无需运行预览应用的仓库。

选好后点「保存」。

![在「预览环境」中单独选择构建方式](https://static-docs.nocobase.com/studio-guide-zh-preview-20261127-121d9c6618de.webp)

## 通过 CI 发布预览

选择「CI 构建」。如果外部 CI 已经用这个仓库的密钥上报检查，发布预览可以复用它。首次接入时，在面板中生成密钥，保存到流水线的保密变量 `NB_STUDIO_API_KEY`。确认 CI 执行机能访问 Studio。

**使用 GitHub Actions**

1. 切换到「GitHub Actions 工作流」，选择 PR 触发和用于预览的托管环境。应用在仓库根目录时，应用目录填 `.`；在子目录时，填写相对路径，例如 `apps/shop`。核对面板给出的应用 ID。
2. 将面板提供的提示词交给有仓库权限的 Coding Agent，或展开手动配置，把生成的工作流放到仓库的 `.github/workflows/`。在仓库的 Actions secrets 中，将密钥保存为 `NB_STUDIO_API_KEY`。
3. 打开或更新一个 PR。构建发布成功后，在 Studio 仓库的「构建记录」里核对应用和提交，再从任务打开 [PR 预览](../release/previews.md)。

![在「CI 构建」中查看仓库密钥和流水线配置](https://static-docs.nocobase.com/studio-guide-zh-ci-build-20261127-83f163c60fa7.webp)

**使用 Jenkins 或其他 CI**

1. 在「其他 CI」页签展开手动配置，复制「构建并发布」命令到 PR 流水线。设置 `NB_STUDIO_URL` 和仓库密钥。在执行机安装 `nb-studio` 后，在同一任务中登录：

   ```sh
   printf '%s' "$NB_STUDIO_API_KEY" | nb-studio login --server "$NB_STUDIO_URL" --api-key-stdin
   ```

2. 将 `PR` 设为 PR 编号，`SHA` 设为 PR 最新提交，`CI_RUN_URL` 设为本次构建的日志地址。生成的命令先上报构建状态，再向 Studio 确认是否需要预览。
3. 在脚本的构建占位处填入项目命令，保留外层的条件判断。例如，NocoBase 应用运行 `pnpm build --tar` 后得到 `storage/exports/dist.tar.gz`。部署命令的 `--file` 应指向实际产物。Studio 跳过预览时，这次流水线也会跳过构建和部署。
