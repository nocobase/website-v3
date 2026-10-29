---
title: 客户端运行时
---

客户端运行时把配置、服务、插件、路由与 React 扩展组合成一个浏览器应用。应用与插件都向同一套运行时提供声明，最终的页面布局与组件由应用决定。

## 组装与渲染

```text
client/runtime.ts
  → resolveAppRuntime()
  → ClientApplication
  → app.start()
  → AppClientRoot
  → React Providers + routes
```

`client/runtime.ts` 聚合应用自己的扩展及 `client/plugins.ts` 中的插件。`resolveAppRuntime()` 解析声明和页面中的公开配置；`ClientApplication` 持有配置、服务容器和生命周期。宿主等待 `app.start()` 成功后再渲染 `AppClientRoot`。

启动所需的声明使用静态导入。页面组件、大型 SDK 和语言消息可放在延迟加载边界；不要在声明模块顶层启动连接或访问 DOM。

## 应用持有哪些资源

| 资源 | 职责 |
| --- | --- |
| `app.config` | 已合并的浏览器公开配置 |
| `app.services` / `app.container` | 应用级服务的解析与注册 |
| `apiClientToken` | HTTP 客户端 |
| `realtimeClientToken` | 实时连接与主题订阅 |
| 路由声明 | 页面路径、加载方式、身份与访问约束 |
| `reactProviders` | 包裹页面树的 React 上下文 |

这些资源属于当前浏览器应用实例。多个浏览器窗口、服务端以及另一个应用不会共享这个容器。

## 修改应用时的入口

新增页面先接入 `client/routes.ts`；新增可复用服务通过客户端 ServiceProvider 注册；树内上下文通过 React Provider 声明。模板已完成运行时连接时，通常只改对应聚合文件。

`AppClientRoot` 自带浏览器路由。测试需要自选路由器时，可以在自己的 Router 下使用 `AppClientProviders`，或使用 `@nocobase/app-testing/client` 的应用渲染工具，避免嵌套两个 BrowserRouter。

## 状态与释放

服务值改变不会自动引起 React 重渲染。界面通过 state、Context 或订阅读取最新值。离开应用时，宿主卸载 React 根节点，并调用 `app.shutdown()` 释放 Provider 拥有的资源。

继续阅读[客户端服务](../services/integration.md#客户端服务)、[React Provider](react-providers.md)和[页面、路由与导航](../../developing-apps/pages-routes-and-navigation.md)。

## 接口与实现

- [Client runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Default runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/client/runtime.ts)
