---
title: 部署到 Studio
description: 把应用部署包上传到已有 Studio，设置变量、发布版本并验证数据。
---

本文以任务应用为例说明部署流程，也适用于自己的 NocoBase Core 应用。先按[选择部署方式](../deployment/choose-a-deployment-method.md)确认目标环境；部署自己的项目时，替换示例中的应用名称、路径和业务验收项。

这一篇把任务应用部署到一个已有的 NocoBase Studio，由 Studio 管理版本、运行环境、配置和应用的启停。开发机负责构建，Studio 接收构建后的发布包。

部署前确认应用已通过测试；任务示例的测试步骤见[搭建第一个应用](build-your-first-feature.md)。准备一个可以登录的 Studio，以及创建应用、上传、配置和部署的权限。本篇选择接受压缩包的 Linux x64、Node.js 24 环境，为教程创建独立应用和新数据库。

## 使用 Agent

在任务应用源码目录提出部署要求。先替换 Studio 地址、应用名称和环境；如果示例标识已经存在，请换一个新标识：

```text
请在下面的 Studio 中新建一个独立的教程应用，并部署当前任务应用。

Studio 地址：<完整地址，包含路径>
新应用标识：tasks-tutorial
显示名称：Tasks tutorial
部署环境：<我指定的环境名称或标识>
使用新数据库，不导入开发数据，也不添加示例任务。

请按项目的 Studio 部署指引执行，先核对登录账号、目标环境和新应用，避免修改已有应用。
准备并发布应用版本，设置管理员登录信息，保留 Studio 为它生成的密钥。
需要我在浏览器登录或提供凭据时，告诉我在哪里完成，不把密码写进报告。

部署后实际检查登录、任务操作和只读权限。
只重启这个新应用，确认之前创建的任务仍然保留。
完成后告诉我实际访问地址、验证结果和未完成事项。
```

如果本机还没有 `nb-studio`，从目标 Studio 的 **Use Studio in your agent** 入口获取安装命令，按提示安装，再运行 `nb-studio skills install`。CLI 使用 Node.js 24 或更新版本；安装命令中的下载凭据与登录凭据是两回事。

本机 CLI 未登录时，执行下面的命令，并由你在浏览器确认设备码：

```bash
nb-studio --profile tutorial login --server https://studio.example.com/main
nb-studio --profile tutorial whoami
```

已登录正确实例时直接复用。Studio 内运行的 Agent 使用其现有身份与权限。

让 Agent 按 Studio 自带的指引选择当前实例支持的发布方式。没有关联仓库的本地示例需要使用页面上传，具体步骤见下文；你不必在提示词里列出 CLI 命令。

## 不使用 Agent

### 1. 选择环境并创建应用

进入 Studio 的 **发布 → 部署环境**，确认目标环境接受应用压缩包，核对运行平台、访问地址规则和部署是否需要审批。环境名称由你的 Studio 决定；本次演练使用已有的“预览”环境，不代表正式应用也应该放在那里。

进入 **发布 → 应用**，创建独立教程应用，填写名称、唯一应用 ID 和环境。ID 例如 `tasks-tutorial`，实际访问路径以环境生成的结果为准。

这一操作创建的是 Studio 中的部署目标。开发机上的应用源码目录可以有不同名称，不需要在 Studio 服务器重新执行 create app。

### 2. 在开发机构建并上传

按目标环境构建。在本篇的 Linux x64、Node.js 24 环境中执行：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

在 Studio 中打开刚创建的应用，进入 **部署 → 上传版本**，选择开发机上的 `storage/exports/dist.tar.gz`。

![Studio 上传版本弹窗，已选择 dist.tar.gz，提交字段可选](/assets/core/tutorials/deployment/studio-upload.png)

“提交”可以填写构建对应的真实 Git 提交；没有对应提交时留空。上传成功后，版本列表会显示版本号、制品类型、校验摘要和大小。此时还没有部署运行。

### 3. 配置应用变量

进入应用的 **变量** 页。Studio 会根据刚上传版本声明的变量显示来源、是否必填、是否为密钥，以及是否仅首次启动生效。

首次部署至少检查：

