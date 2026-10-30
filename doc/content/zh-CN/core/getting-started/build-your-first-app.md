---
title: 开发第一个功能
metaDescription: 在新创建的应用里，让 Agent 开发第一个功能：客户管理。记录客户、负责销售和下次跟进，三种角色看到和能改的客户不同。
---

在[创建应用](create-app.md)得到的应用里，让 Agent 开发第一个功能：客户管理。先在应用根目录打开 Agent。

## 1. 描述需求

把下面这段发给 Agent：

```prompt
帮我做客户管理。客户有名称、联系方式、备注、负责销售、下次跟进日期，状态分潜在、跟进中、已成交。
可以新建、查看、编辑、删除客户，按名称搜索，按状态筛选。
销售主管管理全部客户；销售只能查看自己负责的客户，并更新它们的状态；只读用户可以查看全部客户，不能修改。
```

需求只写业务：要记录什么，能做哪些操作，谁能做什么。Agent 会按项目的 Skill 自己处理用户和权限管理、多语言文案、测试和汇报。

## 2. 确认设计

开发之前，Agent 会先给出设计，请你确认页面结构、主要交互，以及需要你决定的问题。回答这些问题，确认后它开始开发。

## 3. 查看结果

Agent 开发完会自己运行测试，在浏览器里逐项验收并截图，然后交给你一份报告，列出做了什么和没有验证的部分。验收需要登录时，它会请你自己登录。

打开 Agent 给出的地址，侧边栏出现 **Customers**。在这里可以新建客户、指定负责销售和下次跟进日期、更新状态，也可以搜索和筛选：

![客户列表，包含状态、负责销售、下次跟进日期和分页。](/assets/core/tutorials/customers/customer-list.png)

截图来自示例应用。同一段需求每次做出来的布局可能不同。

Agent 会一并启用用户管理和权限管理。按下面的步骤，看看销售能做什么：

1. 在 **System settings → Users** 添加一个用户，在 **Permission sets** 中加上销售角色（示例应用里叫 `Sales rep`）。
2. 新建一个客户，负责销售选这个用户。
3. 换这个账号登录。客户列表里只有这个用户负责的客户；可以更新状态，不能编辑资料或删除。

## 4. 继续调整

如果结果不对，或者想换一种做法，告诉 Agent 你做了什么、看到了什么、期望什么：

```prompt
我用只分配了销售角色的账号登录，仍能看到别人负责的客户。
销售应该只能看到自己负责的客户。
```

交互也可以直接提，例如“点击客户名称先打开详情，再决定是否编辑”。

## 5. 查看代码改动

下面是示例应用里改动的主要位置。你的文件名可能不同，位置基本一致：

```tree
my-app/
├── database/main/
│   ├── migrations/      # 新建 customers 表
│   └── seeds/           # 初始化三种客户角色
├── server/
│   ├── customers/       # 输入校验、业务服务和权限声明
│   ├── providers/       # 注册客户服务和权限
│   └── routes/          # 客户的 HTTP 接口
├── client/
│   ├── routes.ts        # 客户页面、侧边栏入口和系统设置
│   ├── pages/customers/ # 列表、详情、表单和操作菜单
│   └── locales/         # 界面文案
└── tests/               # 迁移、接口、页面和浏览器测试
```

## 下一步

继续阅读[持续开发应用](develop-with-an-agent.md)，了解如何提出新需求、确认设计和验收结果，逐步扩展这个应用。

## 完整示例代码

示例项目叫 **CRM 客户管理**，目录为 `apps/crm`。查看[完整源码](https://github.com/nocobase/docs-examples-v3/tree/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm)（固定提交 `8ad9530`），或[下载完整项目 ZIP](/assets/core/downloads/crm-source-8ad9530.zip)。项目包含前后端、数据库迁移、角色初始化、中文和英文界面、测试及依赖锁文件；[README](https://github.com/nocobase/docs-examples-v3/blob/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm/README.MD)说明了代码位置与验证范围。

运行环境：Node.js 24、pnpm 11.7.0。示例基于 Default 模板 `1.0.0-beta.85`，依赖版本由 `pnpm-lock.yaml` 固定。下载并解压后执行：

```bash
cd crm
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite --json
pnpm nocobase config check --json
pnpm dev
```

打开终端输出的完整应用地址。首次启动会创建客户表和三种业务角色；新模板默认使用 `nocobase` / `admin123` 登录。项目不包含演示账号、客户数据或本地配置，可按本文的步骤新建客户、分配角色并验证权限。

下面是该项目实际运行的客户列表与详情页，数据为虚构示例：

![CRM 客户列表：状态、负责销售、下次跟进日期，以及搜索、筛选和分页。](/assets/core/tutorials/crm/customer-list-en.png)

![CRM 客户详情：查看联系方式、负责销售、下次跟进日期与备注。](/assets/core/tutorials/crm/customer-detail-en.png)

已在 SQLite 环境中验证新建、编辑、删除、状态更新、搜索、筛选、分页和刷新后的数据保留，并用仅分配一种业务角色的账号检查销售主管、销售和只读权限。相关的 24 项自动化测试、类型检查和应用构建通过；其他数据库和生产部署未验证。
