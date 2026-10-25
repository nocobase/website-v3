---
title: Deploy environments
description: Deploy environments decide where apps are deployed, how people reach them, and who can deploy. The preview environment holds each PR's preview, staging is for the team to try things out, and every deployment to a protected production environment needs an approver's sign-off.
---

Admins manage deploy environments in **Releases › Deploy environments**. Each environment has its own set of apps, so changing one environment doesn't affect the apps in another.

| Environment | Where it comes from | What it's for |
| --- | --- | --- |
| Preview | Created automatically when Studio is installed | Each PR's preview, to try the change yourself before accepting it |
| Staging | Added by an admin | Deployed automatically after merges, for the team to try before release |
| Production | Added by an admin. Studio never creates it for you | The business system in real use. Every deployment needs approval |

## Two run modes

When you add an environment, choose its run mode first. You can't change it afterwards:

| Run mode | Where apps run | Good for |
| --- | --- | --- |
| In process | On Studio's server, with no Docker needed. Apps start on first visit and stop when nobody is using them | Previews |
| Docker | In Docker on Studio's server, one container per app, isolated from each other | Staging and production |

In Docker mode, a deployment pulls the image by the version's digest and starts the new container first, switching traffic over only after it passes its health check. If the new version never becomes healthy, the old container keeps serving and the deployment fails. A rollback deploys the earlier image the same way.

Before using Docker mode, turn it on in Studio's `config.yml` (`releases.docker.enabled`), and make sure the user that runs Studio can access Docker.

## Add an environment

1. Open **Releases › Deploy environments**, click **Add environment**, and choose the run mode.
2. Enter a name and an environment ID, such as "Staging" and `staging`. The environment ID appears in addresses and can't be changed once created.
3. **Public URL pattern**: where people open an app in this environment, with `{appId}` standing for the app, such as `https://apps.example.com/{appId}/`.
4. For Docker, choose the **Registry** that CI pushes images to, or add one with its address and pull credentials.
5. Set the policies described in the next section.
6. Before saving, click **Test connection** to make sure it connects.

Under apps, you can set how many apps the environment holds at most, and how long an unused app waits before it stops and before it goes dormant. A stopped app frees its memory and starts again on the next visit. A dormant app also has its unpacked files removed, keeping its configuration and data, so it takes longer to prepare on the next visit.

## Protected environments and approvers

Turn on **Protected**, and every deployment to the environment, whether a person, an agent, or CI starts it, and including rollbacks, becomes a deployment request waiting for an approver. To approve, the approver types the app ID once more.

Approvers can be:

- Project leads: the lead of the project that owns the repository of the app being deployed.
- Admins: owners and admins.
- Specific people.

Any one approver's approval is enough, and nobody can approve their own request. If no approvers are chosen, admins decide. For what approvers do, see [Approve releases and roll back](../project/release.md).

> [!WARNING] Back up production first
> Studio doesn't back up the app's database before deploying. Back up your production databases regularly yourself.

## The preview environment

The preview environment is created automatically when Studio is installed. It runs in process and isn't protected. By default it runs at most 20 previews at a time, and a preview stops after 10 minutes without visitors and goes dormant after 24 hours.

- A preview loads sample data and generates a first administrator on its first deployment. It never contains your company's real data.
- When a PR is merged or closed, its preview is deleted automatically.
- When a preview is missing a variable, the preview area on the issue page lists what's missing. Anyone who can manage environments can set it for the whole preview environment, and every preview uses it from then on.

For real use, give previews their own domain rather than sharing Studio's address, and run previews as a different system user that can't read Studio's configuration. See [Configuration options](../reference/config.md).

## Environment variables

Variables that deployed apps read can be set on an environment, for every app in it, or on a single app. The app's own variables take precedence. Secrets are encrypted and never shown again.
