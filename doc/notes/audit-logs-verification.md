# Audit logs user guide verification

## Scope

The English, Chinese and Japanese guides cover capabilities, two Agent setup scenarios, manual configuration, sensitive data redaction, and log browsing and Excel exports. Each declares `minimumEdition: enterprise`. The menu places Audit logs immediately after Localization. No commercial implementation or companion product-management application is published with the guide.

## Source baseline

- Pro synchronization commit: `d34880188dd3fbb21df96a03cfb589c3f7ef9428`. The Audit Logs runtime remains the implementation from `ceae58f5c73d9cf5c2e4ea166b8d90ac99ab195f`, package `@nocobase/app-plugin-audit` at `0.0.1`; the synchronization also adapts its HTTP tests to segmented audit files.
- OSS: `37ad166617baf80e8e68a05d816fde043f0c0a81`, synchronized from `888bca5075a17f52ee90b2d29d0efe84c9a483c9` with `pnpm nocobase3:sync`, followed by `pnpm install`, `pnpm nocobase3:check` and `pnpm nocobase3:config:check`.
- File audit implementation: `@nocobase/audit` at `0.1.0-beta.1`. See the pinned [rolling-file contract](https://github.com/nocobase/nocobase/blob/37ad166617baf80e8e68a05d816fde043f0c0a81/packages/libs/audit/README.md#rolling-file-output), [configuration validation](https://github.com/nocobase/nocobase/blob/37ad166617baf80e8e68a05d816fde043f0c0a81/packages/libs/audit/src/config.ts) and [file output implementation](https://github.com/nocobase/nocobase/blob/37ad166617baf80e8e68a05d816fde043f0c0a81/packages/libs/audit/src/file-output.ts).
- Running application: the private Audit Lab, originally generated from Default template `2.0.0-beta.4`, now using the synchronized OSS workspace and its existing application-owned operation translations. Its application source was not regenerated.

Database storage and management pages require the commercial plugin. The base audit service supplies the file driver independently. File options are `path`, `maxFileSizeMB` (default 50) and `retentionDays` (default 180). The path is a segment prefix, not the legacy single output file. Rotation follows UTC dates and size; archive retention uses modification time, with background cleanup on startup and rotation. Current-day and active segments, unrelated names and legacy unsegmented files are excluded from cleanup. The concise guide covers the main options, rotation, retention and single-writer boundary.

New exports remain XLSX-only background jobs using the initiating locale, without request/response bodies. Download links last 24 hours and require the initiating user's current export permission. The management page's retention setting affects database records, not file archives. Missing translation references do not retroactively translate historical events.

The manual TypeScript, locale JSON and YAML examples are identical across languages. They are integration fragments for existing application routes and resources, not a standalone application. The route snippet and parsed configuration are checked against the installed public contracts; the YAML also passes the runtime audit configuration validator.

## Upgrade verification

- Synchronization, dependency installation, pointer alignment and mirrored workspace checks passed. Installation reported deprecated transitive dependencies and unavailable `app-host` / `app-host-docker` CLI build outputs; those unrelated deployment executables were not validated by this task.
- OSS file-audit and service tests: 33 passed. The first macOS run had one failure because a direct test fixture passed a non-canonical `/var/...` temporary path to a class that requires a resolved directory. Re-running with `TMPDIR` resolved through `pwd -P` passed all 33 without changing OSS source.
- Pro audit targeted XLSX, formatting, actor and client tests: 47 passed.
- Pro audit HTTP integration file: all 5 passed after replacing its three legacy fixed-file reads with segmented-file reads. Existing event equality, authorization, export, rollback and application-isolation assertions remain in place.
- Audit Lab operation-name localization tests: 3 passed.
- Typechecks passed for OSS audit, Pro audit and Audit Lab. OSS audit and Pro audit package builds passed. The modified Pro test file passed ESLint and Prettier checks; commit hooks also passed.

After restarting the Lab, the application entry answered HTTP 200 and anonymous access to the audit API answered 401. A real operation through the Lab page produced request `lab-ebecba54-3b6f-4885-a4dc-771bfb1c30ad` and audit event `dbba6020-1bc1-439e-b82f-32b65dd5ed5f`. The native list and detail API showed the localized operation name and current actor name, with no request or response body captured. The same request appeared in `events.2026-11-27.000000.jsonl`; the existing `events.jsonl` was not rewritten. This live pass did not force rotation or expiry in the persistent application; isolated OSS tests cover those behaviors.

This was targeted upgrade verification, not a new full application or workspace test run. No new live XLSX download, production installation, package publication or other-database acceptance run was performed.

## Screenshots

The original list and no-body detail screenshots were captured before the OSS upgrade. The redacted detail screenshot was captured afterward from the same actual local audit manager. All three use English, the Light theme and a 1800 × 1000 viewport, without cropping, DOM substitutions or fabricated audit data.

| Asset | Captured state |
| --- | --- |
| `public/assets/core/audit-logs/list.png` | Existing HTTP-generated laboratory events, filters, outcomes and Export button |
| `public/assets/core/audit-logs/detail.png` | Creation event `db124123-9cd2-4241-92e6-6c8feccc6065`, showing actor, affected record, outcome and request ID; bodies were not captured |
| `public/assets/core/audit-logs/redacted-detail.png` | Event `cd071c2d-a2c4-4869-995f-926f110e8b22`, with built-in, application and route rules masking the captured body |

The images were inspected for readability and credentials. Visible identifiers and loopback addresses belong to synthetic local test data. No credentials, browser-state files, databases or runtime logs are copied into this repository.

## Redaction verification

A new real operation using the Lab's **Create with redacted JSON** button produced request `lab-2d8e7329-ba5a-414e-810a-024bdc66780c`. The authenticated detail API returned `******` for eight sensitive values in each of the request and response snapshots: password, token, identity number, application secret, profile phone, customer address, route secret and member phone. Ordinary values remained visible. The corresponding JSONL event was checked separately; the UI is not merely masking raw values at display time.

The guide's route and application examples show a subset of these existing Lab rules. `fields` matches exact names at any depth; `paths` is rooted at each body and traverses arrays. Both levels add to built-in masking. The text explains that an explicit `captureBody: false` at either level blocks capture, including the earlier storage example's global opt-out. No application configuration, permissions, code or historical events were changed for this screenshot.

## Documentation checks

Run from the website repository root:

```sh
pnpm doc:test
pnpm doc:build
git diff --check
```

The checks pass for the documentation test suite and production build, including all three audit-guide routes. Browser checks cover the Enterprise marker, menu placement, screenshots and configuration callouts. Documentation checks do not establish that the referenced packages can be installed from the customer registry.
