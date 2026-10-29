---
title: 日志
description: 通过宿主的 loggingToken 记录结构化的业务日志，了解应用与插件如何共用日志服务、输出与轮换的配置，以及排查问题和处理敏感数据的做法。
---

`@nocobase/logging` 提供结构化日志、来源标记、输出和轮换。应用通过 `@nocobase/app-server/logging` 中的 `loggingToken` 取得日志服务。

## 记录业务上下文

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderLogger(container: ServiceResolver) {
  return container.resolve(loggingToken).getLogger('@example/orders');
}
```

使用返回的 logger 记录日志，例如 `logger.info({ orderId }, 'Order submitted')`；失败时使用 `logger.error({ err: error, orderId }, 'Order submission failed')`。把需要检索的字段放在对象中，不要全部拼接进消息字符串。

`getLogger(source)` 中的 source 会记录为 `logger` 字段，并不会自动创建一个独立的文件。不传参数时，通常使用 `system` 作为来源；默认的文件名仍然是 `app`。

## 应用与插件共用日志

在应用或插件的 Provider 中，把 `app.container` 传给 `orderLogger()`，再把得到的 logger 注入业务服务。来源名称使用稳定的包名或模块名，方便按 `logger` 字段过滤；输出位置、日志级别和轮换由应用配置统一管理。插件不要重新配置或关闭共享的日志服务。

请求、后台任务和定时执行的上下文可能各不相同。需要把它们关联起来时，请显式传递业务 ID 和关联 ID，不能假设 HTTP 上下文会自动出现在后台任务中。测试时，可以给业务服务传入一个记录调用情况的 logger 替身，验证关键字段和错误分支；文件轮换则属于输出的集成测试。

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

文件输出始终是 JSON Lines 格式，`console.pretty` 只影响终端中的显示。应用日志存放在持久化的 `storage/logs/` 中，不会因为来源名称不同而改变目录。示例把 request 日志写入单独的文件，其余日志共用 app 文件。

日志文件按 UTC 日期和单个文件的大小轮换；保留天数和总大小的上限作用于目录中所有的日志文件。一个日志目录应只由一个进程管理，多个进程之间不会协调轮换的状态。使用 App Host 时，以宿主的输出策略和身份绑定为准。

## 排查问题与数据处理

优先保留请求的关联 ID、业务记录 ID、模块来源和错误对象，便于从请求一路追踪到后台任务。需要查看启动细节或请求开始的信息时，可以临时使用 debug 级别，排查结束后再恢复为适合当前环境的级别。

不要主动写入密码、Cookie、Token、完整的个人资料或大文件的内容。内置的脱敏功能不能代替正确地选择日志字段。日志文件需要有自己的保留策略；普通的诊断日志也不能代替不可丢失的业务审计记录。

宿主在关闭时会等待日志完成清理；独立使用这个库时，由使用者自行安排生命周期。部署时请保留日志目录，并监控磁盘的占用。

## 接口与实现

- [Logging configuration and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/logging/token.ts)
