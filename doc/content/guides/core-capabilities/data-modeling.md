---
title: "Data modeling and schema changes"
metaDescription: Turn business requirements into an ER diagram and data dictionary, add tables safely with schema migration scripts, and verify relations and data consistency.
---

Extend an existing NocoBase Core application with multi-table business structures: using CRM opportunities, products, and quotes as the example, align on an ER diagram and data dictionary with your Agent, apply incremental schema changes with migration scripts without disrupting existing records, and connect transactional save logic.

You can follow along in an app that already manages customers, contacts, and follow-ups, or run the complete `doc-demo-crm` reference app to compare results. Sign in as an administrator and keep existing customer records so you can verify that the schema changes do not affect existing features.

**Modules covered**

- [Data models and migrations](../../core/developing-apps/data-models-and-migrations.md)
- [Transactions and consistency](../../core/developing-apps/transactions-and-consistency.md)
- [Database](../../core/framework/database/overview.md)

## Derive an ER diagram and data dictionary

When a requirement spans multiple tables and relationships, have the Agent produce an ER diagram and data dictionary before touching the database so you can confirm the business structure first.

In our CRM example, one customer (such as Northstar Labs) may pursue team licenses and an onboarding service at the same time—each potential deal needs its own progress and multiple quotes. Each quote can include multiple products with its own quantities and discounts, and later catalog price updates must leave saved quotes unchanged.

In an Agent session at the application root, send:

```prompt
I want to manage opportunities and quotes in this CRM. A customer can have several opportunities, each with several quotes. The product catalog maintains names, codes, and current prices. A quote can include multiple products, each with its own quantity and discount. Later catalog price changes must leave saved quotes unchanged.

First draw an ER diagram and prepare a short data dictionary explaining the key fields, types, relationships, and constraints. Keep existing customers, contacts, and follow-ups. Don't change the database yet.
```

The ER diagram shows entities and traversal paths, while the data dictionary lists the fields and constraints each table stores. Both describe the same model—check three design decisions before approving it:

![One-to-many relationships connect customers, opportunities, quotes, and lines. Products store current prices; quote lines store quoted prices.](/assets/guides/crm-sales-er.svg)

1. **Separate independent entities**: Customers, opportunities, and quotes connect through one-to-many links so separate deals for the same customer do not mix.
2. **Use a line-item table for many-to-many attributes**: A quote includes multiple products and a product appears on multiple quotes. **Quote lines** bridge them and store per-offer attributes (quantity and discount).
3. **Separate references from point-in-time values**: Each quote line stores both `productId` (pointing to the catalog) and its own quoted unit price. A foreign key alone would pull today's catalog price when reopening an old quote.

This excerpt summarizes each table's role; see the [complete model and field notes](https://github.com/nocobase/doc-demo-crm/blob/main/docs/sales-model.md) in the reference app for concrete column types and constraints:

| Record | Example fields | Business purpose |
| --- | --- | --- |
| Product `crmProducts` | Name, code, current price | Maintain sellable products and their current prices |
| Opportunity `crmOpportunities` | Customer reference, name, stage | Track separate deals for the same customer |
| Quote `crmQuotes` | Opportunity reference, name, total | Record an offer for a specific opportunity |
| Quote line `crmQuoteLines` | Quote reference, product reference, quantity, quoted price, discount | Record what this offer sells, how much, and at what price |

If you already have an ER diagram, data dictionary, or external SQL, hand it to the Agent to fill in missing relations, types, and constraints first. Prefer text or structured exports—supply details missing from images, and convert external SQL into incremental migrations for this project.

## Create tables with migration scripts

NocoBase Core manages schema changes on the primary data source through **migration scripts**—versioned change scripts that record each new table, column, and relation in order, much like commits track code history (not a database transfer or data-import tool). Once an app holds real data or deploys across environments, editing the database by hand risks losing records and cannot be repeated reliably; writing incremental scripts lets you preview changes, keep existing tables untouched, and apply the exact same evolution everywhere. Every new business table and subsequent schema change on the primary data source must go through migration scripts (external data sources are exempt from this rule).

After confirming the model, ask the Agent to generate the migration scripts and show the planned changes first:

```prompt
The model looks right. Add the tables for opportunities, products, quotes, and quote lines to this CRM based on the agreed ER diagram and dictionary, keeping existing records. Show me which tables and relationships will be added before making the changes.
```

The generated scripts create the four tables and their relationship constraints, along with the definitions the application uses to query related records. For migration syntax and relation definitions, see [Tables and data initialization](../../core/developing-apps/data-models-and-migrations.md) and [Database relations](../../core/framework/database/relations.md).

