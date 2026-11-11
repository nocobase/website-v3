---
title: Multi-portal example - ServiceHub
metaDescription: Run the ServiceHub equipment service example to explore portal switching, independent layouts, role permissions, and collaboration around shared tickets.
---

The [ServiceHub example repository](https://github.com/nocobase/app-example-multi-portal) models equipment service for coffee shops. Customers report faults, dispatchers assign engineers, and customers confirm the completed work. Each portal presents the information and actions its users need for the same ticket.

![System administrator workbench](/assets/core/servicehub/admin-workbench.png)

## Scenario and portal responsibilities

Four portals share one application's accounts and business data. Each can be installed and uninstalled separately.

| Portal | Pages and layout | Purpose |
| --- | --- | --- |
| Customer portal | Top navigation: overview, devices, service tickets | Report faults, track progress, confirm service |
| Dispatch console | Sidebar: ticket queue, field team, service overview | Assign tickets across customers and inspect team workload |
| Engineer workspace | Task cards and fixed bottom navigation | Handle personal assignments and review completed work |
| Service insights | Analytics sidebar with status and location summaries | View live statistics and demonstrate portal installation |

The interface defaults to English and also supports Chinese. Both languages share fictional English sample data: 3 shops, 6 devices, 12 tickets, and 7 business accounts.

## Install and initialize

You need Node.js 24 or later, pnpm 11.7.0, and read access to the NocoBase commercial package registry. The example source is public; its commercial multi-portal dependency still requires download permission.

Clone the example, sign in to the registry, and install dependencies from the project root:

```bash
git clone https://github.com/nocobase/app-example-multi-portal.git
cd app-example-multi-portal
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
pnpm install
```

Use the registry read token as the login password. Keep it in your user-level configuration, not in the repository. See [Create a multi-portal app](create-app.md#prepare-the-environment-and-commercial-access) for registry setup and access checks. This repository is already a complete app; do not run `create-app` again.

The commands below use the example's default SQLite setup, which needs no separate database service. Initialize configuration and enable sample data before the first startup:

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set app.sampleData=true
pnpm nocobase config set client.app.title=ServiceHub i18n.defaultLocale=en-US client.app.defaultTheme=compact
pnpm nocobase config check
pnpm dev
```

Configuration initialization creates local `config.yml` and application keys. Open the application URL printed in the terminal, keeping the `/main/` path. First startup runs migrations and sample initialization. To use another database, install its driver and adjust configuration as described in [Database configuration](../../reference/database-configuration.md).

The initial administrator defaults to `nocobase` / `admin123`; `admin@nocobase.com` also works at sign-in. Before first startup, you can change these credentials under `users.initialAdmin` in `config.yml`. Editing that configuration does not reset an existing account.

As the administrator, open **System settings → Portal management** and install Customer portal, Dispatch console, and Engineer workspace. Leave Service insights uninstalled initially. Return home to see the three installed portals.

These accounts use public demonstration passwords and belong in an isolated demo environment. The repository's [README](https://github.com/nocobase/app-example-multi-portal/blob/main/README.MD) contains full setup instructions and troubleshooting.

## Demo accounts and permissions

All business accounts below use **`ServiceHub2026!`**. Sign in with a username or email.

| Username | Name | Email | Data and actions |
| --- | --- | --- | --- |
| `manager` | Morgan Brooks | `manager@servicehub.example` | Dispatch all tickets; handle personal field tasks; view installed service insights |
| `dispatcher` | Jordan Lee | `dispatcher@servicehub.example` | View tickets across customers and assign engineers |
| `engineer1` | Taylor Chen | `engineer-1@servicehub.example` | Handle personal assignments |
| `engineer2` | Sam Patel | `engineer-2@servicehub.example` | Handle personal assignments |
| `customer1` | Alex Morgan | `customer-1@servicehub.example` | Devices and tickets for Harbor Coffee · London |
| `customer2` | Sofia Rivera | `customer-2@servicehub.example` | Devices and tickets for Juniper Coffee · Amsterdam |
| `customer3` | Jamie Park | `customer-3@servicehub.example` | Devices and tickets for Daylight Coffee · Singapore |

The manager is not a system administrator, has no customer portal permission, and cannot install portals or restore demo data. Use separate browser profiles to demonstrate collaboration between people; ordinary tabs in the same browser share a session.

## Switch portals and compare layouts

Sign in as `manager` and open **Dispatch console**. Its sidebar provides **Ticket queue**, **Field team**, and **Service overview**. The team page shows actual engineer assignments; select a ticket to open its details.

![Dispatch sidebar and field team workload](/assets/core/servicehub/dispatch-team.png)

Choose **Switch portal → Engineer workspace**. Without signing out, the page changes to task cards and bottom navigation, showing only Morgan Brooks's assignments. Two active tasks are provided initially. **Completed work** starts empty for this account and gains records after customers confirm completed service.

![A manager switching between dispatch and engineer portals](/assets/core/servicehub/portal-switching.png)

<img src="/assets/core/servicehub/engineer-mobile.png" alt="Engineer mobile workspace with portal switching, task cards, and bottom navigation" width="390" />

Sign in as `customer1` to see the top navigation layout. **Overview** contains a welcome area and summaries, **My devices** provides a fault-report entry for each device, and **Service tickets** supports progress tracking and service confirmation.

![Customer top navigation and device overview](/assets/core/servicehub/customer-portal.png)

ServiceHub implements its own business-user workbench and switcher, listing only portals that are installed and authorized for the current account. It does not directly reuse the template's administrator catalog. The server independently checks installation state, business permissions, and record scope. See [Access and permissions](access.md) for the default template's boundaries.

## Complete a service request

Prepare two browser profiles, signed in as `customer1` and `manager`:

1. **Report:** in the customer portal, open **My devices** and report a fault for the Linea espresso machine. Use “Espresso machine not heating” as the title. Note the new ticket ID; its status is **Unassigned**.
2. **Assign:** open **Dispatch console → Ticket queue** as the manager, find the ID, and open the details or **Assign engineer** from the more menu. Assign it to **Morgan Brooks**. The status becomes **Assigned**.
3. **Switch and accept:** choose **Switch portal → Engineer workspace**, find the same ticket, open **View task**, and select **Accept and start**. The status becomes **In progress**.
4. **Resolve:** enter a **Resolution**, such as “Replaced the thermostat and verified normal operation.” Select **Submit resolution**. The ticket becomes **Awaiting review**.
5. **Confirm:** return to the customer's **Service tickets**, refresh, and filter by **Awaiting review**. Review the resolution, confirm, and rate the service. The ticket becomes **Completed**. Refresh the manager's engineer portal and find it under **Completed work**.

To demonstrate a separate dispatcher and engineer, have `dispatcher` assign the ticket to Taylor Chen, then use `engineer1` to handle it. Customer and dispatch portals use responsive tables with row actions collected in a text-only more menu.

## Manage portals and restore demo data

The system administrator's home provides business portal entries, **Portal management**, and **Restore demo data**. Business users do not receive the two administrative entries.

Install **Service insights** in portal management, then refresh the manager's page to see it in the switcher. Open it to view ticket counts by status and location. Uninstalling hides its entry while preserving business data; see [Manage portals](manage.md) for lifecycle rules.

![Portal management with three installed portals and optional service insights](/assets/core/servicehub/portal-management.png)

Before the next presentation, the administrator can select **Restore demo data** on the home page and confirm. This removes tickets added during the presentation and recreates the sample devices and 12 tickets, retaining accounts, roles, and portal installation states. Restoration requires `app.sampleData` to be enabled.

If sample data was disabled at first startup, stop the service in your development environment, run the commands below, and restart. `db sample` runs previously skipped sample initialization; it does not replace the routine demo reset and cannot run in production.

```bash
pnpm nocobase config set app.sampleData=true
pnpm nocobase db sample
pnpm dev
```

## Explore the source

The [example repository](https://github.com/nocobase/app-example-multi-portal) contains the complete application. These links pin the version used in this guide:

| Entry | Contents |
| --- | --- |
| [Four portal packages](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/packages) | Independent `client/layout.tsx` in each portal |
| [Portal layout and switcher](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/client/pages/servicehub/portal-layout.tsx) | Authorized portal menu, navigation, and account controls |
| [Business API](https://github.com/nocobase/app-example-multi-portal/blob/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/server/routes/servicehub.ts) | Accessible portals, ticket operations, and record scope checks |
| [Seeds](https://github.com/nocobase/app-example-multi-portal/tree/c6dbe365bb7e1f2b93c30aa8a72380bd0d316fc8/database/main/seeds) | Business users, roles, devices, and tickets |

To add your own portal, continue with [Develop a business portal](develop.md).
