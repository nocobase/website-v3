---
title: Build the sales workspace UI
metaDescription: Compose a sales workspace, customer list, and detail pages with UI Library, connect follow-ups to opportunities and quotes, and verify filtering and navigation.
lesson: 6
---

Build a sales workspace in the [existing CRM](opportunities-and-quotes.md) to view customers, follow-ups, opportunities, and quotes together. Reuse existing records and calculation rules.

Follow the application's shadcn component conventions. Prefer installed UI Library components and business blocks, including tables, cards, and tabs.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-5"><code>lesson-5</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-6"><code>lesson-6</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-6/docs/lesson-6.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/developing-apps/page-layouts.md">UI Library</a></td></tr>
</tbody>
</table>
</div>
</div>

## Define the roles of the workspace, list, and detail pages

At the start of the day, salespeople need to find recent conversations, opportunities in progress, and their quotes. Within a customer, they need to switch between account details, contacts, and business records.

| Entry point              | Purpose                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| Sales workspace          | Review customer, opportunity, and quote summaries; continue recent follow-ups |
| Customer list            | Find a customer by name and status                                            |
| Customer detail          | Switch between details, contacts, follow-ups, and opportunities               |
| Opportunities and quotes | Follow customer relationships to view and edit quote lines                    |

Workspace counts and records come from existing business data. Recent follow-ups are recorded conversations, not tasks, and opening one does not mark anything complete.

## Build pages with UI Library

Send this request to the Agent in the application root:

```prompt
Turn the existing CRM into a workspace for daily sales work. Keep the current options to add and edit records.

- Show customer, opportunity, and quote summaries alongside recent follow-ups. Each record opens its customer or opportunity.
- Let me search customers by name and filter by status.
- Use customer detail tabs for information, contacts, follow-ups, and opportunities, with links to quotes.
- Show clear loading, empty, and error messages. Let me view records and return to the list on my phone.
```

The prompt only needs to describe your business needs. The application’s `AGENTS.md` directs the Agent to development Skills and component guidelines, which explain how to reuse existing components, add components from UI Library, and compose pages. This lets the Agent choose suitable standard components for requests such as viewing a customer list or switching between customer details. You do not need to know component names or specify UI Library in the prompt.

Check these behaviors when the pages are ready:

| Page | Components | Expected behavior |
| --- | --- | --- |
| Workspace | `Card`, `DataTable`, `RecordLink` | Counts match the records; a follow-up opens its customer's follow-up tab |
| Customer list | `DataTable`, search, filters, pagination | Name and status apply together; refresh preserves filters and page number |
| Customer detail | `PageHeader`, `Tabs`, existing forms | The customer name stays visible; refresh, save, and cancel preserve the selected tab |

These components display the interface. The Agent also connects data and navigation, and resets pagination when filters change. See [Page layouts](../core/developing-apps/page-layouts.md), [Page routes](../core/developing-apps/pages-and-interactions.md), and [Data requests and state](../core/developing-apps/data-requests-and-state.md).

![The workspace brings together record counts, recent follow-ups, and links to opportunities and quotes.](/assets/guides/sales-workspace.png)

## Continue the customer follow-up and review the quote

Open **Northstar Labs** from the workspace and walk through its tabs. If starting directly from this lesson’s tag, first prepare Annual rollout proposal using [the previous quote exercise](opportunities-and-quotes.md#create-a-quote-and-check-prices). The seeded Northstar team rollout is a separate quote.

1. Check the customer name, industry, and status; edit one field and save.
2. Open contacts, confirm the existing contacts remain, and add another.
3. Open follow-ups and record `Reviewed Annual rollout proposal with Emma`, with `Confirm rollout schedule` as the next step. Confirm the new record appears first and saving keeps you on the follow-up tab.
4. Open **Northstar sales workspace**, then **Annual rollout proposal**. Check the two products and quoted unit prices; the total should still be `1150.00`.
5. Return to the customer list and reopen the same customer to confirm the changes remain.

After saving a follow-up, return to the workspace and find the new record. Reopen an edited quote and check its saved amount. Empty tabs should explain that no records exist and offer a create action when the user has permission.

![Customer tabs organize related records; saving a follow-up returns to the same tab.](/assets/guides/customer-workspace.png)

## Check filters, navigation, and saved results

Prepare customers with different statuses. Search and status filters should apply together, and result counts should reflect the current conditions.

| Action                                                       | Expected result                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Search using part of a customer name                         | Only matching customers appear                                             |
| Select a status while a search is active                     | Results satisfy both conditions                                            |
| Search for a nonexistent name, then clear filters            | An empty result appears, followed by the restored list                     |
| Change filters and move between result pages                 | No records or page numbers remain from the old filter                      |
| Open customers, opportunities, and quotes from the workspace | Each link opens the correct record; refreshing the detail page still works |
| Save a contact, follow-up, or quote and return               | Lists, details, and workspace show the updated data                        |
| Simulate an offline connection while requesting data         | A clear error appears; retry works after reconnection                      |
| Narrow the browser viewport                                  | Key actions remain reachable without obscuring back or save controls       |

Ask the Agent to test combined filters, empty results, and navigation targets, then complete these flows in the browser. Use developer tools to throttle or disconnect the network when checking loading and error feedback. A visible loading indicator alone does not prove that the request eventually succeeds.

**Done when**: Workspace counts match business records, search and status filters work together, and links open the correct customer, opportunity, or quote. Saved data and the active tab survive reloading, key actions work at mobile widths, and failed loads can be retried.

Continue with [Role permissions and customer access](team-permissions.md) to give each salesperson access to the appropriate records.
