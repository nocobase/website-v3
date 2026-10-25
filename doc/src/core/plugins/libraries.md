---
title: Libraries
status: Body to be completed
description: Packages the app uses directly, with no registration needed. Database and record lifecycle each have their own page, and the rest are listed here.
---

> [!PENDING] Body to be written
> The tables below come from `packages/libs/` on the NocoBase repository's `v3-develop` branch (2026-10-23). The body will cover each library: what it solves, how the app uses it, and what to configure at deployment.

## Libraries the app uses directly

| Library | What it does | Default template | At deployment |
| --- | --- | --- | --- |
| [Database](db.md) `@nocobase/db` | Tables, queries, migrations, database dialects | Included | Choose a database |
| [Record lifecycle](lifecycle.md) `@nocobase/lifecycle` | Workflows: statuses, transitions, follow-up steps | Included | — |
| `@nocobase/jobs` | Background jobs that run on a schedule or repeat, in memory or on Redis (BullMQ) | Included | Multiple instances must use Redis, and Redis must have persistence on |
| `@nocobase/queue` | App queues: producers and consumers, on Redis or in a single-process memory queue | Included | Same as above |
| `@nocobase/realtime` | Realtime page updates: browser subscription and permission-aware server push | Included | Use Redis with multiple processes |
| `@nocobase/drive` | File storage: local, S3-compatible, Alibaba Cloud OSS | Included | Storage credentials, backups |
| `@nocobase/secrets` | Encrypted credentials and keys, with rotation | With the runtime | The `secrets` configuration; if the keys are lost, saved credentials cannot be decrypted |
| `@nocobase/caching` | Caching | Included | — |
| `@nocobase/logging` | Logging | Included | Log level and output |
| `@nocobase/i18n` | The language runtime | Included | — |
| `@nocobase/authorization` | The core that computes permissions, which the Permissions plugin is built on | Included | — |
| `@nocobase/mailer` | SMTP and Resend sending, used by the Authentication and Notification channels plugins to send email | With the Authentication and Notification channels plugins | Email provider credentials |
| `@nocobase/config` | Reading and merging configuration | Included | — |
| `@nocobase/service-provider` | The service container | Included | — |
| `@nocobase/repository-input`, `@nocobase/snowflake`, `@nocobase/session` | Query input, ID generation, sessions | Included | — |

## Mainly for plugins and tools

`@nocobase/api-client` (a client for NocoBase APIs), `@nocobase/agent-protocol` and `@nocobase/acp-bridge` (the protocols for agent runs and sessions), `@nocobase/cli-envelope`, `@nocobase/markdown-mermaid`, `@nocobase/db-testing`, `@nocobase/db-testkit`.
