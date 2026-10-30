---
title: Quality follow-ups
description: Resolve defects, business questions, and automation gaps found by quality plans.
---

**Quality follow-ups** collects work left by quality plans. Filter by project, type, and status. Open an item to see its source plan, round, and linked task.

![Filter quality follow-up work by project and status](https://static-docs.nocobase.com/studio-en-guide-quality-followups-20261031.png)

| Type | Action |
| --- | --- |
| Defect | Review reproduction steps and impact, then arrange repair and verification |
| Open question | Confirm expected business behavior before deciding on a change |
| Automation work | Add durable tests for verified behavior that lacks coverage |
| Linked task | Follow development or other work already arranged |

When expected behavior is unclear, answer the question first rather than treating the Agent's assumption as a defect. Repairs run as regular tasks and follow the same [acceptance process](../use/accept.md).

## Retesting and history

A recurring finding links to the existing issue across rounds to avoid duplicates. After repair, [start another round](plans.md#retest-and-schedule) to verify the result.

The follow-up list covers the entire plan and does not change when you select a historical report. Completing a repair does not turn a historical failure into a pass. A new round records the new result.
