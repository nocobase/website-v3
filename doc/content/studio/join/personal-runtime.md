---
title: Connect a personal runtime
description: Connect your own coding tools and capacity for work performed on your behalf.
---

A personal runtime uses your signed-in coding tools and subscriptions. It runs work on your behalf. Use it to add capacity or make another model available for your tasks.

## Prepare

Follow [Prepare a machine](../setup/shared-runtimes.md#prepare-a-machine) to install dependencies and sign in to coding tools. Use a separate container or virtual machine, isolated from Studio.

## Add the runtime

1. Open **Agent management › Runtimes** and select **Add runtime**.
2. Keep **Personal** as the usage scope and select installed coding tools.
3. Set concurrency to match the machine and your subscription limits.
4. Generate the install command, select the operating system, and give the prompt to a Coding Agent in that environment.

The command carries a single-use credential. Generate another if it expires. See [Install on the machine](../setup/shared-runtimes.md#install-on-the-machine).

![A personal runtime shows its owner, connectivity, and available coding tools](https://static-docs.nocobase.com/studio-en-guide-personal-runtime-20261031.png)

## Check the connection

The runtime should show **Personal** and **Online**, with selected tools **Signed in**. Once a corresponding Agent is enabled, **Where it runs** includes this runtime.

## Eligible work

- Task steps performed on your behalf and Runner Agent conversations you start.
- An Agent available only on a personal runtime serves only that runtime's owner.
- Work using variables restricted to shared runtimes cannot use a personal runtime.

If another member requests work on your task that would use your personal runtime, Studio asks you to confirm. See [Personal runtime requests](../use/answer.md#personal-runtime-requests).

## Manage the runtime

Open its details to change its name, concurrency, or available tools. Only its owner can edit a personal runtime. An administrator can make it shared when needed.

Pause or resume work on the machine:

```bash
nocobase-runner stop
nocobase-runner start
```

To retire it, revoke its credential before deleting it. Run history remains. Run `nocobase-runner uninstall` on the machine to remove the service. See [Runtime configuration](../configure/runtimes.md).
