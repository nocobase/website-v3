---
title: Workload and usage
description: Track Agent queues, runtime capacity, and estimated model costs.
---

## View workload

Open **Issues** and switch to **Agent queue**. Each Agent has a lane for running work, queued work, items waiting for a reply, and assigned but idle tasks. Waiting reasons appear with each item. Open items that need your response directly from the queue.

![See running, queued, and waiting work by Agent](https://static-docs.nocobase.com/studio-en-guide-agent-queue-20261031.png)

Frequent capacity waits may call for more concurrency or additional [Runtimes](../configure/runtimes.md). If an Agent rarely receives work, review its capability description and available models.

## View usage

Open **Usage**, choose a date range, and group by Agent, requester, subject, model, coding tool, or date. Reports include run counts, duration, input and output tokens, cache usage, and estimated cost.

![Model usage and cost trends](https://static-docs.nocobase.com/studio-en-guide-usage-20261031.png)

Daily trends show cost or token changes. Calls outside Agent runs, such as knowledge indexing, appear under other model usage.

## Set prices

Members with model pricing permission can open the price settings. Enter input, output, and cache prices per million tokens, or apply pricing rules to multiple models.

Mark subscription-based coding tools as non-billable subscriptions. Models without prices show **—** for cost. These figures are team estimates; the provider's invoice determines the actual charge.
