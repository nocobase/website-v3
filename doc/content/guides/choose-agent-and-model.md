---
title: Choose an agent and a model
metaDescription: Pick a coding tool and a model.
---

## Choose a coding tool

For the coding tool, use a common coding agent such as Codex, Claude Code or OpenCode; the prompts work the same. Install and sign in by following each tool's official instructions.

## Choose a model

As of late 2026, the recommended models are the top models in the Claude and GPT families, and DeepSeek among Chinese models:

| Model | Strengths |
| --- | --- |
| Claude Opus | Builds better-looking pages and has stronger all-round ability |
| GPT Astra/Sol | Given a fairly complete system design document, can build the whole system |
| DeepSeek | Fast and low-cost. Use it in OpenCode, or connect it to Claude Code by following DeepSeek's documentation |

For design documents and new features, use a strong model with a higher reasoning effort. For small changes such as copy or styling, switch to a faster, cheaper model.

For code review, a model from another vendor finds problems more easily. For example, when Codex built a feature with GPT, open a Claude Code session and have Opus review it:

```prompt
Review the uncommitted changes. Look for problems against the conventions in AGENTS.md, list them by severity, and don't change any code.
```
