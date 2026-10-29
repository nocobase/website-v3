---
title: Secrets and sensitive-data encryption
---

`@nocobase/secrets` provides versioned keyrings and authenticated encryption. Applications resolve `secretsServiceToken` from `@nocobase/app-server/secrets` so plugins share the host's key management.

## Configuration and use

Generate stable `secrets.keys` during configuration initialization, or inject them through `SECRETS_KEYS`. The first key encrypts new values; retained versions decrypt existing values. Keep keys out of client configuration, logs and Git. Database backups require separately retained keys.

Resolve the server service and pass it to business functions:

```ts
import type { SecretsService } from '@nocobase/app-server/secrets';

export function protectIntegrationToken(
  secrets: SecretsService,
  integrationId: string,
  plaintext: string,
) {
  const options = {
    purpose: '@example/orders/integration-token',
    aad: [integrationId],
  };
  const sealed = secrets.seal(plaintext, options);
  // Persist sealed; open with the same purpose and record binding.
  return { sealed, read: () => secrets.open(sealed, options) };
}
```

`purpose` separates uses and `aad` binds ciphertext to a business record. Both must match during decryption. Changing a record ID, purpose string or binding requires a migration. Format checks and `inspect()` do not authenticate ciphertext; a successful `open()` does.

Use this for values such as API tokens whose plaintext must be recovered. Leave password handling to the authentication plugin.

## Rotation

1. Back up data and existing keys; place a new version first while retaining old versions.
2. Deploy configuration that reads both versions and run `pnpm nocobase secrets status`.
3. Run `pnpm nocobase secrets rotate --dry-run`, inspect the scope, then perform rotation.
4. Remove old versions only after accounting for stored ciphertext and backups that still need them.

The CLI discovers only stores registered through `registerStore()`. Calling `seal()` does not automatically enroll a custom table. Implement a `SecretsStore` with status reporting and safely repeatable resealing.

## Standalone use

The library also exposes `createKeyring()`, `seal()`, `open()` and `derive()`. Use `generateSecretKey()` for initialization or rotation, never to regenerate a persistent-data key on every startup. Components such as [Sessions](sessions.md) can derive keys for their own purposes.

## Interfaces and implementation

- [Keyring implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/secrets/src/keyring.ts)
- [Host service and rotation stores](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/secrets/service.ts)
