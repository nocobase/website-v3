---
title: 服务端运行时
description: 了解服务端运行时如何管理配置、资源路径、服务生命周期，以及 HTTP 和 WebSocket 的接入。
---

服务端运行时负责配置、资源路径、服务的生命周期，以及 HTTP 和 WebSocket 的接入。它把业务应用与监听端口的宿主分开，使同一个应用可以用于独立服务、命令或测试。

## 运行时与应用实例

```text
server/runtime.ts + server/config/
  → resolved runtime
  → createApp(runtime)
  → Application + ServiceProviders
  → app.start()
  → HTTP / WebSocket host
```

`server/runtime.ts` 声明配置的加载、插件、ServiceProvider、路由和语言资源；`server/app.ts` 中的 `createApp(runtime)` 组装应用和框架服务。`Application` 持有 `config`、`paths`、`container` 以及请求处理的入口。

`app.start()` 完成的是应用内部的启动，真正的网络监听由宿主负责，所以 Provider 的 `ready()` 并不等于端口已经可以访问。测试可以通过应用的 `fetch` 边界发送请求，不需要额外监听端口。

## 注册业务能力

| 内容 | 接入位置 |
| --- | --- |
| 配置分区 | `server/config/` 及其汇总入口 |
| 业务服务 | `server/providers/`，或插件的 `serviceProviders` |
| HTTP 接口 | 应用的路由数组，或插件的 `routes` |
| 数据资源 | `database/<connection>/`，或插件的数据库声明 |
| 插件 | `server/plugins.ts` |

数据库、日志、任务等框架服务，都从现有的容器中解析。插件不应另建一个应用容器，或复制一份宿主的服务，以免连接、状态和关闭顺序出现分裂。

## 请求与全局状态

应用容器通常在整个进程期间存活，而用户身份和本次的输入只属于一次请求。不要把“当前用户”写进单例的字段。路由在验证身份之后，把必要的参数传给业务服务；需要事务时，显式传递事务连接。

路径使用 `app.paths` 解析，避免依赖启动命令时的工作目录。业务上传的文件和 SQLite 文件等运行数据，必须放在持久化的位置，不能写进可能被替换的构建目录。

## 故障与关闭

在异步的生命周期中建立、检查和释放资源。清理函数应能处理只完成了部分初始化的情况，并且只关闭自己拥有的资源。严格的启动策略、健康检查和进程管理属于宿主的接入，需要与应用内部的就绪状态一起检查。

继续阅读 [应用启动与生命周期](lifecycle.md)、[服务端服务](../services/integration.md#服务端服务) 和 [选择部署方式](../../deployment/choose-a-deployment-method.md)。

## 接口与实现

- [Application](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Server runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/server/runtime.ts)
