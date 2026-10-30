---
title: 插件加载与扩展
---

插件通过公开入口声明贡献，由目标应用显式组装。依赖安装、运行端注册和最终业务接入是三个需要分别确认的步骤。

## 三个运行端独立注册

| 运行端 | 插件入口 | 应用入口 |
| --- | --- | --- |
| Client | `package/client` | `client/plugins.ts` |
| Server | `package/server` | `server/plugins.ts` |
| CLI | `package/cli` | `cli/plugins.ts` |

插件按需提供入口；只分发 Skill 的包可能没有任何运行时入口。客户端注册不自动启用服务端，服务端注册也不会给页面安装组件。

## 声明如何进入应用

`defineClientPlugin()`、`defineServerPlugin()` 和 `defineCliPlugin()` 描述贡献。目标应用导入插件工厂，将注册结果加入各端聚合声明。运行时解析这些贡献后，在相应阶段注册服务、构造路由、加载资源或挂载 React Provider。

导入声明时不应该读业务数据、启动任务或建立连接。声明选项用于稳定的组装参数；部署凭据放在服务端配置，不能放入客户端插件选项。

## 依赖和扩展边界

插件向其他插件公开服务接口和 Token，由消费者从公开导出使用。缺少依赖应在组装或启动阶段给出清楚错误，而不是深层相对导入另一个包的私有文件。

页面替换可以使用客户端路由组件覆盖：替换页面加载器，保留插件定义的路径、身份与权限元数据。需要源码级自由组合的 UI 资产，通过独立 Registry 分发；它不自动注册运行时插件。

## 验证接入

检查三端实际注册、数据库资源是否执行、路由是否可访问，以及应用构建后的运行结果。`plugin inspect` 读取静态接入面，不能证明业务已工作；注册快照也只表示已声明的插件，不表示全部能力都被使用。

操作流程见[管理插件](../../developing-apps/manage-plugins.md)，源码资产见[发布 UI 源码资产](../../extension-development/frontend-components.md#按需分发-ui-源码资产)。

## 接口与实现

- [Client plugin composition](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Server plugin contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/plugins/index.ts)
- [CLI contributions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
