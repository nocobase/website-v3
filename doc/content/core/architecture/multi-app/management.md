---
title: Manage hosted applications
description: Create child application instances from templates, grant workbench access, and manage configuration, runtime state, and versions.
---

An application instance is a running child application. A single customer management template can create several instances, each with its own access URL, data, configuration, and running version. The main application manages them centrally.

## Create an instance and grant access

Prepare a [published template version](templates.md#publish-and-maintain-versions) and an [available deployment environment](environments.md). In the main application:

1. Open **Templates**, open the template details, and click **Create instance**. You can also create an instance from **Application instances → Hosted applications**.
2. Enter a name and unique identifier, then select the template version and deployment environment. The identifier becomes part of the application's path, cannot be changed after creation, and must not conflict with the main application's `main` path.
3. Submit and wait for deployment to finish. If the environment requires approval, an approver must approve it first. Open the instance details and confirm that **Current version** is correct and **Runtime state** is running.

![Select a template version and deployment environment to create an independent instance](/assets/core/multi-app/create-instance.png)

The main application automatically configures single sign-on for new instances. You do not need to enter the identity service URL, client identifier, or secret manually. The child itself must have [platform sign-in integrated](templates.md#prepare-a-child-application-archive) before it is packaged.

After deployment succeeds, an administrator with full permissions in the main application opens the instance's **Access** tab, clicks **Add users**, and selects users with view or edit permissions.

![Grant selected users access to the child application](/assets/core/multi-app/instance-access.png)

Main application administrators also need access to the instance. The child maps view and edit permissions to specific business permissions; neither grants child administrator privileges. To add single sign-on to an existing instance, first click **Register platform sign-in** on this page, then upgrade to a version that supports it.

## Open and switch applications from the workbench

After a user signs in to the main application, the workbench shows the applications they may access. Click an application card to open the child. While the main application's sign-in session remains valid, no password is needed again.

![The workbench shows applications available to the current user](/assets/core/multi-app/workbench.png)

Inside a child application, click the switcher beside the application name to open another authorized application or select **Back to workbench**.

![Switch from customer management to expense management or return to the main application's workbench](/assets/core/multi-app/app-switcher.png)

If an application is missing from the workbench, check the user's access and the instance's runtime state. If the child has no switcher, check that its deployed version includes the application-switching component. Granting access alone does not add that component to the page.

## Update configuration and manage runtime state

Open **Application instances** and click an application name to view its details. The overview shows the actual runtime state, current version, and environment. The action menu in the upper-right corner provides configuration, upgrade, start, and stop options.

![Instance details show the current version, runtime state, and available actions](/assets/core/multi-app/instance-actions.png)

- **Update configuration:** select **Configure**, change the display name and default language, and enter the instance identifier as prompted to confirm. This does not change database connections or sign-in secrets.
- **Stop or start:** select **Stop** for a running instance and **Start** after it has stopped. Stopping preserves data; it does not delete the application. To restart, wait for stopping to finish before starting again.
- **Check results:** review execution status in **Deployment history** and **Operation history**. If an operation fails, open its record and address the reported problem before deciding whether to retry. Avoid creating duplicate instances.

![Change the instance display name and default language](/assets/core/multi-app/instance-configure.png)

If single sign-on is unavailable, an administrator with the required permissions can view the initial administrator credentials under **Access** and use the child's local sign-in to recover access. This shows the initial credentials, not a password changed afterward.

## Upgrade, archive, and restore instances

**Upgrade an instance:**

1. [Publish a new version](templates.md#publish-and-maintain-versions) in the original template.
2. Back up the instance's database, attachments, and private configuration, and record its current version.
3. Select **Upgrade** from the instance's action menu, choose the target version, confirm that a backup is available, and submit.
4. Wait for deployment to finish, check the current version, and open the child to verify existing data and new features. Instances you did not select remain on their previous versions.

![Choose a version and confirm a recoverable backup before upgrading an instance](/assets/core/multi-app/instance-upgrade.png)

**Archive an instance:** stop it first, then select **Archive** from its action menu. Archiving preserves data and configuration but removes the application's entry from users' view.

**Restore an instance:** filter the instance list to show archived applications and select **Restore**. Once restoration finishes, start the instance and check its existing data and user access.

Restoring an archived instance is not the same as restoring a data backup. Before reverting to an older version, confirm that the old code is compatible with the current database. Switching code versions does not undo database migrations that have already run.
