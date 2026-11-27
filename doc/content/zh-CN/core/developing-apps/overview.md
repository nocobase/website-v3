---
title: 应用开发概览
description: 了解 NocoBase 应用的组成、业务功能的实现过程、代码组织方式，以及与 Agent 协作开发的方法。
---

NocoBase Core 及配套插件提供开发业务应用所需的基础能力，包括数据库、服务端、客户端、认证与权限等。开发者可以直接使用这些能力，专注于业务功能的实现，而不必从零搭建基础设施。

你可以自己编写代码，也可以让 AI Agent 根据需求完成开发。

## 应用由哪些部分组成？

一个 NocoBase 应用主要由以下部分组成：

| 组成 | 作用 |
| --- | --- |
| 客户端 | 构建页面、表单、列表和交互 |
| 服务端 | 提供 API、处理业务逻辑 |
| 数据库 | 定义数据结构、存储业务数据 |
| 插件 | 提供认证、权限、文件、通知等现成能力 |
| 配置 | 管理数据库连接、服务参数等 |

这些部分可以按需组合，并不是每个功能都需要涉及全部模块。

## 一个业务功能如何实现？

以 CRM 系统中的“创建客户”为例：

<div class="states" aria-label="创建客户的处理流程"><span>填写客户信息</span><span class="arrow" aria-hidden="true">→</span><span>调用 API</span><span class="arrow" aria-hidden="true">→</span><span>处理业务逻辑</span><span class="arrow" aria-hidden="true">→</span><span>保存到数据库</span><span class="arrow" aria-hidden="true">→</span><span>更新页面</span></div>

在 NocoBase 中，你通常只需要实现与业务相关的部分：

- **客户端**：创建客户表单和客户列表。
- **服务端**：实现客户创建接口、权限检查及业务规则。
- **数据库**：定义客户的数据结构。
- **插件**：复用现有的认证、权限等能力。

订单等记录需要经过多个阶段，由人员操作、自动处理或外部结果推进时，参见[工作流](business-workflows.md)。

## 代码写在哪里？

NocoBase 应用按照职责组织代码：

```tree
my-app/
├── client/       # 页面、组件、路由
├── server/       # API、业务服务
├── database/     # 数据迁移、初始化数据
├── tests/        # 测试
└── config.yml    # 应用配置
```

根据功能需要，在对应目录中编写代码。新增页面、接口或服务时，通过相应的注册入口接入应用。

具体参见[项目结构](project-structure.md)。

## 与 Agent 一起开发

NocoBase 支持人和 Agent 协作开发应用。

典型流程：

<div class="states" aria-label="与 Agent 协作开发的流程"><span>描述需求</span><span class="arrow" aria-hidden="true">→</span><span>制定方案</span><span class="arrow" aria-hidden="true">→</span><span>实现功能</span><span class="arrow" aria-hidden="true">→</span><span>测试验证</span><span class="arrow" aria-hidden="true">→</span><span>人工验收</span></div>

Agent 可以结合项目规则、文档和 Skills，使用 NocoBase 已有的能力实现业务功能。

开发者主要负责明确需求、审核关键设计和验收结果。

## 配置商业包的授权源

安装或使用商业插件、商业数据库驱动、多应用模板或多门户包时，需要具备相应的商业授权，并在执行安装命令的环境中配置商业包授权源。已有有效配置时无需重复执行。

从授权账号或授权交付方获取具有下载权限的读取令牌（通常为 `nbr_…`），将下方命令中的 `<read-token>` 替换为实际令牌：

```bash
npm config set "@nocobase:registry" "https://pkg-v3.nocobase.com/"
npm config set "//pkg-v3.nocobase.com/:_authToken" "<read-token>"
npm whoami --registry=https://pkg-v3.nocobase.com/
```

如果授权交付方提供了专用私有仓库地址，将 `https://pkg-v3.nocobase.com/` 替换为该地址，并将 `//pkg-v3.nocobase.com/` 替换为去掉 `https://` 和末尾 `/` 后的主机名及路径。

- **配置位置与安全**：上述命令写入用户级 `~/.npmrc`，npm 和 pnpm 都会读取。不要将令牌写入项目文件、文档、Git 仓库或 Agent 对话中。
- **仅作用于 `@nocobase` scope**：商业源同时代理公开的 `@nocobase/*` 包，普通第三方依赖仍使用公共 npm 源或你配置的镜像。不要将默认 registry 整体改成商业源，否则安装第三方包可能返回 404。
- **验证具体包权限**：`npm whoami` 仅确认身份认证通过，不代表拥有某个商业包的下载权限。需要确认时，可执行 `npm view <包名> version --registry=https://pkg-v3.nocobase.com/` 检查。
- **配合 Agent 使用**：在 Agent 实际执行命令的机器和用户环境中提前完成配置；远程 Agent 不会自动继承本机的 `~/.npmrc`。
- **常见报错**：商业包返回 401、403 或查不到版本时，检查令牌是否有效、账号是否有该包权限以及版本是否存在；第三方包返回 404 时，检查默认 registry，确保商业源只配置到 `@nocobase` scope 后重新执行 `pnpm install`。
