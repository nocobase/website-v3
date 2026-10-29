---
title: 升级 NocoBase Core
description: 使用 Agent 或手动合并新模板，升级应用使用的 NocoBase Core，保留业务代码，并验证数据与权限。
---

本文介绍如何升级当前应用使用的 NocoBase Core 及相关依赖。升级在应用的源码项目中进行；验证完成后，再按原有的方式 [部署应用](../deployment/choose-a-deployment-method.md)。

## 升级会改变什么

通过 create-app 创建的项目，既包含 NocoBase 的包依赖，也包含复制到项目中的框架代码，例如应用入口、路由、布局、配置和测试工具。因此，升级时需要合并新模板在代码和依赖上的变化，同时保留你自己开发的功能。

所以，不要只是把所有 `@nocobase/*` 包都更新一遍，也不要用新创建的应用覆盖现有项目。各个包的版本独立变化，应以目标模板的依赖组合为准。

打开应用根目录的 `package.json`，可以看到类似下面的配置：

```json
{
  "nocobase": {
    "templateKind": "app",
    "templatePackage": "@nocobase/app-template-default",
    "defaultTemplateVersion": "1.0.0-beta.81"
  }
}
```

`templatePackage` 是应用的来源模板，`defaultTemplateVersion` 是已经合并到应用中的模板版本。应用自身的 `version` 用于业务应用的版本管理，并不代表 Core 的版本；单独修改上面这些字段，也不能完成升级。

## 升级前的准备

- 把现有的修改整理好并提交到 Git，记下当前的提交。升级在独立的分支上进行。
- 确认目标版本及其发布说明，包括 Node.js、包管理器、数据库和自定义插件的兼容性。
- 准备可以恢复的数据库备份，保存运行配置、密钥和文件存储，并记录与之匹配的旧版构建。
- 在独立的验证环境中演练。需要验证旧数据时，恢复数据库和文件的备份，并确认该环境不会连接正式数据库，也不会发送真实的业务通知。

新版本在启动时可能会自动执行迁移，所以务必在第一次启动之前完成备份、迁移检查和必要的数据准备。

接下来任选一种方式操作，最后都要完成本文的验证与部署步骤。

## 使用 Agent

在应用根目录打开 Coding Agent。应用自带的升级指引位于 `.agents/skills/nocobase-app-upgrade/SKILL.md`，会随依赖安装同步；请先确认 Agent 能读取它和项目的 `AGENTS.md`。提示词中只需说明升级目标、需要保留的功能和验证要求。

如果缺少这个 Skill，先按项目的锁文件安装依赖；如果安装时没有执行脚本，再运行：

```bash
pnpm nocobase skills sync
```

可以使用下面的提示词，把目标改成一个明确的版本，或者保留“当前发布通道的新版”：

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

确认计划时，重点检查：你的功能是否都会保留，被移除的插件是否仍在使用，数据库能否恢复。Agent 完成后，查看实际的差异和验证结果，再进入部署步骤。

## 迁移旧的全局插件开发 Skill

如果以前全局安装过 `nocobase-app-plugin-development`，请把它的迁移纳入升级计划。目标版本需要同时提供项目级的 Skill 和兼容的同步命令；不要以为项目中的同名 Skill 会自动覆盖全局版本。

1. 按目标模板升级依赖，然后运行 `pnpm nocobase skills sync`。
2. 确认 App 的 `.agents/skills/nocobase-app-plugin-development/` 中包含完整的指引及其引用文件。
3. 检查当前 Agent 的全局安装位置，移除这个确切名称的旧安装及相关链接。如果其中有自定义内容，先备份到 Agent 不会扫描的位置；对于软链接，只移除链接入口，不要删除它指向的项目或源码。
4. 开启一个新的 Agent 会话，确认它使用的是项目中的文件。

如果项目级 Skill 尚未提供或同步失败，请先保留原有的全局安装，并解决前提问题。全局文件不受 App 的 Git 分支保护，需要单独记录备份和恢复的方式；安装依赖和同步命令都不会自动删除它们。如果应用已经升级、但还没有清理全局副本，也可以补做这项迁移，不需要再次修改版本号。

## 不使用 Agent

### 1. 确认基线和目标版本

