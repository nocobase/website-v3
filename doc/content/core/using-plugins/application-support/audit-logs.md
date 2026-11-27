---
title: Audit logs
description: Configure auditing for business operations, then view, filter and export logs in System settings.
minimumEdition: enterprise
---

## Capabilities

Audit logs help you trace who did what, when, which records were affected, and how the operation ended. Once the Enterprise audit logs plugin is enabled and collection is configured, logs are stored in the application database. Authorized users can view and export them in System settings.

Use audit logs to track important operations such as product changes, order processing and user management. Configured operations can record successful, failed and denied outcomes.

## Ask an Agent to configure audit logging

First, confirm that your application is licensed to use Enterprise audit logs. The coding Agent working on your application can connect the plugin, configure storage and add auditing to business operations. See [Manage plugins](../../developing-apps/manage-plugins.md) for general setup guidance.

### Add auditing to an application that has none

If the application has no audit setup yet, ask the Agent to review its existing features and cover the operations you need to track:

```prompt
Set up audit logging for this application with @nocobase/audit. Review its existing creation, update, deletion and key business operations, then add the necessary describeAudit declarations following the audit documentation and the project's development conventions. Do not duplicate operations the framework already audits or log ordinary queries.

Configure a destination with driver: database under audit.transports in config.yml so administrators can view and export logs in System settings. Each record should identify the actor, time, affected records, and whether the operation succeeded, failed or was denied.

Translate operation names into every language the application currently supports, using the corresponding language in the list, details and new exports. Do not record sensitive information such as passwords or API keys, or change existing business permissions.
```

### Add auditing for a specific business feature

If auditing is already configured but a new feature or an existing operation is not covered, limit the request to that feature. For example:

```prompt
Use the application's existing @nocobase/audit package to add missing audit records for product creation, updates and deletion. Following the audit documentation and the project's development conventions, configure describeAudit on the relevant business routes to record who acted on which product, when, and whether the operation succeeded, failed or was denied.

Check audit.transports in config.yml for a destination with driver: database. Reuse it if present, or add it if missing, so these records can be viewed and exported in System settings. Preserve other features' audit configuration and avoid duplicate records.

Translate these operation names into every language the application supports, keeping the list, details and new exports consistent. Do not record sensitive information such as passwords or API keys, or change product management's existing permissions.
```

Replace “product management” with your feature. After configuration, perform an operation on a test record and check its actor, object, result and language in the audit log.

## Configure audit logging manually

For database storage and management pages, install and register the client and server entries of `@nocobase/app-plugin-audit`, run the application's database migrations, then configure the routes to audit and their storage. Keep existing authentication, permissions and input validation in place.

### Record a business operation with `describeAudit`

Add `describeAudit` to your server's business route file, such as `server/routes/products.ts`. This example audits a product update. Here, `router` and `productUpdateHandlers` stand for your existing router and complete handler chain, including authentication, permissions, API documentation, input validation and business logic.

```ts
import { describeAudit } from '@nocobase/audit';

const auditProductUpdate = describeAudit({
  action: 'products.update',
  resource: 'products',
  operationName: {
    ns: 'my-app',
    key: 'audit.products.update',
    defaultValue: 'Update a product',
  },
  target: (context) => ({
    collection: 'products',
    key: context.req.param('id'),
  }),
  captureBody: false,
});

router.patch('/products/:id', auditProductUpdate, ...productUpdateHandlers);
```

| Setting | Purpose |
| --- | --- |
| `action` | A stable identifier for distinguishing and filtering operations |
| `resource` | The identifier of the resource the operation belongs to |
| `operationName` | The name displayed in pages and exports, with a translation reference and fallback |
| `target` | The affected collection and record key; return identifiers, not an entire business record |
| `captureBody` | Whether to capture request and response bodies; explicitly disabled here |

This route reads the product key from the URL's `id`, without reading the body. When a newly created key is available only after success, use `resolveTargets` to supply the target. Use `describeAudit(false)` to exclude a route. For complete route setup, see [HTTP routes and APIs](../../developing-apps/apis-and-services.md).

### Translate operation names

Replace `my-app` with your application's `package.json` `name`; plugin-owned operations use the plugin's package name. The `key` points to the same entry in each locale resource, and `defaultValue` is the fallback when a translation is unavailable.

Merge the following fields into existing locale resources without replacing other text. Both client and server resources are needed: the client supplies list and detail labels, and the server supplies exports.

In `client/locales/en-US.ts` and `server/locales/en-US.ts`:

```json
{
  "audit": {
    "products": {
      "update": "Update a product"
    }
  }
}
```

In `client/locales/zh-CN.ts` and `server/locales/zh-CN.ts`:

```json
{
  "audit": {
    "products": {
      "update": "修改商品"
    }
  }
}
```

Add matching entries for any other languages the application supports, and ensure the resources are loaded. Names use the viewing language or the language selected when starting an export; business data is not translated automatically. See [Localization](i18n.md) for resource integration.

### Configure multiple destinations in `config.yml`

