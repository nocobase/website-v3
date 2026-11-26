---
title: "Build a knowledge base"
metaDescription: Add a product knowledge base to CRM for guides, pricing policies, and sales playbooks with change proposals, version review, text search, and per-document access control.
---

Add a shared product knowledge base to the CRM application: sales managers maintain product guides, pricing policies, and sales playbooks; salespeople search articles and submit change proposals that become versioned updates after review; and administrators restrict internal documents so unauthorized roles cannot see or search them.

When trying the complete example, prepare separate administrator, salesperson Alex and Taylor, and manager Morgan accounts (see [account and role setup](roles-and-permissions.md#configure-users-and-roles)).

**Modules covered**

- [Knowledge](../../core/using-plugins/agents-and-knowledge/knowledge.md)

## Define the knowledge space and role permissions

The product knowledge base uses a dedicated space `crm-products` (labeled **Product knowledge**), kept separate from customer business records. Each CRM role receives an explicit access level:

| Role | Space permissions | Allowed actions |
| --- | --- | --- |
| Sales (Alex, Taylor) | `read`, `propose` | Browse, search, and submit change proposals; cannot edit directly or decide proposals |
| Sales manager (Morgan) | `read`, `propose`, `edit` | Create folders and articles, edit directly, and accept or reject proposals |
| Administrator | `manage` (includes all above) | Configure custom per-folder and per-document access permissions |

For internal leadership documents (such as a confidential discount margin floor), administrators can switch that document to **custom permissions** and grant read access only to sales managers. Restricted documents never appear in the tree or search results for unauthorized salespeople.

## Connect the knowledge base and add product documents

The [Knowledge plugin](../../core/using-plugins/agents-and-knowledge/knowledge.md) provides spaces, folder trees, Markdown editing, version history, built-in text search, and proposal review without requiring Agents or semantic vector indexing. In the complete example, the [assistant provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/crm-assistant.ts) binds the space access resolver and user subject directory, and [client routes](https://github.com/nocobase/doc-demo-crm/blob/main/client/routes.ts) add **Product knowledge** to the main sidebar.

Send the role table above together with this request to your development Agent:

```prompt
Add a Product knowledge base to CRM for maintaining product guides, pricing policies, and sales playbooks.

- Salespeople can read, search, and propose changes, but cannot edit articles directly or approve proposals.
- Sales managers can create and edit articles and review change proposals from salespeople.
- Administrators can restrict individual sensitive documents to specific users so unauthorized salespeople cannot see or search them.
- Use built-in text search for now without requiring a vector index.
```

After setup, populate initial documents in the running app:

1. Sign in as Morgan, open **Product knowledge** from the sidebar, and create three folders: **Product guides**, **Pricing & policies**, and **Sales playbooks**.
2. Under **Product guides**, create **Enterprise Implementation Guide** documenting the standard 4-week multi-office rollout schedule (Week 1 discovery and modeling, Week 2 workspace and permissions, Week 3 UAT and training, Week 4 go-live).
3. Under **Pricing & policies**, create **Quotation Discount Policy** documenting discount thresholds (up to 10% confirmed automatically, above 10% requires sales manager approval, no self-approval, confirmed quotes lock price snapshots).
4. Under **Sales playbooks**, create **Sales Discovery Playbook** with initial scoping questions.
5. As an administrator, create **Internal Discount Margin Floor** under **Pricing & policies**, open its permissions menu, switch to custom access, and grant read access only to Morgan.

![Alex viewing the published v2 Quotation Discount Policy in Product knowledge while restricted internal documents stay hidden](/assets/guides/crm-knowledge-space.png)

## Submit change proposals and review versions

When a salesperson notices missing details in product documentation, they submit a change proposal for a manager to inspect and publish as a new version:

1. As Alex, open **Product knowledge → Pricing & policies → Quotation Discount Policy**. The header shows **Propose only**; click **Propose changes**.
2. Add the manager review turnaround detail (for example, discounts above 10% are reviewed within 2 business days), enter a short reason, and submit.
3. As Morgan, open **Product knowledge**, select **Pending review** in the left pane, open the proposal, and switch to the **Changes** tab to inspect the diff.
4. Click **Accept** to publish `v2` with the proposer and reason preserved in version history.

![Morgan inspecting Alex's change proposal diff with Accept and Reject actions](/assets/guides/crm-knowledge-proposal.png)

If another editor updated the document while a change was in progress, optimistic version locking rejects stale overwrites so the editor must reload the latest version first.

## Verify text search, version history, and access boundaries

Use separate accounts to verify search, history, and document-level isolation:

| Action | Expected result |
| --- | --- |
| As Alex, press `Ctrl/Cmd + K` and search `discount` | Returns **Quotation Discount Policy** (`v2`); **Internal Discount Margin Floor** does not appear |
| As Morgan, search `discount` | Returns both **Quotation Discount Policy** and the lock-badged **Internal Discount Margin Floor** |
| As Alex, open **History** on **Quotation Discount Policy** | Displays `v1` and `v2` revisions; direct editing remains unavailable |
| As Alex, attempt a direct document update or proposal acceptance via API | Rejected by the server; document version remains unchanged |

Concurrent version conflicts (submitting a stale `expectedVersion`) and unauthorized direct API reads are covered in the example's [server integration test](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/crm-assistant.test.ts). This guide uses built-in text search; to add optional semantic indexing later, see [Search and semantic indexing](../../core/using-plugins/agents-and-knowledge/knowledge.md#search-and-semantic-indexing).

**Done when**: **Product knowledge** is accessible from navigation, managers can maintain articles and accept proposals into new versions, salespeople can read, search, and propose changes without direct edit rights, and restricted documents stay hidden from unauthorized users in both the tree and search results.

With product knowledge in place, continue to [Connect a business Agent](business-agent.md) so the customer detail sales assistant can combine these articles with authorized CRM records to draft follow-ups.
