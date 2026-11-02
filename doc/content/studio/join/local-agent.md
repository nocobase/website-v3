---
title: Use a local Coding Agent
description: Use nb-studio from Claude Code or Codex to read projects, create tasks, and follow results.
---

With `nb-studio`, you can manage Studio from your usual Claude Code, Codex, or other local Coding Agent. The Agent uses the CLI to read tasks and documents, create requests, and add comments. Studio runtimes can execute the development work.

## Install and sign in

1. Open the avatar menu in Studio and choose **Use Studio in your agent**.
2. Copy the setup instructions to your Coding Agent.
3. After it installs the CLI, open the sign-in URL it provides and authorize in your browser.
4. The Agent checks your identity and installs the CLI skill.

![Copy Studio’s setup instructions to your local Coding Agent](https://static-docs.nocobase.com/studio-en-guide-local-agent-20261031.png)

Node.js 24 or later and npm are required. The package comes from your Studio instance and matches its version. The download link expires after 30 minutes; generate another if needed.

`nb-studio` uses your account permissions. Keep the login command running until browser authorization finishes.

## Ask for work

```prompt
List the Studio tasks waiting for me, ordered by urgency.
```

```prompt
Read docs/supplier-rating.md and create tasks in Supplier Management for its requirements. Do not start them yet.
```

```prompt
Find out what is blocking PUR-23 and tell me what information I need to provide.
```

You can also give the Agent a Studio task URL.

## Check the connection

```bash
nb-studio whoami
nb-studio docs
```

`whoami` shows your identity. `docs` lists commands available on the connected server. See [nb-studio commands](../reference/cli.md).

To chat through the Studio browser interface, use a [Runner Agent](runner-agent.md) or [connect your computer](connect-computer.md).
