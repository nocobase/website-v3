---
title: 迁移旧版门户
metaDescription: 把旧版多门户应用恢复为默认布局，并把已有门户改为 package.json 清单、在 client/routes.ts 中声明页面的 definePortalRoutes 和 PortalLayout 的写法。
---

## 哪些门户需要迁移

旧版多门户会用门户外壳替换应用的布局和路由文件，门户通过 `portal.ts` 描述自己，路由写完整地址，布局交给应用的外壳渲染。之后的过渡版本把页面单独写在 `portal-routes.ts` 中，再分别交给前端和服务端。现在门户使用多门户插件提供的独立布局，页面只在 `client/routes.ts` 中声明一次，应用只注册插件。

出现以下任一情况，说明应用或门户需要迁移：

- 应用中有 `client/layouts/portal-shell.tsx`，或「我的门户」仍显示为「工作台」（`/workbench`）。
- 门户包中有 `portal.ts`。
- 门户的 `client/routes.ts` 中写着 `/portals/<门户>/…` 这样的完整路径。
- 门户包中有 `portal-routes.ts`，`definePortalRoutes` 传了 `components`，或服务端注册门户时传了 `routeManifest`。

迁移前，先提交或保存所有改动，从干净的工作区开始，并备份数据库。迁移不改变数据库中的数据。

## 恢复应用的默认布局

先处理应用。按[为已有应用启用多门户](enable-in-existing-app.md)升级到最新的企业版时，会一并恢复多门户以前替换的文件；已经升级到最新企业版的应用，可以跳过这一节。升级企业版时也可以单独运行新版本中的 `node scripts/app-capability.mjs multi-portal --app . --from <上一个企业版>`，它会和其他能力的改动一起恢复同样的文件，见应用 `README` 中「Upgrade an application to a newer Enterprise version」一节。

只升级了多门户插件时，用插件附带的命令恢复。在应用根目录先预览，再写入：

```bash
node node_modules/@nocobase/app-plugin-multi-portal/scripts/restore-default-layout.mjs
node node_modules/@nocobase/app-plugin-multi-portal/scripts/restore-default-layout.mjs --apply
pnpm install
```

命令根据应用中的 `presets/` 判断每个文件当时生成的内容，只恢复与它完全一致的文件：

- 文件在生成后被修改过时，哪怕只改了一条翻译，或 `README.MD`、`AGENTS.md` 中的一段，都会作为冲突列出，并给出原始文件在 `presets/content/` 下的路径，不写入任何文件。先保存这些修改，把文件恢复为原始内容后重新运行，再重新应用自己的修改。
- 要修改的文件是符号链接，或位于链接目录下时，也作为冲突列出。
- 应用中已经没有 `presets/` 时，加上 `--from <解压后的企业版发布包>`，指定生成这个应用时使用的企业版。
- 同时启用了多应用的应用会保留多应用的路由和指引。

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

### 改用 definePortalRoutes

1. `client/routes.ts` 改用 `definePortalRoutes({ manifest, layout, routes })`。路由的路径改为相对门户地址，去掉 `/portals/<门户>` 前缀；每个页面用 `componentLoader` 指定组件，要进入菜单的页面加上 `navigation`。写法见[定义页面路由](develop.md#定义页面路由)。
2. 门户中如果有 `portal-routes.ts`，把其中的路由逐个移进 `routes`；原来在 `components` 中按页面名提供的组件，移到对应路由上作为 `componentLoader`。然后删除 `portal-routes.ts`。
3. 服务端注册门户时只传门户信息：`register({ ...portalFromPackage(manifest), defaultInstalled: false })`。删除 `routeManifest`、`modules`、`definePortalRouteManifest`，以及 `@nocobase/app-plugin-multi-portal/shared/routes` 的导入。
4. 页面组件去掉外层的 `<Layout>`，只渲染自己的内容。

迁移时保留原来的授权。路由的 `name` 和 `group` 就是角色中已有的授权键，保持不变：

- 原来写 `module: 'reports'` 的页面，或页面名与原授权键不同的页面，改用 `group: 'reports'`。
- 需要单独授权的子页面加上 `access: 'own'`。
- 原来的自定义 `authz` 保留。

### 改用 PortalLayout

把 `client/layout.tsx` 改为使用 `@nocobase/app-plugin-multi-portal/client/layout` 中的 `PortalLayout`：

```tsx
<PortalLayout logo={<Logo title={title} />} switcher={<PortalSwitcher />} />
```

菜单由路由的 `navigation` 生成，原来布局中的菜单数组可以删除。原来多个页面共用的包装内容移到这个布局中。语言文件中只保留页面文案；Logo 需要显示门户名称时，用 `usePortalText()` 读取。其他属性见[导航与门户布局](develop.md#导航与门户布局)。

### 更新链接和接口

- 指向 `/workbench` 的链接改为 `/portals`。
- 调用 `GET /api/portalCenter/workbench` 的地方改为 `GET /api/portalCenter/myPortals`。
- `myPortals` 现在只返回已安装、并且成员开启了门户访问的门户，不再带 `href`、`landing` 和 `modules`。面向成员的门户链接改用 `useMyPortals()`，它返回的门户带有成员实际可以进入的 `href`。
- 原来用 `requireModule` 保护的接口，改用 `requirePortalAccess` 加业务操作权限。如果原来只靠页面授权保护某个操作，给相关角色和 API 密钥授予对应的业务操作，再在接口中检查这个操作。
- 门户原有的业务接口可以保留原地址，继续用 `requirePortalAccess` 检查门户访问。新增的接口建议用 `definePortalApiRoutes` 挂到 `/api/portals/<key>` 下，见[定义门户接口](develop.md#定义门户接口)；把已有接口移过去会改变地址，调用方要一起修改。

## 检查角色授权并验证

升级多门户插件时，迁移 `202611250001_portal_access_grants` 会为已有角色和带页面授权的 API 密钥补上门户访问权限；原来开放整个门户的授权继续覆盖整个门户，API 密钥的权限仍不超过所有者。迁移后在 **角色与权限 → 多门户** 中检查各角色：

- 每个门户的访问开关和已开放页面数与迁移前一致。「已开放 x/y」只计算加上上级页面的检查后、至少能打开一个页面的授权项；单独授权的子页面在父页面未开放时不计入，但勾选仍然保留。
- 新增的页面没有被意外开放。

然后对每个门户检查：

- 从我的门户和切换器能进入，导航、头部按钮和头像菜单正常显示。
- 旧地址 `/workbench` 跳转到我的门户，门户原来的地址仍能打开。
- 分别用管理员、有权限和无权限的账号检查页面和业务接口，结果与迁移前一致。
- 开启了门户访问但没有开放任何页面的账号，进不去门户，我的门户中也不显示这个门户。

最后运行门户和应用的检查：

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm build
```
