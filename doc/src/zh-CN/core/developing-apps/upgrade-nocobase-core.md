---
title: 升级 NocoBase Core
description: 使用 Agent 或手动合并新模板，升级应用使用的 NocoBase Core，保留业务代码并验证数据与权限。
---

本文介绍如何升级当前应用使用的 NocoBase Core 及相关依赖。升级在应用源码项目中进行；完成验证后，再按照原来的方式[部署应用](../deployment/choose-a-deployment-method.md)。

## 升级会改变什么

通过 create-app 创建的项目，既包含 NocoBase 的包依赖，也包含复制到项目中的框架代码，例如应用入口、路由、布局、配置和测试工具。升级时需要合并新模板的代码和依赖变化，同时保留自己开发的功能。

因此，不要只对所有 `@nocobase/*` 包执行更新，也不要用新创建的应用覆盖现有项目。各个包的版本独立变化，应以目标模板的依赖组合为依据。

打开应用根目录的 `package.json`，可以看到类似配置：

```json
{
  "nocobase": {
    "templateKind": "app",
    "templatePackage": "@nocobase/app-template-default",
    "defaultTemplateVersion": "1.0.0-beta.81"
  }
}
```

`templatePackage` 是应用来源模板，`defaultTemplateVersion` 是已经合并到应用中的模板版本。应用自身的 `version` 用于业务应用的版本管理，不代表 Core 版本；不能通过单独修改上述字段完成升级。

## 升级前准备

- 将现有修改整理并提交到 Git，记录当前提交。升级在独立分支进行。
- 确认目标版本及其发布说明，包括 Node.js、包管理器、数据库和自定义插件的兼容性。
- 准备可恢复的数据库备份，保存运行配置、密钥和文件存储，记录与之匹配的旧版构建。
- 使用独立验证环境演练。需要验证旧数据时，恢复数据库与文件备份，并确认环境不会连接正式数据库或发送真实业务通知。

新版本启动时可能自动执行迁移，所以应在第一次启动前完成备份、迁移检查和必要的数据准备。

接下来选择一种方式操作，最后都完成本文的验证与部署步骤。

## 使用 Agent

在应用根目录打开 Coding Agent。应用自带的升级指引位于 `.agents/skills/nocobase-app-upgrade/SKILL.md`，会随依赖安装同步；先确认 Agent 能读取它和项目的 `AGENTS.md`。提示词只需说明升级目标、需要保留的功能和验证要求。

如果该 Skill 缺失，先按项目锁文件安装依赖；安装时未执行脚本的，再运行：

```bash
pnpm nocobase skills sync
```

可以使用下面的提示词，把目标改成明确版本，或者保留“当前发布通道的新版”：

```text
请把当前应用使用的 NocoBase Core 升级到当前发布通道的新版。

先检查并给我一个具体计划，暂时不要修改项目：
- 当前是什么版本，准备升级到哪个版本；如果已是目标版本，说明无需升级，不做降级。
- 这次升级会影响哪些功能、依赖、配置和插件，有哪些变化需要我决定。
- 怎样保留已有业务功能、主题、用户权限和数据，以及出问题后如何恢复。
- 是否有无法撤销的数据变更，或需要修复的历史记录，分别说明原因和影响。

我确认计划后，再按照项目升级指引，在独立分支完成修改。
不要直接覆盖当前应用或清空数据库，也不要只改版本号就算完成。
请在独立测试环境验证旧数据、登录、普通用户权限和任务操作仍然正常。
最后告诉我升级前后的版本、做出的调整、验证结果和未完成事项。
这次只准备并验证升级后的项目，正式环境部署另行确认。
```

确认计划时，重点检查自己的功能是否保留、移除的插件是否仍在使用、数据库是否能恢复。Agent 完成后，查看实际差异和验证结果，再进入部署步骤。

## 不使用 Agent

### 1. 确认基线和目标版本

在应用源码根目录执行。后面的命令使用同一个 Bash 终端中的变量：

