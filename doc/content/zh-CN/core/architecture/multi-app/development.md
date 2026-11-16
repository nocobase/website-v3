---
title: 开发与部署子应用
---

## 创建子应用项目

使用已取得下载权限的兼容模板：

```bash
pnpm create @nocobase/app@beta customer-app --template sub-app --template-tag beta
cd customer-app
pnpm nocobase config init
pnpm nocobase config check
```

`sub-app` 是独立业务项目，预装项目部署 CLI，并注册 Platform SSO。主应用不会替你生成业务代码。应用开发方法见[开发应用](../../developing-apps/overview.md)。

## 本地开发与登录

按[快速开始](quickstart.md#第二步创建子应用)配置独立数据库、访问地址和初始管理员，启动时显式传入开发端口，并核对终端打印的地址。本地管理员与部署后的实例管理员分别初始化；开发数据不会随构建归档部署。

```bash
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13240 pnpm dev
```

未配置平台凭据时，子应用使用本地登录。不要把某个已部署实例的 SSO 密钥复制进源码或本地示例配置来代替集成。

![子应用项目在本地独立运行，使用自己的管理员账号登录。](/assets/core/multi-app/hd-child-local-home.png)

## 初始化部署配置

在子应用根目录运行：

```bash
pnpm nocobase deploy init --server https://apps.example.com/main --instance dev --id customer-dev --node local
pnpm nocobase deploy validate
```

命令生成 `deploy.yml`。主应用地址包含其 base path；同一个文件中的实例使用同一主应用。`validate` 在本地检查部署配置及引用的配置文件，不连接主应用。

## 授权项目部署 CLI

```bash
pnpm nocobase deploy auth
pnpm nocobase deploy auth status
pnpm nocobase deploy doctor
```

在浏览器中使用有部署权限的平台账号确认授权。CLI 会按主应用保存会话；`auth logout` 移除当前主应用的本机会话。部署权限不等于子应用业务权限。

`doctor` 检查 Node.js、配置、主应用连接、授权、运行节点和已有归档。尚未构建的项目应先解决连接和授权问题，再构建并重新检查。

![批准项目 CLI 授权后，返回终端继续部署。](/assets/core/multi-app/hd-cli-authorization.png)

## 配置目标节点与应用实例

一个项目可以在 `deploy.yml` 中配置多个实例。以下是 SQLite 示例：

```yaml
version: 1
server: https://apps.example.com/main
build:
  platform: auto
instances:
  dev:
    id: customer-dev
    name: Customer Dev
    node: local
    database:
      dialect: sqlite
    access:
      platformSso: true
    admin: generated
    sampleData: false
    variables: {}
```

`dev` 是本地配置键；`id` 是主应用中的稳定实例标识，不能使用主应用占用的 `main`。`node` 可以写具体节点标识或 `auto`，后者使用与界面一致的节点推荐规则，仍须检查计划中的选择。

使用外部数据库时，填写该实例的独立数据库连接，将密码写为 `passwordEnv: CUSTOMER_DB_PASSWORD`，由运行 CLI 的进程提供对应环境变量。配置文件用 `config: ./deploy/dev.config.yml` 引用；秘密值用 `${env:NAME}`，变量用 `{ env: NAME }`，不要写明文。

`DB_*`、`INITIAL_ADMIN_*`、`PLATFORM_*` 及主应用写入的访问地址不能作为普通变量随意覆盖。完整字段以 `pnpm nocobase deploy schema` 为准。

## 构建并发布版本

```bash
pnpm nocobase deploy artifact upload --build --yes
pnpm nocobase deploy artifact list
```

CLI 构建、检查、上传并发布归档。应用包名取自项目 `package.json` 的 `name`，版本取自构建内容；首次上传自动创建应用包。发布前更新版本号，不可用同一版本覆盖旧内容。

`--build` 强制重新构建；省略它时可能使用已有归档，因此源码更新后不要依赖旧文件。`artifact upload --dev --build --yes` 发布带时间标识的开发版本，普通版本列表默认不显示它。

构建平台自动匹配目标节点；跨平台构建失败时，依据诊断选择兼容的构建机器或目标，不能靠修改归档元数据绕过检查。

## 预览部署计划与执行部署

```bash
pnpm nocobase deploy instance plan dev --action create
pnpm nocobase deploy instance create dev --plan <planId> --yes --wait
```

以第一条命令返回的 `planId` 替换占位符。计划只读，显示目标版本、节点、配置变化和阻塞项；执行前确认这些内容。计划绑定请求内容和实例版本状态，目标或输入变化后需要重新生成。

部署结束后执行 `instance status dev`，并在真实访问地址验证登录和业务功能。等待审批、请求结果未知或进程仍在启动都不等于部署成功。

![部署记录展示实例、版本、运行节点和已完成的操作。](/assets/core/multi-app/hd-deployment-detail.png)

## 更新版本与同步配置

发布新版本后，先预览升级：

```bash
pnpm nocobase deploy instance plan dev --version 0.0.2
```

确认数据库、文件和配置已备份后，再执行：

```bash
pnpm nocobase deploy instance upgrade dev --version 0.0.2 --plan <planId> --backup-acknowledged --yes --wait
```

将示例版本替换为实际发布版本。备份确认只是记录你的确认，不会创建备份；升级可能执行迁移，降级版本不能撤销已经执行的数据变更。

修改实例配置文件或 `variables` 后，用 `instance plan dev --action config` 预览，再以 `instance config dev --plan <planId> --backup-acknowledged --yes --wait` 应用。配置变更会重启实例。

CLI 比较上次应用的配置、本地配置和主应用现状。仅在主应用修改的值会保留；两边修改同一项时以 `CONFIG_DRIFT_CONFLICT` 停止。执行 `instance config dev --from-current` 取回当前配置作为基线，合并需要的本地修改后重新预览。该命令会写入本地配置文件，先保存自己的改动。

## 使用 Agent 与 CI 部署

Agent 可以读取项目内安装的 `nocobase-deploy-cli` Skill，用 `pnpm nocobase deploy commands --json` 查询当前命令。授权分成两步：

```bash
pnpm nocobase deploy auth --start --json
# 由用户打开返回地址并批准授权后，再继续
pnpm nocobase deploy auth --resume --json
```

CI 使用秘密存储注入 `NB_DEPLOY_API_KEY` 和 `NB_DEPLOY_SERVER`，后者必须与 `deploy.yml` 的主应用一致。API key 需要相应部署权限，不将其提交到仓库。自动化命令使用 `--json`，检查 `ok`、`error.code` 和退出码。

| 退出码 | 处理 |
| --- | --- |
| `0` | 命令完成，仍需按任务验证运行或业务结果 |
| `4` | 等待审批，交由有权限的人处理 |
| `5` | 计划存在阻塞项，尚未提交 |
| `6` | 结果未知，查询状态和原操作回执 |
| `7` | 计划已变化，重新预览 |

结果未知时先执行 `instance status dev --wait --json`。保留 `storage/deployment/` 下的操作回执，使用原参数重试以查询原操作，不删除锁或改参数来重复提交。备份确认、降级和删除数据需要人的明确决定，Agent 不应自行添加相应确认参数。
