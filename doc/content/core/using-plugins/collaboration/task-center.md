---
title: "Task Center"
description: "Aggregate personal work across independent business sources with a default page, header count shortcut, authenticated query APIs and reusable components."
minimumEdition: professional
---

## Capabilities

`@nocobase/app-plugin-task-center` collects items requiring the signed-in user's attention into one personal task center. It does not depend on Approvals: you can use it standalone for ordinary business work such as equipment pickup or order confirmation, or alongside [Approvals](approval.md) to bring approval tasks, copies and other business work together. Confirm package access and licensing before installation; see [Manage plugins](../../developing-apps/manage-plugins.md).

| Capability | Provided by the plugin | Handled by the application |
| --- | --- | --- |
| Personal task index | `userTasks` index table and source-bound writers (`UserTaskWriter`) | Write and update task statuses inside business transactions, with recipient eligibility and safe titles |
| Default page and header shortcut | Authenticated `/task-center` page and a standard header shortcut showing the pending count | Hide the shortcut, remove or override the default page as needed, and wire business details and actions |
| Query APIs and client components | Authenticated `GET /api/userTasks*` routes, `createTaskCenterDataSource` and `<TaskCenter />` | Load lists, categories and counts with matching scopes in dashboards, badges or custom pages |
| Approval integration | No dependency on Approvals; provides the shared index and UI foundation | Enable `userTasks` mapping in approval definitions and load approval details and actions through business routes |

A task index entry only records what needs a user's attention and never grants permission to view or modify business records. Business detail APIs, completion actions, state transitions and authorization checks remain owned by each business module; notification delivery belongs to [Notifications](../notifications/notification.md).

## Scenarios and examples

Use Task Center when users need one place to handle personal work from multiple businesses—for example, combining purchase approvals, leave approvals and equipment collection in one inbox, or showing the current user's pending count in the header or workspace home.

You do not need Task Center in these cases:

- Sending a reminder or alert message: use [Notifications](../notifications/notification.md) or [In-app notifications](../notifications/in-app.md).
- Editing a record inside a single business detail page.
- Building an organization-wide administrative report: Task Center endpoints only return the signed-in user's own index.
- Tracking "requests I submitted": approval task contributions index pending decisions and copies only; applicant tracking belongs to a separate business view or source.

### Example: Handle approvals and business work together

After signing in, an employee wants to see purchase approvals, leave approvals and equipment pickups in one place, filter them by source and business subject on the left, open each item to approve or confirm receipt in its business view, and have completed items move out of pending with updated counts.

Prerequisite: authentication, the relevant approval or business modules (such as equipment delivery), and the Task Center plugin installed and registered as described in [Manage plugins](../../developing-apps/manage-plugins.md).

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Connect purchase approvals, leave approvals and equipment pickups to Task Center. Opening an item should take me to its business detail page to approve or confirm pickup, and update the task status once handled. Everyone should only see their own tasks.
```

After registering the plugin and running migrations, signed-in users can open `/task-center` from the header shortcut. The left navigation groups counts by source and subject, the tabs switch between To do, Done and All, and clicking a card opens the index drawer or the application's business detail view.

![Default Task Center page and header pending-count shortcut](/assets/core/task-center/task-center.png)

This screenshot shows the default `/task-center` layout and header count shortcut with English sample data. Once the application wires business detail components, clicking an entry opens the corresponding approval or business action directly.

### Example: Show pending counts in a dashboard or header

A procurement workspace home only needs a "My pending approvals" card showing the signed-in user's pending purchase approval count and five most recent items, without adding a separate full page—or the application already has its own workspace entry and wants to hide the default header button.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Add a "My pending approvals" card to the procurement workspace home showing my pending purchase approval count and the 5 latest items, where clicking an item opens that purchase detail page. Hide the default Task Center shortcut in the header since we already have our own entry.
```

