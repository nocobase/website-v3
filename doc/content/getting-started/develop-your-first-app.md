---
title: Build your first app with Core
metaDescription: "Create and start a NocoBase app, build customer management with a Coding Agent, check permissions, and keep iterating."
---

Create a NocoBase application in an empty directory, then work with a Coding Agent to build customer management: record customers, assigned sales reps, and follow-up dates with role-based access. By the end, you can sign in, manage customer data, and continue iterating on new requirements.

## Prepare the environment

- Node.js 24 or later, and pnpm 11 (see [Prepare the development environment](../guides/prepare-environment.md)).
- At least one local Coding Agent installed and signed in, such as Claude Code, Codex, or Cursor.
- On Windows, use WSL; run the commands below in a POSIX shell such as Bash.

The steps below use SQLite, which requires no separate database server. To use another database, see [Create an app with a different database](../core/developing-apps/database-configuration.md).

## Create and start the application

Choose either option below, then continue to [Sign in](#sign-in).

### Option 1: Create with a Coding Agent (recommended)

Install the app-creation Skill globally (only needed once) and select your Coding Agent when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

If your Coding Agent is already open, start a new session so the newly installed Skill takes effect. Create and enter an empty directory (for example `my-app`), then open your Coding Agent and send:

```bash
mkdir my-app && cd my-app
```

```prompt
Create a NocoBase 3 application for local development in this empty directory, using the default template and SQLite.
When it is running, tell me the URL and initial login account.
```

The Coding Agent creates the app, generates configuration, and starts it, then returns the URL and initial login credentials.

### Option 2: Run the commands manually

In the directory where you keep applications, run the command below to create `my-app` and install dependencies:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

NocoBase 3 is currently in beta. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows pnpm to install newly published versions for this command only.

Enter the directory, generate and check the configuration, and start the server:

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

- `config init` generates `config.yml` and application keys using SQLite, with no separate database setup. `config.yml` is not committed to Git.
- `config check` loads the configuration the same way startup does and prints guidance if anything is wrong.
- `pnpm dev` starts the development server and prints the `Local:` URL. Keep this terminal running; closing it stops the app.

## Sign in

Open the application URL in your browser (for example `http://127.0.0.1:13000/main/`) and sign in as the default administrator: username `nocobase`, password `admin123`.

- **Option 1**: use the URL returned by your Coding Agent.
- **Option 2**: use the `Local:` URL printed in your terminal.

Keep the application path at the end of the URL (such as `/main/`). After signing in, the home page lists built-in capabilities and example prompts:

![Home page of a newly created application before any business features are added.](/assets/core/tutorials/getting-started/home.png)

## Describe your first business requirement

Start a Coding Agent session in the `my-app` root directory. If you started the app manually in Option 2, keep the `pnpm dev` terminal running and open a separate terminal in `my-app` to launch your Coding Agent.

Send this requirement:

```prompt
Build customer management. Customers have a name, contact details, notes, assigned sales rep, next follow-up date, and status (lead, in progress, or won).
Users can create, view, edit, and delete customers, search by name, and filter by status.
Sales managers manage all customers; sales reps can only view customers assigned to them and update their status; read-only users can view all customers without modifying them.
```

Describe only the business rules: what to record, which actions are needed, and who can do what. The Coding Agent uses the project's Skills to handle users, permissions, localization, tests, and reporting.

Before writing code, the Coding Agent presents a design covering the page structure, key interactions, and open questions. Answer those questions and confirm to begin development.

## Check features and permissions

When development finishes, the Coding Agent runs tests, checks each item in a browser with screenshots, and hands you a report covering what was built and anything left unverified. If login is needed during verification, it asks you to sign in.

Open the application URL; **Customers** now appears in the sidebar. You can create customers, assign sales reps and follow-up dates, update statuses, search, and filter:

![Customer list with status, assigned sales rep, next follow-up date, and pagination.](/assets/core/tutorials/crm/customer-list-en.png)

The Coding Agent also enables user and permission management. Verify what a sales rep can do:

1. Go to **System settings → Users**, add a user, and assign the sales rep role under **Permission sets** (`Sales rep` in the example app).
2. Create a customer and assign this user as the sales rep.
3. Sign in with this account. The customer list should show only customers assigned to this user; the user can update status but cannot edit details or delete records.

Then check as a sales manager and a read-only user: managers should manage all customers; read-only users should view all customers without creating, editing, or deleting. Complete any unverified items from the report before adding more features.

## Refine and continue developing

If something does not match expectations or you want a different behavior, tell the Coding Agent what you did, what you saw, and what you expected:

```prompt
When I sign in with an account that only has the sales rep role, I can still see customers assigned to others.
Sales reps should only see customers assigned to them.
```

You can request UI changes directly as well, such as "Clicking a customer name should open the detail view first before editing."

Next, add customer follow-up records in the same Coding Agent session at the application root:

```prompt
Add follow-up records to customers. After each contact, a sales rep records the date, method (phone, visit, or email), and notes.
Show follow-up records in the customer details, newest first.
Sales reps can only add follow-ups for their own customers. Sales managers can view all records. Read-only users can only view them.
Existing customers don't need historical follow-up records added.
```

Confirm the design, then verify as a sales rep, manager, and read-only user. Split larger requests into independently usable features—such as follow-ups, opportunities, quotes, and sales reports—and verify each before moving on.

Ask the Coding Agent to save lasting conventions, for example: "Use the company's time zone for all dates from now on, and save this in the project conventions." These rules are stored in `.agents/rules/` and indexed by `AGENTS.md` for future sessions.

See the [CRM example source](https://github.com/nocobase/docs-examples-v3/tree/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm) and its [README](https://github.com/nocobase/docs-examples-v3/blob/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm/README.MD). Consult [Project structure](../core/developing-apps/project-structure.md) to locate code, continue to [Install and use Studio](collaborate-with-studio.md) to try the team workbench, or browse the [Learning path](learning-path.md).
