---
title: Application development overview
description: Understand the parts of a NocoBase application, how to implement business features, where code belongs, and how to develop with an Agent.
---

NocoBase Core and its plugins provide the foundations for business applications, including database, server, client, authentication and permission capabilities. Developers can use these capabilities directly and focus on business features without building the infrastructure from scratch.

You can write code yourself or ask an AI Agent to develop features from your requirements.

## What makes up an application?

A NocoBase application consists of these main parts:

| Part | Purpose |
| --- | --- |
| Client | Build pages, forms, lists and interactions |
| Server | Provide APIs and handle business logic |
| Database | Define data structures and store business data |
| Plugins | Provide ready-made capabilities such as authentication, permissions, files and notifications |
| Configuration | Manage database connections, service parameters and other settings |

Combine these parts as needed. Not every feature involves all of them.

## How is a business feature implemented?

Consider creating a customer in a CRM system:

<div class="states" aria-label="Customer creation flow"><span>Enter customer details</span><span class="arrow" aria-hidden="true">→</span><span>Call the API</span><span class="arrow" aria-hidden="true">→</span><span>Apply business rules</span><span class="arrow" aria-hidden="true">→</span><span>Save to the database</span><span class="arrow" aria-hidden="true">→</span><span>Update the page</span></div>

In NocoBase, you usually only need to implement the parts specific to your business:

- **Client**: build the customer form and customer list.
- **Server**: implement the customer creation API, permission checks and business rules.
- **Database**: define the customer data structure.
- **Plugins**: reuse existing authentication and permission capabilities.

For records such as orders that advance through stages driven by people, automatic processing or external results, see [Workflow](business-workflows.md).

## Where does the code go?

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

## Develop with an Agent

NocoBase supports collaboration between people and Agents to develop applications.

A typical workflow:

<div class="states" aria-label="Development workflow with an Agent"><span>Describe requirements</span><span class="arrow" aria-hidden="true">→</span><span>Plan the implementation</span><span class="arrow" aria-hidden="true">→</span><span>Build the feature</span><span class="arrow" aria-hidden="true">→</span><span>Test and verify</span><span class="arrow" aria-hidden="true">→</span><span>Human acceptance</span></div>

An Agent can use project rules, documentation and Skills to implement business features with NocoBase's existing capabilities.

Developers are primarily responsible for clarifying requirements, reviewing key design decisions and accepting the results.

## Configure the commercial package registry

Installing or using commercial plugins, commercial database drivers, multi-app templates or multi-portal packages requires the corresponding commercial license and an authorized commercial registry configured in the environment where installation commands run. Skip this if valid credentials are already configured.

Obtain a download-enabled read token (typically prefixed with `nbr_…`) from your authorized account or license provider, replace `<read-token>` with your token, and run:

```bash
npm config set "@nocobase:registry" "https://pkg-v3.nocobase.com/"
npm config set "//pkg-v3.nocobase.com/:_authToken" "<read-token>"
npm whoami --registry=https://pkg-v3.nocobase.com/
```

If your license provider supplies a dedicated private registry URL, replace `https://pkg-v3.nocobase.com/` with that URL and replace `//pkg-v3.nocobase.com/` with its host and any path (without `https://` or the trailing `/`).

- **Storage and security**: These commands write to your user-level `~/.npmrc`, which both npm and pnpm read. Do not put tokens in project files, documentation, Git repositories or Agent chats.
- **Scope to `@nocobase` only**: The commercial registry also proxies public `@nocobase/*` packages, while third-party dependencies continue to use public npm or your mirror. Do not change the entire default registry to the commercial source, or third-party packages may return 404.
- **Verify package access**: `npm whoami` confirms authentication only; it does not prove download permission for a specific package. Check package visibility with `npm view <package-name> version --registry=https://pkg-v3.nocobase.com/`.
- **Using with an Agent**: Complete this configuration on the machine and under the user account where the Agent runs commands. A remote Agent does not automatically inherit your local `~/.npmrc`.
- **Common errors**: If a commercial package returns 401, 403 or no accessible version, check that the token is valid, the account has permission for the package and the requested version exists. If a third-party package returns 404 from the commercial registry, restore the default registry, scope the commercial source to `@nocobase` only and run `pnpm install` again.
