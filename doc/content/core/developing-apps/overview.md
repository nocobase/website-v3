---
title: Application development overview
description: Understand the parts of a NocoBase application, how to implement business features, where code belongs, and how to develop with an Agent.
---

NocoBase Core and its plugins provide the foundations for business applications, including database, server, client, authentication and permission capabilities. Developers can use these capabilities directly and focus on business features without building the infrastructure from scratch.

You can write code yourself or ask an AI Agent to develop features from your requirements.

## 1. What makes up an application?

A NocoBase application consists of these main parts:

| Part | Purpose |
| --- | --- |
| Client | Build pages, forms, lists and interactions |
| Server | Provide APIs and handle business logic |
| Database | Define data structures and store business data |
| Plugins | Provide ready-made capabilities such as authentication, permissions, files and notifications |
| Configuration | Manage database connections, service parameters and other settings |

Combine these parts as needed. Not every feature involves all of them.

## 2. How is a business feature implemented?

Consider creating a customer in a CRM system:

<div class="states" aria-label="Customer creation flow"><span>Enter customer details</span><span class="arrow" aria-hidden="true">→</span><span>Call the API</span><span class="arrow" aria-hidden="true">→</span><span>Apply business rules</span><span class="arrow" aria-hidden="true">→</span><span>Save to the database</span><span class="arrow" aria-hidden="true">→</span><span>Update the page</span></div>

In NocoBase, you usually only need to implement the parts specific to your business:

- **Client**: build the customer form and customer list.
- **Server**: implement the customer creation API, permission checks and business rules.
- **Database**: define the customer data structure.
- **Plugins**: reuse existing authentication and permission capabilities.

## 3. Where does the code go?

A NocoBase application organizes code by responsibility:

```tree
my-app/
├── client/       # Pages, components and routes
├── server/       # APIs and business services
├── database/     # Migrations and initial data
├── tests/        # Tests
└── config.yml    # Application configuration
```

Write code in the appropriate directories for your feature. Connect new pages, APIs or services to the application through their registration entry points.

See [Project structure](project-structure.md) for details.

## 4. Develop with an Agent

NocoBase supports collaboration between people and Agents to develop applications.

A typical workflow:

<div class="states" aria-label="Development workflow with an Agent"><span>Describe requirements</span><span class="arrow" aria-hidden="true">→</span><span>Plan the implementation</span><span class="arrow" aria-hidden="true">→</span><span>Build the feature</span><span class="arrow" aria-hidden="true">→</span><span>Test and verify</span><span class="arrow" aria-hidden="true">→</span><span>Human acceptance</span></div>

An Agent can use project rules, documentation and Skills to implement business features with NocoBase's existing capabilities.

Developers are primarily responsible for clarifying requirements, reviewing key design decisions and accepting the results.

See [Continue developing your app](../getting-started/develop-with-an-agent.md) for details.

## 5. Next steps

For your first NocoBase application, start with [Develop your first feature](../getting-started/build-your-first-app.md) to learn the development process through a complete business example.

As you continue developing, consult individual topics as needed. You do not have to read them all in order.
