---
title: "Template printing"
description: "Use the Skills the plugin provides to implement DOCX template filling and PDF output in an application."
---

## Capabilities

`@nocobase/app-plugin-template-print` provides Agent Skills and a reference implementation for template printing, helping an application generate documents from Office templates and business data, and handle images, QR codes and PDF conversion as needed.

### What you get after installing

The current package only distributes development guidance. It has no Client, Server or CLI runtime entry, and provides no template table, print route, rendering engine or ready-made print page. After installing it, the application still implements its own printing feature.

Install a compatible version as a direct development dependency of the application, then synchronize in the application root:

```bash
pnpm nocobase skills sync
```

Confirm that the application can read the `nocobase-app-plugin-template-print` Skill. There is no need to add this package to the Client or Server plugin registration arrays, and do not invent a runtime entry just to install the Skill.

## Scenarios and examples

### Example: generate a printable document for orders

Give the application's Agent the following request:

```prompt
Use the template-print Skill to add Download order to our order detail page.
Fill the supplied DOCX template with order details, line items and totals.
Reuse the current user's record and field permissions.
Implement DOCX first; explain and integrate deployment dependencies if PDF is needed.
Verify empty line items, long text, missing images, denied access and valid output files.
```

The implementation should be owned by the application or a business plugin: the template assets, data queries, rendering dependencies, download API and button. You can first get one business flow working with a fixed template, then decide whether template upload, versioning and preview are needed.

**Done when**: authorized users can download a DOCX with correct fields and layout; when PDF is needed, a file that opens can also be produced in the target environment.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Development dependency and Skills synchronization | Install the guidance package and synchronize it into the application | The coding Agent can read the current version's guidance; no runtime plugin is added |
| Template assets, business queries and the download API | Implement authorized data assembly and DOCX rendering | A real document that opens is returned |
| Order details and the optional PDF environment | Connect the download button, conversion dependencies and failure feedback | Users can download, and conversion failures can be explained |

### Organizing and using content

First settle the fields in the template and the detail areas that repeat, then prepare authorized data. Images, QR codes, fonts and page breaks must be checked in the generated document itself. PDF is only an optional output; the conversion tool, runtime environment and deployment dependencies must be arranged separately, and installing this package does not mean the server can convert.

`app-plugin-template-print-example` in the plugin source is a separate example with its own invoice data, authorization, fixed DOCX and download interface; it is not a general rendering service built into this Skill package.

## AI development constraints and verification

### Development constraints for this plugin

- This package only provides development guidance; do not import runtime entries that do not exist, and do not claim a general print service exists.
- Template fields may only use data the current user is allowed to access, and the download API must recheck record and field permissions.
- Actually open the output file to check details, totals, page breaks and images; verify PDF conversion with the real deployment dependencies, not just that the API returns 200.

### Verify results

Check that the generated document opens, that field values and totals are correct, that repeated areas and page breaks are reasonable, and that the current user cannot print records or fields they are not allowed to view. When PDF is needed, also verify conversion, fonts and error handling in the deployment environment.

Related documentation: [Develop with an Agent](../../developing-apps/develop-with-an-agent.md), [Files](../data-and-files/file-management.md), [Permission management](../authorization/permissions.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-template-print).
