---
title: ID 生成
description: 通过宿主的 idGeneratorToken 生成带时间顺序的整数 ID，了解 worker 与时钟的要求，以及 Snowflake ID 适用的业务边界。
---

`@nocobase/snowflake` 生成带时间顺序、在 JavaScript 中安全的整数 ID。应用通过 `@nocobase/app-server/id-generator` 中的 `idGeneratorToken` 共享同一个生成器。

## 使用宿主的生成器

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { ServiceResolver } from '@nocobase/service-provider';

export function nextOrderId(container: ServiceResolver): string {
  return container.resolve(idGeneratorToken).generateString();
}
```

`generate()` 返回安全整数，`generateString()` 返回它的字符串形式。接口与数据库字段的类型保持一致即可；不要把任意长度的第三方整数 ID 都强制转换为 JavaScript 的 number。

需要独立运行时，可以创建 `new SnowflakeIdGenerator({ workerId })`。在一个进程内应复用同一个生成器，不要每次调用都创建新实例，否则同一秒内的序列会重新开始。

应用和插件共用宿主的生成器，通过业务服务或 Provider 传入 `app.container`。Worker 的配置由部署的应用统一提供，不能让每个插件各自用相同的 worker 创建生成器。浏览器需要新记录的 ID 时，请通过业务接口让服务端生成。

```yaml
snowflake:
  workerId: 1
```

这是当前实例的配置示例，多个实例应分配不同的值。业务测试可以注入一个返回固定序列的生成器替身；验证算法本身时，则使用独立的生成器，检查同一秒内的序列、时钟回退和边界值。

## Worker 与时钟

这个实现使用秒级的时间、5 位的 worker 和 16 位的序列。`workerId` 的范围是 0–31，可以通过 `snowflake.workerId` 或 `SNOWFLAKE_WORKER_ID` 设置。在同一个 ID 空间中并发运行的生成器必须使用不同的 worker ID，配置不会自动协调分配。

同一秒内的序列用尽、时钟回退到上一次生成的时间之前，或者数值超出安全整数的范围时，生成器会抛出错误，而不会静默返回重复的 ID。部署服务时需要稳定的时钟和明确的 worker 分配；快速重启同一个 worker 时，也要考虑同一秒内序列被重复使用的风险。数据库的唯一约束仍然是必要的。

## 业务边界

时间有序不等于严格的全局提交顺序，不同 worker 生成的 ID 无法证明事务的先后。ID 中包含时间和 worker 的信息，因此也不是不可猜测的认证凭据。

不要把 Snowflake ID 用作密码重置链接、会话密钥或 API Token。数据库的自动主键、业务编号和对外使用的随机标识，可以各自选择合适的机制；生成记录 ID 也不能代替访问控制。

## 接口与实现

- [Snowflake implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake/src/snowflake.ts)
- [Host ID service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/id-generator/provider.ts)
