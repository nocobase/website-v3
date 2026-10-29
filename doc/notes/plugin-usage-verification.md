# Plugin usage guide verification

Checked on 2026-10-28. The 21 guides under `content/core/using-plugins/` and `content/zh-CN/core/using-plugins/` replace the corresponding placeholder bodies without changing menu structure or URLs.

## Source revisions

- Open-source plugins: `nocobase/nocobase` at `015404ecd0dbed33cc46831f73907329c577d375`. Sources were read from the matching local checkout; the commit's availability on GitHub was also checked. Untracked application files in that checkout were not used.
- Commercial Approval: `nocobase/nocobase3-pro` at `138665ffaaaa9e28596d85d4d329c05f78e641ac`. The guide describes public exports and host integration, without copying a commercial implementation or publishing a private source link.
- Default-template composition: `packages/templates/app-template-default/client/plugins.ts`, `server/plugins.ts`, `server/config/auth.ts`, `client/config/auth.ts`, `server/config/authorization.ts` and `server/config/notification.ts` at the open-source revision above.

The reference plugin inventory has its own earlier baseline. Do not silently treat its template-inclusion column as a promise about an arbitrary installed version.

## Source map

Paths below are relative to `packages/plugins/app-plugin-<name>/` unless stated otherwise. Package manifests and Client/Server declarations were checked for the listed runtime exports; the template-print manifest exposes no runtime entry. README descriptions were checked against relevant implementation and declarations, particularly where older paragraphs describe pages that are no longer registered.

| Guide / package suffix | Principal evidence | Contract captured in the guide |
| --- | --- | --- |
| Users / `users` | `README.md`, `client/routes.ts`, `client/user-client.ts`, `server/plugin.ts` | Invitation page is registered; administration UI belongs to the App; operations need user grants; preferences and role scopes use public contracts |
| Authentication / `authentication` | `client/index.ts`, `client/plugin.ts`, `client/auth-provider.tsx`, `server/config.ts`, `server/password-reset.ts` | App-owned auth pages, host-derived persistent secrets, paired client/server extensions, explicit recovery configuration |
| API keys / `api-keys` | `README.md`, `client/index.ts`, `server/index.ts`, `server/providers/index.ts` | Runtime registration plus auth factories; owner/scope intersection; signed-in sessions manage keys; secrets returned on issuance/rotation |
| Permissions / `authorization` | `README.md`, `client/plugin.ts`, `server/plugin.ts`, `server/index.ts` | No administration pages; resource declarations, explicit Member assignment, server data-policy enforcement |
| Default access / `authz-default-access` | `README.md`, `client/plugin.ts`, `server/plugin.ts` | Additional authorization factory required; baseline expands records for already-granted actions; one rule per resource |
| Sharing / `authz-sharing-rules` | `README.md`, `client/plugin.ts`, `server/plugin.ts` | Subject-specific record expansion; no action grant or `all` selection |
| Restrictions / `authz-restriction-rules` | `README.md`, `client/plugin.ts`, `server/plugin.ts` | Selection describes records still allowed; matching restrictions intersect; unrestricted identities bypass these rules |
| Database explorer / `database-explorer` | `README.md`, `client/plugin.ts`, `server/plugin.ts` | App-owned page and shared page grant; read APIs with metadata-initialization qualification |
| Files / `file` | `README.md`, `docs/README.md`, `server/routes.ts`, public indexes | Host-owned Collection/disk/routes; required policy; public content route is outside policy; metadata deletion retains objects |
| Notifications / `notification` | `README.md`, `server/routes/index.ts`, `server/index.ts`, `client/service-provider.ts`, `registry/logs-ui/README.md` | Named channels and complete per-channel messages; protected logs; transient messages have no durable retries |
| Providers / `notification-providers` | `README.md`, `server/plugin.ts`, manifest | Server-only channel registration; SMTP, Resend, Feishu and DingTalk; literal YAML and explicit credential mappings |
| In-app / `notification-in-app` | `README.md`, `client/plugin.ts`, `client/index.ts`, `server/plugin.ts` | No registered inbox page despite an older README introduction; owned inbox routes, hooks and app-relative targets |
| Web push / `notification-web-push` | `README.md`, `server/config.ts`, `server/index.ts`, `client/index.ts` | Persistent VAPID and host secrets, device preferences, HTTPS and base-prefixed internal targets |
| Email / `mail` | `README.md`, `client/plugin.ts`, `client/index.ts`, `server/plugin.ts` | Personal-mailbox integration, explicit configuration composition and App-owned routes, exact synchronized participant filtering |
| Agents / `agents` | `README.md` configuration/model/UI sections, `client/plugin.ts`, `client/routes.ts`, `server/tokens.ts`, `server/composition.ts` | Runner and OnlineAgent paths distinguished; exported routes are composed by the App; model services and permissions remain explicit |
| Knowledge / `knowledge` | `README.md`, `client/plugin.ts`, `client/routes.ts`, `config.ts`, `server/plugin.ts`, `server/services/proposals.ts` | Host space/access resolver, optional page, optimistic versions, proposal boundaries and optional Knowledge-owned semantic index |
| Approval / `approval` (commercial) | `README.md`, `server/index.ts`, `server/plugin.ts`, `client/plugin.ts` | Migrations and public lifecycle integration, host-owned UI/API/permissions and timer, transactional final outcomes |
| Scheduler / `scheduler` | `README.md`, `server/tokens.ts`, `server/routes/index.ts`, `server/schedules/registry.ts`, `cli/index.ts` | Code-defined schedules/targets, explicit Jobs host, page access gate, careful complete-manifest finalization |
| Template printing / `template-print` | `README.md`, `package.json` | Skills-only development dependency; App implements rendering and PDF conversion; example is a separate package |
| Localization / `i18n` | `README.md`, public indexes and declarations | App loaders determine languages; picker is App-owned; browser/server fallback semantics |
| Foundation / `foundation` | `README.md`, `client/plugin.ts`, `client/routes.ts`, `server/plugin.ts` | Registered page with unrestricted-only access; evidence differs from installation; optional CLI build artifact |

## Documentation boundaries

The guides explain how to consume each plugin. They do not duplicate the full API reference or plugin-development chapters. Installation, registration, upgrades and removal link to Manage plugins. API details defer to the running application's OpenAPI document, with the application mount prefix made explicit in the overview.

Internal Agent sessions, Projects, Task center, Releases and Demo mode remain excluded from Using plugins. Both languages keep three folders and ten standalone plugin entries. No new menu level or page path is introduced.

Examples use illustrative business IDs and configuration names. Snippets labelled as fragments require the stated host integration; they are not standalone applications. Procedures in each guide are acceptance checks for a consuming application, not assertions that those runtime checks were executed here.

## Validation scope

Required repository checks are `pnpm doc:test` and `pnpm doc:build`, including bilingual structure, links and anchors. Inspect built/served pages for complete bodies and removal of placeholder/noindex behavior, and confirm all 21 overview destinations in both languages resolve.

This change runs documentation checks only. It does not run plugin test suites, start business applications, connect SMTP/IMAP/OAuth/model services, send notifications, subscribe a physical device, execute commercial approval flows or validate renderer binaries. No source plugin or application is changed.