在应用源码的根目录执行。后面的命令都使用同一个 Bash 终端中的变量：

```bash
git status --short
git rev-parse HEAD
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"

TEMPLATE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
npm view "$TEMPLATE" dist-tags --json
```

如果工作区有修改，先整理并提交。如果模板来源或基线字段缺失，先根据项目历史确认，不要根据 `templateKind: app` 去猜它来自 Default 还是 Examples，也不要猜一个基线就继续。

Beta 应用通常继续使用 `beta` 通道，稳定版应用通常使用 `latest`。`latest` 只是一个发布标签，并不保证比 `beta` 更新，也不保证指向稳定版。其他预发布通道需要单独确认。

下面以 beta 应用为例，解析一次目标版本并把它固定下来：

```bash
TARGET=$(npm view "$TEMPLATE@beta" version)
printf 'Template: %s\nBase: %s\nTarget: %s\n' "$TEMPLATE" "$BASE" "$TARGET"
```

需要指定版本时，直接把 `TARGET` 设为已经确认的完整版本号。按语义化版本的规则比较基线和目标：两者相同则无需升级；目标更旧则停止，不能隐式降级。确认目标版本更新后，创建分支：

```bash
git switch -c "chore/upgrade-core-$TARGET"
```

### 2. 获取两个版本的模板

把模板下载到临时目录，不写入应用源码：

```bash
WORK=$(mktemp -d)

for VERSION in "$BASE" "$TARGET"; do
  ARCHIVE=$(npm pack "$TEMPLATE@$VERSION" --silent --pack-destination "$WORK")
  mkdir -p "$WORK/$VERSION"
  tar -xzf "$WORK/$ARCHIVE" -C "$WORK/$VERSION" --strip-components=1
done

diff -rq "$WORK/$BASE" "$WORK/$TARGET"
```

`diff` 返回 `1` 表示发现了差异，这是正常的结果。这里比较的是两个已发布的模板；如果直接拿当前项目和新模板比较，就无法分清哪些差异来自你自己的业务开发。

### 3. 逐项合并代码与依赖

对于有变化的文件，同时查看基线模板、目标模板和项目中的版本。例如，查看路由的变化：

```bash
diff -u "$WORK/$BASE/client/routes.ts" "$WORK/$TARGET/client/routes.ts"
diff -u "$WORK/$BASE/client/routes.ts" client/routes.ts
```

前一份差异是模板自身的变化，后一份是项目已有的定制。把模板的新行为合并到你自己的代码中，同时保留任务路由、系统设置入口和权限声明等业务内容。

| 内容 | 合并方式 |
| --- | --- |
| 普通框架文件 | 未定制过的文件直接采用目标版本；双方都改过的文件逐项合并 |
| `package.json` | 按目标模板调整依赖和脚本，保留应用名称、业务版本、自定义依赖和脚本；不要覆盖整个文件 |
| 插件注册 | 同时检查 `client/plugins.ts`、`server/plugins.ts` 和 `cli/plugins.ts`，保留应用正在使用的插件 |
| 配置与主题 | 合并配置示例和框架的变化，保留实际的配置、密钥、应用标识和自定义主题 |
| 数据库迁移与 Seed | 已执行过的文件保持原有的内容和路径；需要修正时，通过新的迁移完成 |
| Agent 指引 | 合并 `AGENTS.md` 和 `.agents/rules/` 中的应用定制；`.agents/skills/` 通过命令重新同步 |

目标模板删除了某个文件或依赖时，先检查业务代码、配置和测试是否仍在使用它。对于确认可以移除的 NocoBase 包，应趁它仍声明在依赖中时，通过 `pnpm nocobase package remove <包名>` 清理依赖、Skills 和插件注册；业务代码中的引用则需要自行处理。对于 CLI 尚不支持该命令的旧项目，请按项目升级 Skill 中的兼容步骤处理。

目标模板中的包升级，还可能带来插件内部的迁移。除了应用文件的差异，也要阅读相关包的升级说明，检查是否需要准备数据、适配接口，或者寻找已移除能力的替代方案。

### 4. 安装依赖并同步 Skills

完成源码合并后，把 `nocobase.defaultTemplateVersion` 更新为本次固定的目标版本，然后执行：

```bash
pnpm install
pnpm dedupe
pnpm nocobase skills sync
```

