---
title: "Role permissions and data scopes"
metaDescription: Assign sales and manager roles, customer ownership, and read-only sharing, then verify related records, workspace summaries, and direct API access.
---

Configure distinct action permissions and customer record scopes for salespeople and sales managers. Before starting:

- Prepare separate accounts for an administrator, two salespeople, and a manager. Sales and manager accounts must not have administrator or other broad grants.
- Have a manager assign owners to existing unassigned customers. Do not open unassigned customers to all signed-in users.
- Back up the database. Migrations that add permission and record-scope fields cannot be rolled back automatically; undoing them requires restoring a matching database backup.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="core-capabilities/index.md#example-project">How to use the complete example</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Example project</th><td><a href="https://github.com/nocobase/doc-demo-crm"><code>nocobase/doc-demo-crm</code></a> (latest complete CRM app)</td></tr>
<tr><th scope="row">Run guide</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/main/README.MD">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/using-plugins/authorization/permissions.md">Permission management</a> · <a href="../core/using-plugins/authorization/sharing-rules.md">Sharing rules</a> · <a href="../core/using-plugins/authentication/users.md">Users</a> · <a href="../core/using-plugins/authentication/sign-in.md">Authentication</a></td></tr>
</tbody>
</table>
</div>
</div>

## Define roles, action permissions, and record scope

Decide separately what a user can do and which records they can act on. Opening the customer page does not imply permission to edit every customer. Receiving access to a shared customer does not imply permission to change it.

| Action                                                              | Salesperson                                           | Sales manager                |
| ------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| Create a customer                                                   | Allowed; the new customer belongs to the creator      | Allowed; can assign an owner |
| Read customers and related records                                  | Owned customers and those explicitly shared with them | All customers                |
| Edit customers, contacts, opportunities, and quotes; add follow-ups | Owned customers only                                  | All customers                |
| Access shared customers                                             | Read-only                                             | Can manage them              |
| Assign owners or create and revoke sharing                          | Not allowed                                           | Allowed                      |
| Read the product catalog                                            | Allowed                                               | Allowed                      |
| Maintain the product catalog                                        | Not allowed                                           | Allowed                      |

Core [permission management](../core/using-plugins/authorization/permissions.md) limits both actions and records. A salesperson can edit customers, but only those they own. Managers can maintain all customers.

Contacts, follow-ups, opportunities, and quotes follow their customer’s permissions. Workspace counts, search results, and recent follow-ups must include only accessible data. The application must enforce these rules beyond hiding buttons.

Roles assign responsibilities to users, action permissions determine what they can do, and record scope determines which records each action applies to. Read and edit scopes can differ: salespeople can read shared customers but edit only their own. Sharing extends record scope without granting action permissions.

[Default access](../core/using-plugins/authorization/default-access.md) adds a common record scope, such as public customers, for users who already have the action permission. It does not mean “only my customers.” This guide limits access by role and ownership, then adds sharing with a selected salesperson.

## Configure users and roles

Assign roles through [user management](../core/using-plugins/authentication/users.md). [Authentication](../core/using-plugins/authentication/sign-in.md) identifies the current user; permission rules determine what they can read or change. Both pages and server APIs must check access. The complete example's [permission definitions](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-permissions.ts) and [access routes](https://github.com/nocobase/doc-demo-crm/blob/main/server/routes/crm-access.ts) implement these rules.

Send this request to the Agent in the application root:

```prompt
Add salesperson and sales manager roles to the CRM.

- Salespeople maintain only their own customers. New customers belong to their creator.
- Managers maintain all customers, assign owners, and grant or revoke read-only sharing with selected salespeople.
- Shared customers can be read but not changed. Contacts, follow-ups, opportunities, and quotes follow their customer's access rules.
- Salespeople can view products; managers maintain them.
- Administrators assign roles to selected users. Do not automatically grant CRM access to everyone who signs in.
```

After implementation, sign in as an administrator and assign roles to the test users through user management in **System settings**. Assignments should be visible and editable from user details. Inspect existing roles to ensure no other grant broadens access. Do not assign the sales role to all signed-in users.

The verification steps below call the salespeople Alex and Taylor, and the manager Morgan. You can use different names, but use three separate users and independent browser sessions. Set their passwords in your own test environment; keep them out of source files and screenshots.

## Verify salesperson and manager action permissions

Sign in separately as Alex and Morgan. Use a practice product so price changes do not affect existing quote data.

