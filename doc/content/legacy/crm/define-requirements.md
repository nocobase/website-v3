---
title: Define CRM requirements
metaDescription: Clarify the first CRM release with an agent, document and approve requirements before generating an HTML prototype, then define delivery steps and acceptance criteria.
lesson: 2
---

After [creating an app](create-app.md), work with the agent from the application root to agree on the business problem. “Build a CRM” leaves decisions about users, information, and allowed operations unresolved. Recording those decisions gives development and acceptance a shared basis.

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="../../guides/core-capabilities/index.md#example-project">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-1"><code>lesson-1</code></a></td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-2"><code>lesson-2</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-2/docs/lesson-2.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td>None (requirements and design)</td></tr>
</tbody>
</table>
</div>
</div>

## Discuss business requirements with the agent

Start with the users and their everyday work, before requesting implementation:

```prompt
I want this CRM to keep customer details, contacts, and communication history together so we can find a customer and pick up where the last conversation ended.
The first version is for an administrator. Let's clarify the requirements before writing code.
Ask me about decisions in small groups, and give your recommendation for each question.
```

Use real situations to answer. Before contacting a customer, you need their contacts and previous conversations. When you stop following up, you still need their history. Do not leave the agent to infer these rules from “customer management.”

## Agree on the first release's scope and rules

The current CRM's first release uses these decisions. Use them when answering the agent, or adapt them to your business and update the development requests and acceptance criteria accordingly.

| Question                                    | First-release decision                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who uses it, and what can they access?      | Start with an administrator. Signed-out users and users without customer access cannot read or change customers. There is no per-salesperson data isolation yet                       |
| What details does a customer need?          | Name, industry, website, notes, and status. Name is required; other details can be added later                                                                                        |
| How do users find and maintain customers?   | Create, view, edit, search by name, and filter by status. No deletion                                                                                                                 |
| What does status mean?                      | Prospect, Customer, and Inactive are classifications, without approval. Inactive customers retain their records                                                                       |
| Where do contacts and conversations belong? | Both belong to a customer and are viewed and added on its detail page. Contacts have a required name and optional job title, email, and phone                                         |
| What does a follow-up record contain?       | Type: call, email, meeting, or note. Required summary and optional next step. Record the current user and time automatically, newest first. Saved records cannot be edited or deleted |
| What is outside this release?               | Sales and manager responsibilities, opportunities, quotes, approvals, automatic reminders, email synchronization, and imports. A next step is plain text and does not send a reminder |

Use the app's existing components and interactions. If your organization requires particular colors, fonts, or interface conventions, add that guidance to the project and tell the agent where to find it.

## Record the requirements in a design document

Once the scope and rules are clear, ask the agent to record the requirements in `docs/design.md` in the application repository as the basis for the prototype and development:

```prompt
Put the CRM requirements we agreed on into a requirements document. Include users, customer and contact details, the follow-up flow, pages, access rules, and what is outside the first release.
List unresolved questions separately rather than treating them as agreed requirements.
```

Read the document, especially rules about editing saved follow-ups, retaining inactive customers, and customer access. Ask the agent to clarify ambiguities before you approve it.

## Generate and approve an HTML prototype

After approving `docs/design.md`, ask the agent to generate a prototype from the document so you can check page layouts and workflows. Save it as `docs/prototype.html` in the application repository. Keep styles, interaction scripts, and demonstration data in this single HTML file so it opens directly in a browser without starting the app or connecting to a database.

```prompt
Based on the agreed requirements, make a prototype I can open in a browser to try the customer list, create and edit forms, customer details, and adding contacts and follow-ups.
Use an English interface and fictional data, following the app's existing visual style. Build the prototype first, before implementing the actual business features.
```

Forms, search, and status filters should respond to interaction so you can check how the pages connect. Follow the existing app's shadcn component conventions. The HTML prototype simulates interactions without loading application components or calling real APIs.

