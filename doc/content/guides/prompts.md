---
title: Common prompts
metaDescription: "Prompt templates by scenario: create an app, write a design doc, raise a request, plan first, accept and send back, hand over to a new session, write rules, upgrade, deploy and review."
---

Replace the parts in angle brackets with your own.

## Create an app

```prompt
Create a NocoBase 3 app in the current directory, using SQLite as the database. Once it's running, tell me the URL and the login account.
```

## Discuss the design

```prompt
I want to build <a system>. Don't write code yet; work out the design with me first.
<Roles and main flows, in two or three sentences>
Ask me about anything I need to decide, one group of questions at a time, with your recommendation for each.
```

## Write the design doc

```prompt
Write the agreed design into docs/design.md: roles, data, flows, pages, permissions, plus a step-by-step delivery plan with acceptance criteria for each step.
Register it in AGENTS.md: read it before any business change; when a request changes the design, update it before changing the code.
```

## Raise a request

```prompt
<What to build: who uses it and where, and what it should accomplish>
<Rules and boundaries: who can do it, and when it is not allowed>
<What happens when it fails>
Acceptance: <which account does what, and what result it sees>
```

## Plan first

```prompt
Don't change any code yet. List which parts this change touches, the questions I need to decide, and how you plan to verify it.
```

## Send back

```prompt
<Feature> has a problem: with <account>, <steps>, I see <actual result>; it should be <expected result>. After fixing it, check again with the same account and attach screenshots.
```

## Review

Open a session with a model from a different vendor:

```prompt
Review the uncommitted changes. Look for problems against the conventions in AGENTS.md, list them by severity, and don't change any code.
```

## Hand over to a new session

```prompt
First read AGENTS.md, docs/design.md and the recent commits, and tell me how far this app has got and what is still missing. Then do: <request>.
```

## Turn a convention into a rule

```prompt
Record this convention in .agents/rules/<topic>.md and register it in the index in AGENTS.md, saying when to read it:
<convention>
```

## Upgrade NocoBase Core

```prompt
Upgrade NocoBase to the latest version. Give me an upgrade plan first and change things only after I confirm; afterwards run all tests and confirm all business data is still there.
```

## Deploy

```prompt
Deploy this app with Docker to the server <user>@<server address>, in the directory <path>, served at https://<domain>/<path>/, with a new empty database.
Keep the configuration and data in the deployment directory so recreating the container doesn't lose them. I'll give you the admin password separately; don't put it in the code or the report.
After deploying, log in, create a record, recreate the container, and confirm the data is still there. Finally, tell me what is still not configured, such as HTTPS.
```

## Requests from other teams

```prompt
I want to send the development team a request: <one sentence>. Ask me a few questions first, write it up as a requirements document, then make a single-file HTML demo of the main pages.
```
