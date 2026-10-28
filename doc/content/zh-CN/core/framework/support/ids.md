---
title: ID 生成
---

`@nocobase/snowflake` 生成带时间顺序的 JavaScript 安全整数 ID。应用通过 `@nocobase/app-server/id-generator` 的 `idGeneratorToken` 共享生成器。

## 使用宿主生成器

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { ServiceResolver } from '@nocobase/service-provider';

export function nextOrderId(container: ServiceResolver): string {
  return container.resolve(idGeneratorToken).generateString();
}
```

`generate()` 返回安全整数，`generateString()` 返回其字符串形式。接口与数据库字段保持一致即可；不要把任何长度的第三方整数 ID 都强制转成 JavaScript number。

需要独立运行时可创建 `new SnowflakeIdGenerator({ workerId })`。一个进程内复用同一生成器，不要在每次调用时创建新实例，否则同秒内序列会重新开始。

## Worker 与时钟

本实现使用秒级时间、5 位 worker 和 16 位序列。`workerId` 范围为 0–31，通过 `snowflake.workerId` 或 `SNOWFLAKE_WORKER_ID` 设置。同一 ID 空间里并发运行的生成器必须使用不同 worker ID，配置不会自动协调分配。

同一秒序列用尽、时钟回退到上一个生成时间之前，或数值超出安全整数范围时会抛错，不会静默返回重复 ID。服务部署需要稳定时钟与 worker 分配；快速重启同一 worker 也要考虑同秒序列复用风险。数据库唯一约束仍然必要。

## 业务边界

时间有序不等于严格的全局提交顺序，不同 worker 的 ID 不能证明事务先后。ID 包含时间和 worker 信息，也不是不可猜测的认证凭据。

不要把 Snowflake 用作密码重置链接、会话密钥或 API Token。数据库自动主键、业务编号与对外随机标识可以各自选择合适机制；记录 ID 生成也不会替代[访问控制](../security/authorization.md)。

## 接口与实现

- [Snowflake implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake/src/snowflake.ts)
- [Host ID service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/id-generator/provider.ts)
