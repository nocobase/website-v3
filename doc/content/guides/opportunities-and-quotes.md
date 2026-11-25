---
title: "Multi-table relations and historical snapshots"
metaDescription: Turn business requirements into an ER model and data dictionary, apply migrations, and use a price change to understand historical quote prices.
---

Add opportunities, products, and quotes to a business application that already manages customers, contacts, and follow-up records. Save the quoted prices so later catalog changes do not alter past quotes.

Use an administrator account and keep existing customers, contacts, and follow-ups so you can verify that the new structures preserve them.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="core-capabilities/index.md#example-project">How to use the complete example</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Example project</th><td><a href="https://github.com/nocobase/doc-demo-crm"><code>nocobase/doc-demo-crm</code></a> (latest complete CRM app)</td></tr>
<tr><th scope="row">Run guide</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/main/README.MD">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/framework/database/overview.md">Database</a></td></tr>
</tbody>
</table>
</div>
</div>

## Derive an ER model and data dictionary from requirements or existing materials

Data modeling translates business entities and their relationships into database table structures.

Northstar Labs may be buying team licenses while another department discusses a separate service. The customer describes the same company, but each potential sale has its own progress and quotes. Add opportunities under the customer, then associate each quote with its opportunity.

In an Agent session at the application root, send:

```prompt
I want to manage opportunities and quotes in this CRM. A customer can have several opportunities, each with several quotes. The product catalog maintains names, codes, and current prices. A quote can include multiple products, each with its own quantity and discount. Later catalog price changes must leave saved quotes unchanged.

First draw an ER diagram and prepare a short data dictionary explaining the key fields, types, relationships, and constraints. Keep existing customers, contacts, and follow-ups. Don't change the database yet.
```

An ER diagram shows these entities and their relationships visually. A data dictionary describes the fields each record stores and what they mean. Both express the same model, helping you confirm the Agent’s understanding before development. Follow the Agent's diagram from customer to opportunity, quote, and lines, then check how each line relates to a product:

![One-to-many relationships connect customers, opportunities, quotes, and lines. Products store current prices; quote lines store quoted prices.](/assets/guides/crm-sales-er.svg)

A quote contains multiple products, and a product can appear on multiple quotes. **Quote lines** connect them. Quantity and discount describe this particular offer, so they belong on the line rather than in the catalog. A line stores both `productId` and its own price: a product reference alone would retrieve today's price when reopening an old quote.

This dictionary excerpt shows what each record stores and how it connects to other records:

| Record | Example fields | Business purpose |
| --- | --- | --- |
| Product `crmProducts` | Name, code, current price | Maintain the products available for sale and their current prices |
| Opportunity `crmOpportunities` | Customer reference, name, stage | Manage separate potential sales to the same customer |
| Quote `crmQuotes` | Opportunity reference, name, total | Record an offer for a particular sales opportunity |
| Quote line `crmQuoteLines` | Quote reference, product reference, quantity, quoted price, discount | Record what this offer includes, how much, and at what price |

