---
title: Configuration loading, parsing and validation
---

`@nocobase/config` separates sources, parsing and reads. The application host adds sections, environment mappings, validation and browser-public fields. Business modules declare a configuration contract; deployments supply values.

## Sources and precedence

The default application merges code defaults, then `config.yml`, then declared environment mappings. Plain objects merge recursively; later arrays and scalars replace earlier ones. YAML `${NAME}` strings are not interpolated, and environment names are not automatically converted into arbitrary configuration paths.

At library level, `Config` loads values or bytes from Providers and parses bytes through Parsers. An object Provider supplies code defaults; a file Provider and YAML Parser supply file values. Standalone callers own loading order and reloading.

## Define a section

```ts
// server/config/orders.ts
import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { pageSize: 20 },
  env: { ORDERS_PAGE_SIZE: envInteger('pageSize') },
  public: ['pageSize'],
  validate(value, context) {
    if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) {
      context.error('pageSize', 'Expected an integer between 1 and 100.');
    }
  },
});
```

Add `orders` to `defaultAppConfigs()` in `server/config/index.ts` and update that aggregator's explicit return type. The YAML path becomes `orders.pageSize` and the environment variable is `ORDERS_PAGE_SIZE`. Update `config.example.yml` to expose the setting to new environments.

Plugins contribute configuration through their declaration; consumers override deployment values. Ship validation, defaults and declarations with the module rather than parsing the same environment variable independently in several services.

## Validation and public values

Validate types, ranges and combinations using `context.error(path, message)`. Avoid network dependencies and writes during validation. Use `secret` metadata for sensitive environment mappings.

The browser can read `client`; other sections expose only leaf paths listed in `public`. Here `public: ['pageSize']` does not expose the entire orders section. Keep authentication keys and database passwords out of public configuration.

## Reads and updates

Server services use `app.config.get()` and related accessors; clients consume host-published values. Reloading configuration does not automatically rebuild existing connections or services. Services must define their own hot-update behavior; otherwise apply changes with a controlled restart.

Inspect declarations with `pnpm nocobase config variables --json` and check offline with `pnpm nocobase config check --no-connect`. See [Configuration reference](../../reference/configuration.md) for fields and commands.

## Interfaces and implementation

- [Configuration sources](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/config/README.md)
- [Application configuration declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/config/define-app-config.ts)
