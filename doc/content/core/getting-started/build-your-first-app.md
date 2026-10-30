---
title: Develop your first feature
metaDescription: Have an agent build customer management in a new application. Track customers, sales owners and follow-up dates, with three roles controlling what users can see and change.
---

Have an agent build your first feature, customer management, in the application from [Create an app](create-app.md). Open the agent in the application root.

## 1. Describe the requirement

Send this to the agent:

```prompt
Build customer management with a name, contact details, notes, sales owner and next follow-up date. Customer statuses are Lead, Following up and Won.
Support creating, viewing, editing and deleting customers, searching by name and filtering by status.
Sales managers can manage all customers. Sales reps can only view their own customers and update their status. Read-only users can view all customers but cannot make changes.
```

Describe only the business: what to record, which actions are available and who can perform them. The agent follows the project's Skills to handle user and permission management, translations, tests and its completion report.

## 2. Confirm the design

Before implementation, the agent presents a design for you to confirm, covering the page structure, main interactions and decisions it needs from you. Answer its questions and confirm the design so it can begin development.

## 3. Try the result

When development is complete, the agent runs tests, checks the application in a browser and takes screenshots. It then provides a report of what it did and anything it could not verify. If verification requires signing in, it asks you to sign in yourself.

Open the URL the agent provides. **Customers** appears in the sidebar. You can create customers, assign sales owners and follow-up dates, update statuses, search and filter:

![Customer list with statuses, sales owners, follow-up dates and pagination.](/assets/core/tutorials/crm/customer-list-en.png)

The screenshot comes from the example application. The same request may produce different layouts each time.

The agent also enables user and permission management. Try what a sales rep can do:

1. Add a user in **System settings → Users** and assign the sales role in **Permission sets**. The example application calls it `Sales rep`.
2. Create a customer and select this user as the sales owner.
3. Sign in with that account. The list should show only customers owned by this user. The user can update their status but cannot edit their details or delete them.

## 4. Keep refining

If the result is wrong or you want something different, tell the agent what you did, what happened and what you expected:

```prompt
I signed in with an account assigned only the sales rep role, but I can still see customers owned by other people.
Sales reps should only see their own customers.
```

You can also request interaction changes, such as opening customer details when you click a name, then deciding whether to edit.

## 5. Review the code changes

These are the main locations changed in the example application. Your filenames may differ, but the locations should be similar:

```tree
my-app/
├── database/main/
│   ├── migrations/      # Create the customers table
│   └── seeds/           # Initialize three customer roles
├── server/
│   ├── customers/       # Input validation, business services and permissions
│   ├── providers/       # Register customer services and permissions
│   └── routes/          # Customer HTTP APIs
├── client/
│   ├── routes.ts        # Customer pages, sidebar entry and system settings
│   ├── pages/customers/ # List, details, forms and action menus
│   └── locales/         # Interface text
└── tests/               # Migration, API, page and browser tests
```

Browse the [complete CRM example](https://github.com/nocobase/docs-examples-v3/tree/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm) or [download the ZIP](/assets/core/downloads/crm-source-8ad9530.zip). See the [README](https://github.com/nocobase/docs-examples-v3/blob/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm/README.MD) for setup and run instructions.

## Next step

Read [Continue developing your app](develop-with-an-agent.md) to learn how to describe new requirements, confirm designs, and review results as you expand the application.
