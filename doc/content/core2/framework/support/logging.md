---
title: Logging
description: Record structured business logs through the host's loggingToken, and learn how applications and plugins share the logging service, how outputs and rotation are configured, and how to diagnose problems and handle sensitive data.
---

`@nocobase/logging` provides structured logs, source labels, outputs and rotation. Applications get the logging service through `loggingToken` from `@nocobase/app-server/logging`.

## Recording business context

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderLogger(container: ServiceResolver) {
  return container.resolve(loggingToken).getLogger('@example/orders');
}
```

Log with the returned logger, for example `logger.info({ orderId }, 'Order submitted')`, and on failure `logger.error({ err: error, orderId }, 'Order submission failed')`. Put fields you want to search on in the object instead of concatenating everything into the message string.

The source passed to `getLogger(source)` is recorded as the `logger` field; it does not create a separate file automatically. Without an argument, `system` is usually the source, and the default file name is still `app`.

## Sharing logs between applications and plugins

In an application or plugin Provider, pass `app.container` to `orderLogger()` and inject the resulting logger into the business service. Use a stable package or module name as the source, so that logs are easy to filter by the `logger` field; outputs, log levels and rotation are managed centrally by the application configuration. Plugins must not reconfigure or close the shared logging service.

Requests, background jobs and scheduled runs can each have a different context. When you need to correlate them, pass business IDs and correlation IDs explicitly; never assume that the HTTP context appears in background jobs automatically. In tests, you can pass the business service a logger substitute that records calls, to verify key fields and error branches; file rotation belongs in output integration tests.

## Output configuration

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

File output is always in JSON Lines format, and `console.pretty` only affects how logs look in the terminal. Application logs are stored in the persistent `storage/logs/` directory, which does not change with the source name. The example writes request logs to a separate file, while all other logs share the app file.

Log files rotate by UTC date and by the size of a single file; the retention days and the total size limit apply to all log files in the directory. Each log directory should be managed by only one process, because processes do not coordinate rotation state. When you use App Host, the host's output policy and identity binding take precedence.

## Diagnosing problems and handling data

Keep request correlation IDs, business record IDs, module sources and error objects first, so that you can trace a request all the way into background jobs. When you need startup details or request-start information, use the debug level temporarily, and restore a level suitable for the environment after diagnosis.

Do not deliberately log passwords, cookies, tokens, complete personal profiles or the contents of large files. The built-in redaction cannot replace choosing log fields carefully. Log files need their own retention policy, and ordinary diagnostic logs cannot replace business audit records that must not be lost.

The host waits for logging to finish cleaning up at shutdown; when the library is used on its own, its user arranges the lifecycle. When deploying, keep the log directory and monitor disk usage.

## Interfaces and implementation

- [Logging configuration and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/logging/token.ts)
