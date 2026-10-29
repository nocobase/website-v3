---
title: 应用启动与生命周期
description: 了解 Provider 生命周期的各个阶段及其执行顺序，以及资源的归属、启动失败和关闭的处理方式。
---

生命周期把服务的声明、异步初始化、消费者的启动和资源清理分成几个明确的阶段。应用和插件遵循同一个顺序，因此在使用某个依赖之前，就能知道它已经完成了哪个阶段。

## 阶段顺序

```text
Server: validate → register → locales → boot → routes → start → ready
Client: register → boot → render configuration → validation → start → ready
Shutdown: reverse Provider order
```

每个阶段会先遍历所有 Provider，再进入下一个阶段；并不是一个 Provider 一次执行完全部钩子。服务端在就绪阶段之后，还会处理模板的示例数据逻辑，这部分不属于业务请求的事务。

| 钩子 | 适合做的工作 |
| --- | --- |
| `register()` | 同步绑定实例或延迟创建的工厂 |
| `boot()` | 解析依赖、完成异步准备、登记处理器 |
| `start()` | 开始监听、订阅或消费后台工作 |
| `ready()` | 所有 Provider 都已启动后，完成应用内部的准备 |
| `shutdown()` | 停止并等待自己拥有的资源 |

服务端的路由工厂在 `boot()` 之后、`start()` 之前执行，此时可以解析服务，但不能假设消费者已经开始工作。客户端的 React 树在应用启动成功之后，才由宿主渲染。

## 依赖与资源归属

需要用到其他 Provider 的服务时，在注册阶段只声明工厂，把解析放到合适的阶段进行。如果一个 Provider 依赖另一个资源的启动顺序，必须在汇总入口中明确安排，不能依赖文件名碰巧形成的顺序。

关闭时，使用 `resolveIfCreated()` 检查实例是否已经创建，避免为了关闭一个服务而第一次创建它。数据库等共享资源由其所有者关闭，使用方只释放自己的订阅、任务处理器或连接句柄。

## 启动失败与验证

清理逻辑要能处理只完成了部分初始化的情况，并且可以重复执行。关闭失败时，不要用空的 `catch` 掩盖，而应记录原因，让宿主判断进程能否干净地退出。业务代码应验证以下几条路径：正常启动、依赖缺失、初始化失败，以及在任务处理过程中关闭。

`ready()` 只表示应用内部的阶段已经完成；外部端口、反向代理和数据库是否可用，还需要相应的健康检查。完整的 Provider 示例见 [ServiceProvider 与服务生命周期](../../extension-development/service-provider.md)。

## 接口与实现

- [Provider registry](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/registry.ts)
- [Server lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Client lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
