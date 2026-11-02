---
title: Connect your computer
description: Use coding tools on your own computer through My Agent in Studio.
---

Connect your computer to talk to its coding tools through **My Agent** in Studio. The tools work in the local folders you allow.

To manage Studio from a terminal, use [nb-studio](local-agent.md). To have a machine pick up queued development tasks, [connect a runtime](personal-runtime.md).

## Connect

1. Install and sign in to a coding tool, such as Claude Code or Codex, on the computer.
2. Open **My sessions** in Studio and select **My Agent**.
3. Select **Connect your computer** and give the setup instructions to a Coding Agent on that computer.
4. Complete browser sign-in at the address the Agent provides.
5. Return to **My computers** and check the connection and available tools.

![Connect a computer to use its coding tools through My Agent](https://static-docs.nocobase.com/studio-en-guide-connect-computer-20261031.png)

Setup installs `nb-studio` and a background connection service. It requires Node.js 24 or later and supports macOS, Linux, and Windows. Download links expire after 30 minutes; generate another if needed.

## Choose allowed folders

Set allowed folders in **My computers**. The default is your entire home directory; you can restrict it to specific work folders. When starting a session, select the folder and coding tool to use.

The Agent has the access of the system user running it. Use a separate user or virtual machine when projects need isolation.

## Handle disconnections

A sleeping or powered-off computer cannot continue a session. Restore its network and background service, then check the session status. Closing the browser does not stop execution on the computer.

When retiring a computer, remove it from **My computers** and ask your local Agent to uninstall the background service. Existing session records remain available.
