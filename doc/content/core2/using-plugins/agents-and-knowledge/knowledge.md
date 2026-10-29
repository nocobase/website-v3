---
title: "Knowledge base"
description: "Integrate knowledge spaces, document versions, search, permissions and change review."
---

## Capabilities

`@nocobase/app-plugin-knowledge` provides knowledge spaces, folders, Markdown documents, files, versions, search and change proposals. The basic knowledge base works on its own and does not require Agents or semantic retrieval.

The basic knowledge base is independent of Agents and semantic indexing; the business ownership and authorization of spaces are defined by the application.

## Scenarios and examples

### Example: review changes to team knowledge

1. The application configures a knowledge space for the team, with permissions to read, propose and edit.
2. A member submits a change proposal for an article, and an editor checks the differences and the version it is based on.
3. The editor accepts or rejects the proposal; accepting it creates a new version of the document.
4. Check the search results and history, and verify that members of other spaces cannot see content they are not allowed to access.

Setting `knowledge.proposals: false` turns off the proposal flow in favor of direct editing; existing proposal data is kept, and direct editing still requires the existing permissions. An actor working on a user's behalf can neither edit directly nor decide on proposals.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Knowledge to add team spaces and document-change review. Bind a
KnowledgeAccessResolver for team-visible spaces and read/propose/edit/manage
access. Reuse its page or views for member proposals and editor review against
the base version. Start with text search, without assuming semantic models or OCR.
Test team isolation, edit conflicts, accepted proposals and parsing failures.
```

**Done when**: members can propose changes, accepting a proposal creates a new version, and other teams cannot read the content through either pages or search.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Server access resolver | Bind `knowledgeAccessToken` and resolve space and node permissions | Users can only enter the team spaces they are allowed into |
| Client routes or a business page | Register the knowledge base page, or embed `KnowledgeView` | Interfaces for documents, folders, versions and proposals appear |
| Optional index configuration and Jobs | Combine indexing and its management permission separately | Semantic retrieval is added when needed, while basic search stays available |

### Integration and space permissions

Register the Client and Server plugins and run the migrations. The application must provide a `KnowledgeAccessResolver` through `knowledgeAccessToken` exported from `/server/tokens`, defining whether a space exists, how permissions are inherited and which permissions the current reader has. Without an access resolver bound, no spaces are available.

A space is identified by `scope` and `scopeId`, such as the system space or the space of a business project. The list of selectable spaces and their permissions are decided by the application; never hand every space in the database to users to choose from.

| Permission | Work it allows |
| --- | --- |
| `read` | Read the documents and files the reader is allowed to access |
| `propose` | Submit change proposals |
| `edit` | Edit content and review the proposals they may handle |
| `manage` | Manage permission settings of spaces and nodes |

Folders, documents and files can also have inherited or custom permissions. Page access and content permissions are separate: being able to open the page does not mean being able to read every space.

### Use pages and content

`knowledge()` registers the `/knowledge` page by default and also accepts `path` and `space`. To embed the knowledge base in a business page, use `knowledge({ routes: false })` and compose `KnowledgePage` or `KnowledgeView` from `/client/pages` yourself.

Users can create folders and articles, edit Markdown, view differences between versions and restore content. Edits are submitted with the expected version; on a version conflict, read the latest version before handling it, so nobody else's changes are overwritten.

Uploading files also needs the Files plugin and Drive. Files keep their original content, and text is extracted from supported formats when possible; the parsing status shows as processing, succeeded, failed or unsupported. There is currently no OCR, so do not assume images or scanned documents yield searchable text.

### Search and semantic indexing

Basic search matches within current documents and extracted text. Semantic indexing has to be configured separately: Knowledge can maintain its own global index, and Agents serves only as an optional Embedding gateway without reusing Agents' vector collections.

When you need indexing, combine `defineKnowledgeConfig()` exported from `/config`, configure the index instances, model source and the host's Jobs, and connect the public index management components. Index management uses its own `settings:kb.indexing` permission, which is not granted automatically with space management permissions. While the index is unavailable or rebuilding, ordinary text search still works.

## AI development constraints and verification

### Development constraints for this plugin

- The space list, document reads and search use the same access boundary; being able to open the page does not mean every space is readable.
- Writes carry the expected version, and conflicts are handled by reading again; never force an overwrite by removing the version check.
- Verify eligibility to propose, cross-space search and file parsing failures; do not hide the fact that scanned documents are not searchable by faking an "extraction succeeded" status.

Verify space isolation, version conflicts, file parsing failures, proposal review and search scope. Related documentation: [Agents](agents.md), [Files](../data-and-files/file-management.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-knowledge).
