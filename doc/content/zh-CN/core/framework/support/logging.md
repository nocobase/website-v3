---
title: 日志
---

`@nocobase/logging` 提供结构化日志、来源标记、输出和轮换。应用通过 `@nocobase/app-server/logging` 的 `loggingToken` 取得服务。

## 记录业务上下文

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderLogger(container: ServiceResolver) {
  return container.resolve(loggingToken).getLogger('@example/orders');
}
```

调用返回的 logger，例如 `logger.info({ orderId }, 'Order submitted')`，失败时使用 `logger.error({ err: error, orderId }, 'Order submission failed')`。把可检索字段放在对象中，不要全部拼进消息字符串。

`getLogger(source)` 的 source 记录为 `logger` 字段，不会自动创建独立文件。无参数时通常使用 `system` 来源；默认文件名仍是 `app`。

## 输出配置

```yaml
logging:
  level: info
  file:
    enabled: true
    name: app
    retentionDays: 7
    maxFileSizeMB: 10
    maxTotalSizeMB: 500
  console:
    enabled: true
    pretty: false
  loggers:
    request:
      file:
        name: request
```

文件输出始终是 JSON Lines，`console.pretty` 只影响终端。应用日志放在持久化的 `storage/logs/`，不会因来源名不同而改变目录。示例将 request 日志送到自己的文件，其余共享 app 文件。

文件按 UTC 日期和单段大小轮换；保留天数和总大小预算覆盖目录里的日志文件。一个日志目录应由一个进程管理，多进程不会协调轮换状态。使用 App Host 时，宿主的输出策略与身份绑定优先。

## 排查与数据处理

优先保留请求关联 ID、业务记录 ID、模块来源和错误对象，便于从请求追踪到任务。需要启动细节或请求开始信息时临时使用 debug，排查后恢复适合环境的级别。

不要主动写入密码、Cookie、Token、完整个人资料或大文件内容。内置脱敏不能替代正确选择日志字段。日志文件需要自己的保留策略；普通诊断日志也不能替代不可丢失的业务审计记录。

宿主在关闭时等待日志清理；独立库使用者自行安排生命周期。部署时保留日志目录并监测磁盘占用。

## 接口与实现

- [Logging configuration and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging/README.md)