| 变量 | 本教程的选择 |
| --- | --- |
| `INITIAL_ADMIN_USERNAME` | 确认新应用的初始管理员用户名 |
| `INITIAL_ADMIN_PASSWORD` | 首次启动前设置自己的密码，以 Secret 保存 |
| `APP_SAMPLE_DATA` | 设置为 `false`，不加载演示数据 |
| `DB_DIALECT` 及连接变量 | 本篇使用新的 SQLite 数据库；外部数据库填写实际连接信息 |
| `APP_PUBLIC_ORIGIN` | 核对 Studio 生成的外部 origin，不包含应用路径 |
| `SECRETS_KEYS` | 保留 Studio 生成的值，后续重启与更新继续使用 |

Studio 管理应用的运行路径、端口和持久化位置，不要直接套用独立服务器的 pm2 或 Compose 配置。变量标记“仅首次启动生效”意味着应用初始化后再修改它，不会重置已有用户或重新导入数据。

使用 CLI 配置时，先查询 `nb-studio docs app env set`。例如关闭这个应用的示例数据：

```bash
nb-studio --profile tutorial app env set tasks-tutorial APP_SAMPLE_DATA false
```

初始密码通过页面的 Secret 字段保存，或使用 CLI 支持的 `--from-env`，不要放进普通命令参数或文档。

### 4. 部署这个版本

回到 **部署** 页，点击目标版本右侧的 **部署**。等待“部署记录”中的状态变为“成功”，再查看应用运行状态和日志。若环境要求审批，先提交部署请求并等待有权限的人批准；上传完成或请求已提交都不代表部署成功。

![Studio 教程应用的版本与部署记录，部署状态为成功](/assets/core/tutorials/deployment/studio-release.png)

在未受保护的环境，也可以用已上传的 Release ID 发起部署：

```bash
nb-studio --profile tutorial app deploy tasks-tutorial \
  --release <release-id> --wait true --json

nb-studio --profile tutorial app get tasks-tutorial --json
```

Release ID 取自这个 Studio 中刚上传的版本，不是版本号。CLI 等待超时后先查看部署记录，确认状态再决定下一步，避免重复发起部署。

### 5. 打开应用并验证

从应用 **概览 → 访问地址** 打开实际应用。Studio 的管理地址与教程应用入口是两个地址，例如管理页面为 `/main/`，应用入口为 `/tasks-tutorial/`。

使用新应用自己的管理员账号登录。新数据库的任务列表为空是预期结果：发布包不携带开发机上的任务、团队用户和角色分配；当前入门示例的任务角色由必需种子初始化。

1. 新建任务，完成再恢复，刷新页面确认状态正确。
2. 按[搭建第一个应用](build-your-first-feature.md)中的权限说明创建普通只读成员，验证页面可访问且任务写入被拒绝。
3. 回到 Studio，点击这个应用的 **重启**，等待运行状态恢复。
4. 再次打开应用，确认重启前的同一条任务仍然存在。

只重启教程应用，无需重启 Studio 或其他应用。也可以执行 `nb-studio --profile tutorial app restart tasks-tutorial`。

## 已关联仓库时

如果 Studio 已关联源码仓库，并且构建对应的提交可以被验证，Agent 或 CI 可以通过 CLI 一次上传并部署：

```bash
nb-studio --profile tutorial deploy \
  --app tasks-tutorial \
  --repository owner/repo \
  --sha <full-source-commit> \
  --file storage/exports/dist.tar.gz \
  --json
```

这条命令适用于仓库构建流程。本篇实际验证的是页面上传本地包，再部署已有版本；不要为本地未提交的代码编造一个提交标识。

## 部署新版本

业务功能修改后，重新验证源码并构建部署包。在原应用的 **部署 → 上传版本** 中上传，再选择新版本部署到原运行环境；不用重新创建应用或初始化账号。

更新流程概览见[发布应用新版本](../deployment/publish-app-release.md)。发布前确认数据库和文件备份、迁移兼容性及恢复路径；发布后核对已有数据、角色和新功能。Studio 的版本切换不会自动撤销业务写入，也不能替代数据恢复。

与 Agent 一起执行时，明确提供原应用 ID、目标环境和新包路径，要求先检查迁移与备份，再按授权范围发布；继续使用上面的页面上传或已关联仓库的 CLI 流程。

本篇已在已有 Studio 中创建独立应用，完成页面上传、变量配置、部署、真实登录与任务权限测试，并验证应用重启后的数据保留。受保护环境审批、外部数据库迁移和跨版本回滚不在本次演练范围内。

本篇部署实操记录和截图来自此前的演练，不能视为当前 `1.0.0-beta.81` npm 示例已经重新完成部署验证。
