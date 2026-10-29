---
title: "Template printing"
description: "Use plugin Skills to implement DOCX templates and PDF output in an application."
---

## Capabilities

`@nocobase/app-plugin-template-print` supplies Agent Skills and references for generating documents from Office templates and business data, with optional images, QR codes and PDF conversion.

### What installation provides

The package contains guidance only: no Client, Server or CLI runtime, template tables, rendering engine, print endpoints or UI. The application implements the resulting feature.

Install a compatible version as a direct development dependency, then synchronize from the application root:

```bash
pnpm nocobase skills sync
```

Confirm the Agent can read `nocobase-app-plugin-template-print`. Do not add nonexistent runtime entries to Client or Server registration.

## Scenarios and examples

### Example: print an order

Give the application Agent a concrete request:

```text
Use the template-print Skill to add Download order to our order detail page.
Fill the supplied DOCX template with order details, line items and totals.
Reuse the current user's record and field permissions.
Implement DOCX first; explain and integrate deployment dependencies if PDF is needed.
Verify empty line items, long text, missing images, denied access and valid output files.
```

The application or business plugin owns templates, queries, rendering dependencies, downloads and UI. Start with one fixed template before adding upload, version management or preview features.

**Done when**: Authorized users download correctly populated DOCX files; optional PDF works and opens in the target environment.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Development dependency and synchronized Skills | Install guidance and synchronize it | Coding Agents receive instructions without a runtime plugin |
| Templates, business queries and download API | Implement authorized data assembly and DOCX rendering | Return an actual usable document |
| Order detail and optional PDF environment | Add download UI, conversion dependencies and errors | Users download output and receive meaningful failures |

### Prepare output

Map fields and repeating regions to authorized data. Inspect images, QR codes, fonts and pagination in actual generated files. PDF conversion needs a separately configured tool and deployment environment; installing this package does not supply one.

`app-plugin-template-print-example` is a separate runnable example with invoice data, authorization, a fixed DOCX and download UI. It is not a generic renderer built into this Skill package.

## AI development constraints and verification

### Plugin-specific development constraints

- The package contains guidance only; do not invent runtime imports or a built-in universal renderer.
- Populate templates only with authorized data and recheck record and field access in downloads.
- Open actual output to inspect rows, totals, pagination and images. Verify PDF with deployment dependencies, beyond an HTTP 200 response.

### Verify

Open generated files and check values, totals, repeating regions and pagination. Verify denied records and fields cannot be printed. For PDF, test conversion, fonts and failure handling in the deployment environment.

Related: [Develop with an agent](../../developing-apps/develop-with-an-agent.md), [Files](../data-and-files/file-management.md), [Permission management](../authorization/permissions.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-template-print).
