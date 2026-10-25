---
title: My sessions
description: Follow work by session. Discuss ideas with an agent, look at code, and split work into issues, and the session keeps the issues it created and their progress attached.
---

**My issues** follows work by issue, and **My sessions** follows work by session. A session starts with a discussion: you talk something through with an agent and have it split the work into issues for the agent team. After that, the session keeps those issues and their progress attached, so when you come back to it you can pick up with "how is it going?"

::figure sessions-list | My sessions: the progress bar under each session has one segment per issue, and its color shows the issue's status

Each session in the list shows which project it belongs to and how many issues it has. Each segment of the progress bar is one issue: green is done, purple is in review, blue is in progress, amber is blocked, and gray is backlog. When an issue is waiting for you, "Needs you 1" appears on the right.

## My agent and agent team

A session has two modes, which you switch between at the top right of the agent panel. The difference is who drives the agent:

| | My agent | Agent team |
| --- | --- | --- |
| What it is | The Claude Code, Codex, or other tool you connected to Studio | The agents your team has enabled under **Agent team** |
| How it runs | You choose the computer and directory and talk to it directly. It uses the code, tools, and configuration on that computer | A runtime picks it up and runs it. The runtime may be a team server, or your own personal runtime |
| What you need to set up | Connect your computer (once) | Nothing |
| Good for | Discussing requests against local code and splitting work into issues | Asking questions, looking things up, and splitting work into issues when no computer is connected |

Sessions in both modes are listed in **My sessions**, and only you can see them. The agent in a session works in Studio with your identity and permissions: it creates issues, posts comments, and changes statuses, and it cannot do anything you cannot do.

> [!NOTE] One computer, two uses
> Your computer can join the agent team as a personal runtime and execute issues for you, and it can also be connected as **My agent** so you can talk to it directly in a session. The two are set up separately and do not affect each other.

## Connect your computer

Before you use **My agent**, connect your computer to Studio:

1. Open **My sessions** and click **Connect your computer**.
2. Copy the setup instructions on the page and give them to the coding tool on that computer (such as Claude Code or Codex). It installs the `nb-studio` command line, asks you to confirm the sign-in in your browser, and runs `nb-studio acp service install` so the computer stays connected after it starts up.
3. Back in Studio, confirm that the computer shows as online.

::figure connect-computer | Give the setup instructions to the coding tool on that computer

- Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, OpenCode, and other coding tools are supported. The computer can run macOS, Linux, or Windows.
- By default the agent can access your whole home directory. You can change this to specific directories under **My computers**. The agent's permissions in those directories are the same as when you use it in your own terminal.
- The installation link in the setup instructions is valid for 30 minutes. Generate new instructions when it expires.

## Start a session

1. In **My sessions**, click **New session**, or press <kbd>⌘</kbd> <kbd>J</kbd> on any page (<kbd>Ctrl</kbd> <kbd>J</kbd> on Windows and Linux).
2. Choose a mode. For **My agent**, choose the computer, the agent on that computer, and the directory to work in. For **Agent team**, choose one agent from the team. In both modes you can set the project the session belongs to.
3. Say what you need. You can say several things at once, and you can paste screenshots.

Choose the strongest model you can use, and analysis and issue breakdown will be more accurate.

Click **Ask agent** on an issue page or a project page to start a session with the current page as context.

## Turn a discussion into issues

When things are clear, ask the agent to turn the discussion into issues, for example "create these three things as issues in the Supplier Management project".

::figure req-session | The session lists the issues it created, which you can start directly

- Issues created by a session stay attached to it. The session shows their latest status and a progress bar, and marks the ones waiting for you.
- Select **Start** to hand an issue to the agent team, or **Not now** to leave it in Backlog.
- Type `#` in the input box to mention an existing issue, so the agent can read it, comment on it, or change it as you ask.
- From an issue page you can also go back to the session where it was created.

## Follow a session

- You can filter the session list by **Needs me** and **In progress**. When an agent asks for permission or is waiting for you to confirm, the session is marked, and it counts toward the reminders in the top bar.
- For issues handed off from an **Agent team** session, key progress (a run ending, a block, in review, a failure, a close, or a PR opened) comes back to the session as a card, and the agent summarizes it and suggests the next step.
- Sessions you no longer need can be archived, and restored at any time.
