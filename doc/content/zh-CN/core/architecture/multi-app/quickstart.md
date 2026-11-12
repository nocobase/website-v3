---
title: 快速开始
description: 创建多应用项目，启动主应用和一个托管子应用，并从工作台进入子应用。
---

## 准备环境与商业包访问权限

准备 Node.js 24 或更新版本、pnpm 11.11.0，以及[多应用商业插件](overview.md#使用前提)的许可和下载权限。要体验平台统一登录，还需要一个由可信证书保护的 HTTPS 域名。

> [!NOTE]
> 以下创建命令需要安装源中已发布支持 `multi-app` 的 create-app、`@nocobase/app-template-multi-app` 和兼容商业插件。使用前请确认所用版本支持此模板。

在终端中登录获授权的包源；已经登录且权限有效时可跳过：

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
```

按提示输入凭据，不将下载令牌写入源码或命令参数。

## 创建多应用项目

```bash
pnpm create @nocobase/app platform --template=multi-app --registry=https://pkg-v3.nocobase.com/
cd platform
```

创建完成后，项目根目录是 Main，`apps/sub/` 是附带试剂管理示例的子应用。依赖在根目录安装一次，各应用的开发 Skills 随安装同步。此时已有源码和依赖，还没有运行配置或托管实例。

如果依赖安装失败，修复包源权限或版本问题后，在已经生成的项目根目录继续运行：

```bash
pnpm install
pnpm skills:sync
```

## 配置应用与 HTTPS 入口

将示例地址 `https://platform.example.com` 替换为自己的 HTTPS 域名。反向代理需要把 Main 和子应用路径转发到 Main 的 `127.0.0.1:13230`，支持 WebSocket，并保留公网 Host 与 HTTPS 转发信息。Host 使用的 `127.0.0.1:13231` 是内部控制端口，不对外开放。

统一登录的 Web 回调要求可信 HTTPS 和非回环主机名，不能使用 `localhost`。以下配置命令不创建 DNS、证书或反向代理；应先完成这些准备。仅开发本地业务而不使用 SSO 时，可改用[本地开发环境](development.md#配置并启动本地开发环境)。

在项目根目录运行：

```bash
pnpm --dir=apps/sub nocobase config init
EXAMPLE_MODE=sso EXAMPLE_PUBLIC_ORIGIN=https://platform.example.com pnpm setup:local
```

示例使用 SQLite。若使用其他数据库，先为对应应用安装驱动，用匹配的 dialect 初始化配置并填写连接信息，再运行 Main 配置命令；已有数据库配置会保留。

分别打开根目录和 `apps/sub/` 的 `config.yml`，设置初始管理员的用户名、邮箱和唯一强密码。保留自动生成的 `secrets.keys`，每个应用使用自己的配置和密钥。管理员账号创建后，修改初始管理员配置不会重置其密码。

```bash
pnpm nocobase config check
pnpm --dir=apps/sub nocobase config check
```

两次配置检查都通过后继续。确认 `13230` 和 `13231` 未被其他进程占用。

## 构建应用并创建第一个实例

在根目录分别构建子应用和 Main：

```bash
pnpm --dir=apps/sub build --tar
pnpm build --tar
```

等待两个命令完整成功。Main 归档位于 `storage/exports/dist.tar.gz`，子应用归档位于 `apps/sub/storage/exports/dist.tar.gz`。

首次体验可用模板提供的初始化命令发布子应用归档并创建一个实例。先在根目录生成计划，版本取自子应用的实际包信息：

```bash
node --input-type=module <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile('apps/sub/package.json', 'utf8'));
const plan = {
  artifacts: [{ version, path: './apps/sub/storage/exports/dist.tar.gz' }],
  instances: [{ id: 'reagents-demo', name: 'Reagent management demo', version }]
};
await writeFile('demo-plan.json', JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
NODE

pnpm demo --initialize --plan "$PWD/demo-plan.json"
```

如果 `demo-plan.json` 已存在，先检查已有内容，不覆盖原计划。计划中的版本必须与归档一致，归档路径相对于计划文件。

命令启动 Main，发布计划中的制品、创建缺少的实例，并为配置的无限制管理员授予新建示例实例的访问资格。完成后进程继续运行。已有实例不会被重置或自动升级。

如果初始化中断，先在应用管理页面检查已有实例和操作结果，再决定如何继续；重复运行计划会跳过已有实例，不一定补齐中断后的授权。处理方法见[处理失败或未完成的操作](management.md#处理失败或未完成的操作)。

## 授权用户并进入子应用

打开自己的 HTTPS 地址并加上 Main 路径，例如 `https://platform.example.com/main/`，使用配置的管理员登录。

1. 在**应用模板**中确认子应用版本已发布。
2. 在**应用实例**中确认 `Reagent management demo` 已完成部署并可运行。
3. 从工作台打开该应用，浏览器完成平台登录后进入试剂管理页面。
4. 在平台准备一个普通用户，在该实例的**访问授权**中明确授予访问资格，再用该用户从工作台进入。

用户能进入子应用后，还需要由子应用的业务角色决定能查看或修改哪些内容。具体规则见[统一登录与访问授权](single-sign-on.md)。

## 再次启动

结束本次运行后，保留原配置、数据和构建输出，下次在项目根目录运行：

```bash
pnpm demo
```

普通启动不会再次发布制品或创建实例。实例若已在管理页面被明确停止，需要在页面中启动它。

继续开发业务功能，见[应用开发](development.md)；准备部署到服务器，见[部署与运维](deployment.md)。
