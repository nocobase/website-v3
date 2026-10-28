---
title: Sessions
---

`@nocobase/session` manages cross-request data, cookies and expiration. Applications integrate it through `sessionManagerToken` from `@nocobase/app-server/session`. Authentication plugins own sign-in, identity and authentication policies; an ordinary session field is not proof of identity.

## Request sessions

Session middleware establishes a request session from the cookie, exposes it as the Hono `session` variable, and persists changes and cookie updates when the request finishes. Register it before routes that use sessions. Creating another manager creates a separate state boundary.

Pass the session from the request context to business functions:

```ts
import type { NocoBaseSession } from '@nocobase/session';

export async function rememberListView(session: NocoBaseSession) {
  await session.set('ordersView', 'compact');
  const data = await session.get();
  return data?.ordersView;
}

export async function clearListView(session: NocoBaseSession) {
  await session.forget('ordersView');
}
```

`get()` asynchronously reads the data. `set()` changes a key, `update()` replaces data or calculates it from the previous value, and `forget()` removes a key. `regenerate()` changes the session ID and `destroy()` removes the session. Authentication plugins can own separate authentication cookies, so destroying this session does not replace their sign-out flow.

## Storage and expiration

| Configuration | Purpose |
| --- | --- |
| `session.default`, `session.stores` | Select memory, fs, redis or null storage |
| `session.cookie` | Cookie name, path, Secure, HttpOnly, SameSite and other attributes |
| `session.lifetime.absolute` | Absolute lifetime |
| `session.lifetime.inactivity` | Optional inactivity timeout |
| `session.lifetime.rolling` | Refresh expiration with activity |

Memory suits single-process development. Multiple instances need shared storage. Match the cookie's `secure` setting to external HTTPS access. File-backed sessions are runtime data: retain their directory during deployment and backup.

An explicit `session.secret` encrypts and authenticates session cookies. If omitted, the host can derive a session key from configured Secrets keys. Configure stable keys in production to avoid invalidating sessions on restart; see [Secrets](secrets.md).

## Integration

Applications declare session configuration and Providers in their server runtime; plugins consume the host service. When embedding the library yourself, use `createSessionManager()` and Hono's `createSessionMiddleware()`, and dispose the manager at shutdown. Keep server session secrets out of browser code.

## Interfaces and implementation

- [Session contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session/src/types.ts)
- [Hono integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session/src/hono.ts)
- [Application session provider](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/session/provider.ts)
