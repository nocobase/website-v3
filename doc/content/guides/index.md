---
title: Tutorials
---

<p class="course-intro">Learn how to use NocoBase 3 through practical examples.</p>

## Introduction

AI Agents can help you build the first version of a business app quickly. Keeping that app useful requires reliable data and permissions, clear development conventions, and a way to preserve requirements and business rules across a team. NocoBase 3 provides Core for developing and running apps, and Studio for collaboration.

[NocoBase Core](../core/index.md) is an open-source foundation for AI development and running business systems. It provides shared capabilities such as data, users and permissions, files, and workflows, along with project conventions and development Skills that guide Agents in building business features. [NocoBase Studio](../studio/index.md) is a governance platform for people and Agents developing together. It organizes collaboration through tasks, checks, and reviews, and preserves team knowledge in a knowledge base and project memory. You can develop and deploy an app with Core alone, then add Studio when you need team collaboration.

## Start with an example project

The tutorial builds on one CRM app. Salespeople manage customers and follow-up records, then track opportunities and prepare quotes. The team controls customer access through role permissions and gradually adds approvals, attachments, notifications, and AI capabilities.

Each lesson starts with a business requirement, explains how to work with an Agent to implement it, and shows how to check the result. Quick start produces a usable customer follow-up app; Hands-on practice extends the same project. Follow the lessons in order if you are new, or choose topics based on their prerequisites if you already have experience. Adapt the example requirements to your own business rules.

### Use example project tags

The [example project](https://github.com/nocobase/doc-demo-crm) uses `lesson-N` tags for the completed state of Lesson N, including lessons that only change requirements or design. Each lesson's introduction lists its starting and completed states: choose the starting tag to follow the development steps, or the completed tag to try the result. Lesson 1 starts from an empty directory and has no starting tag. You do not need to switch lesson tags when continuously developing your own app.

Get the example in a separate directory. These commands use `lesson-1`; replace it with the tag for the stage you want:

```bash
git clone https://github.com/nocobase/doc-demo-crm.git my-crm-example
cd my-crm-example
git switch -c my-crm lesson-1
pnpm install --frozen-lockfile
```

Have the Agent follow the selected version's README and `docs/lesson-N.md` to prepare configuration, the database, and startup. For a first run, the following commands use SQLite as an example; follow the project instructions to configure another database:

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Sign in at the complete `Local:` URL printed in the terminal. `lesson-1` contains only the app foundation, without customer data. See each lesson's setup notes for data preparation and specific migration restrictions.

To upgrade an existing example installation, stop it and back up the database, configuration, and file storage. Retain that data, then follow the target lesson's setup notes to install dependencies, apply migrations, and start the app. Do not reinitialize or reset the database. Git tags contain source code, not configuration, secrets, business data, or uploaded files; switching tags does not roll back the database.

## Core: Develop business apps

The Core lessons start with an app template and introduce three areas: data models, relationships, and migrations organize business data; pages and UI components provide the interface; authentication, permissions, and shared capabilities such as workflows, files, and notifications support business rules. The app's `AGENTS.md` and development Skills guide implementation, while tests and hands-on checks verify the results. Consult the [Core manual](../core/index.md) for details on individual capabilities.

<section class="course-section">

<div class="course-heading">

### Quick start

<span class="course-range">Lessons 1–4</span>

</div>

Build a customer follow-up app, from project creation to testing and delivery.

<div class="course-grid">

[<span class="course-title">1. Create an app</span><span class="course-description">Start with the Core app template.</span>](create-app.md)

[<span class="course-title">2. Define CRM requirements</span><span class="course-description">Agree on scope, business rules, and acceptance criteria.</span>](define-requirements.md)

[<span class="course-title">3. Develop customer follow-up features</span><span class="course-description">Use data and pages to track customer follow-ups.</span>](customers-and-follow-ups.md)

[<span class="course-title">4. Accept and deliver the app</span><span class="course-description">Accept features against requirements, then publish and verify with your team.</span>](test-and-deliver.md)

</div>

</section>

<section class="course-section">

<div class="course-heading">

### Hands-on practice

<span class="course-range">Lessons 5–14</span>

</div>

Explore related data, team permissions, approvals, notifications, and AI in the same CRM.

<div class="course-grid">

[<span class="course-title">5. Model opportunity and quote data</span><span class="course-description">Use data relationships, queries, and migrations.</span>](opportunities-and-quotes.md)

[<span class="course-title">6. Build the sales workspace UI</span><span class="course-description">Compose business pages with UI Library.</span>](sales-workspace.md)

[<span class="course-title">7. Role permissions and customer access</span><span class="course-description">Combine authentication, data permissions, and sharing rules.</span>](team-permissions.md)

[<span class="course-title">8. Quote approvals and tasks</span><span class="course-description">Integrate workflows, approvals, and tasks.</span>](quote-approvals.md)

[<span class="course-title">9. Attachments and quote documents</span><span class="course-description">Use file storage and template printing.</span>](attachments-and-documents.md)

[<span class="course-title">10. In-app notifications for assignments and quotation results</span><span class="course-description">Deliver business updates with in-app notifications.</span>](notifications.md)

[<span class="course-title">11. Mailbox integration and customer emails</span><span class="course-description">Connect mailbox synchronization and email sending.</span>](email.md)

[<span class="course-title">12. Scheduled follow-ups and expiry reminders</span><span class="course-description">Combine scheduled jobs with notifications.</span>](scheduled-reminders.md)

[<span class="course-title">13. AI-assisted customer follow-ups</span><span class="course-description">Connect knowledge, models, and business Agents.</span>](ai-assistant.md)

[<span class="course-title">14. Customer imports and API integration</span><span class="course-description">Connect business data with APIs and API keys.</span>](import-and-integrations.md)

</div>

</section>

## Studio: Develop as a team

<section class="course-section">

<span class="course-range">Lessons 15–19</span>

Continue the same CRM with quote revision comparison and customer handover, agreeing rules, accepting work, and releasing it as a team.

<div class="course-grid">

[<span class="course-title">15. Connect to Studio</span><span class="course-description">Connect the repository, checks, and PR previews.</span>](bring-into-studio.md)

[<span class="course-title">16. Work with Agents</span><span class="course-description">Develop and accept quote revision comparison.</span>](agent-team-request.md)

[<span class="course-title">17. Involve business colleagues</span><span class="course-description">Let the sales manager own customer handover.</span>](business-colleagues.md)

[<span class="course-title">18. Capture knowledge</span><span class="course-description">Maintain rules, checklists, and project memory.</span>](capture-knowledge.md)

[<span class="course-title">19. Release to production</span><span class="course-description">Verify staging, upgrade production, and record its version.</span>](release.md)

</div>

</section>

## Best practices

Not yet written.
