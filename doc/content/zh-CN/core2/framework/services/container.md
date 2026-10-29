---
title: 服务容器
description: 了解服务容器如何注册和解析服务、如何传入依赖，以及单例的作用域和失败处理。
---

服务容器把服务的使用者与服务的创建方式分开：调用方依赖接口和 Token，应用在组装时决定使用哪个实现。客户端和服务端都采用这套机制，但各自拥有自己的实例。

## 注册与解析

```ts
import { ServiceContainer, createServiceToken } from '@nocobase/service-provider';

interface Titles { normalize(value: string): string }
const titlesToken = createServiceToken<Titles>('example.titles');
const container = new ServiceContainer();
container.singleton(titlesToken, () => ({ normalize: (value) => value.trim() }));

const titles = container.resolve(titlesToken);
console.log(titles.normalize('  Order  ')); // Order
```

这是一个可以独立运行的容器示例。应用代码应使用已有的 `app.container`，不要为每个页面、每个请求或每个插件新建全局容器。

| 方法 | 行为 |
| --- | --- |
| `instance(token, value)` | 注册一个已经创建好的值 |
| `singleton(token, factory)` | 第一次解析时同步创建，之后始终返回同一个实例 |
| `resolve(token)` | 解析服务；服务缺失或存在循环依赖时报错 |
| `has(token)` | 检查是否已经绑定，不会触发创建 |
| `resolveIfCreated(token)` | 只返回已经创建的值，尚未创建时返回 `undefined` |

## 依赖如何传入

`singleton` 的工厂函数会收到一个 resolver，可以用它解析其他已注册的服务，再通过构造函数传给业务实现。这样业务类在测试中可以直接接收替身，不需要了解应用对象。

工厂函数是同步的。数据库连接、SDK 登录等异步准备工作，应放在 ServiceProvider 的生命周期中进行，以免把 Promise 误当成服务实例。

## 作用域与失败

这里的单例只在一个容器内唯一，并不是跨进程或跨浏览器的单例。容器不会自动创建请求作用域；用户身份、事务和取消信号应作为方法参数传递。

同一个 Token 重复绑定会报错，循环依赖也会被检测出来。工厂执行失败后，这个绑定会保持失败状态，不要把首次解析当成自动重试的循环。需要可恢复的连接时，由服务自己实现明确的恢复策略。

注册的位置与启动顺序见 [ServiceProvider 与服务生命周期](../../extension-development/service-provider.md)，跨包共享的服务标识见 [服务契约与 Token](tokens.md)。

## 接口与实现

- [Container](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