To generate migrations, the Agent also needs database field names, types, and constraints. See the [complete model and field notes](https://github.com/nocobase/doc-demo-crm/blob/main/docs/sales-model.md) in the complete example for those definitions.

Before proceeding, confirm that the model separates two sales opportunities for one customer, supports different quantities, discounts, and prices for the same product on different quotes, and preserves old prices independently of the catalog.

If you already have an ER diagram or dictionary, give it to the Agent and have it fill in missing relationships, types, and constraints before continuing. Prefer text or structured exports. Supply details missing from images; external SQL still needs to be adapted into an incremental migration for this project.

## Convert the model into migrations and apply them

Migrations are the Core DB mechanism for creating tables; business tables in the primary data source and subsequent schema changes must be created and managed through migrations. This requirement does not apply when connecting to external data sources.

After confirming the model, send:

```prompt
The model looks right. Add the tables for opportunities, products, quotes, and quote lines to this CRM based on the agreed ER diagram and dictionary, keeping existing records. Show me which tables and relationships will be added before making the changes.
```

The migrations create the four tables and their relationship constraints, then add the definitions the application uses to query related data. Once applied, the database can store these records and the application can follow customer → opportunity → quote → lines. For implementation details, see [Database migrations](../core/developing-apps/data-models-and-migrations.md) and [Database relations](../core/framework/database/relations.md).

Check that the pending changes add only the new structures without removing existing tables. From the application root, with the database configured, run:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

Back up the existing database first. `--dry-run` previews the work; the second command applies it. If the development server already applied the migrations, the preview may show nothing pending: check migration history instead.

Check the new tables and relationships, then open an existing customer, view its contacts and follow-ups, and add a follow-up. Existing features should still work. At this point you have storage structures. A migration does not copy a product's price onto a quote line: the quote save operation must implement that business rule.

## Create opportunities and quotes with products and lines

Ask the Agent to connect the business operations:

```prompt
Connect these records to pages so I can maintain products, create and open opportunities from a customer, and create, view, and edit quotes. Keep the interface in English.

Selecting a product should fill in its current price. Save that price on the quote and use the saved price when editing an old quote. Calculate each line from quantity, unit price, and discount, round half up to two decimal places, then add the rounded lines. A 10% discount means one tenth off.

Use USD and leave out tax, shipping, and currency conversion for now. Run the result so I can create a quote.
```

The [quote save logic](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/sales.ts) in the complete example stores prices, calculates in integer cents, and uses the quote's own price during edits. The server recalculates totals instead of accepting browser-supplied totals. A [transaction](../core/developing-apps/transactions-and-consistency.md) saves the quote and its lines together, so one failed line cannot leave half a quote.

As an administrator, complete these operations in the English interface:

1. Open **Customers → Northstar Labs**. If it is missing, create the customer and add a contact and follow-up.
2. In **Products**, create or update **Team workspace license** (code `TEAM-LICENSE`, price `100.00`) and **Onboarding workshop** (code `ONBOARDING`, price `250.00`).
3. Return to the customer and use **New opportunity** to create **Northstar sales workspace**, or open it if it already exists.
4. Create **Annual rollout proposal**, select both products, and enter the quantities and discounts below. Save, reopen, and refresh the quote.

| Product | Quantity | Quoted price | Discount | Line amount |
| --- | --- | --- | --- | --- |
| Team workspace license | 10 | 100.00 | 10% | 900.00 |
| Onboarding workshop | 1 | 250.00 | 0% | 250.00 |
| **Total** | | | | **1150.00** |

If sample data was loaded, **Northstar team rollout** also exists with a total of `2096.00`. It is a separate seeded quote; create Annual rollout proposal for this exercise.

![Annual rollout proposal preserves two products, their prices and discounts, totaling USD 1,150.00.](/assets/guides/quote-details.png)

Follow **Northstar Labs → Northstar sales workspace → Annual rollout proposal** and check its parent opportunity and two lines. This path follows the relationships you created.

## Change a product price and verify historical quotes

First predict what happens when Team workspace license changes from `100.00` to `120.00`. Which price should appear in the catalog, in the saved Annual rollout proposal, and in a new quote where you select the product again?

Then check your prediction:

| Action | Expected observation |
| --- | --- |
| Change the license price to `120.00` in Products | The catalog displays `120.00` |
| Reopen and refresh the old quote | Its license price remains `100.00` and its total remains `1150.00` |
| Create **Repriced rollout check** under the same opportunity, select both products again, use the same quantities and discounts, and save | The license price defaults to `120.00`, its line amount is `1080.00`, and the total is `1330.00` |
| Edit the old quote's license quantity from `10` to `12`, keeping its price and discount | Recalculation uses the old price of `100.00`; the line amount is `1080.00` and the total is `1330.00` |
| Restore the old quantity to `10`, save, and refresh | Its total returns to `1150.00` |

Ten licenses on the new quote and twelve on the old quote happen to produce the same amount, but use different unit prices. Explain the result using the lines, not just the total. The product relationship identifies what was selected; the price on the line records what was offered. Both are needed.

Ask the Agent to run supporting input-validation, failed-save, and existing-feature tests in an isolated database (see [verification notes](https://github.com/nocobase/doc-demo-crm/blob/main/docs/verification.md)), then review the actual results.

To see how to turn existing business records into a daily workspace interface, continue with [Build a workspace UI with UI Library](sales-workspace.md).