`audit.transports` supports multiple destinations. Each collected audit record is sent to each destination. For example, enable both database and file storage in the application's root `config.yml`:

```yaml
audit:
  enabled: true
  autoDetect: false
  captureBody: false
  transports:
    history:
      driver: database
    localFile:
      driver: file
      options:
        path: audit/events.jsonl
        maxFileSizeMB: 50
        retentionDays: 180
```

`history` and `localFile` are names you choose; `driver` determines the storage method. This configuration writes logs to the database for management-page queries and exports, and appends them to the specified file.

| Setting | Meaning |
| --- | --- |
| `enabled` | The audit master switch; `false` stops collection and delivery |
| `autoDetect` | Whether to additionally audit documented write operations automatically; defaults to `false`. Explicit audit declarations and framework-generated data mutation endpoints do not depend on this switch |
| `captureBody` | Body capture; disabled globally here, so individual routes cannot re-enable it |
| `transports` | Named destinations, each with its own driver and options |
| `driver: database` | The audit plugin's database storage, using the application's default database; configure one database destination per application to avoid duplicate writes |

Restart the application after changes. This configuration keeps operation metadata without request or response bodies. To capture bodies, see [Sensitive data redaction](#sensitive-data-redaction).

After configuring storage and restarting, update a test product. The management page should show “Update a product”, the `products` collection and the matching key, and the file should receive a new record. Switching the page language should display the translated operation name.

### File output settings and considerations

With `driver: file`, these options control file output:

| Setting | Description |
| --- | --- |
| `options.path` | Required; the directory and filename prefix, such as `audit/events.jsonl` |
| `options.maxFileSizeMB` | File-size rotation threshold; defaults to `50` MB |
| `options.retentionDays` | Archive retention period; defaults to `180` days |

Relative paths start at application storage; absolute paths are also supported. Logs rotate by UTC date and file size, using JSON Lines with one record per line.

Retention is measured from each file's last modification time. Expired archives are cleaned up in the background, independently of database log retention. Multiple instances need separate output directories or prefixes; legacy unsegmented files must be archived or removed separately.

> [!TIP]
> For file-only output, keep `localFile` and remove `history` from the example. File output comes from `@nocobase/audit`, already integrated into the Default application template, and does not require `@nocobase/app-plugin-audit`. The plugin is needed for database storage and management pages.

## Sensitive data redaction

When JSON request and response bodies are captured, sensitive fields such as passwords and tokens are replaced with `******` before logs are written. You can add rules for business fields too. The detail below shows masked identity numbers and phone numbers alongside unchanged ordinary fields.

![Audit detail with sensitive fields masked and ordinary values preserved](/assets/core/audit-logs/redacted-detail.png)

### Route-level configuration: `describeAudit`

Add the following settings to the business route's existing `describeAudit` declaration, keeping its operation name and targets. Bodies are not captured by default; enable capture only on routes that need it. If you used the earlier global `captureBody: false` setting, remove that line first. An explicit `false` at either level prevents capture.

```ts
describeAudit({
  action: 'products.update',
  captureBody: true,
  redact: {
    fields: ['routeSecret'],
    paths: ['payload.members.mobile', 'data.payload.members.mobile'],
  },
});
```

`fields` matches exact field names at any depth. `paths` matches paths from the body root, including fields inside arrays. This example masks every `routeSecret` field and the phone numbers in the request and response `members` arrays.

### Application-level configuration: `config.yml`

Merge shared rules into `audit.redact` in `config.yml`, keeping existing settings such as `audit.transports`:

```yaml
audit:
  redact:
    fields: [identityNumber, appSecret]
    paths:
      - payload.profile.mobile
      - data.payload.profile.mobile
```

Application and route rules apply together without replacing the built-in sensitive-field rules. List separate paths when request and response structures differ. Restart the application after changes; new rules affect only subsequent audit records, not business data or historical logs.

## View and export logs

### View the log list

Open **System settings → Audit logs**, then the **Logs** tab. Records appear newest first, showing the actor, action, affected object and outcome.

Choose a time range, then use **More filters** to narrow the list by action, outcome or actor type. If you know a record ID, user ID, IP address or request ID, use the search box to locate it.

![Audit log list showing filters, affected objects and outcomes](/assets/core/audit-logs/list.png)

### View operation details

Click a record to open its details, including the actor's identity, affected records, result and request ID. When investigating an issue, share the request ID with your support team to help locate the same request.

![Audit log details showing the actor, affected record and result](/assets/core/audit-logs/detail.png)

Request and response content appears only when collection is allowed and the content was captured. **Not stored for this record** means that this log has no corresponding body content, not that the entire operation went unrecorded.

### Export logs

1. Set the filters for the records you need
2. Click **Export**, then **Start export**
3. Wait for background generation, then download the file from the completion notification in **Inbox**

The export includes records matching the filters, not just the current page. The Excel (`.xlsx`) file contains information such as time, actor, action, affected object and result, but not request or response bodies. Translated content uses the language selected when you start the export.

Download links are valid for 24 hours. Only the person who requested the export can download it, and they must still have export permission. Create a new export if the link has expired.
