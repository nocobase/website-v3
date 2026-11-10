---
title: 快速开始
description: 运行多应用示例，创建应用实例，授予访问权限，并检查数据隔离与独立升级。
---

使用 [app-example-multi-app 示例](https://github.com/nocobase/app-example-multi-app)体验一个主应用管理多个试剂管理实例。试剂业务只用于演示，创建自己的系统时可以替换为库存、客户或采购等业务。


## 启动多应用示例

在新的目录中克隆示例：

```bash
git clone https://github.com/nocobase/app-example-multi-app.git
cd app-example-multi-app
pnpm install --frozen-lockfile
```

安装完成后，在同一个目录配置入口并构建。将下面的域名替换为已经准备好的实际地址：

```bash
EXAMPLE_PUBLIC_ORIGIN=https://apps.example.com pnpm setup:local
pnpm build:templates
pnpm build --target linux-x64 --node-version 24 --tar
pnpm demo
```

`setup:local` 配置主入口、App Host 和演示存储；`build:templates` 构建试剂模板；`pnpm demo` 启动构建后的主应用及受管理的 App Host，并执行演示初始化。只运行根目录的 `pnpm dev` 不等于完成这套初始化。

终端出现 `Application templates demo is ready.` 后，打开配置脚本输出的 HTTPS 主入口，路径为 `/main/`。新环境默认演示账号是 `nocobase`，密码是 `admin123`；已有配置可能覆盖它们。不要把默认账号的演示环境开放给不可信访问者。

配置脚本为演示设置了非 Secure Cookie。它不适合作为生产安全配置；正式部署见[部署与运维](deployment.md)。

已有环境重启时，确认没有进程使用同一数据库和存储后运行 `pnpm demo`。不要为了重启重新配置地址、删除数据或重建实例。

## 查看模板与创建应用实例

首次初始化包含一个试剂管理模板和以下实例：

| 实例标识 | 初始版本 | 初始状态 |
| --- | --- | --- |
| `teaching-reagents` | `1.3.11` | 运行中 |
| `research-reagents` | `1.3.14` | 运行中 |
| `browser-reagents` | `1.3.11` | 已停止 |

在**应用模板**中打开模板详情，查看两个已发布版本。然后在**应用实例**中创建一个名称和标识均可辨认的新实例，选择模板、明确的版本及部署环境。

等待操作完成后，确认实例状态为运行中、当前版本与所选版本一致，并且访问地址能打开。提交请求成功或出现部署记录，还不代表应用已可使用。详细操作见[管理模板与应用实例](management.md)。

## 授予访问权限并进入子应用

1. 在主应用准备一个普通平台用户。
2. 打开新实例的**访问授权**，选择该用户并授予只读或编辑访问资格。
3. 用该普通用户登录主应用，从工作台进入实例。
4. 确认经过平台登录后进入子应用，并只能执行对应业务角色允许的操作。

演示初始化会给新建演示实例中的演示主账号显式授予编辑资格；你手动创建的实例仍需添加成员。主应用管理员身份不代替应用成员授权。

需要本地恢复登录时，在实例详情的访问授权区域查看初始管理员凭据，并使用子应用登录页的 `?auth=local` 入口。这不是查询用户后来修改过的密码。

## 验证数据隔离与独立升级

在两个可访问的实例中分别创建不同的试剂记录，刷新页面后确认各自只显示自己的数据。停止再启动其中一个实例，确认记录保留。

记录两个实例的当前版本，然后只升级其中一个至模板的另一个已发布版本。等待部署完成，确认：

- 被升级实例运行目标版本，原有业务记录仍存在。
- 另一个实例的版本和数据没有变化。
- 未获得成员授权的用户不能通过直接地址进入应用。

这两个演示版本用于观察版本选择与实例隔离，不保证存在可见的业务界面差异。

实现入口见固定版本的[配置脚本](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/configure-local.mjs)、[模板构建脚本](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/build-templates.mjs)和[演示初始化](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/scripts/prepare-demo.mjs)。准备开发自己的子应用时，继续阅读[应用开发](development.md)。
