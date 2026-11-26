---
title: 迁移旧版门户
metaDescription: 把旧版多门户应用恢复为默认布局，并把已有门户改为 package.json 清单、definePortalRoutes 和 PortalLayout 的写法。
---

## 哪些门户需要迁移

旧版多门户会用门户外壳替换应用的布局和路由文件，门户通过 `portal.ts` 描述自己，路由写完整地址，布局交给应用的外壳渲染。现在门户使用多门户插件提供的独立布局，应用只注册插件。

出现以下任一情况，说明应用或门户需要迁移：

- 应用中有 `client/layouts/portal-shell.tsx`，或「我的门户」仍显示为「工作台」（`/workbench`）。
- 门户包中有 `portal.ts`。
- 门户的 `client/routes.ts` 中写着 `/portals/<门户>/…` 这样的完整路径。

迁移前，先提交或保存所有改动，从干净的工作区开始，并备份数据库。迁移不改变数据库中的数据。

## 恢复应用的默认布局

先处理应用。按[为已有应用启用多门户](enable-in-existing-app.md)升级到最新的企业版时，会一并恢复多门户以前替换的文件；已经升级到最新企业版的应用，可以跳过这一节。

只升级了多门户插件时，用插件附带的命令恢复。在应用根目录先预览，再写入：

```bash
node node_modules/@nocobase/app-plugin-multi-portal/scripts/restore-default-layout.mjs
node node_modules/@nocobase/app-plugin-multi-portal/scripts/restore-default-layout.mjs --apply
pnpm install
```

命令只恢复与当时生成内容完全一致的文件。文件在生成后被修改过时，哪怕只改了一条翻译，或 `README.MD`、`AGENTS.md` 中的一段，都会作为冲突列出，并且不写入任何文件。先保存这些修改，把文件恢复为原始内容后重新运行，再重新应用自己的修改。同时启用了多应用的应用会保留多应用的路由和指引。

恢复后，保留 `client/plugins.ts` 和 `server/plugins.ts` 中的插件注册，再运行应用的检查。

## 迁移门户代码

对应用中的每个门户，依次完成下面四步。

### 门户信息移到 package.json

把 `portal.ts` 中的门户信息移到门户包的 `package.json`：

```json
{
  "name": "@nocobase/app-portal-inventory",
  "nocobase": {
    "title": { "en-US": "Inventory", "zh-CN": "库存" },
    "description": { "en-US": "Manage materials and stock", "zh-CN": "管理物料和库存" },
    "portal": { "key": "inventory", "icon": "Warehouse", "tone": 1 }
  }
}
```

- 名称和说明从原来的 `nocobase.portal.locales` 移到 `nocobase.title` 和 `nocobase.description`。
- 原来入口地址的最后一段与默认值（包名去掉 `@nocobase/app-portal-`）不同时，写入 `nocobase.portal.key`，保持门户地址不变。
- 复制原来的 `icon` 和 `tone`，删除旧的语言条目和 `schemaVersion`、`modules`。

然后把使用 `portal.ts` 的地方改为读取清单：服务端用 `portalFromPackage(manifest)`，门户页面中用 `usePortal()`。删除 `portal.ts`、它在 `package.json` 中的 `./portal` 导出，以及 TypeScript 配置中的单独引用。

已执行过的 seed 不要修改。如果某个已执行的 seed 仍然导入 `portal.ts`，在原路径保留一个兼容文件供它使用。新的 seed 直接读取清单。

### 改用页面清单和 definePortalRoutes

1. 新建 `portal-routes.ts`，把原来的路由名、相对路径和标题移进去，写法见[页面与导航](develop/pages-and-navigation.md#在页面清单中声明页面)。
2. `client/routes.ts` 改用 `definePortalRoutes({ manifest, routes: portalRoutes, layout, components })`，页面组件按路由名放进 `components`。
3. 服务端注册门户时，传入 `routeManifest: definePortalRouteManifest({ portal, routes: portalRoutes })`。
4. 页面组件去掉外层的 `<Layout>`，只渲染自己的内容。

迁移时保留原来的授权：

- 原来写 `module: 'reports'` 的页面，或页面名与原授权键不同的页面，改用 `group: 'reports'`。
- 需要单独授权的子页面加上 `access: 'own'`。
- 原来的自定义 `authz` 保留。

### 改用 PortalLayout

把 `client/layout.tsx` 改为使用 `@nocobase/app-plugin-multi-portal/client/layout` 中的 `PortalLayout`：

```tsx
<PortalLayout logo={<Logo title={title} />} sidebar={navigation} switcher={<PortalSwitcher />} />
```

原来多个页面共用的包装内容移到这个布局中。语言文件中只保留页面文案；Logo 需要显示门户名称时，用 `usePortalText()` 读取。其他属性见[门户布局](develop/layout.md)。

### 更新链接和接口

- 指向 `/workbench` 的链接改为 `/portals`。
- 调用 `GET /api/portalCenter/workbench` 的地方改为 `GET /api/portalCenter/myPortals`。
- 面向成员的门户链接使用返回结果中的 `href`，没有 `href` 时再用 `entry`：`entry` 是门户地址，`href` 是成员实际可以进入的页面。

## 检查角色授权并验证

升级多门户插件时，迁移会为已有角色和带页面授权的 API 密钥补上门户访问权限；原来开放整个门户的授权继续覆盖整个门户。迁移后在 **角色与权限 → 多门户** 中检查各角色：

- 每个门户的访问开关和已开放页面数与迁移前一致。
- 新增的页面没有被意外开放。

然后对每个门户检查：

- 从我的门户和切换器能进入，导航、头部按钮和头像菜单正常显示。
- 旧地址 `/workbench` 跳转到我的门户，门户原来的地址仍能打开。
- 分别用管理员、有权限和无权限的账号检查页面和业务接口，结果与迁移前一致。

最后运行门户和应用的检查：

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm build
```
