---
title: 客户端运行时
description: 了解客户端运行时如何把配置、服务、插件、路由和 React 扩展组合成一个浏览器应用。
---

客户端运行时把配置、服务、插件、路由和 React 扩展组合成一个浏览器应用。应用和插件都向同一套运行时提供声明，最终的页面布局和组件由应用决定。

## 组装与渲染

```text
client/runtime.ts
  → resolveAppRuntime()
  → ClientApplication
  → app.start()
  → AppClientRoot
  → React Providers + routes
```

`client/runtime.ts` 汇总应用自己的扩展，以及 `client/plugins.ts` 中的插件。`resolveAppRuntime()` 解析这些声明以及页面中的公开配置；`ClientApplication` 持有配置、服务容器和生命周期。宿主在 `app.start()` 成功之后，才渲染 `AppClientRoot`。

启动所需的声明使用静态导入。页面组件、大型的 SDK 和语言消息，可以放在延迟加载的边界之后；不要在声明模块的顶层启动连接或访问 DOM。

## 应用持有哪些资源

| 资源 | 职责 |
| --- | --- |
| `app.config` | 合并后的浏览器公开配置 |
| `app.services` / `app.container` | 应用级服务的解析和注册 |
| `apiClientToken` | HTTP 客户端 |
| `realtimeClientToken` | 实时连接和主题订阅 |
| 路由声明 | 页面路径、加载方式、身份和访问约束 |
| `reactProviders` | 包裹页面树的 React 上下文 |

这些资源属于当前这个浏览器中的应用实例。多个浏览器窗口、服务端以及另一个应用，都不会共享这个容器。

## 修改应用时的入口

新增页面，先接入 `client/routes.ts`；新增可以复用的服务，通过客户端 ServiceProvider 注册；组件树内的上下文，通过 React Provider 声明。只要模板已经完成了运行时的连接，通常只需修改对应的汇总文件。

`AppClientRoot` 自带浏览器路由。测试中需要自行选择路由器时，可以在自己的 Router 之下使用 `AppClientProviders`，或者使用 `@nocobase/app-testing/client` 提供的应用渲染工具，以免嵌套两个 BrowserRouter。

## 状态与释放

服务中的值发生改变，并不会自动引起 React 重新渲染；界面需要通过 state、Context 或订阅来读取最新的值。离开应用时，宿主会卸载 React 根节点，并调用 `app.shutdown()` 释放 Provider 拥有的资源。

继续阅读 [客户端服务](../services/integration.md#客户端服务)、[React Provider 的注册与挂载](react-providers.md) 和 [页面、路由与导航](../../developing-apps/pages-routes-and-navigation.md)。

## 接口与实现

- [Client runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Default runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/client/runtime.ts)
