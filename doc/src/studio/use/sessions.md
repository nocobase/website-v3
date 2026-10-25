---
title: My sessions
description: My issues follows work issue by issue, and My sessions follows it session by session. A session starts as a conversation in which you and an agent get something clear, and the agent turns it into issues for the agent team. The session keeps those issues and their progress attached, so you can come back and ask how it's going.
---

::figure sessions-list | My sessions: the bar under each session has one segment per issue, colored by its status

Each session in the list shows its project and how many issues it has. Each segment of the bar is one issue: green for done, purple for in review, blue for in progress, amber for blocked, and gray for backlog. Sessions with issues waiting on you are marked.

Only you can see your sessions. The agent in a session acts in Studio with your identity and permissions, for example when it creates issues or posts comments, and can't do anything you can't.

## Who you talk to

The session panel has two modes:

| | My sessions | Runner Agent |
| --- | --- | --- |
| Who | Your own agent, such as Claude Code or Codex | An agent from the agent team, run by a runtime |
| What it can see | The code, tools, and configuration in the folders you allow | The repositories on the runtime |
| Setup | [Connect your computer](../join/connect-computer.md), once | None |
| Good for | Discussing a request alongside the code you have and turning it into issues | Asking questions, looking things up, and turning a request into issues |

Sessions in both modes are listed in **My sessions**.

## Start a session

1. In **My sessions**, click **New session**.
2. Choose a mode. For **My sessions**, choose your agent and a working directory. For **Runner Agent**, choose an agent from the team. In either mode you can set the project the session belongs to.
3. Say what you want to do. You can cover several things at once and paste screenshots.

When discussing requests, pick the most capable model so the request is understood correctly.

On an issue or project page, click **Ask agent** to start a session with the current page as context.

## Turn the discussion into issues

Once things are clear, ask the agent to turn the discussion into issues, for example "Create issues for these three things in the Supplier Management project."

::figure req-session | The session lists the issues it created, ready to start

- Issues created in a session stay attached to it, and the session shows their latest status and progress.
- Click **Start** to hand them to the agent team, or **Not now** to leave them in **Backlog**.
- Mention an existing issue with `#` in the input box to have the agent read it, comment on it, or change it as you ask.
- From an issue page you can also go back to the session that created it.

## Follow your sessions

- Filter the session list by **Needs you** or **In progress**. A session is marked when the agent asks for permission or waits for your confirmation.
- When issues from a session reach a milestone with the agent team, such as a run finishing, the issue being blocked, ready for review, failed, or closed, or a PR being opened, a card comes back into the session, and the agent sums it up and suggests what to do next.
- Archive sessions you no longer need, and restore them any time.
