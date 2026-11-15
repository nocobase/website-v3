---
title: Capture knowledge
metaDescription: Preserve CRM decisions, build a project checklist, and use project memory to help people and Agents take over.
lesson: 18
---

The quote revision and customer handover issues now contain agreed rules. Preserve lasting decisions so the next developer or Agent can use them.

| Location | What belongs there |
| --- | --- |
| Knowledge | Human-maintained business rules, policies, and decision context |
| Skills | Methods for development, verification, and review |
| Project memory | Constraints, corrections, and experience maintained with the code |

These resources support development in Studio. Product knowledge and customer information used by salespeople or business Agents inside the CRM belong to application features; adding Studio knowledge does not connect them automatically.

## Save CRM rules and decisions in Knowledge

Open **Knowledge** in the CRM project and create a CRM business rules document containing the agreed decisions:

- Submitted quote revisions are immutable; later changes create a new draft. Catalog price changes do not alter historical amounts.
- Existing quotes retain their identifiers and contents. Earlier revision history must not be invented.
- Managers can transfer customers, recording the reason, operator, and time. Original follow-up authors and quote history remain unchanged.
- Former owners lose ownership-based access. Continued assistance requires an explicit read-only share from the manager.

State the scope and link the relevant issues. If discount approval rules already exist, reference the agreed policy rather than inventing another threshold. Give Morgan edit access to the relevant document so its business meaning has an owner. See [Knowledge](../studio/project/knowledge-base.md).

![Read CRM acceptance rules and their maintenance information in project Knowledge.](/assets/guides/studio/knowledge.png)

In a CRM conversation, ask:

```prompt
Can the former owner still view a customer after handover? Explain the conditions using our project knowledge and link the source.
```

**Step check**: The answer matches the document and identifies its source. If the Agent cannot read it, check the requesting person's access.

## Build a CRM development and review checklist

Ask a Coding Agent that can read the project and delivery reports:

```prompt
Turn what we learned from quote comparisons and customer handovers into a checklist for future CRM changes. Focus on who can access customers, preserving historical quotes, and keeping complete handover records. Show me the draft first.
```

The checklist should describe how to verify a rule, not merely say “check permissions”:

| Subject | Check |
| --- | --- |
| Customers and related records | Test pages and APIs as the owner, an unauthorized salesperson, and a manager |
| Submitted quotes | Change a new draft and catalog prices, then compare historical contents and amounts |
| Handover and sharing | Check revoked access and the limits of explicit read-only sharing |
| Existing-data upgrades | Retain before-upgrade samples and reconcile relationships, authors, and history |

After reviewing it, create the Skill in **Skills**. Its `SKILL.md` uses `name: crm-checklist`, a `description` stating when CRM development, self-testing, and review should use it, and the agreed methods in its body. An Agent with management permission can also help create it. Attach it under **Settings → Default skills** in the CRM project, limiting it to a repository if needed. See [Skills](../studio/project/skills.md) for format and permissions.

![Default skills can be attached to a project or limited to a selected repository.](/assets/guides/studio/default-skills.png)

**Step check**: `crm-checklist` is attached and subsequent run records and delivery reports show the relevant checks. Attachment alone does not prove that verification happened.

## Inspect and accumulate project memory

Open the project's **Memory** tab to inspect lasting conclusions recorded by Agents. Examples include “Do not invent revisions for existing quotes” and “Check independent sharing grants when revoking ownership access.”

![Inspect project memory by repository and type.](/assets/guides/studio/memory.png)

Memory lives in `.nb-studio/memory/` in the repository and is reviewed and merged with a task PR. Ask in an issue to retain an agreed rule; the Agent decides how to record it. Remove duplicate, outdated, or incorrect entries during review. Do not store secrets, private customer data, or temporary progress there. See [Project memory](../studio/project/project-memory.md).

**Done when**: Rules have clear sources, methods are attached to the project, and lasting experience is available alongside the code for the next task.

Next, [release the features and record the production version](release.md).
