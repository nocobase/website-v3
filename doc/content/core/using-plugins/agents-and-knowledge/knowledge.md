---
title: "Knowledge base"
description: "Integrate spaces, document versions, search, permissions and change review."
---

`@nocobase/app-plugin-knowledge` provides spaces, folders, Markdown articles, files, versions, search and change proposals. Basic knowledge management requires neither Agents nor semantic indexing.

## Spaces and permissions

Register both runtimes and apply migrations. Bind a `KnowledgeAccessResolver` through `knowledgeAccessToken` from `/server/tokens`, defining valid spaces, inheritance and reader access. Without a resolver, no spaces are available.

Spaces use `scope` and `scopeId`. The application enumerates authorized spaces rather than exposing an unfiltered database list.

| Level | Capability |
| --- | --- |
| `read` | Read permitted documents and files |
| `propose` | Submit changes for review |
| `edit` | Edit content and decide eligible proposals |
| `manage` | Manage space and node permissions |

Nodes can inherit access or use custom permissions. Page access does not grant access to every space.

## Pages and content

`knowledge()` registers `/knowledge` by default and accepts `path` and `space`. For embedded business views, use `knowledge({ routes: false })` and compose `KnowledgePage` or `KnowledgeView` from `/client/pages`.

Users can maintain folders and Markdown, inspect versions and restore content. Updates carry an expected version; resolve conflicts against the latest content.

Uploads additionally need Files and Drive. Supported files have text extracted and expose parsing status. There is no OCR, so images and scanned documents do not necessarily produce searchable text.

## Example: review team knowledge changes

1. Configure a team space and read, propose and edit permissions.
2. A member proposes an article update; an editor reviews its diff and base version.
3. Accept or reject it; acceptance creates a new version.
4. Verify history, search and isolation from unauthorized users.

`knowledge.proposals: false` disables proposal workflows while preserving historical records. Direct editing retains its permission checks. Actors acting for users cannot directly edit or decide proposals.

## Search and semantic indexing

Basic search matches current document and extracted text. Semantic search is optional. Knowledge owns its global index; Agents can supply an Embedding gateway, without sharing Agents vector collections.

Compose `defineKnowledgeConfig()` from `/config`, configure index instances, model access and host Jobs, then integrate indexing controls. Administration uses independent `settings:kb.indexing` permissions, not space management alone. Text search remains available while indexing is unavailable or rebuilding.

Verify isolation, version conflicts, parsing failures, proposal review and search boundaries. Related: [Agents](agents.md), [Files](../data-and-files/file-management.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-knowledge).
