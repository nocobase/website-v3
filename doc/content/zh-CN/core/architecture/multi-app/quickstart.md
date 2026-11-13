---
title: 快速开始
description: 创建多应用主应用和独立子应用，配置托管环境，发布第一个版本并进入应用实例。
---

先创建提供工作台和管理功能的主应用，再将一个独立开发的子应用打包并部署为托管实例。可以让 Agent 协助完成，也可以按手动步骤操作。

## 准备环境与商业包访问权限

准备 Node.js 24 或更高版本、pnpm 11.11.0，以及有权下载[多应用商业包](overview.md#使用前提)的账号。以下命令使用 Bash 等 POSIX shell；Windows 可使用 WSL。

在实际执行安装的机器上登录商业源，密码处使用账号的读取令牌：

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-app@beta version \
  --@nocobase:registry=https://pkg-v3.nocobase.com/
```

确认模板版本查询成功后再创建项目。读取令牌仅保存在用户的 npm 配置中，不写入项目或对话。认证或下载失败时，见文末[常见问题](#常见问题)。

## 安排项目目录

以下示例把主应用和子应用放在 `demo` 目录中，便于跟随操作：

| 项目目录 | 用途 |
| --- | --- |
| `demo/platform/` | 主应用，提供工作台和应用管理 |
| `demo/customer-demo/` | 子应用，提供客户业务页面 |

目录结构仅供示例。主应用和子应用是独立项目，可以放在不同位置、使用独立的 Git 仓库。部署时只需子应用的构建归档，无需将其源码放入主应用。

## 使用 Agent 创建多应用环境

在 Agent 实际运行的机器和用户环境中完成商业源登录。远程 Agent 不会自动获得本机的登录信息。

安装创建应用的 Skill，按提示选择使用的 Agent，然后重新打开 Agent 会话：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

### 创建并启动主应用

在示例的 `demo` 目录开启 Agent 会话，提出创建主应用的需求：

```prompt
请创建一个 NocoBase 3 多应用平台，项目目录为 platform。
开始前，请与我确认数据库配置、访问地址和部署环境，再配置管理员账号及托管子应用所需的运行环境。完成后启动平台，并提供访问地址和登录说明。
```

完成后，你将得到一个已启动的多应用平台，以及访问地址和管理员登录说明。登录后可以使用工作台和应用管理页面，托管子应用所需的运行环境也已配置好，可以继续创建和部署子应用。

### 创建子应用

在示例的 `demo` 目录开启 Agent 会话，提出创建子应用的需求：

```prompt
请创建一个独立的 NocoBase 3 客户管理应用，项目目录为 customer-demo，后续由多应用平台托管。
需要支持新增、编辑、查询和删除客户，记录客户名称、联系人、联系电话和跟进备注。
开始前，请与我确认数据库配置，以及是否使用主应用统一登录。
```

Agent 完成后，子应用代码保存在 `customer-demo` 目录中，尚未部署到主应用。接下来需要将子应用构建为部署包，再通过主应用上传、发布并创建实例。

### 构建子应用并创建第一个实例

在子应用目录继续：

```prompt
帮我把这个客户管理应用构建为多应用平台可以上传的部署包。先确认目标运行环境，完成后告诉我归档路径和应用版本。
```

取得 `storage/exports/dist.tar.gz` 后，在主应用中[上传、发布并创建实例](#构建子应用并在管理界面创建实例)。Agent 已完成的创建、配置和构建操作，不需要再按下面的手动步骤重复执行。

部署成功并授予当前用户访问资格后，子应用会显示在主应用工作台中。点击应用卡片，即可从主应用进入子应用。

![在主应用工作台中查看并进入子应用](/assets/core/multi-app/zh-CN/workbench.png)

## 手动创建多应用环境

### 创建主应用

在示例的 `demo` 目录执行，`platform` 必须是新目录或空目录：

```bash
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
  pnpm create @nocobase/app@beta platform \
  --template multi-app --template-tag beta
cd platform
pnpm nocobase config init
```

`multi-app` 生成完整的主应用源码，不创建子应用。按初始化提示选择数据库并填写连接参数；非交互执行需要显式指定 `--dialect`。缺少驱动时，按提示安装后再初始化，详见[数据库配置](../../reference/database-configuration.md)。

### 配置并启动主应用

在首次启动前，检查 `config.yml` 中的 `users.initialAdmin`，设置管理员用户名、邮箱和独立密码。例如，在 Bash 中安全输入密码并写入配置：

```bash
read -r -s -p 'Initial administrator password: ' INITIAL_ADMIN_PASSWORD
printf '\n'
export INITIAL_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=INITIAL_ADMIN_PASSWORD
unset INITIAL_ADMIN_PASSWORD
```

妥善保护生成的配置和密钥，不提交到 Git。初始管理员只在用户表为空时创建，之后修改这段配置不会重置已有账号密码。

主应用默认不启用 Host。下面以同机本地体验为例，主应用使用 `13230` 端口，Host 使用 `13231`；确认端口未被占用后，在主应用根目录执行：

```bash
pnpm nocobase config set \
  server.host=127.0.0.1 \
  server.port=13230 \
  app.publicOrigin=http://127.0.0.1:13230 \
  releases.host.enabled=true \
  releases.host.host=127.0.0.1 \
  releases.host.port=13231 \
  releases.host.publicUrl=http://127.0.0.1:13230
pnpm nocobase config check
pnpm dev
```

打开终端打印的 `Local:` 地址；上述配置对应 `http://127.0.0.1:13230/main/`。使用刚配置的管理员登录。主应用保留 `/main` 路径，并将子应用路径转发给 Host，浏览器不直接访问 Host 内部端口。

若从另一台机器访问，应调整监听地址，并将 `app.publicOrigin` 和 `releases.host.publicUrl` 设为浏览器实际使用的 origin（协议、主机和端口，不含路径）。使用 SSO 的 HTTP 本地环境，还需配置[回调例外](environments.md#添加部署环境)。

### 创建部署环境

登录主应用，打开**部署环境（Deploy environments）**，选择**添加环境（Add environment）**：

1. 填写环境名称和标识，例如 `Local Host`、`local`。
2. 选择托管 Host 及适合部署归档的运行方式；同机体验可使用 **In process**。
3. 将公开地址规则设为浏览器可访问的地址，例如 `http://127.0.0.1:13230/{appId}/`，让每个实例拥有独立路径。
4. 按界面要求检查连接和配置，保存环境。

已有可用环境时可以直接使用，不必重复创建。启用 Host 只启动运行服务，不会自动生成这条部署环境记录。

![部署环境列表展示运行方式、公开地址规则和 Host 状态](/assets/core/multi-app/zh-CN/environments.png)

### 创建并配置子应用

保持主应用运行，打开另一个终端，在示例的 `demo` 目录执行：

```bash
pnpm create @nocobase/app@beta customer-demo \
  --template default --template-tag beta
cd customer-demo
pnpm nocobase config init
pnpm nocobase config check
```

主应用和子应用不共享业务表；使用同一数据库服务时，也要分配独立数据库或隔离空间。

普通 Default 应用不会自动接入主应用的 SSO。保留本地登录时，可以直接构建默认首页来体验托管流程；需要统一登录和应用切换时，先完成[子应用 SSO 集成](templates.md#准备子应用部署包)。

业务功能在子应用项目中开发。可以按实际需要创建客户管理或其他业务页面，完成后再构建并部署。

### 构建子应用并在管理界面创建实例

在子应用根目录执行：

```bash
pnpm build --tar
```

构建成功后取得 `storage/exports/dist.tar.gz`。目标操作系统、CPU 架构、libc 和 Node.js 版本须与 Host 兼容；不同机器间交付时按[构建部署包](../../tutorials/deploy-with-app-installer.md#构建部署包)指定目标。不要将本地数据库、上传文件、密钥和实例专属配置放进归档。

保持主应用运行，在管理页面完成以下操作：

1. 打开**应用模板（Templates）**，创建模板，例如 `Customer management`，选择已准备的部署环境。
2. 在模板操作中上传 `dist.tar.gz`，核对应用包名和版本，然后发布版本。
3. 在模板的**已发布版本（Published versions）**中，选择目标版本的**用此版本创建（Create with this version）**。
4. 填写实例名称和唯一标识，例如 `Customer demo`、`customer-demo`，确认版本和环境后提交。
5. 如需审批，完成审批后等待部署操作结束。在实例详情中确认实际版本、运行状态和访问地址。

实例标识不要使用主应用已占用的 `main`。上传只保存制品，发布才使版本可供创建实例，创建实例才会部署运行；三者是不同操作。

![模板已发布版本列表，可选择一个版本创建实例](/assets/core/multi-app/zh-CN/template-versions.png)

## 检查实例运行状态

在实例详情中确认运行状态正常，再打开实际访问地址。

- **使用本地登录**：有实例配置权限的管理员可以查看初始管理员凭据，用它登录子应用并修改初始密码。
- **使用平台 SSO**：先在实例的**访问授权（Access）**中为用户授予成员资格，再从工作台进入，验证登录、业务权限和[应用切换](management.md#从工作台进入与切换应用)。主应用管理员也不会自动获得子应用成员资格。

确认首页可见、预期功能可用。Default 首页与自定义客户页面都可以用来验证托管流程，不需要在子应用源码目录同时运行开发服务器。

![客户实例详情展示已部署版本、运行状态和应用入口](/assets/core/multi-app/zh-CN/instance-details.png)


## 常见问题

| 现象 | 处理 |
| --- | --- |
| 商业包返回 401、403 或查询不到版本 | `401` 先检查登录状态；`403` 或找不到包时，检查下载权限、包名和版本。`NOCOBASE_REGISTRY` 仅指定创建器下载模板的源，不能替代认证 |
| 第三方依赖或创建器下载失败 | 商业源仅配置到 `@nocobase` scope，其他依赖使用公共 npm 源或你的镜像。外层 pnpm 下载创建器所用的源不受 `NOCOBASE_REGISTRY` 控制 |
| pnpm 拒绝安装刚发布的包 | 确认版本可信后，可为本次创建命令设置 `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` |
| 主应用可访问，但没有可用部署环境 | 检查 Host 配置与启动日志，并在页面创建和检查部署环境 |
| 上传或部署失败 | 检查归档目标平台和操作记录，不要反复创建同名实例 |
| 工作台没有子应用 | 检查实例是否运行、入口是否启用，以及当前用户的成员资格 |
| SSO 子应用可以登录，但没有切换器 | 检查布局是否渲染 `AppSwitcher`，并确认实例已升级到包含该组件的版本 |

## 下一步

继续[管理托管子应用](management.md)，了解更新版本、启停、配置和失败处理。
