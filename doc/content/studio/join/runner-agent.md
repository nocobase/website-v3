---
title: Talk to a Runner Agent
description: Choose a Runner Agent in Studio to discuss requirements, inspect a project, and turn a discussion into tasks.
---

A Runner Agent is a coding tool and model available on a runtime. Talk to it directly in Studio to discuss requirements, inspect a project, or follow tasks.

Your team needs an online [runtime](../configure/runtimes.md) and an enabled [Agent](../configure/agents.md). With a shared runtime, you do not need to connect your own computer.

## Start a conversation

1. Open **My sessions** and switch to **Runner Agent**.
2. Create a conversation and choose an Agent.
3. For project-specific work, select the project before sending the first message.
4. Send a request. For example:

   ```prompt
   Explain how supplier ratings are calculated in this project. Describe the current rules without changing the code.
   ```

The Agent works on the runtime. Replies and execution progress stay in the conversation. Continue with questions or add images and attachments.

## Turn a discussion into a task

Once the requirement is clear, ask the Agent to create a task:

```prompt
Turn the supplier rating changes we agreed on into a task. Don't start it yet.
```

Linked tasks appear beside the conversation. Review the requirement and select **Start** for the coordinator to arrange execution. Follow progress and answer questions from the same conversation.

Use **Link task** to include an existing task. Conversations are private to you; tasks are shared according to project permissions.

## Continue or adjust the conversation

- **Change Agent:** finish or stop the current execution and handle queued messages first. The conversation history and linked tasks are preserved.
- **Offline runtime:** messages wait for the original runtime to return. **Switch runtime** sends conversation history to another eligible machine; files in the old working directory are not moved.
- **No available Agent:** ask an administrator to check runtime status, coding-tool sign-in, and enabled Agents.

When work is delivered, [accept the result](../use/accept.md) and merge the change.
