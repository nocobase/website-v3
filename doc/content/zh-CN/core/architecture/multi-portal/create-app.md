---
title: 创建多门户应用
metaDescription: 登录商业包源，创建、配置并启动多门户应用。
---

创建并启动一个多门户应用，为后续业务门户提供运行环境。模板已经接好多门户插件、工作台和门户管理，但不包含预装的业务门户或示例数据。

## 准备环境与商业包访问权限

准备 Node.js 24 或更高版本、pnpm 11，以及有权下载多门户商业包的账号。下列命令适用于 Bash 等 POSIX shell；Windows 可使用 WSL。

先在自己的终端登录私有 npm 源。已有有效登录时无需重复登录：

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-template-multi-portal@beta version --registry=https://pkg-v3.nocobase.com/
```

按登录提示提供账号信息，密码处使用商业源的读取令牌。令牌由 npm 用户配置保存，不要写入项目文件或提交到 Git。`whoami` 成功后还要确认包版本查询成功；账号登录成功并不代表拥有该包的下载权限。

多门户模板、管理插件和门户生成器都来自商业源。普通第三方依赖仍从公共 npm 源或你配置的镜像下载，不要把默认 registry 整体改成商业源。

## 使用 Agent 创建应用

先在 Agent 实际执行命令的机器和用户环境中完成上面的商业源登录。若 Agent 运行在远程机器，本机的 npm 登录不会自动传过去。不要把读取令牌粘贴到对话中。

安装全局 `nocobase-create-app` Skill，并按提示选择你使用的 Agent：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

重新打开 Agent 会话，让新 Skill 生效。在准备存放项目的父目录打开 Agent，提供项目名称、目录、数据库和访问方式；尚未确定的配置可以先与 Agent 确认。例如：

```prompt
帮我创建一个本地开发用的 NocoBase 3 多门户应用，项目放在 my-portals 目录。
先和我确认数据库和访问方式，启动后告诉我访问地址和首次登录账号。
```

创建 Skill 支持商业多门户模板，会检查包访问权限，使用 `multi-portal` 模板创建项目，再完成依赖安装、配置和启动。创建完成后，检查交付的项目目录和访问地址，并登录确认能看到管理员工作台与门户管理。新应用的门户列表为空是正常状态；读到“创建成功”不等于已经完成登录验证。

后续在生成的应用目录中继续开发，Agent 应读取该应用的 `AGENTS.md`、`.agents/rules/multi-portal.md` 和项目 Skills。若当前会话没有加载新项目指引，在应用目录重新打开会话，再进入[开发业务门户](develop.md#创建第一个门户)。

下面的手动步骤是另一种创建方式；Agent 已完成创建、配置和启动时，不需要再执行一遍。

## 手动创建应用

### 创建应用

在项目的父目录执行，`my-portals` 必须是新目录或空目录：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \
NOCOBASE_REGISTRY=https://pkg-v3.nocobase.com/ \
npm_config_registry=https://registry.npmjs.org \
pnpm create @nocobase/app@beta my-portals \
  --template=multi-portal --template-tag=beta
cd my-portals
```

`multi-portal` 对应 `@nocobase/app-template-multi-portal`。创建器会生成源码、安装依赖，并同步项目的开发 Skills。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 仅让本次命令可以安装刚发布的 beta 包。使用公共镜像时，可替换上面的公共 registry 地址。

创建器 `0.1.0-beta.36` 起支持商业源和第三方依赖源分开安装。项目 `.npmrc` 保存 `@nocobase:registry` 地址，认证信息仍由用户配置提供。后续开发以项目的 `AGENTS.md`、`.agents/rules/multi-portal.md` 和同步的 Skills 为准。

### 配置数据库与访问地址

在应用根目录初始化配置：

```bash
pnpm nocobase config init
```

按提示选择数据库并填写连接参数；非交互环境需要显式传入 `--dialect`。驱动缺失时，先按命令提示安装对应驱动，再重新初始化。各数据库的完整配置见[使用不同数据库创建应用](../../reference/database-configuration.md)。初始化会生成 `config.yml` 和应用密钥，不要把整个配置文件替换成文档片段。

如果通过局域网、域名或代理访问，将 `app.publicOrigin` 设为浏览器实际使用的协议、主机和端口，不带 `/main` 等路径。例如，先将以下占位值替换为机器实际的局域网 IP 和应用端口：

```bash
pnpm nocobase config set 'app.publicOrigin=http://<LAN_IP>:<PORT>'
pnpm nocobase config check
```

配置检查通过后再启动。数据库连接或原生驱动是否真正可用，还要以应用成功启动和完成初始化为准。

### 启动应用

```bash
pnpm dev
```

打开终端打印的 `Local:` 地址，包含应用基础路径。需要局域网访问时，使用 `APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=<PORT> pnpm dev`，端口应与前面配置的访问地址一致。若应用因端口占用选择了其他端口，应同步修正 `app.publicOrigin` 后重新启动。

使用 `users.initialAdmin` 配置的初始管理员登录；未修改默认值时为用户名 `nocobase`、密码 `admin123`，首次登录后应更改密码。

登录后可以看到管理员工作台和 **系统设置 → 门户管理**。新应用尚未生成业务门户，列表为空是正常状态。

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 商业包返回 401、403 或查询不到版本 | 检查登录是否过期、账号是否有包权限，以及所选版本是否可用 |
| 第三方包从商业源下载并返回 404 | 检查默认 registry；商业源只配置到 `@nocobase` scope，修正后在现有应用中执行 `pnpm install` |
| 使用局域网地址无法登录 | 检查 `app.publicOrigin` 是否与浏览器实际使用的 origin 一致 |

## 下一步

继续[开发业务门户](develop.md#创建第一个门户)，生成、安装并扩展第一个门户。
