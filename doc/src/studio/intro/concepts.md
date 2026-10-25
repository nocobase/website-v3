---
title: Core concepts
description: The people in Studio, requests and issues, projects and repositories, agents and runtimes, skills, the knowledge base, project memory, previews and deploy environments, and how they fit together.
---

<figure class="map" aria-label="Studio's core concepts and how they relate">
<div class="row"><div class="box human"><b>People</b><span>Issue owners, project leads, and admins: raise requests, answer questions, accept results, and approve releases</span></div></div>
<div class="down">Requests become issues</div>
<div class="row"><div class="box brand"><b>Issues</b><span>Belong to a project, with the code in the project's repository</span></div></div>
<div class="down">The coordinator agent assigns them</div>
<div class="row c2"><div class="box agent"><b>Agent team</b><span>The coordinator agent hands out the work, and worker agents design, build, test, and review</span></div><div class="box"><b>Runtimes</b><span>Team servers and members' machines, where the agents work</span></div></div>
<div class="down">Read before working, written back with what they learn</div>
<div class="row"><div class="box"><b>Skills · Knowledge base · Project memory</b><span>How work gets done · Business documents · What agents have learned</span></div></div>
<div class="down">Deployed after merging</div>
<div class="row"><div class="box"><b>Deploy environments</b><span>Previews · Staging · Production</span></div></div>
</figure>

## People

| Role | Who | What they do |
| --- | --- | --- |
| Issue owner | One per issue, by default the person who raised the request | Answers the agents' questions and accepts the result |
| Project lead | One per project | Manages the project's settings, skills, and knowledge base, and usually approves releases too |
| Admin | Anyone with the **Admin** or **Owner** system role | Connects shared runtimes, enables agents, and manages members, deploy environments, and system settings |

Every member has a system role, **Member**, **Admin**, or **Owner**, or a custom role. See [Members and roles](../admin/members-and-roles.md). Issue owner and project lead aren't system roles, and any member of the team can be one.

## Requests and issues

People raise requests. You can talk a request through with an agent in **My sessions** first and have the agent turn it into issues, or fill in an issue directly. Issues go into projects and are the unit of work in Studio.

Every issue has:

- **An owner**: the person responsible for the result. Agents go to the owner when a person has to decide, and hand the finished work to the owner for acceptance.
- **An executor**: once the issue is started, the executor is the coordinator agent, which has worker agents do the work. A member can also work on an issue themselves.
- **A project, priority, labels, and a due date**: runtimes pick up work for urgent issues first.
- **Sub-issues and blockers**: an issue doesn't start until its blockers are done, then carries on by itself.

Every issue is in one of these six statuses:

<div class="states" aria-label="Issue statuses"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span><span class="st-pill"><span class="si cancel"></span>Cancelled</span></div>

| Status | Meaning |
| --- | --- |
| Backlog | Not started yet. Agents leave it alone |
| In progress | The agent team is working on it |
| Blocked | Waiting for the issue owner to decide something |
| In review | Delivered, waiting for the issue owner to accept it |
| Done | Accepted. An issue moves to Done on its own once all its linked PRs are merged |
| Cancelled | No longer needed |

People can move an issue to any status. The coordinator agent moves issues only between In progress, Blocked, and In review, and worker agents never change the status.

## Projects and repositories

A project keeps related issues and code together. When you create a project, you can create a new repository, choose an existing one, or add one later. A new repository is initialized from the NocoBase app template by default, which gives you an app built on Core. You can also initialize it from a prompt, or leave it empty.

- A new project's first issue is "Initialize project", and the project's other issues wait until it is done.
- Studio reaches repositories on GitHub, GitLab, or Gitee through the Git connections an admin adds. Once members connect their own Git accounts, the PRs agents open for them and the merges they make in Studio are done under their own names.
- Worker agents use branches named `agent/<issue key>` by default, and PRs from these branches are linked to their issues automatically.

> [!NOTE] Protect branches on your code host
> Studio doesn't protect branches for you. Turn on protection rules for the default branch on GitHub, GitLab, or Gitee.

## Agents and runtimes

A runtime is a machine where agents work: a team server, a virtual machine, or a member's own machine. A runtime reports the coding tools and models that are installed and signed in there, and each coding tool and model pair is an agent, such as Claude · Opus 5.5. Once an admin writes what it is **Good at** and enables it, it joins the agent team as a worker agent. The coordinator agent is built into Studio, and an admin picks one of the enabled agents for it to run on.

| | Shared runtime | Personal runtime |
| --- | --- | --- |
| Who connects it | An admin | Any member |
| Whose work it runs | Everyone's | Only the work its owner starts |
| Good for | Team servers that are online all day | A member's own machine, with their own coding tools and subscriptions |

To see how the agent team divides the work and moves many issues at once, read [How the agent team works](agent-team.md).

> [!WARNING] A runtime is not a security boundary
> On a runtime, agents work as the system user that runs `nocobase-runner` and can read and write everything that user can reach. Run it under a dedicated system user, in a container, or in a virtual machine.

## My issues and My sessions

Every member has two ways to keep track of work:

| | My issues | My sessions |
| --- | --- | --- |
| Organized by | Issue | Session |
| What's in it | Issues you own, are working on, or follow, with anything waiting on you at the top | Your conversations with agents, the issues created in each session, and their progress |
| Good for | Handling the decisions waiting on you each day: answering questions and accepting results | Talking a request through before it's clear, and following the issues from one session in one place |

::figure my-tasks-list+sessions-list pair | Left: My issues, organized by issue. Right: My sessions, organized by session

In a session you can talk to your own agent or to an agent from the agent team. See [My sessions](../use/sessions.md). Only you can see your sessions. Whoever you talk to, the agent in the session acts in Studio with your identity and permissions, for example when it creates issues or posts comments.

## Skills, the knowledge base, and project memory

Skills, the knowledge base, and project memory keep methods and experience with the team. Agents read them before they start, so a new person or agent can pick up where the last one left off, and you don't have to explain the background again for every new request.

| | What it holds | Who writes it | Where |
| --- | --- | --- | --- |
| Skills | How work gets done: how to split it into steps, write a plan, build, review, and write a delivery report | Studio comes with a few, and your team can add its own, for everything, one project, or one working directory | **Agent management › Skills** |
| Knowledge base | Business documents: business rules, product notes, technical conventions | People write and upload it. Agents only read it | **Development › Knowledge** |
| Project memory | What agents learn on the job: approaches a person corrected or confirmed, pitfalls, decisions the code doesn't explain | Agents write it themselves, and it is reviewed and merged with the issue's PR | **Development › Project memory**, stored in the repository under `.nb-studio/memory/` |

## Previews and deploy environments

Once the repository's CI is connected to Studio:

- Every PR gets a preview with sample data and a generated admin account, so you can try the change yourself when you accept it.
- After a merge, CI deploys the change to staging, and the issue shows which environments it has reached.
- Every deployment to a protected environment, usually production, needs an approver's sign-off. If something goes wrong, you can roll back to the previous version.

See [Connect CI](../setup/ci.md) and [Deploy environments](../admin/environments.md).

## Permissions

What a member can do depends on their role. Agents work on behalf of the person who started the work and never have more permissions than that person. The coordinator agent and every step it arranges act on behalf of the issue owner. Only people can merge PRs, approve deployments to protected environments, and manage members. See [Issue statuses and permissions](../reference/statuses-and-permissions.md).
