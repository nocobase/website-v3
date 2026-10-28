---
title: 服务端运行时
---

服务端运行时负责配置、资源路径、服务生命周期以及 HTTP 和 WebSocket 接入。它将业务应用与监听端口的宿主分开，使同一应用可以用于独立服务、命令或测试。

## 运行时与应用实例

```text
server/runtime.ts + server/config/
  → resolved runtime
  → createApp(runtime)
  → Application + ServiceProviders
  → app.start()
  → HTTP / WebSocket host
```

`server/runtime.ts` 声明配置加载、插件、ServiceProvider、路由和语言资源；`server/app.ts` 的 `createApp(runtime)` 组装应用及框架服务。`Application` 持有 `config`、`paths`、`container` 和请求处理入口。

`app.start()` 完成应用内部启动。真正的网络监听由宿主负责，所以 Provider 的 `ready()` 不等于端口已可访问。测试可通过应用的 `fetch` 边界发送请求，无需额外监听端口。

## 注册业务能力

| 内容 | 接入位置 |
| --- | --- |
| 配置分区 | `server/config/` 与其聚合入口 |
| 业务服务 | `server/providers/` 或插件 `serviceProviders` |
| HTTP 接口 | 应用路由数组或插件 `routes` |
| 数据资源 | `database/<connection>/` 或插件数据库声明 |
| 插件 | `server/plugins.ts` |

从现有容器解析数据库、日志、任务等框架服务。插件不应另建一个应用容器或复制宿主服务，避免连接、状态和关闭顺序分裂。

## 请求与全局状态

应用容器通常存活整个进程；用户身份和本次输入属于请求。不要把“当前用户”写入单例字段。路由验证身份后将必要参数传给业务服务，需要事务时显式传递事务连接。

路径使用 `app.paths` 解析，避免依赖启动命令的工作目录。业务上传和 SQLite 文件等运行数据必须使用持久化位置，不能写入可替换的构建目录。

## 故障与关闭

在异步生命周期中建立、检查和释放资源。清理函数应允许部分初始化，仅关闭自己拥有的资源。严格启动策略、健康检查与进程管理属于宿主接入，需要与应用内部就绪状态一起检查。

继续阅读[生命周期](lifecycle.md)、[服务端服务](../services/server-services.md)和[选择部署方式](../../deployment/choose-a-deployment-method.md)。

## 接口与实现

- [Application](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Server runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/server/runtime.ts)
