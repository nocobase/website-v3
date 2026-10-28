---
title: Logging
---

`@nocobase/logging` provides structured records, source labels, outputs and rotation. Resolve `loggingToken` from `@nocobase/app-server/logging` in an application.

## Business context

```ts
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderLogger(container: ServiceResolver) {
  return container.resolve(loggingToken).getLogger('@example/orders');
}
```

Use the returned logger, for example `logger.info({ orderId }, 'Order submitted')` or `logger.error({ err: error, orderId }, 'Order submission failed')`. Put searchable fields in the object instead of embedding everything in a string.

The source passed to `getLogger(source)` becomes the `logger` field; it does not select a separate file automatically. The no-argument source is normally `system`, while the default file stem remains `app`.

## Outputs

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

Files always contain JSON Lines. `console.pretty` affects terminals only. Application logs live in persistent `storage/logs/`; source names do not change the directory. This example routes request records to their own file while other sources share app files.

Files rotate at UTC date boundaries and segment limits. Retention days and total-size budgets cover log files in the directory. One process should own each directory; rotation state is not coordinated across processes. App Host output policies and identity bindings take precedence for hosted apps.

## Diagnosis and data handling

Retain correlation IDs, business record IDs, sources and error objects to trace requests into tasks. Temporarily use debug for startup details or request-start information, then restore an appropriate level.

Do not deliberately log passwords, cookies, tokens, full personal records or file contents. Built-in redaction does not replace careful field selection. Diagnostic logs need retention policies and do not replace durable business audit records.

The host waits for cleanup at shutdown; standalone users own the lifecycle. Preserve the log directory during deployment and monitor disk use.

## Interfaces and implementation

- [Logging configuration and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging/README.md)
