---
title: Manage deployment environments
description: Configure runtime modes, access URLs, and deployment rules for hosted child applications, and check and maintain their environments.
---

A deployment environment determines how hosted child applications run, where users access them, and whether deployment requires approval. You select an available environment when creating application templates and instances. Several child applications can share one environment.

## Add a deployment environment

First enable child application hosting in the main application by following the [Quickstart](quickstart.md#configure-and-start-the-main-application). Then sign in with an account that can manage environments and open **Deploy environments**.

![The environment list shows runtime modes, application counts, and public URL patterns](/assets/core/multi-app/environment-list.png)

1. Click **Add environment** and enter a name and unique identifier. You can change the name later, but not the identifier.
2. Select the environment's intended purpose and a runtime mode available in the current main application.
3. Set **Public URL pattern**, using `{appId}` for the child application's identifier. For example, with `https://apps.example.com/{appId}/`, an instance identified as `customer-demo` uses the `/customer-demo/` path.
4. Click **Test connection** and save after the check passes.

![Environment settings include the name, runtime mode, and public URL pattern](/assets/core/multi-app/environment-settings.png)

The URL must be accessible from users' browsers. When applications share a domain, the reverse proxy must forward both main and child application paths to the main application's entry point and support WebSocket connections. Do not use an internal control port as the public access URL.

<details>
<summary>Use HTTP locally or on a private network</summary>

Single sign-on uses HTTPS by default. To use HTTP in a controlled environment, explicitly allow the child application's origin in the main application's `config.yml`, for example:

```yaml
sso:
  insecureRedirectOrigins:
    - http://127.0.0.1:13510
```

Replace this with the actual scheme, host, and port, without an application path or wildcards. Run `pnpm nocobase config check` and restart the main application before deploying or connecting the child. Configure this exception in the main application for independently deployed children too; no separate switch is needed in the child.

</details>

## Check environment availability

Click the environment name, then **Check** on its details page. Use the results to resolve connection or runtime dependency problems. Successfully creating an environment does not mean its connection check has passed.

The **Overview** tab shows the public URL pattern and application runtime states. If a deployment fails, first confirm that the environment check passes, then inspect the instance's [deployment history](management.md#update-configuration-and-manage-runtime-state) for the cause.

## Update runtime and deployment settings

Open **Settings** on the environment details page, make your changes, and save:

| Setting | When to use it |
| --- | --- |
| Protected | Require approval from a designated approver before each deployment runs |
| Application limit | Limit the number of applications the environment can hold |
| Stop or hibernate after inactivity | Set a default idle policy for applications without their own runtime policy |
| Load sample data on first deployment | Enable only in environments that need demonstration data, not in production business environments |

![Environment settings for deployment approval, application limits, and idle policies](/assets/core/multi-app/environment-policy.png)

After changing the public URL pattern, check affected applications' actual entry URLs and sign-in callbacks. Changing the pattern does not automatically migrate existing applications to a new domain. Before deleting an environment, handle the applications it contains; deleting the environment is not a substitute for stopping an individual child.

When maintaining the main application or recreating its container, preserve its configuration, database, and `storage/` directory. These hold deployment archives and records as well as hosted instances' data and private configuration. Back up external databases and file storage separately for children that use them. For deployment and backup guidance for the main application itself, see the [application deployment guide](../../deployment/choose-a-deployment-method.md).
