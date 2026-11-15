---
title: Attachments and quotation documents
metaDescription: Apply customer access to requirement attachments, generate a fixed DOCX from a confirmed quotation, and verify downloads and amounts.
lesson: 9
---

Extend [Quote approvals and tasks](quote-approvals.md) with customer requirement attachments and downloadable quotation documents.

If you are trying the completed version without exercise data, prepare:

- Separate administrator, salesperson Alex and Taylor, and manager Morgan accounts using [account and role setup](team-permissions.md#configure-users-and-roles).
- A **Confirmed** **Phase one implementation** quotation from the [Lesson 8 exercise](quote-approvals.md#review-quotations-in-the-task-center).
- Alex as owner of **Northstar Manufacturing**, with Morgan's manager role active.

You do not need to repeat earlier development or access-revocation exercises.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-8"><code>lesson-8</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-9"><code>lesson-9</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-9/docs/lesson-9.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/using-plugins/data-and-files/file-management.md">File management</a> · <a href="../core/framework/file-storage.md">File storage</a> · <a href="../core/using-plugins/automation/template-print.md">Template printing (Skill)</a></td></tr>
</tbody>
</table>
</div>
</div>

## Define the purpose of attachments and formal quotations

Requirement attachments hold customer-provided material that can be added or removed. A formal quotation records the confirmed proposal and must remain stable when the catalogue or customer name changes.

Generate an English DOCX quotation. PDF conversion and online template editing are not included. For a revised proposal, create and confirm another quotation before generating its file.

## Upload and manage customer attachments

[File management](../core/using-plugins/data-and-files/file-management.md) provides upload and preview; [file storage](../core/framework/file-storage.md) saves the content. Downloads must check customer access, even when someone has the URL. The example's [file service](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/providers/customer-files.ts) and [routes](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/routes/customer-files.ts) enforce these rules.

Send your development agent:

```prompt
Add an Attachments tab to customer details for uploading, viewing, and downloading requirements. Allow up to 10 files per save, each up to 5 MB.

- Follow customer access rules. Read-only shared users can view and download, but cannot upload or remove files.
- Cancelled or failed uploads must not appear as saved. After removal, even the original uploader cannot access or reattach a file.
- Show storage rules in System settings. Administrators can clean uploads older than 24 hours that have never been linked to a customer, preserving saved attachments and formal documents.

Add “Generate quotation” to confirmed quotes, producing an English DOCX:
- Use a fixed template with customer, opportunity, products, quantities, unit prices, discounts, currency, and total.
- Use the confirmed quote content. Save customer and opportunity names on first generation. Always return the same file afterward, regardless of catalog or customer-name changes.
- Unconfirmed quotes cannot generate files. Losing customer access prevents attachment downloads and quote generation.
- Administrators can see the actual template in System settings.
```

Files use private local storage. Click **Save** to link uploads to the customer. Administrators can clean unlinked uploads older than 24 hours under **System settings → Files and quotation documents**.

1. Prepare `Customer requirements.txt` with the project scope and implementation quantity.
2. As Alex, open **Northstar Manufacturing → Attachments → Add attachments**. Upload the file and save.
3. Check its name, type, size, uploader, and time. Select the filename to preview or **Download** to retrieve it.

![Requirement attachments in customer details](/assets/guides/customer-attachments.png)

## Generate a document from a confirmed quotation

[Template printing](../core/using-plugins/automation/template-print.md) provides development guidance and reference code. The Agent implements the generation page in the app. The example uses a [fixed DOCX template](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/docs/templates/quotation-v1.docx) shipped with the app. See the [generation code](https://github.com/nocobase/doc-demo-crm/blob/lesson-9/server/providers/quotation-renderer.ts); no PDF converter is required.

Open the confirmed **Phase one implementation** quotation from the previous lesson. Under **Quotation document**, select **Generate DOCX**, then preview or download the file.

| Field | Expected value |
| --- | --- |
| Customer | Northstar Manufacturing |
| Opportunity | Regional CRM rollout |
| Product | CRM implementation |
| Quantity / Unit price / Discount | 2 / 12000.00 / 15% |
| Total / Currency | 20400.00 / USD |

![Actual generated quotation in the running example's DOCX preview](/assets/guides/quotation-document.png)

Unconfirmed quotations explain that confirmation is required and offer no generation action. Failed generation must allow retry without publishing an incomplete formal document.

## Check file content and access

Use separate accounts for these checks:

- Cancel after uploading: no customer attachment appears. A failed save keeps the selection, and a successful retry adds it.
- Owners and authorized managers can read files. Shared users can download but cannot modify them. Unrelated and signed-out users cannot read them. Retry an old download address after transferring the customer.
- Open the downloaded DOCX and check every line and total. Change catalogue prices and the customer name, then generate again: the original file and content remain unchanged.
- Repeated generation creates one formal file. Administrative cleanup affects only old unlinked uploads, preserving saved attachments and issued documents.

Have the Agent test simultaneous generation, failed saves, cleanup during uploads, and data retention after upgrades in a separate environment. Review its report for actual results and any incomplete checks.

**Done when**: Customer attachments can be saved, previewed, and downloaded, with download access following customer permissions. The generated formal DOCX has been opened and checked for the correct customer, opportunity, line items, and 20400.00 USD total. Repeated generation returns the original file, and cleanup preserves saved files.

Continue with [In-app notifications for assignments and quotation results](notifications.md).
