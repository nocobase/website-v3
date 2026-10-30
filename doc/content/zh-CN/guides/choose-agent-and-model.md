---
title: 选择 Agent 和模型
metaDescription: 选好编码工具和模型。
---

## 选择编码工具

本教程默认用 Codex，也可以用 Claude Code 或 OpenCode，提示词通用。按各工具的官方说明安装并登录。

## 选择模型

推荐 Claude 和 GPT 系列的顶尖模型，国产模型推荐 DeepSeek：

| 模型 | 特点 |
| --- | --- |
| Opus | 写出的页面更好看 |
| GPT-6 Astra | 有相对完整的系统设计文档时，能写出完整的系统 |
| DeepSeek | 同上。可以在 OpenCode 里使用，也可以按 DeepSeek 的文档接入 Claude Code |

写设计文档、开发新功能，用强模型、调高思考强度；改文案、调样式这类小改动，可以换快一些、便宜一些的模型。

评审代码时换另一家厂商的模型，更容易发现问题。例如 Codex 用 GPT 写的功能，开一个 Claude Code 会话让 Opus 评审：

```prompt
请评审当前未提交的改动（git diff）。先阅读 AGENTS.md，按项目的约定检查缺陷、安全、权限和测试。
只指出问题和修改建议，按严重程度排序，不要直接修改代码。
```

Studio 的评审也是这样安排的，见 [检查与评审](../studio/project/checks-and-review.md#评审)。
