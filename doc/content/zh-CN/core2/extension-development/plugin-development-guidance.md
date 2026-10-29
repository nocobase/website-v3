---
title: 插件开发指引（AGENTS.md）
description: 在插件的 AGENTS.md 中维护职责、修改约定、兼容要求和验证方法，帮助 Agent 持续维护插件源码。
---

插件的 `AGENTS.md` 面向维护源码的 Agent：让它知道这个插件负责什么、修改某项能力时需要检查哪些文件，以及如何验证结果。指引应记录跨任务都有效的约定，并随插件源码一起维护。

本篇说明如何编写这些维护要求。供应用 Agent 调用、接入和组合插件能力的 Skill，见 [插件 Skill](write-plugin-skills.md)。两类指引可以描述同一项能力，但关注的问题不同。

## 指引放在哪里

在应用工作区中，插件的开发指引位于插件根目录：

```tree
my-app/
├── AGENTS.md                       # 应用整体开发约定
├── .agents/skills/                 # 从依赖同步的开发与使用指引
└── packages/
    └── app-plugin-notice-cli/
        ├── AGENTS.md              # 本插件的源码维护约定
        ├── CLAUDE.md              # 引用同目录的 AGENTS.md
        ├── README.md              # 插件说明与接入方法
        ├── cli/                   # 命令实现
        ├── tests/                 # 验证实现的测试
        └── skills/                # 面向插件使用者的 Skills（按需）
```

创建工具已经生成了 `AGENTS.md` 和 `CLAUDE.md`，不需要为了增加指引而重新创建插件。当前模板中 `CLAUDE.md` 的内容为：

```text
@AGENTS.md
```

请保留这条引用，让开发约定集中在 `AGENTS.md` 中维护。开始修改插件时，让 Agent 先阅读应用根目录和插件根目录的指引，再按任务阅读相关的源码。

模板中还会指向应用已安装版本的 `.agents/skills/nocobase-app-plugin-development/SKILL.md`。这份通用的开发 Skill 来自 `@nocobase/app-skills`；插件的 `AGENTS.md` 只需补充本插件实际的约定，不必复制整份通用开发说明。

`pnpm nocobase skills sync` 同步的是包提供的 Skills，不会把插件根目录的 `AGENTS.md` 复制成应用 Skill。源码的维护要求留在插件内部，面向使用者的说明则放在插件的 `skills/` 中。

## 记录哪些维护约定

优先记录那些 Agent 无法仅凭文件名判断、但修改代码时又必须知道的信息：

| 内容 | 应写清什么 |
| --- | --- |
| 职责与边界 | 已实现的能力；哪些数据、权限和业务规则由应用或其他插件负责 |
| 关键入口 | 哪些文件实现功能，哪些文件负责声明、注册和公开它 |
| 修改时的联动 | 新增或调整能力时，需要同步更新哪些声明、依赖、测试和文档 |
| 兼容要求 | 哪些公开路径、参数、返回结构、错误码和服务 Token 已经被外部使用 |
| 验证方式 | 在哪个目录执行哪些命令、预期结果是什么、是否需要目标应用 |
| 特殊约定 | 本插件独有的状态规则、迁移约束、资源归属或外部服务前提 |

请使用具体的文件名和行为要求。例如，“修改 `preview` 的返回字段时，同时检查 CLI 测试和插件 Skill”，就比“保证代码质量”更能帮助 Agent 完成工作。

完整的目录说明见 [插件结构](plugin-structure.md)，入口与公开契约见 [插件声明与公开入口](plugin-declarations.md)。指引可以链接这些已有的说明，只补充当前插件与众不同的地方。涉及 UI 时，请保留“基础组件使用 shadcn、优先参考 NocoBase UI Library”的约定，源码资产的组织方式见 [组件与样式](frontend-components.md)。

## 示例：为 notice-cli 补充维护要求

下面沿用 [命令行扩展](extend-command-line.md) 中已完成的 `notice-cli` 插件：`preview` 命令整理公告文本并返回字符数，配套的 Skill 见 [插件 Skill](write-plugin-skills.md)。

把下面这一节补充到插件现有的 `AGENTS.md` 中，同时保留模板中指向通用开发 Skill 的入口，以及仍然适用的开发规则。文件路径相对于插件根目录，命令则从应用根目录执行：

````markdown
## notice-cli maintenance

### Responsibility

This plugin previews text through `notice-cli preview`. It does not save,
publish or send notices, and the preview command does not start application services.

### Implementation and public contract