检查并保留锁文件的变化。`pnpm dedupe` 用于整理兼容范围内的重复依赖；遇到冲突时，用 `pnpm why <包名>` 定位来源，再按目标模板和自定义依赖的约束解决。不要通过删除锁文件，或把所有依赖都更新到最新来绕过冲突。

### 5. 检查数据库并执行迁移

先完成下一节的静态检查和自动化测试。确认当前配置指向的是独立的验证环境后，在第一次启动新版本之前，用目标版本的 CLI 执行两个只读检查：

```bash
pnpm nocobase db apply --dry-run --json
pnpm nocobase db repair --dry-run --json
```

第一个命令列出待执行的迁移和 Seed，第二个命令检查已执行记录的校验和是否发生变化。迁移预览既不执行迁移内容，也不检查校验和，所以这两个检查不能相互替代。它们默认检查默认连接；多连接的应用，应对实际使用的每个连接加上 `--connection <名称>`，后续执行时也使用相同的范围。

如果校验和检查提出了修正，先逐项对照版本说明核实原因；不要把实际执行 `db repair` 当成必做的步骤。它会修改所选连接中所有不匹配记录的校验和，但不会重新运行迁移，也不会修复业务数据。遇到无法解释的变化时，请停下来，按项目升级 Skill 中的数据库指引处理；不能修改历史文件、重置数据库或忽略错误。

确认备份可以恢复、校验和检查与必要的数据准备都已完成后，在独立的验证环境中应用迁移：

```bash
pnpm nocobase db apply --json
```

正式环境的迁移由部署流程统一安排，不要用开发项目直接连接正式数据库执行这些操作。

## 验证升级结果

Core 升级可能影响整个应用。对于本文的示例，检查项目已有的脚本，并按 [搭建第一个应用](../tutorials/build-your-first-app.md) 补齐任务功能的独立测试：

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

这些命令在源码项目中执行，测试必须使用隔离的数据库。如果已有的测试配置需要适配新工具，请修复配置并保留测试覆盖，不能靠跳过失败的测试来“通过”。

数据库准备完成后，运行 `pnpm dev`，用输出的 `Local:` 地址验证：

- 管理员能够登录，任务页和系统设置正常，语言和自定义主题符合预期。
- 旧任务的标题、负责人、完成状态和截止日期都得到保留；新建、完成／恢复、筛选和分页都正常。
- 普通用户只能访问已授权的页面和数据；只读用户仍然不能写入，直接请求接口也无法绕过权限。
- 刷新和重启后数据仍然保留；本次涉及的插件功能、后台任务或外部集成都通过了相应的检查。

请按应用实际已有的功能进行验收。在独立的应用中配置好测试地址和账号后，用 `pnpm test:e2e` 运行浏览器测试；具体准备见 [搭建第一个应用](../tutorials/build-your-first-app.md)。注意，`pnpm test` 不包含浏览器测试。

## 部署与回退

验证完成后，提交源码和锁文件，记录基线、目标版本、合并时的决定和验证结果，重新构建，再沿用原有的部署方式发布：

- [使用 Docker 部署](../tutorials/deploy-with-docker.md#部署新版本)
- [使用 PM2 部署（app-installer）](../tutorials/deploy-with-app-installer.md#部署新版本)

保留与旧版构建相匹配的配置和数据备份。回退代码并不会自动撤销数据库迁移；如果旧版本无法使用升级后的表结构，需要恢复相匹配的数据库和文件，并处理备份之后发生的业务写入。

如果版本说明要求修正历史校验和，应把备份、修正、迁移以及失败后的恢复纳入同一个维护流程。对于 app-installer，不能先自行执行 `db repair`，再指望普通升级的自动恢复：安装器随后备份的数据可能已经包含新的校验和，旧的运行时不一定能接受。外部数据库也需要单独安排备份和恢复。

## 本篇的验证范围

本篇说明的是模板合并与升级检查的方法。当前的入门示例已经核对了 npmjs.org 上发布的 `1.0.0-beta.81` 模板依赖，并完成了测试和构建；但这不等于已经验证了从任意旧版本升级到该版本。实际进行跨版本升级时，仍需检查目标版本的说明，并在独立环境中验证旧数据、权限和回退方式。
