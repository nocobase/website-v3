---
title: "Generate business documents from a template"
metaDescription: Download an English DOCX from a draft CRM quotation, change a quantity and check the new total. Issue a separate document from a confirmed quotation snapshot.
---

With a saved draft quotation, you can download an English DOCX directly from the customer’s quotation page and check the prices you plan to offer. You can do the whole draft exercise as a salesperson, before submitting the quotation or taking the approval tutorial.

**Modules covered**

- [Template printing](../../core/using-plugins/automation/template-print.md)
- [File management](../../core/using-plugins/data-and-files/file-management.md)

## Prepare a draft quotation

For the [complete CRM example](https://github.com/nocobase/doc-demo-crm/blob/main/README.MD), follow the project’s installation and startup instructions. The full project depends on the commercial Approval and Task Center plugins and requires authorized registry access to install them. The example includes both draft previews and formal documents. Once you have a draft, you can go straight to the download instructions in each section.

If the practice accounts still need roles, have an administrator assign **Sales** and **Sales manager** as described in [account and role setup](roles-and-permissions.md#configure-users-and-roles). If your development installation has no sample records yet, run this command from the application root:

```sh
pnpm nocobase db sample --json
```

Sample customers start without an owner. Have a sales manager assign **Northstar Labs** to the salesperson you will use for this exercise, Alex. Sign in as Alex and open **Customers → Northstar Labs → Opportunities → Northstar sales workspace → Northstar team rollout**. Check that the quote is in **Draft** and has these two lines in USD.

| Product | Quantity | Unit price | Discount | Amount |
| --- | ---: | ---: | ---: | ---: |
| CRM workspace license | 12 | 120.00 | 10% | 1296.00 |
| Implementation workshop | 1 | 800.00 | 0% | 800.00 |

If someone has submitted or edited the sample quote, or another salesperson owns the customer, Alex can create an opportunity under a customer they own. Choose **New quote**, enter a name, add the two lines above and save. Rerunning the sample command preserves existing edits. See the [sample products and quote](https://github.com/nocobase/doc-demo-crm/blob/main/database/main/seeds/202611120001_sales_samples.ts).

## Add a draft preview and download the first English quotation

From the application root, give the development Agent this request:

```prompt
Add a “Download draft DOCX” button to the customer’s draft quotation page. Use an English quotation template with DRAFT clearly visible at the top. Show the customer, opportunity, each product’s quantity, unit price, discount and line amount, and the total with its currency. Use the latest saved quote each time so I can change a quantity and download the updated figures. Keep the quote in Draft and limit downloads to people who can view it.
```

In the example, the button requests the current quotation from the server. The server reads the quote and its lines with the signed-in user’s permissions and passes them to the renderer. In the Word template, `{d.lines[i].quantity}` displays the quantity for each product row and `{d.total}` displays the saved quote total. The server returns the DOCX directly, without submitting the quote or storing an issued file. See the [English template](https://github.com/nocobase/doc-demo-crm/blob/main/docs/templates/quotation-v2.docx) and [renderer](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/quotation-renderer.ts).

In **Draft quotation preview**, choose **Download draft DOCX** and open the downloaded file. Look for **DRAFT QUOTATION** in bold at the top. Check the customer, opportunity and quotation names, then compare each product, quantity, price and discount with the table above. The two line amounts should add up to **Total: 2096.00 USD**.

![The first download shows DRAFT QUOTATION above the two lines and a total of 2096.00 USD.](/assets/guides/quotation-draft.png)

## Change a quantity, download again and check the amounts

Keep the quotation in **Draft**. Choose **Edit quote**, change the **CRM workspace license** quantity from `12` to `13` and save. The quotation page should now show `2204.00`. Choose **Download draft DOCX** again and open the new download alongside the first one.

| Value in the document | First download | After the edit |
| --- | ---: | ---: |
| License quantity | 12 | 13 |
| Discounted license amount | 1296.00 | 1404.00 |
| Workshop amount | 800.00 | 800.00 |
| Total (USD) | **2096.00** | **2204.00** |

Both documents should say **DRAFT**. Back on the quotation page, the state should still be **Draft**, with **Edit quote** available.

## Optional — Issue a confirmed quotation and verify repeat downloads

To add formal quotations, give the development Agent this follow-up request:

```prompt
Let me issue a formal document once a quote is confirmed. Reuse the English draft template with QUOTATION as the heading. Use the products, prices and totals from the confirmed quote. Save the first document so I get the same file on every download, even if catalog prices change. Check that I can still view the quotation each time I download it.
```

The server takes the lines and amounts from the snapshot saved at confirmation. On first issue, it captures the customer and opportunity names and stores the generated file against the quote. Later downloads read that file. See the [quotation document service](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/customer-files.ts).

Open a **Confirmed** quotation you can view. In **Quotation document**, choose **Generate DOCX**, then select the filename to preview or download it. The heading reads **QUOTATION** and the document says **Confirmed quotation**. Compare each quantity, unit price, discount and total with the confirmed quotation.

If you use the 13-license practice quote in an isolated demo, submitting it at the default discount threshold confirms it directly. The issued total should be `2204.00 USD`. Have a manager change the practice product’s catalog price, then download the same document again. Its contents and total should be identical. Open the same download link as another salesperson who cannot view this customer and check that access is denied. See the [download permission tests](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/customer-files.test.ts).

![The issued document reads Confirmed quotation and shows a total of 2204.00 USD.](/assets/guides/quotation-document.png)

## Summary and next steps

**Done when**: You have opened both English documents marked **DRAFT**. After you change the license quantity from 12 to 13, the total rises from **2096.00 USD** to **2204.00 USD**, and the quotation is still editable.

If you have already issued a confirmed quotation, follow [Email integration and messaging](email.md) to send the file to the customer.
