---
title: Connect a runtime
description: Connect one shared runtime so coding tools can execute team tasks.
---

A runtime is the machine where Agents work. An administrator connects one shared runtime for the team. One machine is enough to start.

## Prepare a machine

- macOS or Linux; use WSL on Windows.
- Node.js 24 or later, pnpm 11 (`npm install -g pnpm@11`), Git, and GitHub CLI (`gh`).
- At least one coding tool installed and signed in as the system user running the runtime.
- Access to Studio, GitHub, model services, and package registries.
- Chromium and its system dependencies for tasks that verify the application UI.

Confirm that your coding tool can respond in the terminal.

> [!NOTE] Use a dedicated environment
> We recommend installing the coding tools and runner in a separate container or virtual machine, isolated from Studio. Agents can read and write files accessible to the runtime's system user and run commands.

## Add a shared runtime

1. Open **Agent management › Runtimes** and select **Add runtime**.
2. Select **Shared**.
3. Select the coding tools installed on this machine.
4. Set maximum concurrency to 1 for the first setup.
5. Generate the installation command and select the operating system.

## Install on the machine

Copy the installation prompt to your local Coding Agent, or run the installation command as the user who signed in to the coding tools.

The command downloads `nocobase-runner` and `nb-studio` from your Studio instance, registers the runtime, and installs its background service. It includes a short-lived, single-use credential. Generate another if it expires; do not share the complete command.

![Install the runner with the generated command; the credential is hidden](https://static-docs.nocobase.com/studio-en-setup-runtime-install-20261030.png)

## Confirm the runtime is online

Return to the runtime list and wait for **Online**. Open its details and check that the selected coding tools show **Signed in**. Install or sign in to any tools that need attention, then detect them again.

![The shared runtime is online and its coding tools are signed in](https://static-docs.nocobase.com/studio-en-setup-runtime-online-20261030.png)

Next, [configure Agents](agents.md). See [Runtime configuration](../configure/runtimes.md) for troubleshooting, upgrades, and disabling a runtime.
