---
title: 为已有应用启用多门户
metaDescription: 把已有应用升级到最新的企业版，再启用多门户。
---

多门户属于企业版。已有应用先升级到最新的企业版，再启用多门户。启用只增加多门户插件的注册和门户生成器依赖，不改动应用的布局、路由和业务代码。

## 确认应用当前的版本

在应用根目录查看 `package.json` 中的 `nocobase` 字段：

```bash
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"
```

| 应用当前的情况 | 要做什么 |
| --- | --- |
| `templatePackage` 为 `@nocobase/app-template-default`（社区版） | 升级到最新的企业版，再启用多门户 |
| `templatePackage` 为 `@nocobase/app-template-multi-portal`（旧的多门户模板） | 升级到最新的企业版，再启用多门户 |
| `edition` 为 `enterprise`，`defaultTemplateVersion` 低于最新企业版 | 升级到最新的企业版，再启用多门户 |
| `edition` 为 `enterprise`，已是最新版本 | 直接[启用多门户](#启用多门户) |

查询最新的企业版版本：

```bash
npm view @nocobase/app-template-enterprise@beta version --registry=https://pkg-v3.nocobase.com/
```

专业版应用（`edition` 为 `pro`）升级到企业版不在本文范围内。

## 升级到最新的企业版

先按[配置商业包的授权源](../../developing-apps/overview.md#配置商业包的授权源)，在 Agent 实际执行命令的环境中配置好商业源。应用使用 Git 管理时，先提交或保存所有改动，从干净的工作区开始；升级前备份数据库。

升级由应用自带的 `nocobase-app-upgrade` Skill 完成。它会比较应用当前的模板和最新的企业版模板，逐个文件合并到应用中，保留你的代码、配置和数据。在应用根目录打开开发 Agent，先确认它能读取项目的 `AGENTS.md` 和 `.agents/skills/nocobase-app-upgrade/SKILL.md`，然后输入：

```prompt
把这个应用升级到最新的企业版，保留我的代码、配置和数据。
先列出要改动的文件和需要我决定的地方，确认后再修改，最后运行检查。
```

Agent 会先新建分支并给出变更计划。遇到你改过、模板也改过的文件时，它会请你决定如何合并。确认后，它会合并模板、更新依赖并同步 Skills。

完成后检查：

- `package.json` 中，`templatePackage` 为 `@nocobase/app-template-enterprise`，`edition` 为 `enterprise`，`defaultTemplateVersion` 为最新版本。
- 启动应用后，可以打开 **系统设置 → Cluster readiness**。
- 原有页面和数据都在，`pnpm typecheck`、`pnpm test` 和 `pnpm build` 通过。

应用以前启用过多门户时，升级会把多门户当时替换的布局和路由文件恢复为默认版本，`capabilities` 中保留 `multi-portal`。应用中已有的门户还需要改为新写法，见[迁移旧版门户](migrate.md#迁移门户代码)。

## 启用多门户

在应用根目录先预览改动，确认后再应用：

```bash
pnpm app:enable multi-portal
pnpm app:enable multi-portal --apply
pnpm install
pnpm nocobase config check
```

预览会列出将要新增、修改和删除的文件。如果你修改过的文件与启用改动冲突，命令会列出冲突并且不写入任何文件；先保存你的改动，处理列出的文件后重新预览。应用已经启用多门户时，预览的改动列表为空，不需要再应用。

## 确认我的门户和门户管理

重启应用：

```bash
pnpm dev
```

用管理员账号登录，检查：

- 能打开 **我的门户**，地址为 `/portals`；旧地址 `/workbench` 会自动跳转到这里。
- 能打开 **系统设置 → 门户管理**。
- `client/plugins.ts` 和 `server/plugins.ts` 中注册了多门户插件。

应用还没有门户时，两处列表都为空。接下来可以生成第一个门户，见[快速开始](quickstart.md#生成第一个门户)。
