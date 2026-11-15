---
title: Model opportunity and quote data
metaDescription: Add opportunities, products, and quotes to a customer CRM, preserve price snapshots, calculate totals, and verify existing data after upgrading.
lesson: 5
---

Add opportunities, products, and quotes to the [customer CRM](test-and-deliver.md). Save the quoted prices so later catalog changes do not alter past quotes.

Use an administrator account. Keep existing customers, contacts, and follow-ups to check that the new features preserve them.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-4"><code>lesson-4</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-5"><code>lesson-5</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-5/docs/lesson-5.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/framework/http/validation.md">Request validation</a></td></tr>
</tbody>
</table>
</div>
</div>

## Define business relationships and calculation rules

A customer is the organization you work with. An opportunity is a potential sale, and a quote is a set of products and prices offered for that sale. One customer can have several opportunities, and an opportunity can have multiple quotes.

| Record      | What it stores                                                  | Relationship                                     |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------ |
| Opportunity | A name, sales stage, and other business details                 | Belongs to one customer; can have several quotes |
| Product     | Code, name, and current unit price                              | Can appear on different quotes                   |
| Quote       | A name, line items, and total                                   | Belongs to one opportunity                       |
| Quote line  | Product, quantity, quoted unit price, discount, and line amount | Belongs to one quote; preserves what was offered |

The catalog stores today's price. A quote line stores the price offered at the time, called a “price snapshot.” Later catalog changes leave that price unchanged. Core [database relations](../core/framework/database/relations.md) connect customers, opportunities, and quotes.

Saving a quote must follow two rules:

- The server recalculates amounts from the lines instead of accepting a total from the browser.
- The quote and all its lines save together. An invalid line must not leave partial data.

## Develop opportunities, products, and quotes

Use [database migrations](../core/developing-apps/data-models-and-migrations.md) to add structures while retaining existing records. Saving or undoing the quote and its lines together is a [transaction](../core/developing-apps/transactions-and-consistency.md). For input checks, see [Request validation and errors](../core/developing-apps/request-validation-and-errors.md).

Send this request to the Agent in the application root:

```prompt
Add opportunities, products, and quotes to the existing CRM. Let me open opportunities from a customer and view each quote's lines. Keep existing customers, contacts, and follow-ups. Use the English interface and fictional data.

Follow these business rules:
- A customer can have multiple opportunities, each with multiple quotes.
- Products store a name, code, and current price. Quote lines store the product, quantity, quoted price, and discount.
- Quantities are positive integers and prices are nonnegative. Discounts range from 0–100%; 10% means one tenth off.
- Calculate each line as quantity × unit price × (1 − discount percentage). Round half up to two decimal places, then sum the rounded amounts.
- Catalog changes leave saved quotes unchanged. Editing quote lines recalculates amounts using their saved prices.
- Use USD. Leave tax, shipping, currency conversion, approvals, attachments, and notifications for later.
```

A quote does not yet mean an approved offer or a won sale, and it is not automatically sent to the customer.

## Create a quote and check prices

Complete this sequence as an administrator and keep these records for the next two lessons:

1. Open **Northstar Labs** in **Customers**. Reuse the existing customer, or create it and add a contact and follow-up if it is missing.
2. In **Products**, create **Team workspace license** (code `TEAM-LICENSE`, price `100.00`) and **Onboarding workshop** (code `ONBOARDING`, price `250.00`). If you already created these during the exercise, check their details and prices.
3. Return to Northstar Labs and open **Northstar sales workspace**. If the opportunity is missing, create it with **New opportunity**.
4. Create **Annual rollout proposal** in this opportunity. Select the two products and enter the quantities and discounts below. Selecting a product should fill in its catalog price; saving should produce a total of `1150.00`.

If you loaded sample data, the opportunity also contains **Northstar team rollout**, totaling `2096.00`. That is a separate seeded quote; create Annual rollout proposal for this exercise.

| Product                | Quantity | Quoted unit price | Discount | Line amount |
| ---------------------- | -------- | ----------------- | -------- | ----------- |
| Team workspace license | 10       | 100.00            | 10%      | 900.00      |
| Onboarding workshop    | 1        | 250.00            | 0%       | 250.00      |
| **Total**              |          |                   |          | **1150.00** |

1. Reopen **Northstar Labs → Northstar sales workspace → Annual rollout proposal** and refresh. Check that the lines remain.
2. Change the catalog price of Team workspace license to `120.00`. The saved quote still uses `100.00`; a new line uses `120.00`.
3. Change the saved quote's first quantity from `10` to `12`, keeping its price and discount. The line amount becomes `1080.00`, and the total `1330.00`.
4. Change the quantity back to `10`. The total returns to `1150.00`.

![The quote preserves each line’s unit price and discount, totaling USD 1,150.00.](/assets/guides/quote-details.png)

## Check quote amounts and saved results

Check these scenarios in the UI, using the quote screenshot above to compare the lines and total:

| Action                                                             | Expected result                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| Create two opportunities for one customer, with a quote on each    | Each quote belongs to the correct opportunity          |
| Create the quote above and refresh                                 | Line amounts are 900.00 and 250.00; total is 1150.00   |
| Change a catalog price and reopen the saved quote                  | Its quoted price, discount, and amount stay unchanged  |
| Change a saved quote's quantity                                    | Recalculation uses the price stored on that quote      |
| Enter zero quantity, a negative price, or a discount above 100%    | Saving is rejected; the original quote remains intact  |

The Agent should check failed saves and retries and explain the business results: a failed save leaves no partial quote lines, retrying the same save creates no duplicate quotes or lines, and deleted opportunities or products cannot be used to create quotes. Screenshots can show amounts and saved lines; for behavior a screenshot cannot establish, rely on checks the Agent has actually completed.

Signed-out users and users without page permission cannot access these pages. Isolation between salespeople arrives in Lesson 7.

## Confirm existing customer records are intact

Open a customer created in the previous lesson. Confirm that its details, contacts, and follow-ups remain available and that you can still add a follow-up. After adding opportunities and quotes, return to the customer to find those records too.

Continue with [Build the sales workspace UI](sales-workspace.md) to organize these features for daily use.
