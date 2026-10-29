---
title: 服务契约与 Token
description: 了解如何用服务契约和 Token 定义稳定的服务入口，以及 Token 的身份、契约设计、演进与测试替身。
---

服务契约描述调用方能做什么，Token 则用来在容器中找到具体的实现。把接口和 Token 放在公开的模块中，应用、插件和测试就能使用同一个约定，而不必引用内部的类。

## 定义稳定的入口

```ts
import { createServiceToken } from '@nocobase/service-provider';

export interface TitleService {
  normalize(value: string): string;
}

export const titleServiceToken =
  createServiceToken<TitleService>('@example/orders/title-service');
```

实现类可以改变，使用方始终依赖 `TitleService`。跨插件使用时，从提供方公开的 `client` 或 `server` 入口重新导出接口和 Token，并在使用方的依赖中声明这个包。

## 名称不等于身份

`createServiceToken()` 每次调用都会创建一个新对象。即使传入的字符串相同，两个 Token 也不是同一个标识。使用方必须导入提供方导出的那个 Token，不能自己重新创建。

包被重复安装、从私有的深层路径导入、打包方式错误，都可能让同一份源码在运行时出现两个模块实例。共享的运行时依赖应按公开包声明的 peer 范围对齐；可以用包管理器检查重复的版本和导出边界。

## 设计契约

契约应优先返回业务数据，并明确异步结果、错误和资源的归属。避免让每个方法都必须传入整个 Application、Hono Context 或组件实例，否则服务会与具体的宿主紧密耦合。

前后端可以共享数据类型，但服务 Token 不会跨网络解析。浏览器中的服务需要调用服务端能力时，通过 API 客户端实现这个契约。服务端的私密依赖不能因为“共享接口”而进入浏览器包。

## 演进与测试替身

新增必需的方法或改变返回值的含义会影响所有使用方，需要与版本号和测试一起更新。容器会拒绝重复绑定；测试替身应在组装测试时选择，而不是在应用启动之后悄悄覆盖原有的绑定。

继续阅读 [服务容器](container.md)、[客户端服务](integration.md#客户端服务) 和 [服务端服务](integration.md#服务端服务)。

## 接口与实现

- [Token identity](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/token.ts)
- [Container bindings](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
