---
title: Continue developing your app
metaDescription: Describe requirements, confirm designs, review results, break down larger requests, and save project conventions when developing with an agent.
---

When developing a feature, you make the business decisions: what to build, whether the design works, and whether the result is usable. The agent follows NocoBase Skills to write code, run tests, and check its work.

## Describe requirements

Open your agent in the application root and explain three things in business terms:

- Who will use it.
- What they need to do.
- What rules apply: who can do what, and which data must stay unchanged.

Say when something is undecided, such as “We haven't decided whether follow-up records can be edited.” Don't leave the agent to guess. Share any designs, API agreements, or business materials you already have. You don't need to specify page layouts, file locations, or testing procedures.

For example, to add follow-up records to the customer management feature from [Develop your first feature](build-your-first-app.md):

```prompt
Add follow-up records to customers. After each contact, a sales rep records the date, method (phone, visit, or email), and notes.
Show follow-up records in the customer details, newest first.
Sales reps can only add follow-ups for their own customers. Sales managers can view all records. Read-only users can only view them.
Existing customers don't need historical follow-up records added.
```

If the work involves production, real data, or accounts, specify the environment and what the agent is allowed to do.

## Confirm the design

Before building a new page or interaction flow, such as a create/edit flow or detail drawer, the agent presents a design for you to confirm. It includes:

- The page structure and main interactions.
- Issues found during the design review and how they will be addressed.
- Questions that need your decision.

The agent starts development after you answer the questions and confirm the design. To skip this pause, add “Don't wait for my confirmation; complete the work in one go” to your request. The agent will include the design in its final report.

For small changes, such as adding a column or changing text, the agent edits directly without producing a design.

## Review the result

After development, the agent runs tests, checks the feature in the browser, takes screenshots, and gives you a report covering:

- What changed: pages, routes, and files.
- Issues found during verification and the results of fixes.
- Key screenshots.
- Anything unresolved or unverified, and why.

If verification requires signing in, the agent asks you to sign in yourself; it does not enter your password.

Start with the unverified items in the report, then try the main flows in the application using accounts with the relevant roles. If something is wrong, explain what you did, what happened, and what you expected:

```prompt
I'm signed in as a read-only user, but I can still add follow-up records in the customer details.
Read-only users should be able to view records, but not add them.
```

See [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for the testing and verification practices the agent follows.

## Break down larger requests

When a request covers too much at once, the design becomes long, decisions pile up, and problems are harder to spot during review. Split the work when any of these apply:

- You need several new types of data, each with its own pages and roles.
- You can't explain what people will be able to do when this step is complete.
- Several business decisions are still open.

Split by business capability so each step delivers something usable. For example, expanding customer management into a complete CRM could take four steps:

1. **Follow-up records**: sales reps record each customer contact.
2. **Sales opportunities**: a customer can have multiple opportunities, each with an amount and expected close date.
3. **Quotes**: create quotes for sales opportunities.
4. **Sales reports**: summarize closed sales by sales rep and month.

People can start using each step as soon as it is ready. Problems found in use can be addressed in the next step.

Don't split requests into data, APIs, and pages. Those are the agent's implementation steps: with only the database tables in place, there is nothing for you to try in the application.

If you're unsure how to split the work, ask the agent for a plan before it writes code:

```prompt
I want to expand customer management into a complete CRM with follow-up records, sales opportunities, quotes, and sales reports.
Don't write code yet. Break this into steps that each deliver something usable, and list the decisions you need from me for each step.
```

Once the plan is agreed, work through it in order. Each step follows the same process: describe requirements, confirm the design, and review the result. Share the overall plan when requesting the first step so early design choices leave room for later features.

## Save project conventions

When you agree on a rule that should apply to future work, ask the agent to save it in the project guidance:

```prompt
Use the company's time zone for all date calculations from now on. Save this in the project guidance.
```

The agent writes the rule in `.agents/rules/` and adds it to the index in `AGENTS.md`. Future sessions and other developers can then follow it. When the agent changes the application's framework structure, it also records what changed and why in these rules.

## Next steps

- [Application development overview](../developing-apps/overview.md): understand the parts of a feature and find guides for pages, APIs, data, and tests as needed.
- [Project structure](../developing-apps/project-structure.md): find the relevant directories and files when reviewing the agent's changes or writing code yourself.
- [Choose a deployment method](../deployment/choose-a-deployment-method.md): deploy the application to your own server after verifying its features.