Use the client data source factory to fetch scoped counts and list entries on demand, refresh after handling, and exclude the default header action ID in the client runtime.

## Principles and implementation

These are typical integration areas and visible changes for the scenarios above; adapt filenames to your application layout.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| `server/plugins.ts` and migrations | Register the Task Center Server plugin and apply `202610190001_user_tasks` | Creates the `userTasks` index table and authenticated read APIs |
| `client/plugins.ts` and `client/runtime.ts` | Register `taskCenter()`, with optional exclusions or route overrides | Enables `/task-center` and the header count shortcut, or replaces them with custom UI |
| Business server modules | Resolve `userTaskServiceToken`, register a source and write inside business transactions | Keeps the personal task index atomic with business creation, completion and cancellation |
| Workspace or custom pages | Compose `<TaskCenter sources={...} />` or `createTaskCenterDataSource(client)` | Displays source labels, loads scoped lists/counts and opens authorized business details |

### Register the plugin and customize the default interface

Register the default export from `@nocobase/app-plugin-task-center/server` alongside authentication, apply migrations, and register `taskCenter()` with no arguments in `client/plugins.ts`:

```ts
// client/plugins.ts (excerpt)
import taskCenter from '@nocobase/app-plugin-task-center/client';

// Inside the application's Client plugin array:
taskCenter();
```

Signed-in users can then open `/task-center`, and the standard authenticated header renders a pending-count shortcut that refreshes every 30 seconds while active and when the window regains focus. Custom shells can render registered shortcuts via `<AppHeaderActions />`.

To customize the default interface, keep `taskCenter()` in `client/plugins.ts` and configure `defineAppRuntime()` in `client/runtime.ts` using IDs exported from `@nocobase/app-plugin-task-center/client`:

| Goal | `defineAppRuntime()` option |
| --- | --- |
| Hide the header shortcut and keep `/task-center` | `excludedHeaderActionIds: [TASK_CENTER_HEADER_ACTION_ID]` |
| Remove the default page and its linked header shortcut | `excludedRouteIds: [TASK_CENTER_ROUTE_ID]` |
| Keep `/task-center` and its shortcut with a custom page | `routeComponentOverrides` targeting `TASK_CENTER_ROUTE_ID` |

To embed the center inside an application-owned route, exclude the default route and compose `<TaskCenter sources={sources} />`, supplying a `TaskCenterSource` with a label and `renderTask(task, refresh)` callback for each business source. All three options keep the server APIs and client locales available.

### Contribute business sources and transaction consistency

Resolve `userTaskServiceToken` from `@nocobase/app-plugin-task-center/server`, register each unique `sourceType` once during initialization, and retain its `UserTaskWriter` (duplicate registration fails). The excerpt below writes a pending equipment pickup inside the same transaction as the business record (business table writes and authorization omitted):

```ts
// server/services/deliveries.ts (excerpt)
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';

const userTasks = container.resolve(userTaskServiceToken);
const deliveries = userTasks.registerSource('asset.delivery');

await database.connection().transaction(async (tx) => {
  // Write the authoritative business record using tx, then project its personal task.
  await deliveries.put(
    {
      userId: recipientId,
      sourceKey: deliveryId,
      subject: 'equipment',
      title: 'Confirm laptop pickup',
      status: 'pending',
    },
    tx,
  );
});
```

Each entry is uniquely identified by `(userId, sourceType, sourceKey)`: keep `sourceKey` stable and opaque, use `subject` for the business category, and never treat the entry `id` as a business record ID. Replaying an unchanged `put` preserves ID and timestamps; call `setStatus(..., tx)` in the same transaction when business work finishes or cancels. When recipients change, call `writer.listBySourceKey(sourceKey, tx)` to reconcile within the transaction instead of querying internal tables directly.

