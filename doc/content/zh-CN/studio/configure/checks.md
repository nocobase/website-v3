---
title: 配置仓库检查
description: 选择 PR 检查结果的来源，设置分支规则，并在任务中核对结果。
---

## 选择检查结果来源

打开「项目设置 › 代码仓库」，在目标仓库的「检查」行点「修改」。选择提供检查结果的一方，然后保存。

| 检查来源 | 适用情况 | 结果如何进入 Studio |
| --- | --- | --- |
| Agent 自检（默认） | 由开发 Agent 运行项目检查 | Agent 运行项目脚本，用 `nb-studio check report` 上报结果 |
| 代码平台 CI | 仓库已有 GitHub Actions、GitLab CI 等流水线 | Studio 从关联的 PR 或 MR 读取检查结果 |
| 外部 CI | 检查由 Jenkins 等独立流水线运行 | 流水线向 Studio 上报结果和日志链接 |

![在仓库的「检查」中选择 GitHub Actions](https://static-docs.nocobase.com/studio-guide-zh-checks-20261127-10558ddc7784.webp)

## 接入外部 CI

在仓库的「检查」中选择「外部 CI」。下面以 Jenkins 已能为 PR 运行测试为例。选择「Jenkins」后，可以复制面板里的提示词，让本地 Coding Agent 修改仓库；也可以展开手动配置。

1. 在面板中生成仓库 CI 密钥。在 Jenkins 为这条流水线添加 **Secret text** 凭据，ID 填 `nb-studio-api-key`。密钥只显示一次，默认有效期为 90 天。
2. 将面板生成的 `ci/nb-studio-check.sh` 加入仓库。复制生成的 `Jenkinsfile`；如果仓库已有该文件，将示例中的环境变量和检查阶段并入现有流水线。`NB_STUDIO_URL` 应指向执行机能访问的 Studio 地址，`NB_STUDIO_API_KEY` 从上一步的凭据读取。
3. 按项目实际命令修改检查阶段。每个需要在 Studio 中单独查看的检查使用一个名称。例如，用以下命令运行名为 `test` 的检查：

```bash
sh ci/nb-studio-check.sh test pnpm test
```

脚本先上报 `pending`，再按命令退出码上报成功或失败，并附上 Jenkins 构建日志链接。提交改动并运行 PR 流水线，在任务的「代码与预览」中核对当前提交是否出现了 `test`。

使用其他流水线时，选「其他 CI」，将同样的上报脚本用于已有检查，并配置 Studio 地址和仓库密钥。将本次流水线的日志地址传给 `BUILD_URL`，即可从 Studio 打开日志。如果 CLI 无法识别仓库或提交，在脚本的 `nb-studio check report` 调用中显式传入 `--repository` 和 `--sha`。

## 配置分支规则

在「项目设置 › 代码仓库 › 分支规则」中设置：

- 必需检查失败时是否唤醒调度 Agent。
- 检查全部通过后是否继续推进。
- PR 出现冲突时是否安排修复。
- 哪些检查仅作参考，失败时不阻止 Studio 内的正常合并。

未列为参考的检查按必需检查处理。代码平台的分支保护规则仍然有效。关闭自动唤醒后，可在任务中评论，请调度 Agent 继续处理。

## 在任务中查看检查结果

打开关联 PR 的任务，在「代码与预览」中查看每项检查的状态和日志。「还没收到上报」表示所选来源尚未提供结果。如何处理失败的检查，见 [PR 检查与代码评审](../project/checks-and-review.md)。