| Action | Expected result |
| --- | --- |
| Alex opens the product catalog | Can read products, but cannot create products or change prices |
| Morgan creates a practice product and changes its price | Changes can be saved; Alex sees the updated price after refreshing |
| An administrator temporarily removes Taylor's CRM role; Taylor signs in again and opens a customer page directly | Customer business access is denied; restore the sales role and sign in again before continuing |

If a check fails, inspect role assignments in user details, then the actions granted to the role. Do not grant administrator access to make the test pass. Menu and button visibility alone cannot prove permissions work; the final API checks must also reject unauthorized actions.

## Configure and verify customer record scope

Prepare a customer record with contacts, follow-ups, and a quote (for example **Northstar Labs → Northstar sales workspace → Annual rollout proposal**—see [Multi-table relations and historical snapshots](opportunities-and-quotes.md#create-opportunities-and-quotes-with-products-and-lines) and [Build a workspace UI with UI Library](sales-workspace.md#continue-the-customer-follow-up-and-review-the-quote), or use the seeded sample data).

Use independent browser sessions for Morgan, Alex, and Taylor. Complete each action and its check before moving to the next row. Start with no additional sharing grants for Northstar Labs. If other customers exist, have the manager assign their owners explicitly and judge list results against those assignments.

| Action | Check immediately |
| --- | --- |
| Morgan opens Northstar Labs **Overview** and assigns Alex as owner; create or select **Harbor Design** and assign it to Taylor | Alex can open Northstar Labs, its opportunity, and its quote, but not Harbor Design; Taylor has the opposite scope |
| Alex creates **Cedar Studio** | Alex automatically owns it; Taylor cannot read it, while Morgan can |

As Alex, open Northstar Labs, change a customer detail, and save it. Morgan should see the change. Open Harbor Design's URL directly as Alex; reading must be denied. Check that workspace counts, searches, and recent follow-ups also respect customer ownership.

## Check read-only sharing, revocation, and handover

Keep Alex as the owner of Northstar Labs. Confirm that Taylor cannot read it, then complete these steps in order:

| Action | Check immediately |
| --- | --- |
| Morgan selects Taylor in Northstar Labs **Read-only sharing** and saves, keeping Alex as owner | Taylor can read the customer, existing follow-ups, and Annual rollout proposal, with no working edit or create controls; Harbor Design remains editable |
| Morgan revokes Taylor's sharing grant for Northstar Labs | Refreshing Taylor's open customer and quote pages denies access; searches, workspace counts, and recent rows no longer include its business records. Alex can still maintain them |
| After the revocation checks pass, Morgan transfers Northstar Labs from Alex to Taylor, without sharing it with Alex | Taylor can maintain the customer and related records; Alex loses access on refresh. Taylor sees the existing contacts, follow-ups, and quote, still totaling `1150.00` |

[Sharing rules](../core/using-plugins/authorization/sharing-rules.md) let Taylor read Northstar Labs and its related records without editing them. Taylor still needs a role that permits viewing customers.

Check revocation before transferring ownership. Once Taylor owns the customer, ownership grants access even without sharing. After transfer, Alex loses access while original follow-up authors and quote contents remain unchanged.

![A sales manager assigns the customer owner and grants read-only sharing to a selected salesperson.](/assets/guides/customer-sharing.png)

![During the sharing stage, Taylor can view Alex's customer with no edit or create controls.](/assets/guides/shared-customer-read-only.png)

## Have the Agent check API permissions

Ask the Agent to test with separate accounts and data, without using administrator access for salespeople. Check direct API requests as well as page actions:

| Check | Expected result |
| --- | --- |
| A salesperson tries to create a product or change its price | Request rejected; a manager can perform the same action |
| A user without a CRM role or an anonymous visitor requests customer data | Request rejected |
| Alex tries to read or edit an unshared customer owned by Taylor | Request rejected; data unchanged |
| A read-only user tries to modify a shared customer | Request rejected; data unchanged |
| Revoke Taylor's sharing, then request the original customer and quote | Access denied |
| Alex saves a customer and quote, transfers ownership to Taylor, then resends the original save requests | Permissions checked again; requests rejected instead of returning earlier successful responses |
| Read workspace summaries and related records | Same scope as the customer |
| Assign roles and upgrade the database | No accidental broad grants; existing fields and quote amounts retained |

When resending a request, the Agent should preserve the original identity and complete request, including its identifier, and confirm that it cannot bypass the changed permissions.

**Done when**: Page and API permissions have been checked with separate salesperson, manager, and read-only sharing accounts. Revoking sharing or transferring a customer applies the new access rules immediately, old requests cannot bypass them, and existing contacts, follow-ups, and quote amounts remain intact.

To add a review workflow for business records, see [Approval workflows and to-do center](quote-approvals.md).