With [Approvals](approval.md), `approval.task` and `approval.cc` are owned by the Approval plugin's shared contributor service—ordinary modules should not register or write those sources directly. Enable synchronization via each approval definition's `userTasks` option. When upgrading from an older Approval package that shipped `202610190001_user_tasks`, upgrade Approval and Task Center together to preserve migration history and existing rows; historical business records still require explicit backfill.

### Query lists, categories and statistics

The plugin exposes four authenticated read-only HTTP routes under the application's base path (for example `/main/api/userTasks`):

| Route | Key query parameters | Purpose |
| --- | --- | --- |
| `GET /api/userTasks` | `status`, `sourceType`, `subject`, `orderBy`, `direction`, `pagination`, `page`, `pageSize`, `after`, `includeTotal` | Paginated list of the signed-in user's tasks; `status` and `sourceType` accept single values or arrays (OR within a field, AND across fields) |
| `GET /api/userTasks/statistics` | `status`, `sourceType`, `subject` | Returns `{ pending, completed, cancelled }`; omit `status` for tab totals, or pass `status=pending` for lightweight badges |
| `GET /api/userTasks/categoryStatistics` | Optional `status` (default `pending`) | Discovers `(sourceType, subject)` categories from the user's full history with counts; closed-only categories stay with count `0` |
| `GET /api/userTasks/:id` | None | Returns index metadata for one owned entry |

On the client, `createTaskCenterDataSource(client)` exposes `list`, `statistics` and `categoryStatistics`:

- Map a Closed tab to `status: ['completed', 'cancelled']` and an All tab to omitted `status`; keep tab counts aligned with the list's `sourceType` and `subject` scope while omitting `status`.
- Prefer `pagination: 'cursor'` (ordered by `(createdAt, id)`) for interactive lists, requesting `includeTotal: true` only when exact totals are required. Request `status: 'pending'` for live badges to avoid scanning history.
- Counts measure personal index entries rather than distinct business records.

## AI development constraints and verification

### Plugin-specific development constraints

- Read the `nocobase-app-plugin-task-center` Skill shipped with the installed version (including `references/server.md` and `references/client.md`) before integrating.
- Personal endpoints always derive the owner from server authentication. Never accept client-supplied `userId` overrides or expose generic browser routes to write index rows or mark tasks complete without business logic.
- Commit business mutations and task index writes in the same database transaction; never query or edit the internal `userTasks` table directly.
- `TaskCenter`'s `sources` adapters control presentation only and do not filter out other sources. Keep titles safe for recipients, and enforce authorization in each business detail and action route.
- Use source-bound writers directly for ordinary work instead of inventing approval stages or making Task Center depend on Approvals.

### Acceptance checks

- **Standalone end-to-end flow**: With only Task Center and a non-approval business registered, write a pending task inside a business transaction, sign in as the recipient, inspect list, category navigation and header counts, complete the work through the authorized business endpoint, and verify the item moves to Done with refreshed counts.
- **Transactions and idempotency**: Confirm a rolled-back business transaction leaves no task entry, unchanged replays retain ID and timestamps, and recipient changes reconcile cleanly via `listBySourceKey`.
- **Isolation and error paths**: Anonymous calls to `/api/userTasks*` return `401`; `userId` or invalid/empty array filters return `400`; foreign or missing IDs return `404`; signing out or switching accounts clears cached rows.
- **Scoped consistency**: In dashboards or custom data sources, verify list and count queries share the same `sourceType` and `subject` scope, and verify pending items with no currently available business action do not expose unauthorized controls.

Related: [Approvals](approval.md), [Notifications](../notifications/notification.md), [Transactions and data consistency](../../developing-apps/transactions-and-consistency.md), [Manage plugins](../../developing-apps/manage-plugins.md).

This guide follows the commercial plugin's public exports, bundled Skill and default UI implementation; the screenshot was captured from a local sample run. Package access and use depend on your license.

These are acceptance requirements for your integration, not claims of completed business verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Refine and continue developing](../../../getting-started/develop-your-first-app.md#refine-and-continue-developing) and [Testing](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.
