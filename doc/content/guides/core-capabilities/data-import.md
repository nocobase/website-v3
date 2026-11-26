---
title: "Bulk data import and background processing"
metaDescription: Combine background jobs and transactional validation to bulk-import CRM customers and contacts with conflict handling, error reports, and rollback.
---

Import historical spreadsheets or event lead lists of customers and contacts into the CRM application through background jobs, while inspecting progress, transactional rollback results, and per-row error reports in the UI.

When testing in the full example, prepare four accounts—an administrator, salespeople Alex and Taylor, and manager Morgan (see [Configure users and roles](roles-and-permissions.md#configure-users-and-roles)). Background imports rely only on the built-in job executor and do not require an external queue or third-party service.

**Modules covered**

- [Background tasks and scheduling](../../core/developing-apps/background-tasks.md)
- [Transactions and data consistency](../../core/developing-apps/transactions-and-consistency.md)
- [Jobs](../../core/framework/background/jobs.md)

## Define import fields, conflict strategies, and transaction rules

Bulk import must enforce the same validation, ownership, and deduplication rules as regular CRM entry rather than inserting raw CSV rows directly into the database:

- **Supported columns**: Each row accepts customer fields (`customerName`, `industry`, `status`, `website`, `notes`) and optional contact fields (`contactName`, `contactRole`, `contactEmail`, `contactPhone`). `customerName` is required; `status` defaults to `prospect`; `website` must be empty or a full HTTP/HTTPS URL; whenever any contact field is provided, `contactName` is required and `contactEmail` must be valid. Each upload supports up to 500 rows and 2 MB.
- **Customer matching and conflict strategies**: Existing customers are matched case-insensitively by trimmed `customerName` within the submitting user's authorized scope, with three conflict modes:

| Strategy | Behavior when a matching customer already exists |
| --- | --- |
| Skip existing (`skip`) | Keep the existing customer unchanged and count the row as skipped |
| Update existing (`update`) | Update non-empty customer fields and create or update the contact by email or name; requires customer edit permission |
| Reject conflicts (`reject`) | Record a conflict error without modifying existing data |

- **Transaction boundaries and modes**:
  - **All or nothing (`allOrNothing`)**: Processes the entire file inside one database transaction. If any row fails field validation, conflict rejection, or authorization, the entire batch rolls back with 0 records written, while saving a full per-row error report.
  - **Row by row (`rowByRow`)**: Wraps each row's customer and contact writes in its own transaction. Valid rows commit cleanly while invalid rows roll back individually and appear in the error report, preventing half-saved customers without contacts.
- **Ownership and permission boundaries**: Newly created customers are assigned to the submitting user. Background jobs do not inherit browser cookies; at execution time the job reconstructs the submitter's live authorization context and verifies the account is still active. Salesperson Alex can only match and update Alex's own customers, never Taylor's; batch history is visible only to the submitter, sales managers, and administrators.

## Connect file upload and background import jobs

### Ask the Agent to build it

Provide the field, conflict, and transaction rules above together with this prompt to your coding Agent:

```prompt
Add bulk CSV import for CRM customers and contacts, with an "Import CSV" entry on the Customers page and a downloadable CSV template:
- Support three conflict strategies for matching existing customer names: skip existing, update existing, and reject conflicts.
- Support two transaction modes: all-or-nothing (roll back the whole batch on any error) and row-by-row (commit valid rows while keeping each row's customer and contact atomic).
- Process uploads asynchronously in a background job, showing batch status, progress, and counts, plus a per-row error report and downloadable error CSV for fixing and re-uploading.
- Enforce the submitting user's live permissions and customer ownership during background execution, assign new customers to the submitter, and preserve existing CRM data.
```

### Understand background jobs and transactional validation

In the CRM implementation, bulk import splits responsibilities across three layers instead of parsing and writing inside one long HTTP request:

1. **Shared ingestion rules (`server/providers/crm-intake.ts`)**: Parses CSV content, reuses the CRM `CustomerInput` and `ContactInput` schemas, and exposes `ingestCustomerRow()` for customer matching, conflict handling, and atomic customer/contact writes. [External APIs and system integrations](external-integrations.md) reuses the exact same helper so file imports and API lead intake behave identically.
2. **Asynchronous submission route (`server/routes/crm-imports.ts`)**: `POST /api/crmImports/batches` records the batch (`queued`) and idempotency receipt inside `executeIdempotentMutation()`, then enqueues the background job after commit and responds immediately with `202 Accepted` and the batch ID. Replaying the same `Idempotency-Key` returns the original batch without queueing a duplicate job.
3. **Background executor (`server/providers/crm-imports.ts`)**: Registers the `crm.import.customers` job class during provider startup, loads the batch from the database, checks that the submitter is still active, and builds a live authorization context with `authz.for(identity)`:

```ts
this.executor = this.app.container
  .resolve(jobExecutorServiceToken)
  .getJobExecutor('crm.imports');
this.executor.registerJob(JobClass);
await this.executor.setup({ consume: true });
```

In `allOrNothing` mode, all rows execute inside a single `connection.transaction(async (tx) => { ... })`. If any row fails, the job throws a rollback sentinel so zero customers or contacts persist, then records `status: 'rolledBack'` and writes the `crmImportErrors` entries outside the rolled-back transaction. See [Background tasks and scheduling](../../core/developing-apps/background-tasks.md) and [Transactions and data consistency](../../core/developing-apps/transactions-and-consistency.md) for framework details.

### Upload a sample file and inspect import batches

1. Open **Customers** and click **Import CSV** to open **Bulk customer import** (use **Download template** for a blank CSV header).
2. Click **Load valid sample** (or upload a CSV with two valid customers), choose **Skip existing customers**, and set **Transaction mode** to **All or nothing (roll back on any error)**.
3. Click **Start background import**. The request returns immediately and the **Import batches** table polls until the batch reaches **Completed** with `+2 / ~0 / 0 skip / 0 err`.

![Bulk customer import form and background import batch history](/assets/guides/crm-bulk-import-submit.png)

4. Return to **Customers** to verify that **Harbor Robotics** and **Summit Logistics** were created, and open their **Contacts** tab to confirm the imported contacts.

## Inspect error reports, rollback, and re-import

When a spreadsheet contains malformed URLs or invalid emails, all-or-nothing mode protects the database while giving you an exact error report to fix:

1. On **Bulk customer import**, click **Load sample with errors**. Row 2 (**Cobalt Energy**) is valid, while row 3 (**Broken Record Corp**) has an invalid website (`not-a-valid-url`) and email (`invalid-email`).
2. Keep **Transaction mode** on **All or nothing (roll back on any error)** and click **Start background import**.
3. Click the batch in **Import batches**. Its status shows **Rolled back** with `Total rows: 2`, `Created: 0`, `Failed: 1`, and the error table flags row `#3` (**Broken Record Corp**, `INVALID_FIELD`, `website: Invalid URL`).

![Rolled-back batch report showing zero written records and row-level error details](/assets/guides/crm-bulk-import-report.png)

4. Return to **Customers** and search for `Cobalt Energy`—it is absent because the whole transaction rolled back cleanly.
5. Click **Download error CSV** to export the failed rows with `errorCode` and `errorMessage` columns, fix the invalid fields, and upload the corrected CSV.

When partial progress is acceptable, switch **Transaction mode** to **Row by row (commit valid rows)**. A file with one valid row and one invalid row finishes as **Completed with errors**: the valid row commits while the invalid row rolls back on its own and appears in the error report.

## Verify conflict modes, failure recovery, and permission boundaries

Check these scenarios across roles in the UI:

| Scenario | Action | Expected result |
| --- | --- | --- |
| Skip duplicates | Re-upload the valid CSV with `skip` | Batch finishes `Completed` with `Created: 0`, `Skipped: 2`, and no duplicate customers |
| Update existing records | Change **Harbor Robotics** industry/status and import with `update` + `rowByRow` | Existing customer updates in place; existing contact matches by email rather than duplicating |
| Reject conflicts | Import an existing customer with `reject` + `allOrNothing` | Records `CONFLICT_REJECTED` and rolls back the entire batch |
| Sales data isolation | After Alex imports a batch, sign in as Taylor | Taylor cannot see Alex's batch or imported customers; manager Morgan can view them |
| Insufficient permission | Submit an `update` batch from an account without `editCustomer` | Rejected immediately with `403` before any job is queued |

Single-process local runs use the built-in `memory` jobs backend, which persists pending state to `storage/jobs/` on graceful shutdown. Multi-instance production deployments require a shared Redis backend (see [Configure the execution backend](../../core/developing-apps/background-tasks.md#configure-the-execution-backend)) and separate concurrency verification.

Idempotent submission replay, file limit rejections, disabled-account handling, and isolated rollback checks can be verified automatically by running `tests/server/crm-imports.test.ts`.

**Done when**: Valid CSV files create customers and contacts via background jobs; invalid files roll back completely in all-or-nothing mode and produce a downloadable error CSV; row-by-row mode, all three conflict strategies, and sales ownership isolation behave as specified.

## Summary and next steps

Your CRM now processes bulk customer and contact spreadsheets asynchronously with explicit transaction boundaries, conflict strategies, and downloadable error reports, built on a shared ingestion helper.

Continue to [External APIs and system integrations](external-integrations.md) to issue scoped API keys, ingest external leads through the same customer matching rules, and sync confirmed quotations or won deals to ERP and finance systems.
