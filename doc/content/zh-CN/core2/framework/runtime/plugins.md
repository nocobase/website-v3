---
title: 插件加载与扩展
description: 了解插件如何在客户端、服务端和 CLI 三个运行端分别注册，声明如何进入应用，以及依赖与扩展的边界。
---

插件通过公开入口声明自己的贡献，再由目标应用显式地组装。安装依赖、在各个运行端注册、最终接入业务，是三个需要分别确认的步骤。

## 三个运行端分别注册

| 运行端 | 插件入口 | 应用入口 |
| --- | --- | --- |
| Client | `package/client` | `client/plugins.ts` |
| Server | `package/server` | `server/plugins.ts` |
| CLI | `package/cli` | `cli/plugins.ts` |

插件只需提供它用到的入口；只分发 Skills 的包，可能没有任何运行时入口。在客户端注册不会自动启用服务端的部分，在服务端注册也不会为页面安装组件。

## 声明如何进入应用

`defineClientPlugin()`、`defineServerPlugin()` 和 `defineCliPlugin()` 用来描述插件的贡献。目标应用导入插件工厂，把注册结果加入各个运行端的汇总声明。运行时解析这些贡献，并在相应的阶段注册服务、构造路由、加载资源或挂载 React Provider。

导入声明时，不应读取业务数据、启动任务或建立连接。声明选项用于传递稳定的组装参数；部署凭据应放在服务端配置中，不能放进客户端插件的选项。

## 依赖与扩展边界

插件向其他插件公开服务接口和 Token，使用方从公开导出中使用它们。依赖缺失时，应在组装或启动阶段给出清楚的错误，而不是通过深层的相对路径导入另一个包的私有文件。

替换页面可以通过覆盖客户端路由组件实现：替换页面的加载器，同时保留插件定义的路径、身份和权限元数据。需要在源码层面自由组合的 UI 资产，通过独立的 Registry 分发，它不会自动注册运行时插件。

## 验证接入

检查三个运行端的实际注册情况、数据库资源是否已经执行、路由能否访问，以及应用构建之后的运行结果。`plugin inspect` 读取的是静态的接入面，不能证明业务已经可以工作；注册快照也只表示声明了哪些插件，不表示这些插件的全部能力都已被使用。

操作流程见 [管理插件](../../developing-apps/manage-plugins.md)，源码资产见 [按需分发 UI 源码资产](../../extension-development/frontend-components.md#按需分发-ui-源码资产)。

## 接口与实现

- [Client plugin composition](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Server plugin contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/plugins/index.ts)
- [CLI contributions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
