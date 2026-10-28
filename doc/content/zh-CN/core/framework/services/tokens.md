---
title: 服务契约与 Token
---

服务契约描述调用方能够做什么；Token 用来在容器中找到实现。将接口与 Token 放在公开模块，可以让应用、插件和测试使用同一约定，而无需引用内部类。

## 定义稳定的入口

```ts
import { createServiceToken } from '@nocobase/service-provider';

export interface TitleService {
  normalize(value: string): string;
}

export const titleServiceToken =
  createServiceToken<TitleService>('@example/orders/title-service');
```

实现类可以变化，消费方继续依赖 `TitleService`。跨插件使用时，从提供方的公开 `client` 或 `server` 入口重新导出接口与 Token，并在消费者依赖中声明该包。

## 名称不是身份

`createServiceToken()` 每次都会创建新对象。即使字符串相同，两个 Token 也不是同一标识。消费方必须导入提供方导出的原始 Token，不能自行重建。

包重复安装、私有深层路径和错误的打包方式都可能让相同源码产生两份运行时模块。共享运行时依赖按公开包的 peer 范围对齐；用包管理器检查重复版本和导出边界。

## 设计契约

契约优先返回业务数据，明确异步结果、错误和资源归属。避免将整个 Application、Hono Context 或组件实例作为所有方法的必需参数；这些会让服务与具体宿主紧密耦合。

前后端可以共享数据类型，但服务 Token 并不会跨网络解析。浏览器服务调用服务端能力时，通过 API 客户端实现其契约。服务端私密依赖不能因为“共享接口”进入浏览器包。

## 演进与替身

新增必需方法或改变返回语义会影响所有消费者，应与版本和测试一起更新。容器拒绝重复绑定；测试替身应在测试组装时选择，而不是在应用启动后偷偷覆盖原绑定。

继续阅读[服务容器](container.md)、[客户端服务](client-services.md)和[服务端服务](server-services.md)。

## 接口与实现

- [Token identity](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/token.ts)
- [Container bindings](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
