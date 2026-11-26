---
title: Capture knowledge and experience
metaDescription: Preserve CRM decisions, build a project checklist, and use project memory to help people and Agents take over.
---

When business rules and lessons stay buried in individual issues, new teammates and Agents end up repeating questions or breaking earlier decisions. Suppose your CRM project has agreed on a set of quote revision and customer handover rules (substitute your own team's confirmed rules if using another project)—here is how to capture them across Knowledge, Skills, and Project memory.

Before starting, prepare a connected Studio project (with knowledge edit and skill management permissions) and the rules to preserve. Each store has a clear role:

| Location | What belongs there |
| --- | --- |
| Knowledge | Human-maintained business rules, policies, and decision context |
| Skills | Methods for development, verification, and review |
| Project memory | Constraints, pitfalls, and experience automatically captured by Agents and maintained with the code |

These stores serve development in Studio; customer or product knowledge inside the CRM app is an application feature and does not connect automatically.

## Save CRM rules and decisions in Knowledge

Open **Knowledge** in the CRM project, create a “CRM business rules” article in the project space with the agreed decisions, save it, and grant business owner Morgan edit access in its permission settings (see [Knowledge](../../studio/project/knowledge-base.md)):

- Submitted quote revisions are immutable; later changes create a new draft. Catalog price changes do not alter historical amounts.
- Existing quotes retain their identifiers and contents. Earlier revision history must not be invented.
- Managers can transfer customers, recording the reason, operator, and time. Original follow-up authors and quote history remain unchanged.
- Former owners lose ownership-based access. Continued assistance requires an explicit read-only share from the manager.

![Read CRM acceptance rules and their maintenance information in project Knowledge (shown with a sample project).](/assets/guides/studio/knowledge.png)

Click **Ask agent** on the CRM project page (or ask in a CRM-bound conversation in **My sessions**) to verify:

```prompt
Can the former owner still view a customer after handover? Explain the conditions using our project knowledge and link the source.
```

**Step check**: The answer matches the document and cites its source; if the Agent cannot read it, check the requester's knowledge permissions.

## Build a CRM development and review checklist

In a CRM-bound session (or a local Coding Agent connected to Studio), ask the Agent to draft a checklist first:

```prompt
Turn what we learned from CRM quote revisions and customer handovers into a checklist for future CRM changes. Focus on who can access customers, preserving historical quotes, and keeping complete handover records. Show me the draft first.
```

A useful checklist states how to verify each rule rather than vaguely saying “check permissions”:

| Subject | Check |
| --- | --- |
| Customers and related records | Test pages and APIs as the owner, an unauthorized salesperson, and a manager |
| Submitted quotes | Change a new draft and catalog prices, then compare historical contents and amounts |
| Handover and sharing | Check revoked access and the limits of explicit read-only sharing |
| Existing-data upgrades | Retain before-upgrade samples and reconcile relationships, authors, and history |

Once confirmed, ask the Agent to create and attach the Skill directly:

```prompt
Create this confirmed checklist as a Studio skill named crm-checklist for CRM development, self-testing, and review, and attach it to the CRM project's default skills.
```

You can also create `SKILL.md` manually under **Agent management › Skills** in the left navigation, then add and save it under project **Settings › Default skills** (see [Skills](../../studio/project/skills.md) for format and permissions).

![Default skills can be attached to a project or limited to a selected repository (shown with a sample project).](/assets/guides/studio/default-skills.png)

**Step check**: `crm-checklist` appears in the CRM project's default skills, and subsequent **Runs** and **Handover reports** show those checks being carried out. Attachment alone does not prove execution.

## Let Agents automatically capture project memory

Unlike Knowledge, which teammates maintain manually, project memory does not need to be written by hand. As Agents complete tasks, they automatically summarize lessons worth reusing—such as recurring bug causes, performance pitfalls, corrected practices, business constraints not obvious from the code (for example, “Do not invent revisions for existing quotes” or “Check independent sharing grants when revoking ownership access”), and pointers to external references—and write one file per entry to `.nb-studio/memory/` on the task branch. Routine changes with no new long-term takeaways are not forced into memory, and when an existing entry conflicts with current code, the Agent updates or removes it in the task PR.

If a task uncovers a confirmed rule or lesson you want to make sure is kept, you can also tell the Agent in an issue comment to remember it long-term.

Memory files are submitted and reviewed with the task PR. During acceptance, open **View changes** to review additions or edits under `.nb-studio/memory/` and remove anything inaccurate, outdated, or redundant (never store secrets, private customer data, or temporary progress). **Once the PR merges**, open the CRM project's **Memory** tab to inspect entries by repository, type, and source commit (an empty list is normal for a newly connected project). Agents automatically read these entries before starting later tasks so the team avoids hitting the same pitfalls again (see [Project memory](../../studio/project/project-memory.md)).

![Inspect project memory by repository and type (shown with a sample project).](/assets/guides/studio/memory.png)

**Done when**: Rules have clear sources, the checklist Skill is attached to the project, lasting experience captured automatically or added during tasks is merged with the code, and the next task receives consistent context.

## Summary and next steps

With business rules, verification checklists, and long-term constraints stored in their respective places, teammates and Agents share a consistent, actionable baseline across handoffs instead of relying on informal reminders.

Next, to run continuous quality checks and triage findings before shipping, continue to [Manage delivery quality](enterprise-management.md); if you are ready to deploy directly, proceed to [Release to production](release.md).
