---
title: Talk to a Runner Agent
description: Discuss requirements, inspect project code, and create tasks from a conversation in Studio.
---

A Runner Agent combines a coding tool and model on a runtime. In **My sessions**, talk to it directly to clarify requirements, inspect project code, or follow tasks.

Your team needs an online [runtime](../configure/runtimes.md) and an enabled [Agent](../configure/agents.md).

## Start a conversation

1. Open **My sessions**.
2. Create a conversation and choose an Agent.
3. To inspect project code, select the project before sending the first message.
4. Send your question.

```prompt
Explain how supplier scores are calculated in this project. Read the existing rules without changing any code.
```

The project is fixed after the first message. Start another conversation for a different project. The Agent prepares the selected project's code. You can send text, images, and attachments; messages sent during a run are queued.

![Discuss requirements with a Runner Agent and follow linked tasks](https://static-docs.nocobase.com/studio-en-req-session-20261111-normal-2x.webp)

## Turn a discussion into a task

```prompt
Create a task for the scoring changes we agreed on, but do not start it yet.
```

The created task appears in the conversation. Check the requirements, then select **Start** for the Lead Agent to arrange execution. Use `#task-identifier` to link existing work.

Conversations are private by default. Sharing gives selected members a read-only snapshot; share again to include later messages. The Agent acts with your permissions. Linked tasks follow project permissions.

## Change Agents or runtimes

- **Change Agent**: finish the active run and handle queued messages first. Conversation history and linked tasks remain.
- **Runtime offline**: wait for it to reconnect or select **Switch runtime**. The new runtime receives conversation history; unpushed edits stay on the original machine.
- **No Agent available**: check runtime connectivity, coding-tool sign-in, and whether the Agent is enabled.

Conversations can inspect and change a project. Explicitly request a push or PR when needed. Turn formal requirements into tasks for team tracking and [acceptance](../use/accept.md).