- `cli/preview.ts` implements the preview command.
- `cli/index.ts` declares commands. Preserve the generated `info` command when adding commands.
- `package.json` exposes `./cli` for source and compiled consumers. Keep both mappings valid.
- Keep `preview --text ... --json` compatible with its documented callers.
- Input is trimmed and must contain 1–200 UTF-16 code units after trimming.
- `result.text` is the trimmed value; `result.length` counts Unicode code points.
- Blank or oversized text returns `INVALID_TEXT` with exit code 2.

### Changes and verification

When changing command behavior, update `tests/cli/preview.test.ts`, the README
and `skills/nocobase-app-plugin-notice-cli/SKILL.md` where affected.
Keep usage examples consistent with the actual command; maintain the Skill
in this package, not the synchronized copy in the application.

Run from the owning application root:

```bash
pnpm --filter @nocobase/app-plugin-notice-cli test tests/cli/preview.test.ts
pnpm --filter @nocobase/app-plugin-notice-cli typecheck
pnpm --filter @nocobase/app-plugin-notice-cli build
```

After the application's `cli/plugins.ts` registers this plugin, verify:

```bash
pnpm nocobase notice-cli preview --text " Hello " --json
```

Expect `ok: true`, `result.text: "Hello"` and `result.length: 5`.
For changes to exports, dependencies or CLI integration, also build the owning
application and verify the command through its built CLI entry.
````

这个例子记录了两条容易混淆的规则：输入的上限按 UTF-16 code unit 计算，而结果的长度按 Unicode 码点计算。它还指出了修改行为时需要联动的文件，以及插件单独构建和应用实际调用各自验证的是什么。

示例中的测试文件和 Skill 来自对应的教程；如果你的插件还没有它们，应先实现，或者改为实际的路径。新增了 Client、Server 或数据库能力之后，再补充相应的维护要求，不要在指引中保留并不存在的入口。

## 让 Agent 按指引完成修改

任务描述说明这一次要做什么，`AGENTS.md` 提供长期有效的维护约定，两者配合使用，例如：

```prompt
请在当前应用中检查 packages/app-plugin-notice-cli 的 preview 边界测试。

先阅读应用与插件的 AGENTS.md，以及应用已同步的插件开发 Skill，
检查现有实现和未提交改动。

确认测试覆盖前后空白、空文本、长度上限和 Unicode 字符计数。
已有覆盖直接复用，补齐缺失用例，保持当前命令参数和返回结构兼容。
检查 README 与插件 Skill 是否和实际行为一致，并修正过时说明。

运行受影响的测试与必要检查，说明验证结果和未验证范围。
```

维护者需要知道实现文件、注册位置和兼容要求，使用者只需要知道调用前提、公开命令和返回结果。把前者写进 `AGENTS.md`、后者写进插件 Skill，可以避免两份说明逐渐混成同一份长文档。

## 验证指引是否好用

用一次真实的维护任务来检查指引，而不只是检查文件是否存在：

- 文中的路径都能找到，对应的文件仍然承担所描述的职责。
- 命令与当前 `package.json` 中的脚本一致，执行目录明确。
- 指定的测试确实被发现并运行，结果与预期一致。
- 修改功能之后，相关的声明、导出、依赖和使用示例都得到了同步检查。
- 能区分插件内部的测试和在目标应用中的验证，并记录尚未验证的部分。

检查命令以当前的插件和应用为准。NocoBase 源码仓库专用的检查脚本，不应直接复制到普通应用的插件指引中。测试方法见 [测试与验证](testing-and-verification.md)，应用的验收见 [测试与验收](../developing-apps/testing-and-acceptance.md)。

如果只修改了开发指引，核对路径、命令和描述即可；需要实际验证功能或接入方面的变更时，再运行相应的代码检查。不要为了验证一段说明，而把没有变化的全部业务测试重新跑一遍。

## 随功能一起维护

公开的命令、接口、服务或资源布局发生变化时，请同时检查开发指引、README、测试和插件 Skill。开发指引记录“为什么这样组织、修改时应遵守什么”，README 和 Skill 记录当前的使用方式。涉及兼容性变化时，按项目的版本与发布约定记录变更，见 [构建与发布](publish-plugin.md)。

把稳定的业务决定和维护约定留在指引中；临时的排错过程、某一次任务的日志以及已经过时的步骤，应及时清理。说明较长时，可以链接插件内维护的参考文档，让 `AGENTS.md` 始终是一个清晰的阅读入口。

**完成的标志**：接手插件的 Agent 能够定位本次的改动、遵守公开契约、完成相应的验证，并且知道哪些说明需要同步更新。
