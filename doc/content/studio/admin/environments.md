---
title: Hosted environments
description: Configure runtime modes, variables, and lifecycle policies for preview and test applications.
---

Administrators add and maintain environments under **Hosted environments**. Each environment serves previews or testing and has its own applications, variables, and runtime policies.

![Runtime modes and policies for previews and testing](https://static-docs.nocobase.com/studio-en-guide-environments-20261031.png)

## Add an environment

1. Select **Add environment** and enter a name and ID, such as **Staging** and `staging`.
2. Choose its purpose and runtime mode.
3. Set a public URL pattern, such as `https://apps.example.com/{appId}/`. Prepare DNS and certificates when using subdomains.
4. Set application capacity, stop, and dormancy policies as needed. Test the connection and save.

The default in-process mode runs application subprocesses and uses archive artifacts. With Docker hosting enabled, test applications can run in separate containers. This mode requires image artifacts and registry pull access. See [Configuration reference](../reference/config.md).

Deploy production on your own infrastructure rather than creating a production hosted environment here.

## Deliver test applications

Add a test application from the project's release page, or let CI create it on its first report. The deployment dialog offers an Agent prompt, CI setup, and manual commands.

Use branch-push CI for continuous testing; see [Checks and CI](../configure/checks.md). Application details provide deployment history, logs, stop, wake, and delete actions.

## Configure variables

Environment values apply to all its applications. Application-specific values take priority. Deployment stops when required variables are missing and lists what to set. After changing values, apply them and restart the application.

Secrets are encrypted and hidden after saving. Application variables are separate from [Agent run variables](../project/settings.md#agent-run-variables).

## Protected environments and approvals

Enable protection and assign approvers when test delivery needs approval. Deployments and rollbacks become requests. An approver checks the application and artifact in the inbox before approving. API keys can submit requests; Agents cannot deploy to protected environments.

## Roll back

Choose a previous deployment from the application history, or use `nb-studio app rollback`. Protected environments still require approval.

Rollback does not restore the database. Back up test data before deployment when it must be preserved. Studio recalculates task deployment marks without automatically changing task status.
