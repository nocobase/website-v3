---
title: 应用启动与生命周期
---

生命周期把服务声明、异步初始化、消费者启动和清理放在明确阶段。应用与插件共用这个顺序，因此可在使用依赖前知道它已经完成哪一阶段。

## 阶段顺序

```text
Server: validate → register → locales → boot → routes → start → ready
Client: register → boot → render configuration → validation → start → ready
Shutdown: reverse Provider order
```

每阶段先遍历全部 Provider，再进入下一阶段，不是某个 Provider 一次执行完所有钩子。服务端还会在就绪阶段之后处理模板的示例数据逻辑；这不属于业务请求的事务。

| 钩子 | 合适的工作 |
| --- | --- |
| `register()` | 同步绑定实例或延迟工厂 |
| `boot()` | 解析依赖、异步准备、登记处理器 |
| `start()` | 开始监听、订阅或消费后台工作 |
| `ready()` | 全部 Provider 已启动后的应用内部准备 |
| `shutdown()` | 停止并等待自己拥有的资源 |

服务端路由工厂在 `boot()` 后、`start()` 前执行，可以解析服务，但不能假设消费者已经开始工作。客户端 React 树在应用启动成功之后由宿主渲染。

## 依赖与资源归属

需要其他 Provider 的服务时，注册阶段只声明工厂，将解析放到适当阶段。一个 Provider 依赖另一个资源的启动顺序，必须在聚合入口明确安排，不能依赖文件名的偶然顺序。

关闭时使用 `resolveIfCreated()` 检查已创建实例，避免为了关闭服务而首次创建它。数据库等共享资源由其所有者关闭，消费方只释放自己的订阅、任务处理器或连接句柄。

## 启动失败与验证

清理需要容忍部分初始化，并可重复执行。关闭失败不能用空 `catch` 隐藏；记录原因，让宿主判断进程能否干净退出。业务代码应验证正常启动、依赖缺失、初始化失败和正在处理任务时关闭这几条路径。

`ready()` 只表示应用内部阶段完成，外部端口、反向代理和数据库可用性还需相应健康检查。完整 Provider 示例见[ServiceProvider](../../extension-development/service-provider.md)。

## 接口与实现

- [Provider registry](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/registry.ts)
- [Server lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Client lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