Try this lesson’s interactive prototype below. Demo data stays in the current page and resets when you reload. You can also <a href="/assets/guides/crm-prototype.html" target="_blank" rel="noopener">open the prototype in a new window</a> or view its [source](https://github.com/nocobase/doc-demo-crm/blob/lesson-2/docs/prototype.html).

<iframe src="/assets/guides/crm-prototype.html" title="CRM customer management interactive prototype" loading="lazy" sandbox="allow-scripts allow-forms" width="100%" height="640" style="display: block; width: 100%; border: 1px solid var(--rule); border-radius: 8px;"></iframe>

Open the generated file in a browser and check the following:

1. Create a customer. Leave the name blank to check that the required-field message is clear, then fill it in, open the detail view, and edit the information.
2. Add a contact and two follow-ups from the detail view. Check that the actions are easy to find, the newest follow-up appears first, and saved follow-ups have no edit or delete action.
3. Return to the list, find the customer using search and status filters, then mark it Inactive and check that its existing information remains available.

If a layout or interaction feels awkward, tell the agent which page and action are involved and what you expect. Have it update the HTML file, then reopen it to check. If the prototype reveals an ambiguous business rule, agree on the rule and update `docs/design.md` before updating the prototype. Once you approve the prototype, ask the agent to add a reference to `docs/prototype.html` in the design document and record each page's purpose and key interactions.

Use `docs/design.md` for business rules and `docs/prototype.html` for page layouts and interactions. Resolve any disagreement between them before development begins.

Register both files in the application's `AGENTS.md`: read them before business changes, update the design when requirements change, and update the prototype when those changes affect the interface before changing application code. Save both files together in the application repository's Git history for subsequent development.

## Define delivery steps and acceptance criteria

Have the agent add a delivery plan to the design document. Each step needs an outcome you can check. Compare layouts, actions, and feedback with the approved HTML prototype; verify persistence and permissions in the actual app:

| Step                    | Deliverable                                            | Acceptance criteria                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Customer management     | Customer list, forms, and details                      | Create, search, filter, and edit customers. Reject empty names. Preserve details when marking Inactive. Changes survive a reload                                         |
| Contacts and follow-ups | Contacts and communication history on customer details | Contacts belong to the correct customer. Follow-ups show author and time, newest first. Reject missing required content and prevent editing or deleting saved follow-ups |
| Testing and delivery    | Automated tests, build, and deployment checks          | Tests and build pass. The customer follow-up flow works in the app. Unauthorized access is rejected and existing data remains intact                                     |

Complete the first two steps in [Develop customer follow-up features](customers-and-follow-ups.md), then the third in [Accept and deliver the app](test-and-deliver.md). Agree on rules for later features such as team permissions separately. A planned feature is not an implemented one.

## Describe subsequent requests clearly

The design document holds the overall agreement. For each development request, explain who uses the feature, what they need to do, and which business rules apply. “Add follow-ups” leaves the agent to guess what to record and whether records can change. Instead:

```prompt
An administrator needs to record conversations on the customer detail page, choosing call, email, meeting, or note and entering a summary and next step.
Require the summary, record the author and time automatically, and show the newest entries first. Saved entries cannot be edited or deleted.
```

For larger changes, ask for a proposal and approve it before implementation:

```prompt
Before changing code, explain which existing features this request affects, which business decisions you need from me, and how we can check the result.
```

The example’s [design and prototype](https://github.com/nocobase/doc-demo-crm/tree/lesson-2/docs) are in `docs/`. This stage adds no application business tables.

**Done when**: the application repository contains approved `docs/design.md` and `docs/prototype.html` files. The prototype opens directly and lets you try the main interactions. The design document covers the first release's scope, business rules, prototype reference, delivery steps, and acceptance criteria. `AGENTS.md` references both files.

## Next step

Continue to [Develop customer follow-up features](customers-and-follow-ups.md) to implement customer management, contacts, and follow-up records in stages using the design document and HTML prototype.
