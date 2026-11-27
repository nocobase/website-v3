---
title: "Scheduled tasks"
metaDescription: "Generate a CRM sales activity report at 1 a.m. in the team’s time zone and verify the reporting date with follow-ups recorded on either side of midnight."
---

A sales manager opening the CRM in the morning wants to know how many customers, opportunities and follow-ups the team added yesterday. Use a scheduled task to generate a daily team report. **Sales activity reports** shows the latest 30 dates with a report.

In the [CRM example](https://github.com/nocobase/doc-demo-crm/tree/main), sales managers can view team reports. Administrators can also check the schedule’s run history.

**Modules covered**

- [Scheduled tasks](../../core/using-plugins/automation/scheduler.md)

## Daily report rules

Agree on what “yesterday” means for the sales team. This team works in Shanghai (`Asia/Shanghai`). The run at 1 a.m. on November 26 produces the **November 25** report. It counts records created from midnight at the start of November 25 up to midnight at the start of November 26. A record created exactly at the second midnight belongs to November 26.

Count each activity by its own creation time. Logging a follow-up yesterday for a long-standing customer adds one follow-up to yesterday’s report. The customer itself still counts toward the day it was created.

## Set the run time and time zone

In your CRM project, give your development agent a request like this:

```prompt
Please put together a sales report every day. When I open the CRM in the morning, I’d like to see how many customers and opportunities the team added yesterday and how many follow-ups they logged. I’d also like to look up earlier reports by date.
```

The [report provider](https://github.com/nocobase/doc-demo-crm/blob/main/server/providers/daily-reports.ts) registers the counting operation as the schedule target and sets the rule:

```ts
schedule: { cron: '0 1 * * *', timezone: reportTimezone },
```

Here, `reportTimezone` is `Asia/Shanghai`. The scheduler interprets “01:00 every day” in that zone even if the server runs in UTC. Omitting `timezone` defaults the schedule to UTC, so the same rule would fire at 9 a.m. in Shanghai.

The report uses the same zone to determine the previous calendar day. It converts both local midnights to UTC before querying the records. At 1 a.m. on November 26 in Shanghai it is still 17:00 UTC on November 25. Subtracting a day from the UTC date would report November 24. To adapt the example for another team, change `reportTimezone` so the trigger and report use the same zone.

## View run history

As an administrator, open **System settings → Schedules** and select **Daily sales activity**. Check the cron expression and time zone under **Rule** and the upcoming time under **Next runs**. The browser in the screenshot uses Shanghai time. If your browser displays UTC, 1 a.m. in Shanghai corresponds to 17:00 on the preceding day.

After the task runs, open its execution record and look for `reportDate`, `customers`, `opportunities` and `followUps` in the result. Open **Sales activity reports** in the sidebar and match the three counts to the row with that date. Refresh the page if it was already open when the task ran.

![Daily sales activity schedule showing the rule, time zone, upcoming runs and run history](/assets/guides/crm-sales-activity-schedule.png)

## Check records around midnight

In isolated test data, record these two follow-ups for the same customer. Both have the same UTC date, but the team sees them on different days.

| Created in Shanghai | UTC equivalent | Report date |
| --- | --- | --- |
| November 25 at 23:55 | November 25 at 15:55 | November 25 |
| November 26 at 00:05 | November 25 at 16:05 | November 26 |

Run the [midnight boundary test](https://github.com/nocobase/doc-demo-crm/blob/main/tests/server/daily-reports.test.ts) from the example project root to check these records immediately:

```sh
pnpm exec vitest run tests/server/daily-reports.test.ts
```

The test also creates one customer exactly at midnight on November 25 and an opportunity exactly at midnight on November 26. The November 25 report should show **1 new customer, 0 new opportunities and 1 follow-up**. Running it again in the test still leaves one row for November 25. The November 26 report picks up the opportunity and the 00:05 follow-up.

![Sales activity reports showing one new customer, zero new opportunities and one follow-up for November 25](/assets/guides/crm-sales-activity-report.png)

## Summary and next steps

**Done when**: The task generates the previous day’s report at 1 a.m. in the team’s time zone, and all three counts match the run record. The follow-ups logged at 23:55 and at 00:05 the next day each appear in the count for their own date.

A scheduled task can also check for overdue follow-ups. To send a reminder to the owner, see [Business events and in-app notifications](notifications.md).
