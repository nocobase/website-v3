---
title: 快速开始
metaDescription: 创建多门户应用，生成第一个门户，安装后从我的门户进入。
---

创建一个多门户应用，再生成一个库存门户，安装后从 **我的门户** 进入。完成后，你会得到一个拥有自己 Logo、侧栏和首页的门户，后续开发都在它的基础上进行。

## 准备环境与商业包访问权限

准备 Node.js 24 或更高版本、pnpm 11，以及有权下载企业版商业包的账号。下列命令适用于 Bash 等 POSIX shell；Windows 可使用 WSL。

多门户属于企业版，应用模板、多门户插件和门户生成器都来自商业源。先按[配置商业包的授权源](../../developing-apps/overview.md#配置商业包的授权源)完成配置，再确认当前账号可以查询企业版模板：

```bash
npm view @nocobase/app-template-enterprise@beta version --registry=https://pkg-v3.nocobase.com/
```

使用 Agent 时，要在 Agent 实际执行命令的机器和用户环境中完成配置。Agent 运行在远程机器时，本机的 npm 配置不会自动传过去。不要把读取令牌粘贴到对话中。

## 创建多门户应用

下面两种方式任选一种。

### 使用 Agent 创建

安装全局 `nocobase-create-app` Skill，并按提示选择你使用的 Agent：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

重新打开 Agent 会话，让新 Skill 生效。在准备存放项目的父目录打开 Agent，输入：

```prompt
帮我创建一个本地开发用的 NocoBase 3 多门户应用，项目放在 my-portals 目录。
先和我确认数据库和访问方式，启动后告诉我访问地址和首次登录账号。
```

Agent 会检查商业包访问权限，用多门户模板创建项目，再完成依赖安装、配置和启动。完成后，用它给出的地址和账号登录，确认能看到 **我的门户** 和 **系统设置 → 门户管理**。

### 手动创建

在项目的父目录执行，`my-portals` 必须是新目录或空目录：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta my-portals \
  --template=multi-portal --template-tag=beta
cd my-portals
```

`--template=multi-portal` 会创建企业版应用并启用多门户。创建器会生成源码、安装依赖，并同步依赖提供的开发 Skills。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 仅让本次命令可以安装刚发布的 beta 包；使用公共镜像时，可替换上面的公共 registry 地址。

初始化配置，按提示选择数据库并填写连接参数：

```bash
pnpm nocobase config init
pnpm nocobase config check
```

非交互环境需要显式传入 `--dialect`；各数据库的配置见[使用不同数据库创建应用](../../developing-apps/database-configuration.md)。通过局域网、域名或代理访问时，先用 `pnpm nocobase config set 'app.publicOrigin=http://<LAN_IP>:<PORT>'` 设置浏览器实际使用的地址，不带 `/main` 等路径。

启动应用：

```bash
pnpm dev
```

打开终端打印的 `Local:` 地址，使用初始管理员登录。未修改 `users.initialAdmin` 时，用户名为 `nocobase`，密码为 `admin123`，首次登录后应更改密码。

登录后能看到 **我的门户** 和 **系统设置 → 门户管理**。新应用还没有门户，两处列表都为空。

## 生成第一个门户

在应用根目录操作。下面两种方式任选一种，不要重复生成同名门户。

使用 Agent 时，在应用根目录打开开发 Agent，输入：

```prompt
在当前应用里新增一个库存门户，英文名 Inventory，中文名“库存”，
说明是“管理物料和库存”，图标用仓库，先只做能进入的首页。
```

使用命令时，执行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta inventory \
  --title 'en-US=Inventory' --title 'zh-CN=库存' \
  --description 'en-US=Manage materials and stock' \
  --description 'zh-CN=管理物料和库存' \
  --icon Warehouse
```

生成器会在应用中新增 `packages/app-portal-inventory/`，安装依赖，并把门户注册到应用的 Client 和 Server。门户的名称、说明和图标写在这个包的 `package.json` 中，之后可以直接修改。生成器不会启动服务或修改数据库，也不会创建业务表。

门户地址为 `/portals/inventory`。在命令末尾加上 `--dry-run --json` 可以先预览生成结果，不写入文件；其他参数见 `pnpm create @nocobase/portal@beta --help`。

依赖安装失败时，保留已生成的源码，按命令输出的恢复步骤处理，不要在已有目录上重复运行生成器。

## 安装并进入门户

重启应用，让它加载新注册的门户：

```bash
pnpm dev
```

新生成的门户默认未安装。用管理员账号打开 **系统设置 → 门户管理**，找到 **Inventory**，在行末的 **…** 菜单中选择 **安装**。安装会执行门户的数据库任务并启动门户；状态变为 **已安装** 后，从同一菜单选择 **进入**。

也可以打开 **我的门户**，点击 **Inventory** 卡片进入。

进入后，你看到的是门户自己的界面，而不是应用的侧栏和头部：

- 门户有自己的 Logo；通过门户切换器可以切换到其他门户或返回我的门户。
- 左侧是门户的菜单，目前只有 **Overview**。
- 头部按钮与应用一致，最右侧是头像菜单。

刷新页面后仍能进入，就完成了快速开始。旧地址 `/workbench` 会自动跳转到我的门户。

## 下一步

- 给门户添加页面和导航，见[页面与导航](develop/pages-and-navigation.md)；调整 Logo、导航和头部按钮，见[门户布局](develop/layout.md)。
- 保存和读取业务数据，见[数据与接口](develop/data-and-apis.md)。
- 让其他成员访问门户，见[门户权限](access.md)。
- 卸载、重试或随应用升级门户，见[管理门户](manage.md)。
