---
title: Accept the agent's work
metaDescription: Using a "needed by" date on device requests as the example, read the agent's report, run it yourself with existing data, and send it back with steps to reproduce and the expected result when something is wrong.
---

This chapter adds a "needed by" date to device requests and goes through acceptance and sending work back.

## 1. Raise the request

```prompt
Add an optional "needed by" date to device requests. It cannot be earlier than today, and it shows in the list and the details. Requests already submitted stay empty.
```

The agent's report:

| | Content |
| --- | --- |
| Automated checks | `pnpm typecheck` and `pnpm lint` pass; new migration and API tests (the date is saved, Ben can read it, a date earlier than today is refused), 5 cases pass |
| Hands-on | As Alice, submitted a laptop request needed by November 6, with a screenshot of the details |
| Not verified | Browser automation tests |

For what each kind of check confirms, see [Continue developing your app](../core/getting-started/develop-with-an-agent.md#review-the-result).

## 2. Run the business scenario yourself

Sign in as Alice and open **Device requests**:

![Old requests show 1970, and new requests have an extra time](https://static-docs.nocobase.com/20261030-itam-lite-accept-needed-by-wrong.webp)

Two problems:

- The old requests submitted in Device requests and approval and Roles and permissions have no needed-by date, yet show `Jan 1, 1970, 7:30 AM`.
- The new request shows `Nov 6, 2026, 8:00 AM`, with a time after the date.

The agent's tests and hands-on use both used only new data. When accepting, use existing data and walk through each role's daily work. Once a scenario is settled, you can have the agent turn it into a browser test; see [Testing and acceptance](../core/developing-apps/testing-and-acceptance.md#browser-tests-and-functional-acceptance).

## 3. Send it back

Send it back when an acceptance criterion is not met, old data is shown or handled wrongly, or permissions are wrong. Give steps to reproduce and the expected result:

```prompt
The needed-by date displays wrongly:
1. In Alice's Device requests, old requests without a date show Jan 1, 1970, 7:30 AM; they should show "—".
2. A request with November 6 shows Nov 6, 2026, 8:00 AM; it should show only the date.
Fix both the list and the details. When fixed, check again as Alice and attach screenshots.
```

The agent added a formatting function that shows only the date and shows "—" when there is no date, and made the type nullable; the new tests pass in three time zones: UTC, Los Angeles and Shanghai. Check again:

![Old requests show "—", and new requests show only the date](https://static-docs.nocobase.com/20261030-itam-lite-accept-needed-by-fixed.webp)

Choose yesterday again and submit: `Choose today or a later date.` appears next to the date field. Sign in as Ben, and Alice's needed-by date shows in the list.

**Done when**: a new request's needed-by date shows only the date in the list and the details, and old requests show "—"; a date earlier than today cannot be submitted and is flagged next to the field; Ben can see the date; all tests pass.