Verify that the pending changes **only add new structures without dropping or wiping existing tables**. Back up your database, then preview and apply from the application root:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--dry-run` lists pending work without executing it; run the second command once the plan looks right. If the development server already applied the changes on startup, the preview may report nothing pending—check migration history instead. `db apply` also refreshes the local collection cache automatically.

Check two things immediately after applying:

- **New structures exist**: All four tables and their relation constraints are created.
- **Existing features still work**: Open an existing customer, view its contacts and follow-ups, and add a new follow-up to confirm existing records remain intact.

When you need to add columns or evolve tables later, add a new incremental migration script instead of editing already-applied files; see [Add a migration and preserve existing data](../../core/developing-apps/data-models-and-migrations.md#add-a-migration-and-preserve-existing-data). Keep in mind that schema scripts only create storage structures—they do not automatically copy product prices onto quote lines. That business rule belongs in the write logic next.

## Connect business operations and transactional saves

With the schema in place, ask the Agent to connect the pages and server-side save logic:

```prompt
Connect opportunities, products, and quotes to pages so I can maintain the product catalog, create and open opportunities from a customer, and create, view, and edit quotes.

Selecting a product should default to its current price and save that price on the quote; editing an old quote should keep its saved price. Calculate each line from quantity, unit price, and discount, round half up to two decimal places, then sum the lines for the total. A 10% discount means one tenth off. Run the app when ready so I can verify with a quote.
```

Two write-path safeguards matter here (see [quote save logic](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/sales.ts) in the reference app):

- **Server-side recalculation**: Totals are recalculated on the server in integer cents rather than trusting browser-submitted totals, and edits reuse the line's saved price.
- **Transactional consistency**: A [transaction](../../core/developing-apps/transactions-and-consistency.md) saves the quote header and its lines together so one failed line cannot leave half a quote behind.

Sign in as an administrator and enter a sample quote to verify relation traversal and line-item persistence (the walkthrough uses the English interface and USD, without tax or shipping):

1. Open **Customers → Northstar Labs**. If it does not exist yet, create it and add a contact and follow-up.
2. In **Products**, create or update **Team workspace license** (code `TEAM-LICENSE`, price `100.00`) and **Onboarding workshop** (code `ONBOARDING`, price `250.00`).
3. Return to the customer and use **New opportunity** to create **Northstar sales workspace**, or open it if it already exists.
4. Create **Annual rollout proposal**, add both products with the values below, save, then reopen and refresh the page.

| Product | Quantity | Quoted price | Discount | Line amount |
| --- | --- | --- | --- | --- |
| Team workspace license | 10 | 100.00 | 10% | 900.00 |
| Onboarding workshop | 1 | 250.00 | 0% | 250.00 |
| **Total** | | | | **1150.00** |

If sample data was seeded, the opportunity may also contain **Northstar team rollout** (total `2096.00`). Leave it untouched and create **Annual rollout proposal** for this check.

![Annual rollout proposal preserves two products, their prices and discounts, totaling USD 1,150.00.](/assets/guides/quote-details.png)

## Verify relations and data consistency

Verify the model and write behavior across three areas—relation traversal, isolation from catalog updates, and rollback/regression tests:

1. **Check the relation path**: Navigate **Northstar Labs → Northstar sales workspace → Annual rollout proposal** and confirm the parent opportunity and both product lines match.
2. **Check isolation from catalog updates**: In **Products**, raise **Team workspace license** from `100.00` to `120.00`, then verify each outcome:

| Action | Expected observation |
| --- | --- |
| View the product catalog | The license displays `120.00` |
| Reopen and refresh **Annual rollout proposal** | The license price stays `100.00` and the total stays `1150.00` |
| Under the same opportunity, create **Repriced rollout check** with the same products, quantities, and discounts | The license defaults to `120.00`, line amount is `1080.00`, and total is `1330.00` |
| Edit the old quote's license quantity from `10` to `12` (keeping price and discount) and save | Recalculation uses the saved `100.00` price (line `1080.00`, total `1330.00`); restoring quantity to `10` returns the total to `1150.00` |

Ten licenses on the new quote and twelve on the old quote happen to produce the same total, but at different unit prices. Checking the line items—not just the total—confirms how the product foreign key (which product was chosen) and the stored unit price (what price was offered) each do their job.

3. **Run automated regression and failure checks**: Have the Agent run input-validation, failed-save rollback, and existing customer/follow-up regression tests in an isolated database (see [verification notes](https://github.com/nocobase/doc-demo-crm/blob/main/docs/verification.md)), then inspect the actual test results.

**Done when**: All four tables and relation constraints are applied via incremental migration scripts while existing customer, contact, and follow-up records remain intact; quotes and line items save and recalculate transactionally on the server, catalog price updates do not alter saved quotes, and isolated-database tests pass.

## Summary and next steps

Your application now has a multi-table model for opportunities, products, quotes, and quote lines, and you have walked through the core NocoBase workflow for evolving schemas safely: confirm the ER diagram and data dictionary first, apply incremental migration scripts, and verify relations and consistency through transactional writes and tests.

Next, continue with [Build a workspace and business pages](pages-and-ui.md) to turn these business records into a daily sales workspace with filtered lists and customer detail tabs.
