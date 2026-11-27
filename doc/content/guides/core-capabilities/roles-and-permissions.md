---
title: "Role permissions and data scopes"
metaDescription: Assign sales and manager roles, customer ownership, and read-only sharing, then verify related records, workspace summaries, and direct API access.
---

When a sales team shares one CRM app, salespeople should not edit each other's customers or change product catalog prices, while managers need to oversee all customers and assign ownership. Teams also need a way to share a customer read-only for collaboration or hand it over to another owner. You’ll configure Sales and Sales manager roles in the CRM app with distinct page access, operations, and customer record scopes, then verify read-only sharing, ownership handover, and direct API enforcement.

You can follow along in your own NocoBase Core project, or run the [complete CRM example](https://github.com/nocobase/doc-demo-crm/blob/main/README.MD) to explore the configured roles and sharing behavior.

**Modules covered**

- [Permission management](../../core/using-plugins/authorization/permissions.md)
- [Sharing rules](../../core/using-plugins/authorization/sharing-rules.md)
- [Users](../../core/using-plugins/authentication/users.md)
- [Authentication](../../core/using-plugins/authentication/sign-in.md)

## Define responsibilities for salespeople and managers

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

Core [permission management](../../core/using-plugins/authorization/permissions.md) limits both actions and records. A salesperson can edit customers, but only those they own. Managers can maintain all customers.

Contacts, follow-ups, opportunities, and quotes follow their customer’s permissions. Workspace counts, search results, and recent follow-ups must include only accessible data. The application must enforce these rules beyond hiding buttons.

Roles assign responsibilities to users, action permissions determine what they can do, and record scope determines which records each action applies to. Read and edit scopes can differ: salespeople can read shared customers but edit only their own. Sharing extends record scope without granting action permissions.

[Default access](../../core/using-plugins/authorization/default-access.md) adds a common record scope, such as public customers, for users who already have the action permission. It does not mean “only my customers.” This guide limits access by role and ownership, then adds sharing with a selected salesperson.

## Configure pages, business objects, and record scopes in System settings

As an administrator, open **System settings → Roles and permissions → Roles**. Edit the preset **Sales** or **Sales manager** role. Review the three tabs below. After making changes, select **Review and save**, check the changes, then select **Confirm and save**.

| Tab                 | What to configure                                                                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page access**     | Grant Sales workspace, Customers, Products, and My tasks independently. Selecting a page enables the operations it uses. Review the Operations tab and clear actions the role does not need.                                                                                        |
| **Operations**      | Expand Customers, Contacts, Follow-ups, Opportunities, Quotes, Products, and Bulk customer import separately. Sales uses **Customers I own** for customer-related objects, reads the full product catalogue, and sees **My submissions** for imports. Managers can use all records. |
| **System settings** | Grant integration or workflow administration separately. A manager who handles an assigned quotation approval needs a separate grant to configure the approval workflow.                                                                                                            |

![The Sales role in the Operations tab. Customer, contact, and opportunity views are scoped to owned customers. Assign owner and Manage customer sharing are unchecked.](/assets/guides/crm-sales-role-operations.png)

Under **Quotes**, editing, submitting, withdrawing, approving, rejecting, returning, and issuing a document are separate actions. Sales can submit their own quotations. Managers can decide a quotation only when assigned its task. Creating a quotation requires selecting a product. Keep product View enabled and check the product scope on the quote action. Configure attachment, reminder, and sales assistant actions under **Customers**. Mail and knowledge keep their own access controls.

The example’s [business permission definitions](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-permissions.ts) declare the available actions. Its [role editor configuration](https://github.com/nocobase/doc-demo-crm/blob/main/client/pages/settings/permission-workspace.ts) connects them to pages and objects.

If you are building from a basic CRM, ask the Agent to set up the roles:

```prompt
Configure Sales and Sales manager in the role editor. Let me grant the sales workspace, customer, product, and task pages independently, and control contacts, follow-ups, opportunities, and quotes separately.

- Salespeople maintain only their own customers. New customers belong to their creator.
- Managers maintain all customers, assign owners, and grant or revoke read-only sharing with selected salespeople.
- Shared customers can be read but not changed. Contacts, follow-ups, opportunities, and quotes follow their customer's access rules.
- Salespeople can view products; managers maintain them.
- Administrators assign roles to selected users. Do not automatically grant CRM access to everyone who signs in.
```

<a id="configure-users-and-roles"></a>

## Assign roles to users

As an administrator, open **System settings → Accounts and permissions → Users**. Edit Alex and Taylor and assign **Sales** to each, then assign **Sales manager** to Morgan. Check **Assigned roles** in the list and review any other roles that could broaden these users’ access.

The verification steps below call the salespeople Alex and Taylor, and the manager Morgan. You can use different names, but use three separate users and independent browser sessions. Set their passwords in your own test environment; keep them out of source files and screenshots.

## Verify role permissions and customer sharing

### Try customer ownership and read-only sharing in the UI

Use independent browser sessions for Morgan, Alex, and Taylor, and pick a customer record with contacts, follow-ups, and a quote (for example **Northstar Labs → Northstar sales workspace → Annual rollout proposal**—see [Data modeling and schema changes](data-modeling.md#connect-business-operations-and-transactional-saves) and [Build business pages](pages-and-ui.md#continue-the-customer-follow-up-and-review-the-quote), or use the seeded sample data). Make sure Northstar Labs starts with no extra sharing grants, then walk through these four steps in order:

| Action | Check immediately |
| --- | --- |
| Morgan opens Northstar Labs **Overview** and assigns Alex as owner | Alex can open and edit the customer, its opportunity, and its quote; Taylor does not see it in lists, search, or workspace counts |
| Morgan selects Taylor in Northstar Labs **Read-only sharing** and saves (keeping Alex as owner) | Taylor can view the customer, existing follow-ups, and quote, with no working edit or create controls |
| Morgan revokes Taylor's sharing grant for Northstar Labs | Refreshing denies Taylor access to the customer and quote, and searches and workspace counts no longer include its records; Alex can still maintain them |
| After confirming revocation, Morgan transfers Northstar Labs to Taylor (without sharing it with Alex) | Taylor can maintain the customer and related records with existing contacts, follow-ups, and quote intact; Alex loses access on refresh |

[Sharing rules](../../core/using-plugins/authorization/sharing-rules.md) extend record scope without granting action permissions; Taylor's role still needs View for each related object (for example, disabling quote View blocks opening the quote or downloading its document even while the customer stays shared). Check revocation before transferring ownership because once Taylor owns the customer, ownership grants access even without sharing.

![A sales manager assigns the customer owner and grants read-only sharing to a selected salesperson.](/assets/guides/customer-sharing.png)

![During the sharing stage, Taylor can view Alex's customer with no edit or create controls.](/assets/guides/shared-customer-read-only.png)

### Have the Agent verify remaining permission and API boundaries

Hiding buttons in the UI is not enough to prove permissions work. Instead of manually switching accounts in the browser for every edge case, ask the Agent to test product catalog restrictions, unauthorized requests, and direct API boundaries with separate non-admin accounts:

```prompt
Test the permission boundaries with separate salesperson, sales manager, and no-CRM-role accounts (do not use an admin account for salespeople), including direct API calls:
- Salespeople cannot create products or change prices, while managers can; users without a CRM role and anonymous visitors cannot access customer data.
- Salespeople cannot read or edit an unshared customer owned by someone else, and read-only shared users cannot edit a shared customer.
- After revoking sharing or transferring ownership, both new reads and replayed earlier save requests from the previous user are rejected; workspace counts and related records always match customer scope.
```

When replaying a save request, preserve the original identity and complete request (including its request identifier) to confirm that changed permissions are re-checked rather than returning an earlier successful response. If any check fails, inspect role assignments in user details first, then the role's action permissions and record scopes—do not grant administrator access to make a check pass.

**Done when**: You have walked through customer ownership, read-only sharing, revocation, and handover in the UI, and the Agent has verified product catalog restrictions, unauthorized access, and direct API boundaries with separate accounts.

To add a review workflow for business records, see [Approval workflows and to-do center](approval-workflows.md).
