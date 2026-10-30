---
title: "Knowledge base"
description: "Integrate spaces, document versions, search, permissions and change review."
---

## Capabilities

`@nocobase/app-plugin-knowledge` provides spaces, folders, Markdown articles, files, versions, search and change proposals. Basic knowledge management requires neither Agents nor semantic indexing.

Basic knowledge management is independent of Agents and semantic indexing; the application defines space ownership and access.

## Scenarios and examples

### Example: review team knowledge changes

1. Configure a team space and read, propose and edit permissions.
2. A member proposes an article update; an editor reviews its diff and base version.
3. Accept or reject it; acceptance creates a new version.
4. Verify history, search and isolation from unauthorized users.

`knowledge.proposals: false` disables proposal workflows while preserving historical records. Direct editing retains its permission checks. Actors acting for users cannot directly edit or decide proposals.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use Knowledge to add team spaces and document-change review. Bind a
KnowledgeAccessResolver for team-visible spaces and read/propose/edit/manage
access. Reuse its page or views for member proposals and editor review against
the base version. Start with text search, without assuming semantic models or OCR.
Test team isolation, edit conflicts, accepted proposals and parsing failures.
```

**Done when**: Members can propose changes, acceptance creates a version, and other teams cannot read the content through pages or search.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Server access resolver | Bind knowledgeAccessToken and resolve space/node access | Users see authorized team spaces |
| Client routes or business page | Register the page or embed KnowledgeView | Add documents, folders, versions and proposals |
| Optional index config and Jobs | Compose indexing and its management grants separately | Add semantic search without removing basic text search |

### Spaces and permissions

Register both runtimes and apply migrations. Bind a `KnowledgeAccessResolver` through `knowledgeAccessToken` from `/server/tokens`, defining valid spaces, inheritance and reader access. Without a resolver, no spaces are available.

Spaces use `scope` and `scopeId`. The application enumerates authorized spaces rather than exposing an unfiltered database list.

| Level | Capability |
| --- | --- |
| `read` | Read permitted documents and files |
| `propose` | Submit changes for review |
| `edit` | Edit content and decide eligible proposals |
| `manage` | Manage space and node permissions |

Nodes can inherit access or use custom permissions. Page access does not grant access to every space.

### Pages and content

`knowledge()` registers `/knowledge` by default and accepts `path` and `space`. For embedded business views, use `knowledge({ routes: false })` and compose `KnowledgePage` or `KnowledgeView` from `/client/pages`.

Users can maintain folders and Markdown, inspect versions and restore content. Updates carry an expected version; resolve conflicts against the latest content.

Uploads additionally need Files and Drive. Supported files have text extracted and expose parsing status. There is no OCR, so images and scanned documents do not necessarily produce searchable text.

### Search and semantic indexing

Basic search matches current document and extracted text. Semantic search is optional. Knowledge owns its global index; Agents can supply an Embedding gateway, without sharing Agents vector collections.

Compose `defineKnowledgeConfig()` from `/config`, configure index instances, model access and host Jobs, then integrate indexing controls. Administration uses independent `settings:kb.indexing` permissions, not space management alone. Text search remains available while indexing is unavailable or rebuilding.

Verify isolation, version conflicts, parsing failures, proposal review and search boundaries. Related: [Agents](agents.md), [Files](../data-and-files/file-management.md), [Manage plugins](../../developing-apps/manage-plugins.md).

## AI development constraints and verification

### Plugin-specific development constraints

- Apply access boundaries to space lists, documents and search. Page access does not expose every space.
- Submit expected versions and resolve conflicts instead of disabling version checks.
- Verify proposal eligibility, cross-space search and parsing failures; never mark unsupported scanned content as successfully extracted.

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-knowledge).
