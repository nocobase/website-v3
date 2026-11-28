---
title: Hosted environments
description: Configure runtime modes, variables, and lifecycle policies for preview and test applications.
---

Administrators add and maintain environments under **Hosted environments**. Each environment serves previews or testing and has its own applications, variables, and runtime policies.

![Runtime modes and policies for previews and testing](https://static-docs.nocobase.com/studio-en-environments-20261111-normal-2x.webp)

## Add an environment

1. Select **Add environment** and enter a name and ID, such as **Staging** and `staging`.
2. Choose its purpose and runtime mode.
3. Set a public URL pattern, such as `https://apps.example.com/{appId}/`. Prepare DNS and certificates when using subdomains.
4. Set application capacity, stop, and dormancy policies as needed. Test the connection and save.

The default in-process mode runs application subprocesses and uses archive artifacts. With Docker hosting enabled, test applications can run in separate containers. This mode requires image artifacts and registry pull access. See [Configuration reference](../reference/config.md).

Deploy production on your own infrastructure rather than creating a production hosted environment here.

## Manage preview applications

Open a hosted environment with the **Previews** purpose to see its PR applications and their runtime states. For one project’s previews, open **Previews** under the project’s **Releases** tab.

![PR previews and their build status](https://static-docs.nocobase.com/studio-en-previews-20261111-normal-2x.webp)

Studio’s built-in preview environment uses the defaults below. Adjust capacity and idle times in the hosted environment settings.

| Condition | Behavior |
| --- | --- |
| No visits for 10 minutes | Stop the process; restart on the next visit |
| No visits for 24 hours | Go dormant and remove extracted files, keeping configuration and data |
| PR merged, closed, or preview destroyed | Delete the preview and its data |

The default capacity is 20 previews. A dormant application takes longer to prepare on its next visit.

Previews run as application subprocesses started by Studio. For team use, configure a separate preview domain and a restricted system user. See [Configuration reference](../reference/config.md).

Hosted applications draw on the same host’s available memory. Before starting an application, Studio checks available capacity and stops an idle application when safe. If none can be reclaimed, the page reports that capacity is full. Retry later or adjust the hosting resources.

## Deliver test applications

Add a test application from its hosted environment or the project's release page, or let CI create it on its first report. The deployment dialog offers an Agent prompt, CI setup, and manual commands.

For continuous test deployments, choose a branch push or tag trigger in the deployment panel and set the target test environment and application directory. Generate a workflow for each trigger. Open the application to inspect deployment history and logs, or to stop, wake, or delete it.

## Configure application environment variables

Values set on an environment apply to all its applications. To change only one test application, set its variables on the application itself. Application values take precedence.

The deployment page lists any missing required variables.

When sample data is enabled for the environment, both initial deployment and redeployment load any outstanding samples. To turn this off for one app, set `APP_SAMPLE_DATA=false` in its variables and select **Apply & restart**.

For example, to connect an inventory test application to PostgreSQL:

1. Prepare a test database the application can reach. Grant its database user the required permissions.
2. In **Releases**, open the test application and select **Variables**. Check which variables the artifact declares and which database drivers the application includes.
3. Enter the connection details. The example below is for an application that reads these variables. Add `DB_PASSWORD` as a secret and enter the password.

   ```dotenv
   DB_DIALECT=postgres
   DB_HOST=db.example.com
   DB_PORT=5432
   DB_DATABASE=inventory_test
   DB_USERNAME=inventory_app
   ```

4. Select **Apply & restart**. Check the startup log for database connection errors. Create a record in the test application, then refresh and read it back.

   ![Apply the variable changes and restart the test application](https://static-docs.nocobase.com/studio-en-app-vars-20261119-6810922c1e.webp)

These values apply to the test application. Migrate any SQLite data you want to keep before switching databases.

## Protected environments and approvals

Enable protection and assign approvers to restrict test deployments. Members with deployment access can submit a request. Another approver reviews the application and artifact in the inbox. An eligible approver can deploy directly. Agent runs use the initiating member’s access. Approvals require a person.

## Roll back

Choose a previous deployment from the application history, or use `nb-studio app rollback`. The environment’s approval rules also apply to rollbacks.

Rollback does not restore the database. Back up test data before deployment when it must be preserved. Studio recalculates task deployment marks without automatically changing task status.