```bash
git status --short
git rev-parse HEAD
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"

TEMPLATE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
npm view "$TEMPLATE" dist-tags --json
```

如果工作区有修改，先整理并提交。若模板来源或基线字段缺失，先根据项目历史确认；不要从 `templateKind: app` 猜测它来自 Default 还是 Examples，也不要猜一个基线继续。

Beta 应用通常继续使用 `beta` 通道；稳定版应用通常使用 `latest`。`latest` 只是发布标签，不保证比 `beta` 新，也不保证指向稳定版。其他预发布通道需要单独确认。

下面以 beta 应用为例，解析一次目标版本并固定下来：

```bash
TARGET=$(npm view "$TEMPLATE@beta" version)
printf 'Template: %s\nBase: %s\nTarget: %s\n' "$TEMPLATE" "$BASE" "$TARGET"
```

需要指定版本时，直接把 `TARGET` 设为已确认的完整版本号。按语义版本规则比较基线和目标：相同则无需升级，更旧则停止，不能隐式降级。确认目标更新后创建分支：

```bash
git switch -c "chore/upgrade-core-$TARGET"
```

### 2. 获取两个版本的模板

下载到临时目录，不写入应用源码：

```bash
WORK=$(mktemp -d)

for VERSION in "$BASE" "$TARGET"; do
  ARCHIVE=$(npm pack "$TEMPLATE@$VERSION" --silent --pack-destination "$WORK")
  mkdir -p "$WORK/$VERSION"
  tar -xzf "$WORK/$ARCHIVE" -C "$WORK/$VERSION" --strip-components=1
done

diff -rq "$WORK/$BASE" "$WORK/$TARGET"
```

`diff` 返回 `1` 表示发现差异，属于正常结果。这里比较的是两个已发布模板；直接比较当前项目和新模板，无法分清哪些差异是自己的业务开发造成的。

### 3. 逐项合并代码与依赖

对于变化的文件，同时查看基线模板、目标模板和项目中的版本。例如查看路由变化：

```bash
diff -u "$WORK/$BASE/client/routes.ts" "$WORK/$TARGET/client/routes.ts"
diff -u "$WORK/$BASE/client/routes.ts" client/routes.ts
```

前一份差异是模板的变化，后一份是项目已有的定制。将模板的新行为合并到自己的代码中，保留任务路由、系统设置入口和权限声明等业务内容。

| 内容 | 合并方式 |
| --- | --- |
| 普通框架文件 | 未定制的文件采用目标版本；双方都改过的文件逐项合并 |
| `package.json` | 按目标模板调整依赖与脚本，保留应用名称、业务版本、自定义依赖和脚本；不要覆盖整个文件 |
| 插件注册 | 一并检查 `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts`；保留应用使用的插件 |
| 配置与主题 | 合并配置示例和框架变化，保留实际配置、密钥、应用标识和自定义主题 |
| 数据库迁移与种子 | 保留已执行文件的原始内容和路径；修正通过新迁移完成 |
| Agent 指引 | 合并 `AGENTS.md` 和 `.agents/rules/` 的应用定制；`.agents/skills/` 通过命令重新同步 |

目标模板删除文件或依赖时，先检查业务代码、配置和测试是否仍在使用。确认可移除的 NocoBase 包，应在它仍声明于依赖中时，通过 `pnpm nocobase package remove <包名>` 清理依赖、Skills 和插件注册；还需自行处理业务引用。CLI 不支持该命令的旧项目，按项目升级 Skill 中的兼容步骤处理。

目标模板的包升级还可能带来插件内部迁移。除了应用文件差异，也要阅读相关包的升级说明，检查是否需要数据准备、接口适配或替代已移除的能力。

### 4. 安装依赖并同步 Skills

完成源码合并后，将 `nocobase.defaultTemplateVersion` 更新为本次固定的目标版本，然后执行：

```bash
pnpm install
pnpm dedupe
pnpm nocobase skills sync
```

