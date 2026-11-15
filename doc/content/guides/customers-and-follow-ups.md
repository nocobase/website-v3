---
title: "Develop customer follow-up features"
metaDescription: Ask an agent to build customer lists, forms, and details, add contacts and follow-up records, then check the result through a complete business flow.
lesson: 3
---

Complete [Create an app](create-app.md) and [Define CRM requirements](define-requirements.md) first. Continue using the agent from the application root and keep the development server running. For this lesson, an administrator manages customers; sales and manager responsibilities come in Lesson 7.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="index.md#use-example-project-tags">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-2"><code>lesson-2</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-3"><code>lesson-3</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-3/docs/lesson-3.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../core/framework/database/overview.md">Database</a> · <a href="../core/developing-apps/pages-and-interactions.md">Page routing</a> · <a href="../core/using-plugins/authorization/permissions.md">Authorization</a></td></tr>
</tbody>
</table>
</div>
</div>

## Start development from the design document

Check that the application repository contains the approved `docs/design.md` and `docs/prototype.html` from Lesson 2 and that `AGENTS.md` references both. Follow its delivery plan: customer management first, then contacts and follow-ups.

Reference or attach both files in the agent session and give this instruction:

```prompt
Follow our agreed requirements and prototype, and implement the customer management step first. Run it when ready so I can check it.
```

Use the design document for business rules and the HTML prototype for layouts and interactions. Resolve disagreements and update both files before proceeding. Replace the prototype’s demonstration data and simulated interactions with real persistence and access control in the app.

Keep the first-release scope agreed in Lesson 2: an administrator manages customers, deletion is unavailable, and marking a customer Inactive preserves its records. Team permissions, opportunities, quotes, and automatic reminders come later. If the agent finds unresolved rules, agree on them and update the document before continuing. Use the app's existing components and interactions.

## Build the customer list, forms, and details

Once the agent finishes, open **Customers**. Create a customer, click its name to open the detail page, then use **Edit customer** to change its information.

![The customer list supports name search, status filtering, and pagination.](/assets/guides/customers.png)

The screenshot shows the example's English interface and demonstration data. Your layout may differ. The feature brings together these capabilities:

| Capability                                        | What it does here                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Tables, relationships, and Repository data access | Persist customer details and support queries and pagination                 |
| App routes and UI components                      | Organize the list, forms, and detail entry points                           |
| Authentication and authorization                  | Reject signed-out or unauthorized access                                    |
| Input validation and submission protection        | Reject invalid input and avoid duplicates when retrying the same submission |

User and permission management should also be available in **System settings** as business features are developed. In the example, only the initial administrator has customer access by default. Granting another user the **Customers** page permits reading and writing this shared dataset. There is no per-salesperson data isolation yet; this is not a team permission model.

## Continue with contacts and follow-ups from the design

Once the customer list, forms, and details work, reference the design document and prototype again in the same agent session:

```prompt
Implement contacts and follow-ups from our agreed requirements and prototype, preserving the customer management features already built. Let me check it on the customer detail page when ready.
```

Contacts and follow-ups belong to the current customer. Use **Add contact** and **Record follow-up** directly from its detail page.

![Customer details bring together the overview, contacts, and follow-up records.](/assets/guides/customer-detail.png)

The agreed design requires contact names and follow-up summaries; next steps are optional. Follow-ups appear newest first and cannot be edited or deleted after saving. The server supplies the author and timestamp using the signed-in user; callers cannot submit someone else's name as the author. The next step is plain text at this stage and does not schedule a reminder.

## Try creating, finding, and editing records

Use the administrator account to check the rules agreed in Lesson 2. The steps below follow the tutorial's default design. If you changed the requirements, adapt the checks to your design too. Compare the list, forms, and details with `docs/prototype.html` to check the agreed layouts, actions, and feedback. Verify persistence and permissions in the actual app.

1. In **Customers → New customer**, create `Summit Analytics`, set Industry to `Data services`, and choose **Prospect**.
2. Search for `summit`, open the customer, and add notes using **Edit customer**.
3. Add contact `Alex Morgan`, job title `Sales Lead`, and email `alex@example.com`.
4. Record a **Call** with summary `Discussed the sales team requirements.` and next step `Prepare a product walkthrough.`.
5. Reload the detail page. Check that the notes, contact, follow-up, author, and timestamp remain.
6. Return to the list and filter by **Inactive**. The new prospect should be excluded. Clear the filter to find it again.
7. Mark this customer **Inactive** and filter by that status again. Check that it appears and that its detail page still contains the original information, contacts, and follow-ups.

If you are running the example directly, after initial startup you can run `pnpm nocobase db sample --json` in another terminal in the same application directory. This loads Northstar Labs, Harbor Design, and Willow Retail. Sample data is optional; you can create your own customers without it.

## Check business rules and report problems

Use the acceptance criteria in `docs/design.md` to check these boundaries:

- Empty customer names, contact names, or follow-up summaries prevent saving. Invalid contact email addresses produce an error.
- Add another follow-up with a summary but no next step. It should save and appear above the previous entry. Its author should be the current user, and its timestamp should match the time of entry.
- Saved follow-ups cannot be edited or deleted, and customers have no delete action. Missing buttons only establish the interface behavior; continue checking whether APIs reject these operations in the next lesson.
- Open another customer and check that it does not show the first customer's contacts or follow-ups.
- Signed-out visitors cannot read customers, and ordinary users without customer access cannot read or change them.

When something fails, tell the agent what you did, what happened, and what you expected. For example, if you actually see a contact disappear after reloading:

```prompt
I added Alex Morgan on Summit Analytics' detail page. The contact appeared after saving but disappeared when I reloaded.
It should be saved and still appear under this customer after a reload. Please investigate and fix it.
```

Repeat the original operation after the fix and check that existing customers and follow-ups are unaffected. If the expected behavior changes an agreed business rule, update `docs/design.md` and its acceptance criteria, and update `docs/prototype.html` if the change affects the interface, before asking the agent to change the implementation. Continue with automated tests and API permission checks in the [next lesson](test-and-deliver.md).

## Save the stage version

```prompt
Save this version of customer, contact, and follow-up management. Tell me what is ready to use and which issues remain.
```

**Done when**: the interface acceptance checks for customer management and contacts and follow-ups in the design document are complete, and layouts and interactions match the approved prototype. Checks cover persistence, retaining inactive customer records, follow-up order and editing restrictions, input validation, and access. Record any API behavior still to be verified in the next lesson.

When starting from the example, review `docs/design.md` and `docs/prototype.html` against [Lesson 2’s requirements](define-requirements.md). Adapt them to your business before development and acceptance.

Next: [Accept and deliver the app](test-and-deliver.md).
