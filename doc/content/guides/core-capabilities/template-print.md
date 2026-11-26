---
title: "Template printing and document generation"
metaDescription: Generate an immutable DOCX quotation document from a confirmed record using a fixed template, then verify content snapshots and access control.
---

Generate downloadable formal documents from confirmed business records using a fixed template. This guide uses CRM quotations to show how issued documents stay immutable even when the product catalog or customer name changes later.

When trying the complete example, prepare a confirmed quotation (for example, **Phase one implementation** under **Northstar Manufacturing → Regional CRM rollout** with `2 × 12000.00 USD`, `15%` discount, and `20400.00 USD` total; see [Approval workflows and to-do center](approval-workflows.md#review-quotations-in-the-task-center) if you need to confirm one), with Alex owning the customer.

**Modules covered**

- [Template printing (Skill)](../../core/using-plugins/automation/template-print.md)
- [File storage](../../core/framework/file-storage.md)

## Define formal document content and snapshot rules

A formal quotation captures an agreed proposal and must remain stable after issuance:

- Use a fixed English DOCX template shipped with the app, showing the customer, opportunity, products, quantities, unit prices, discounts, currency, and total.
- Only confirmed quotations can generate formal documents. Draft, under-review, returned, or rejected quotations explain that confirmation is required and offer no generation action.
- Quotation lines use the confirmed snapshot, and customer and opportunity names are frozen on first generation. Repeated generation always returns the same file regardless of catalog or customer-name edits. For a revised proposal, create and confirm another quotation.
- PDF conversion and online template editing are out of scope here. Failed generation must leave the quotation intact and allow retries without publishing an incomplete file.

## Generate a DOCX document from a confirmed quotation

[Template printing](../../core/using-plugins/automation/template-print.md) provides development guidance and reference code; the Agent implements the renderer and UI in the app. The complete example ships a [fixed DOCX template](https://github.com/nocobase/doc-demo-crm/blob/main/docs/templates/quotation-v1.docx) rendered by [quotation-renderer.ts](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/quotation-renderer.ts), with no PDF converter required.

Send this request to your development Agent:

```prompt
Add “Generate quotation” to confirmed quotes, producing an English DOCX:
- Use a fixed template with customer, opportunity, products, quantities, unit prices, discounts, currency, and total.
- Use the confirmed quote content. Save customer and opportunity names on first generation. Always return the same file afterward, regardless of catalog or customer-name changes.
- Unconfirmed quotes cannot generate files. Losing customer access prevents quote generation and downloads.
- Administrators can see the actual template in System settings.
```

Open the confirmed **Phase one implementation** quotation. Under **Quotation document**, select **Generate DOCX**, then select the filename to preview or download it and check every field:

| Field | Expected value |
| --- | --- |
| Customer | Northstar Manufacturing |
| Opportunity | Regional CRM rollout |
| Product | CRM implementation |
| Quantity / Unit price / Discount | 2 / 12000.00 / 15% |
| Total / Currency | 20400.00 / USD |

![Actual generated quotation in the running example's DOCX preview](/assets/guides/quotation-document.png)

Administrators can inspect the active template under **System settings → Files and quotation documents**.

## Check document content and access permissions

Use separate test accounts to check document content, idempotency, and access boundaries:

- Open the downloaded DOCX locally and verify the customer, opportunity, each line item, and the total.
- Change catalog prices and the customer name, then generate again: the original file and content remain unchanged.
- Clicking generate repeatedly creates only one formal file. Direct API generation requests for unconfirmed quotes are rejected by the server.
- The customer owner, authorized managers, and read-only shared users can download the issued document. Unrelated salespeople, signed-out visitors, and former owners who lost customer access cannot generate or download it.

Have the Agent test simultaneous generation, failed render retries, and retention of issued documents after upgrades in a separate environment, then review its report for actual results and any incomplete checks.

## Summary and next steps

**Done when**: A formal DOCX has been generated from a confirmed quotation, opened, and checked for the expected customer, opportunity, line items, and `20400.00 USD` total; repeated generation and master-data changes preserve the original file, and access follows customer permissions.

For editable customer attachments, see [Business attachments and file management](file-management.md). To send the issued DOCX by email, see [Email integration and messaging](email.md).