检查并保留锁文件变化。`pnpm dedupe` 用于整理兼容范围内的重复依赖；遇到冲突时，用 `pnpm why <包名>` 定位来源，按目标模板和自定义依赖的约束解决，不通过删除锁文件或把全部依赖更新到最新来绕过。

### 5. 检查数据库并执行迁移

先完成下一节的静态检查和自动化测试。确认当前配置指向独立验证环境，在第一次启动新版本前，用目标版本 CLI 执行两个只读检查：

```bash
pnpm nocobase db apply --dry-run --json
pnpm nocobase db repair --dry-run --json
```

第一个列出待执行的迁移和种子，第二个检查已执行记录的校验和变化。迁移预览不会执行迁移内容，也不会检查校验和；两个检查不能相互替代。默认检查默认连接，多连接应用应对实际使用的连接加上 `--connection <名称>`，后续执行也使用相同范围。

若校验和检查提出修正，先逐项对照版本说明核实原因；不能把实际的 `db repair` 当成必做步骤。它会修改所选连接中所有不匹配记录的校验和，不会重新运行迁移或修复业务数据。存在无法解释的变化时停止，按项目升级 Skill 的数据库指引处理，不能修改历史文件、重置数据库或忽略错误。

确认备份可恢复、校验和检查与必要的数据准备已完成后，在独立验证环境应用迁移：

```bash
pnpm nocobase db apply --json
```

正式环境的迁移由部署流程统一安排，不用开发项目直接连接正式数据库执行这些操作。

## 验证升级结果

Core 升级可能影响整个应用。对本文示例，检查项目既有脚本，并按[搭建第一个应用](../tutorials/build-your-first-feature.md)补齐任务功能的独立测试：

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

这些命令在源码项目执行；测试必须使用隔离数据库。若既有测试配置需要适配新工具，修复配置并保留覆盖，不以跳过失败测试作为通过。

数据库准备完成后运行 `pnpm dev`，使用输出的 `Local:` 地址验证：

- 管理员能登录，任务页和系统设置正常，语言与自定义主题符合预期。
- 旧任务的标题、负责人、完成状态和截止日期保留；新建、完成／恢复、筛选和分页正常。
- 普通用户只能访问已授权页面和数据；只读用户仍不能写入，直接请求接口也不能绕过权限。
- 刷新和重启后数据仍然保留；本次涉及的插件功能、后台任务或外部集成通过对应检查。

按应用实际已有的功能验收。在独立应用中配置测试地址与账号后，使用 `pnpm test:e2e` 运行浏览器测试；具体准备见[搭建第一个应用](../tutorials/build-your-first-feature.md)。`pnpm test` 不包含浏览器测试。

## 部署与回退

验证完成后提交源码及锁文件，记录基线、目标版本、合并决定和验证结果，重新构建，再沿用原部署方式发布：

- [使用 Docker 部署](../tutorials/deploy-with-docker.md#部署新版本)
- [使用 app-installer 部署](../tutorials/deploy-with-app-installer.md#部署新版本)
- [部署到 Studio](../tutorials/deploy-to-studio.md#部署新版本)

保留与旧版构建匹配的配置和数据备份。回退代码不会自动撤销数据库迁移；若旧版不能使用升级后的表结构，需要恢复匹配的数据库和文件，并处理备份之后的业务写入。

如版本说明要求修正历史校验和，应把备份、修正、迁移及失败恢复纳入同一个维护流程。对于 app-installer，不能先自行执行 `db repair` 再依赖普通升级的自动恢复：安装器随后备份的数据可能已经包含新校验和，旧运行时不一定能接受。外部数据库也需要独立的备份和恢复安排。

## 本篇验证范围

本篇说明模板合并与升级检查方法。当前入门示例已核对 npmjs.org 发布的 `1.0.0-beta.81` 模板依赖，并完成测试及构建；这不等于已经验证任意旧版本到该版本的升级。实际跨版本升级仍需检查目标版本说明，在独立环境验证旧数据、权限和回退方式。
