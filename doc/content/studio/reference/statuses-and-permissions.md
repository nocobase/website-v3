---
title: Task states and permissions
description: Look up task states, common transitions, and the operations available to people and Agents.
---

## Task states

<div class="states" aria-label="Backlog to In progress, In progress and In review can repeat, then Done"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span></div>
<div class="states" aria-label="In progress and Blocked can repeat; unfinished tasks can be canceled"><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span>Unfinished tasks</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>Canceled</span></div>

| State | Meaning |
| --- | --- |
| Backlog | Not started; no automatic execution |
| In progress | The Agent team is working |
| Blocked | Waiting for information, a decision, or recovery |
| In review | Delivered and awaiting owner acceptance |
| Done | Accepted, or all linked PRs merged |
| Canceled | No further work planned |

States are fixed; projects cannot add, remove, or rename them. People with task editing permission can change status. The Lead Agent moves work between In progress, Blocked, and In review. Execution Agents do not change task status.

Use **Start** to hand a backlog task to the Lead Agent. Mentioning an Agent in a comment does not bypass this action.

## Common permissions

| Action | Member default | Admin default |
| --- | --- | --- |
| View and handle tasks | Accessible projects and related tasks | All |
| Project settings and knowledge | Projects they lead | All |
| Delete projects or tasks | Not allowed | Allowed |
| Runtimes | Connect and maintain personal runtimes | Manage shared runtimes |
| Git connections and organization keys | No management access | Management access |
| Invitations and role assignment | Not allowed | Allowed |
| Disable accounts or reset others' passwords | Not allowed | Managed by owners |

Project visibility and business permissions jointly determine access. Custom roles can change the defaults. See [Members and roles](../admin/members-and-roles.md).

## Agent permissions

Agents are limited by both the represented member's permissions and the operations offered to Agents. Task work normally acts for the task owner; conversations act for their requester.

Execution Agents can commit, push branches, and create PRs. They cannot accept tasks, merge PRs, or manage members and roles. Knowledge is read-only; project memory changes are reviewed in task PRs.

Preview publishing also depends on the repository's check source. With Agent self-check selected, an Agent can publish the task PR's preview. See [Checks and CI](../configure/checks.md).
