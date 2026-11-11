---
title: 版本与发布
description: 用 Git tag 标识交付版本，查看包含的任务和可部署制品。
---

Studio 从 Git tag 识别版本，并计算版本包含的任务。版本线决定哪些 tag 属于同一发布序列，制品则用于实际部署。

![查看版本、任务和部署制品](https://static-docs.nocobase.com/studio-zh-versions-20261111-normal-2x.webp)

## 配置版本线

在「项目设置 › 代码仓库」中编辑「版本线」。选择 Studio 根据已有 tag 推荐的前缀，或手动填写以 `*` 结尾的格式，例如 `v*`、`release-beta/*`。

一个仓库可有多条版本线，匹配范围不能重叠。可隐藏前缀，将 `release-beta/1.2.0` 显示为 `1.2.0`。仓库没有 tag 时，先创建首个版本 tag。

## 发布版本

1. 在「发布」中选择项目，打开「如何发布」。
2. 选择版本线、分支和目标提交。可使用某个测试应用正在运行的提交，或填写完整 SHA。
3. 核对本次包含的任务，以及尚未包含的待发布任务。
4. 确认 tag，复制生成的命令，在仓库中创建并推送。

Studio 通过 Webhook 和定时查询识别新版本。修改版本线会重新计算版本与任务关联，保留已有制品和部署记录。

## 制品

制品可以是应用压缩包，也可以是镜像。NocoBase 应用使用 `pnpm build --tar` 生成部署压缩包；镜像由 CI 或 Coding Agent 构建并推送到镜像仓库。

版本页可查看制品、下载压缩包或进入部署操作。构建和上传方式见[检查与 CI](../configure/checks.md)。交付到测试环境见[托管环境](../admin/environments.md)，生产见[生产交付](../project/release.md)。
