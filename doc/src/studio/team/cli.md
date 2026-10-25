---
title: Using Studio in the terminal
nav: In the terminal
description: Install the nb-studio command line so the Claude Code or Codex in your terminal can look up projects, create tasks, and analyze problems for you.
---

`nb-studio` is Studio's command line. Once it is installed and you are signed in, the Claude Code, Codex, or other tool you use in your terminal can work in Studio as you: look up tasks, create tasks, post comments, and read the knowledge base.

It differs from **My agent** in [My sessions](sessions.md): **My agent** is talking to the agent on your computer inside the Studio page, while `nb-studio` stays in the terminal and lets an agent operate Studio through the command line. You can use both at the same time, and connecting a computer also installs `nb-studio`.

## Install and sign in

1. Click your avatar at the top right of Studio and choose **Manage Studio with a local Coding Agent**.
2. Copy the setup instructions the page generates and give them to the coding tool you usually use (such as Claude Code or Codex).
3. The agent follows the instructions and does these things:
   - Checks for Node.js 24 or newer and npm, and asks your permission before installing anything that is missing.
   - Downloads and installs `nb-studio` from your Studio.
   - Runs `nb-studio login --server <Studio address>`, tells you the sign-in URL and code, and waits for you to confirm in the browser.
   - Runs `nb-studio whoami` to confirm your identity, and `nb-studio docs` to learn the available commands.
   - Runs `nb-studio skills install` to install the skill for using `nb-studio` in your coding tool.

The installation link in the setup instructions is valid for 30 minutes. `nb-studio` is installed only from your own Studio, so its version stays in step with Studio.

> [!NOTE] Same permissions as you
> `nb-studio` works as you, and the commands it can use depend on your permissions in Studio. Signing in needs your confirmation in the browser.

## What you can ask it to do

Once it is installed, tell the coding tool what you want in plain language, and it calls `nb-studio` to do it. A few examples:

```text
https://studio.example.com/main/issues/PUR-23
Help me analyze where this task is stuck and how to handle it. Analysis only, no changes.
```

```text
Look at which tasks in Studio are waiting for me, and list them by urgency.
```

```text
Read docs/supplier-rating.md, split the requirements in it into tasks, and create them in the "Supplier Management" project. Do not start them yet.
```

```text
Find the purchase approval policy in the knowledge base and tell me who must approve an order to a tier C supplier.
```

## Common commands

You usually do not need to type commands yourself, but knowing a few helps you follow what the agent is doing:

| Command | What it does |
| --- | --- |
| `nb-studio whoami` | The identity you are signed in as, and its permissions |
| `nb-studio docs` | A description of the available commands |
| `nb-studio <command> --help` | Detailed usage for a command |
| `nb-studio issue get <task>` | Read a task |
| `nb-studio issue progress <task>` | What the task is waiting on right now |
| `nb-studio issue comment add <task>` | Post a comment on a task |
| `nb-studio follow-up list` | The tasks you own and follow, and what each is waiting on |
| `nb-studio kb read <document>` | Read a knowledge base document |

For the full list of commands, see [nb-studio commands](../reference/cli.md).
