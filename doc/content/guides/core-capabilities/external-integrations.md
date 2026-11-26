---
title: "External APIs and system integrations"
metaDescription: Issue scoped API keys for external lead intake and sync confirmed CRM quotations or won deals with ERP and finance systems using idempotency and retries.
---

Expose controlled API access for external systems in your CRM application: accept leads from external web forms or marketing tools using scoped API keys and idempotency keys, and sync won deals or confirmed quotations to ERP and finance systems with safe manual retries.

When testing in the full example, prepare administrator, salesperson Alex, and manager Morgan accounts (see [Configure users and roles](roles-and-permissions.md#configure-users-and-roles)). Local verification does not require an external ERP account—the example includes a built-in mock ERP receiver with idempotency and HTTP 503 failure simulation that you can swap for a real HTTP(S) endpoint later.

**Modules covered**

- [API keys](../../core/using-plugins/authentication/api-keys.md)
- [HTTP routes and APIs](../../core/developing-apps/apis-and-services.md)
- [Request validation and errors](../../core/developing-apps/request-validation-and-errors.md)
- [Background tasks and scheduling](../../core/developing-apps/background-tasks.md)

## Define external endpoints and synchronization rules

External callers should neither share interactive browser sessions nor receive unrestricted access. Set clear inbound and outbound contracts before coding:

- **Scoped API key permissions**: A scoped key's effective access is always the **intersection of the owner's current role permissions and the key's selected scope**—it never grants permissions the user does not hold. This tutorial defines two business scope groups and two presets:

| Scope group | Read (`read`) | Write (`write`) |
| --- | --- | --- |
| `crm.leads` (CRM leads & customers) | List accessible CRM customers | Create/update customers and add/update contacts |
| `crm.integrations` (ERP & finance sync) | Read outbound delivery logs and sync target | Trigger confirmed-quote or won-deal sync and retry failed deliveries |

- **Inbound external lead rules**: `POST /api/crmIntegrations/leads` reuses the customer matching and conflict strategies (`skip` / `update` / `reject`) from [Bulk data import and background processing](data-import.md) and requires an `Idempotency-Key` header. Retrying the same request after a network timeout returns the original record with `Idempotency-Replayed: true` instead of creating duplicates. Standard browser-only routes continue to reject scoped keys.
- **Outbound ERP & finance sync rules**: Only **confirmed quotations** and **won opportunities** may be synced. Each record receives a deterministic idempotency key (`erp-sync:quote:<quoteId>` or `erp-sync:opportunity:<opportunityId>`) in `crmSyncDeliveries` and is delivered asynchronously by a background job. Failed attempts (such as HTTP 503) record the error and reuse the exact same idempotency key on manual retry so the downstream ERP never creates duplicate orders.
- **Key management boundary**: Creating, rotating, and revoking API keys requires an interactive signed-in session; API keys cannot create or manage other keys.

## Issue scoped API keys and ingest external leads

### Ask the Agent to build it

Share the scope table and sync rules above with this prompt to your coding Agent:

```prompt
Add external API and integration support to the CRM:
1. Add a personal "API keys" page in System settings where users can issue expiring scoped keys using the "CRM leads & customers" and "ERP & finance sync" scopes or quick presets, show the plaintext secret once, and rotate or revoke keys immediately.
2. Add external lead intake and customer lookup APIs that accept scoped API keys, reuse the customer matching rules and skip/update/reject conflict modes, enforce Idempotency-Key protection, and assign new leads to the key owner.
3. Add an "External integrations" page in System settings to configure the ERP & finance sync target (defaulting to a local mock receiver with an HTTP 503 failure toggle), track outbound delivery logs, external order references, and attempts for confirmed quotations and won opportunities, and support manual retry with the same idempotency key; also show a sync action on confirmed quotation details.
```

### Configure key scopes and the management page

`@nocobase/app-plugin-api-keys` provides key authentication and the self-service `/api/apiKeys` endpoints. The application connects two pieces:

1. **Scope groups and presets (`server/providers/crm-integrations.ts`)**: During `boot()`, register `crm.leads`, `crm.integrations`, and presets (`lead-intake`, `erp-sync`) on `apiKeyScopesToken`, mapping `business` refs to CRM composite resources.
2. **Explicit route opt-in (`server/routes/crm-integrations.ts`)**: Regular browser routes stay on `auth.required({ scopedKeys: false })`, while integration routes explicitly enable `scopedKeys: true` alongside authorization middleware:

```ts
for (const path of ['/leads', '/customers', '/deliveries', '/deliveries/*', '/sync/*']) {
  router.use(path, auth.required({ scopedKeys: true }), authz.middleware());
}
```

Sign in and open **System settings → API keys** to issue scoped keys:

1. Click the **Lead intake** preset (`CRM leads & customers: Write`, `90 days`), name the key **Website lead capture**, and click **Create API key**.
2. Copy the one-time secret shown in the alert banner immediately—after leaving the page, only the key prefix remains visible.
3. As an administrator or sales manager, also issue an **ERP & finance order sync** key using the **ERP & finance sync** preset. Sales accounts without `crm.integrations` permissions see that scope disabled automatically.

![API keys page in System settings showing scope presets, permission levels, and active keys](/assets/guides/crm-api-keys.png)

### Submit external leads with an API key

Use the copied `x-api-key` and a unique `Idempotency-Key` to submit a lead from the terminal (replace `APP_URL` with the `Local:` URL from startup, such as `http://127.0.0.1:13105/main`):

```bash
IDEM_KEY="$(node -e 'console.log(`${Date.now()}.${crypto.randomUUID()}`)')"

curl -i -X POST "$APP_URL/api/crmIntegrations/leads" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $LEAD_API_KEY" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{
    "externalId": "WEB-2026-108",
    "source": "website",
    "name": "Beacon BioLabs",
    "industry": "Biotech",
    "status": "prospect",
    "website": "https://beacon-biolabs.example.com",
    "notes": "Requested enterprise rollout demo",
    "conflictMode": "skip",
    "contact": {
      "name": "Dana Wu",
      "role": "Head of Operations",
      "email": "dana.wu@beacon-biolabs.example.com",
      "phone": "+1-555-0190"
    }
  }'
```

The first request returns `201 Created` and `Idempotency-Replayed: false` with `action: "created"`. Open **Customers** in the browser to confirm **Beacon BioLabs** was created with the `[website #WEB-2026-108]` source note and assigned to the key owner.

You can inspect the full OpenAPI specification at `$APP_URL/api/swagger/docs` using either a signed-in session or a valid API key.

## Sync won deals and confirmed quotations to external systems

### Understand outbound sync, idempotency, and retries

Calling an external ERP inline inside a quotation save request risks blocking CRM users on third-party latency and creating duplicate orders when timeouts trigger retries.

`server/providers/crm-integrations.ts` separates recording from delivery:

1. **Deterministic outbox entry**: Triggering sync verifies the precondition (quotation is `confirmed` or opportunity is `won`), snapshots customer, opportunity, line items, and totals into `crmSyncDeliveries` under the unique key `erp-sync:quote:<quoteId>` or `erp-sync:opportunity:<opportunityId>`, and enqueues `deliveryId` on `JobExecutor` (`crm.integrations` scope).
2. **Asynchronous delivery and safe retry**: The background job POSTs the snapshot with `Idempotency-Key` and `X-CRM-Event` headers. On success it stores the HTTP status and external reference (for example `ERP-SO-39BB3529`); on failure it records `failed`, attempt count, and error message so manual retry reuses the same delivery record and idempotency key.

### Trigger synchronization and inspect delivery logs

1. Open **System settings → External integrations** and verify **ERP & Finance sync target** points to `mock://erp-finance/orders` with **Sync enabled** turned on. Replace the endpoint URL and optional `X-Integration-Secret` when connecting a real ERP/finance webhook.
2. Under **Beacon BioLabs**, create a `won` opportunity (such as **Beacon enterprise rollout**) or open a confirmed quotation (see [Approval workflows and to-do center](approval-workflows.md)).
3. Click **Sync to ERP** on a confirmed quotation detail page, or trigger won-deal sync using a key with `crm.integrations: write`:

```bash
curl -i -X POST "$APP_URL/api/crmIntegrations/sync/opportunities/<opportunityId>" \
  -H "x-api-key: $ERP_API_KEY"
```

4. Return to **System settings → External integrations**. Under **Outbound sync deliveries**, the entry moves to **Succeeded** with `Attempts: 1 (200)` and an `ERP-SO-...` reference.

![External integrations settings showing the ERP sync target and outbound delivery log with retry action](/assets/guides/crm-external-integrations.png)

## Verify idempotent replay, failure retries, and key revocation

Verify the four critical integration boundaries in order:

| Verification case | Action | Expected result |
| --- | --- | --- |
| Idempotent lead replay | Re-send `POST /api/crmIntegrations/leads` with the same `$IDEM_KEY` and body | Returns `200 OK`, `Idempotency-Replayed: true`, and the same customer ID with no duplicate created |
| Conflict rejection | Send **Beacon BioLabs** again with a new `Idempotency-Key` and `conflictMode: "reject"` | Returns `409` (`CRM_CUSTOMER_CONFLICT`) and leaves the existing record unchanged |
| Failure simulation and retry | Toggle **Simulate HTTP 503 failure** on, sync a new won opportunity until it shows **Failed (`1 (503)`)**, turn failure simulation off, and click **Retry sync** | Delivery moves to **Succeeded**, `Attempts` becomes `2 (200)`, the original idempotency key is preserved, and a single `ERP-SO-...` reference is recorded; triggering sync again replays the succeeded delivery |
| Scope, rotation, and revocation | Call `POST /api/crmIntegrations/leads`, `/api/apiKeys`, or `/api/crm/customers` with a read-only key; click **Rotate** or **Revoke** and retry with the old secret | Disallowed actions and browser-only routes return `403`; rotated or revoked secrets immediately return `401` |

Run `tests/server/crm-integrations.test.ts` to verify these checks automatically against an isolated database, including permission intersections and blocking sales accounts from ERP sync. The built-in mock receiver verifies the CRM outbox, idempotency key, and retry loop locally; when connecting a production ERP or finance system, validate TLS connectivity, shared-secret verification, and downstream idempotency against the real endpoint.

**Done when**: Scoped API keys ingest external leads idempotently via `x-api-key`; confirmed quotations or won opportunities sync asynchronously with an external reference; simulated HTTP 503 failures recover via manual retry under the same idempotency key; and out-of-scope, rotated, and revoked keys are rejected.

## Summary and next steps

Your CRM now provides scoped API key authentication, idempotent inbound lead capture sharing the bulk-import rules, and observable, retryable outbound synchronization to ERP and finance systems.

Return to [Topic tutorials](index.md) to explore other Core capabilities, or review [Bulk data import and background processing](data-import.md) to compare how file imports share the same customer matching and conflict rules.
