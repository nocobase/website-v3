---
title: 快速开始
---

## 开始前的准备

准备 Node.js 24+、兼容模板要求的 pnpm，以及主应用和子应用模板的下载权限。下列命令需要下载源中已经发布兼容版本；若模板尚未提供，请先取得可用版本，不要将工作区源码路径当作 npm 包名。

配置商业包的授权源，将 `<read-token>` 替换为你的下载令牌：

```bash
npm config set "@nocobase:registry" "https://pkg-v3.nocobase.com/"
npm config set "//pkg-v3.nocobase.com/:_authToken" "<read-token>"
npm whoami --registry=https://pkg-v3.nocobase.com/
```

这些命令写入用户级 `~/.npmrc`，npm 和 pnpm 都会读取。不要将令牌写入项目文件。

选择一台用于体验的机器，预留主应用 `13230`、运行节点 `13231` 和子应用本地开发 `13240` 端口。示例使用 SQLite，不需要单独安装数据库；它是体验配置，其他数据库可按实际需要选择。

下面的 `192.168.1.10` 是示例局域网 IP，请全部替换为你的机器地址。此流程仅用于受控内网 HTTP 体验；面向公网部署时，先完成[HTTPS 配置](nodes.md#配置-https-与反向代理)。

## 第一步：创建并启动主应用

在准备存放项目的目录执行：

```bash
pnpm create @nocobase/app platform --template multi-app
cd platform
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.host=0.0.0.0 server.port=13230 app.publicOrigin=http://192.168.1.10:13230
```

首次启动前，设置独立的初始管理员密码。`config init` 生成配置，不会交互询问该密码。以下 Bash 命令隐藏输入，并避免将密码写入命令历史。请安全保存密码，默认用户名为 `nocobase`；同时保留生成的密钥及主应用数据库。

```bash
read -r -s -p "Main administrator password: " MAIN_ADMIN_PASSWORD
printf '\n'
export MAIN_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=MAIN_ADMIN_PASSWORD
unset MAIN_ADMIN_PASSWORD
```

编辑生成的 `config.yml`，合并以下配置。已有 `sso` 段时修改该段，不要创建重复的 YAML 键：

```yaml
sso:
  insecureRedirectOrigins:
    - http://192.168.1.10:13230
```

这个例外允许该受控 HTTP origin 下的子应用登录回调，配置在主应用。然后检查并启动：

开发服务器单独选择监听端口，因此启动时还要显式传入 `APP_SERVER_PORT`。确认终端打印的地址与 `app.publicOrigin` 一致；端口被占用时先释放该端口。

```bash
pnpm nocobase config check
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13230 pnpm dev
```

打开 `http://192.168.1.10:13230/main/`，使用初始管理员登录。进入**系统设置 → 部署管理 → 运行节点**，确认默认 `local` 节点可用。主应用会自动启动它，不需要在页面中添加节点。

如果节点不可用，先检查 `13231` 是否被占用、节点目录是否可写以及主应用日志。浏览器访问主应用端口，不访问节点内部端口。

![创建第一个实例前，确认 local 运行节点已就绪。](/assets/core/multi-app/hd-runtime-nodes.png)

## 第二步：创建子应用

保持主应用运行，在另一个终端中回到项目的父目录：

```bash
pnpm create @nocobase/app child-app --template sub-app
cd child-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.host=0.0.0.0 server.port=13240 app.publicOrigin=http://192.168.1.10:13240
```

启动前，为子应用的本地管理员设置另一个密码。以下仍使用 Bash 隐藏输入；该账号与稍后部署时生成的实例管理员相互独立。

```bash
read -r -s -p "Child administrator password: " CHILD_ADMIN_PASSWORD
printf '\n'
export CHILD_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=CHILD_ADMIN_PASSWORD
unset CHILD_ADMIN_PASSWORD
pnpm nocobase config check
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13240 pnpm dev
```

打开子应用终端打印的应用入口，用子应用自己的初始管理员登录，确认首页正常。子应用模板已集成项目部署 CLI、平台登录与应用切换；本地尚未配置平台登录时使用本地账号。

主应用与子应用的数据库和配置相互独立。确认本地应用正常后，可以停止子应用开发进程；后续部署的实例不依赖它。

![子应用项目在本地独立运行，使用自己的管理员账号登录。](/assets/core/multi-app/hd-child-local-home.png)

## 第三步：配置子应用的部署管理

以下命令均在 `child-app` 根目录执行：

```bash
pnpm nocobase deploy init --server http://192.168.1.10:13230/main --instance dev --id quickstart-child --node local
pnpm nocobase deploy auth
pnpm nocobase deploy validate
pnpm nocobase deploy doctor
```

`init` 生成 `deploy.yml`。`dev` 是配置中的实例键，`quickstart-child` 是主应用中的实例标识，`local` 是运行节点标识。主应用地址要包含 `/main`。

`auth` 发起浏览器授权：使用具有部署权限的平台账号登录，核对主应用和授权请求后批准，再返回终端确认成功。此授权用于项目部署，不是子应用用户的统一登录。

默认配置为新实例生成管理员，并启用平台 SSO。检查 `deploy.yml` 的目标地址、实例标识和节点，再继续。

![批准项目 CLI 授权后，返回终端继续部署。](/assets/core/multi-app/hd-cli-authorization.png)

## 第四步：构建并部署子应用

构建并上传当前代码：

```bash
pnpm nocobase deploy artifact upload --build --yes
pnpm nocobase deploy instance plan dev --action create
```

上传会发布应用版本，首次上传还会创建应用包。构建目标需要与节点兼容；出现平台不匹配时，按 CLI 给出的命令重新构建。

检查计划中的版本、节点、实例标识和配置。没有阻塞项后，将输出的 `planId` 替换到下面命令：

```bash
pnpm nocobase deploy instance create dev --plan <planId> --yes --wait
pnpm nocobase deploy instance status dev
```

若节点要求审批，操作会停在等待审批状态，由另一位有权限的管理员在主应用审批。等待部署完成后，在**应用实例**确认 `quickstart-child` 运行中，并核对实际版本和访问地址。

![部署完成的实例处于运行中状态，并已启用平台 SSO。](/assets/core/multi-app/hd-instance-overview.png)

## 第五步：进入子应用，验证登录与业务权限

在实例详情的初始管理员提示中选择**查看并保存**，将凭据保存到安全位置，再确认已保存。确认后主应用不再保留该密码，CLI 也不能读取它。

![确认前先安全保存生成的管理员凭据，截图中的密码保持隐藏。](/assets/core/multi-app/hd-save-initial-admin.png)

从工作台或实例详情选择**打开应用**。此示例的地址是 `http://192.168.1.10:13230/quickstart-child/`。确认以下结果：

1. 已登录的平台用户可以进入子应用首页，不必再次输入子应用密码。
2. 打开应用切换器，确认可以返回主应用；存在其他可访问应用时，再验证切换。
3. 使用普通平台用户检查业务页面和操作权限。成功登录不应让用户自动获得子应用管理权限。
4. 访问子应用的 `/login?auth=local`，确认保存的本地管理员仍可用于维护，再在子应用中配置需要的业务角色。

![打开应用切换器，可以返回平台工作台。](/assets/core/multi-app/hd-application-switcher.png)

如果出现 `SSO_REDIRECT_NOT_ALLOWED`，检查第一步的 HTTP origin 是否与实际访问地址完全一致；修改主应用配置后重启，再根据原部署记录重试。其他登录问题见[统一登录与业务权限](single-sign-on.md)。

接下来可按[开发与部署子应用](development.md)发布新版本、同步配置并接入 CI。
