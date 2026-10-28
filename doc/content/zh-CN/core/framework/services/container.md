---
title: 服务容器与依赖注入
---

服务容器将服务的使用者与创建方式分开。调用方依赖接口和 Token，应用在组装时决定使用哪个实现。客户端和服务端都采用这套机制，但各自拥有实例。

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

这是可独立运行的容器示例。应用代码应使用已有 `app.container`，不要为每个页面、请求或插件新建全局容器。

| 方法 | 行为 |
| --- | --- |
| `instance(token, value)` | 注册已经创建的值 |
| `singleton(token, factory)` | 第一次解析时同步创建，之后返回同一实例 |
| `resolve(token)` | 解析服务；缺失或循环依赖时报错 |
| `has(token)` | 检查是否绑定，不触发创建 |
| `resolveIfCreated(token)` | 只返回已创建值，未创建时为 `undefined` |

## 依赖如何传入

`singleton` 工厂接收 resolver，可以解析其他已注册服务，再通过构造函数传入业务实现。业务类因此可以在测试中直接接收替身，无需知道应用对象。

工厂是同步的。数据库连接、SDK 登录或其他异步准备放在 ServiceProvider 的生命周期中，避免把 Promise 错当成服务实例。

## 作用域和失败

这里的单例属于一个容器，不是跨进程或跨浏览器单例。容器不自动创建请求作用域；用户身份、事务和取消信号作为方法参数传递。

同一个 Token 重复绑定会报错；循环依赖也会被检测。工厂失败后该绑定保留失败状态，不应将首次解析当成自动重试循环。需要可恢复连接时，由服务实现明确的恢复策略。

注册位置与启动顺序见 [ServiceProvider](../../extension-development/service-provider.md)，跨包身份见[服务契约与 Token](tokens.md)。

## 接口与实现

- [Container](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
