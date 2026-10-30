---
title: 配置检查与预览
description: 选择 Agent 自检、GitHub Actions 或外部 CI，验证任务改动并提供预览。
---

项目初始化完成后，为仓库选择检查方式，并准备 PR 预览。无需搭建 CI 流水线也可以使用 Agent 自检。

## 选择检查方式

打开项目的「设置 › 代码仓库」，点对应仓库的「检查」。

| 方式 | 适合什么情况 | 需要配置什么 |
| --- | --- | --- |
| Agent 自检 | 先由 Agent 验证改动，不搭建 CI | 选择后保存；Agent 根据项目脚本执行检查、上报结果并发布预览 |
| GitHub Actions | 使用 GitHub 流水线统一执行检查和构建 | 添加工作流文件和 CI 密钥 |
| 外部 CI | 已有其他 CI 服务 | 由现有流水线上报检查结果和发布预览 |

每个仓库只采用选定来源的检查结果。切换来源后，旧来源的上报不再生效。

![选择检查来源、触发方式和预览环境](https://static-docs.nocobase.com/studio-zh-setup-ci-options-full-1440x900-20261030.png)

## 使用 GitHub Actions

1. 选择「GitHub Actions」。触发方式选「Pull request」，环境选「预览」。
2. 应用在仓库根目录时，目录填 `.`，保留生成的应用 ID。
3. 点「复制给 Agent 的提示词」，交给本地 Coding Agent。它会添加工作流文件、保存 CI 密钥并创建 PR。
4. 等待工作流完成，在任务的「代码与预览」中查看检查结果并打开预览。

GitHub Actions 必须能够访问 Studio。Studio 只有本机或内网地址时，使用可访问它的自托管执行机，或先配置可达的 HTTPS 地址。

手动配置、外部 CI、分支或标签触发，以及密钥维护，见[检查与 CI](../configure/checks.md)。

## 下一步

配置完成后，[邀请成员](invite.md)加入项目。外部 CI、其他触发方式和密钥维护可随时在[检查与 CI](../configure/checks.md)中查阅。
