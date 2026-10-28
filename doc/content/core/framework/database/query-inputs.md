---
title: Query inputs and builders
---

`@nocobase/repository-input` provides portable query contracts for clients and servers. Builders turn code expressions into serializable data; execution and authorization remain server responsibilities.

## Constructing input

```ts
import { buildFilter, buildSelect, buildSort } from '@nocobase/repository-input';

export const orderQuery = {
  filter: buildFilter((f) => f.string('status').eq('paid')),
  select: buildSelect((s) => s.fields('id', 'orderNo', 'amount')),
  sort: buildSort((s) => s.field('id').asc()),
};
const json = JSON.stringify(orderQuery);
```

`buildFilter`, `buildSelect`, `buildSort` and `buildAggregate` accept ASTs or synchronous callbacks and return detached JSON snapshots. Filter also accepts scalar equality shorthand. Building input neither connects a database nor grants field access.

## Input forms

| Form | Use |
| --- | --- |
| Equality shorthand | Simple scalar conditions |
| Builder callbacks | Readable programmatic composition |
| JSON AST | Persistence, transmission and dynamic construction |

Materialize callbacks before JSON transport. Async callbacks, cycles, invalid numbers and functions in unsupported positions fail. Dates become ISO strings and bigints decimal strings; native bigint remains invalid as a Filter JSON literal.

## Variables and mutations

`context` supplies query variables, not transaction handles or permissions. The server determines which variables derive from trusted identity and which come from validated user input.

`buildCreateValues` and `buildUpdateValues` materialize mutation inputs. API Client's `build*Options` helpers produce complete remote requests. Avoid framework-private `internal/*` entries.

## Server validation

Validate saved queries against Collections, field types, relation depth, limits and policies. Official builders do not authorize arbitrary access. Preserve exact numeric values with strings where BIGINT/DECIMAL fields require them.

Compare Builder and AST execution in tests; JSON shape alone does not establish database semantics. See [API Client](../http/api-client.md) and [Filtering and pagination](filtering-pagination.md).

## Interfaces and implementation

- [Portable input builders](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input/README.md)
- [Repository input contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/inputs.md)
