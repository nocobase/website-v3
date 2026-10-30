---
title: Release to production
metaDescription: Using the device stocktake launch as the example, deploy to the staging environment Studio hosts after merging so the team can try it first, pick this release's issues from those pending release and tag it in the repository, then deploy to your own server with Studio's deployment guide and record the version production runs.
---

Device stocktaking and device retirement are both merged into itam-lite's default branch, but so far they have only run in PR previews. In Part 1, you deployed itam-lite to a server by hand with Docker. Now that the project is in Studio, every step of going live shows on the project's **Releases** page: which environment a change is in, which issues this release includes, and which version production runs.

Studio hosts only the preview and staging environments. Production runs on your own server. Studio doesn't connect to it; it only gives a deployment guide and records the version production runs.

| Stage | Where it runs | When it updates |
| --- | --- | --- |
| Preview | Hosted by Studio | Every PR, already set up in [Bring the project into Studio](bring-into-studio.md) |
| Staging | Hosted by Studio | After every merge, built and deployed by CI |
| Release | The code repository | When you create a tag in the repository that matches a release line |
| Production | Your server | Deploy with the deployment guide, then record the version in Studio |

![The project's Releases page: the Preview, Staging, Release and Production stages, with the issues pending release below](https://static-docs.nocobase.com/20261030-studio-project-releases.webp)

## 1. Deploy to staging after merging

Staging is where the team tries things before they go live. An admin adds hosted environments in **Hosted environments**. See [Deploy environments](../studio/admin/environments.md).

Open the itam-lite project's **Releases** page and click **Deployment guide** in the **Staging** column. Enter `itam-lite-staging` as the app ID, choose the staging environment, then click **Connect CI** in the **Connect CI** row. From then on, the repository's CI builds and uploads an artifact after every merge and deploys it to staging.

![Deploying staging: hand it to an agent, connect CI, or run the commands yourself](https://static-docs.nocobase.com/20261030-studio-staging-deploy.webp)

Once it's connected, merge another PR and staging updates. Ask Xu Ning (the business colleague) to go through the real process on staging: start a stocktake for one location, have someone from IT support check a few devices, end the stocktake, and look at the result and the list of discrepancies. If something is wrong, raise a new issue in Studio.

**Done when**: the **Staging** column on the **Releases** page shows the version running on staging, and Xu Ning has completed one stocktake on staging.

## 2. Look at the issues pending release

**Pending release** at the bottom of the **Releases** page lists issues that are done but not yet released, and the **Where it is** column says whether each is **In staging** or **Not deployed yet**. Before a release, look here to see what will go live. Right now it lists the device stocktake and device retirement issues.

## 3. Set up a release line

A release line decides which tags count as a release, for example `v*`. Open the project's **Settings › Code repositories**, edit **Release lines** for itam-lite, and enter `v*`. Without a release line, the **Release** column asks you to set one up first.

## 4. Tag and publish the release

In the **Release** column, click **How to publish**:

1. Choose the itam-lite repository and the release line `v*`.
2. Under **Based on staging environment**, choose the staging environment you just set up. The target commit is the one running on staging, so what you release is the version Xu Ning tried.
3. You can change the **Suggested tag**, for example to `v1.1.0`.
4. Look at **Included issues** and the issues that aren't included, and confirm that device stocktaking and device retirement are both in.
5. Click **Copy commands** and run them in the itam-lite repository.

![Publishing a release: choose the release line and the staging environment, check the included issues, and copy the tag commands](https://static-docs.nocobase.com/20261030-studio-publish-pending.webp)

Once the tag is pushed, Studio picks it up and updates the included issues.

**Done when**: the repository has the tag `v1.1.0`, the **Release** column shows this version, and device stocktaking and device retirement are no longer listed under **Pending release**.

## 5. Deploy to your server

In the **Production** column, click **Deployment guide**, choose the version `v1.1.0`, and choose **Docker** or **Installer** to suit your server. Part 1 used Docker, so choose Docker.

We recommend **Let your agent deploy it**: copy the prompt to your coding agent. It needs SSH access to the server. It downloads the artifact, builds the image, generates the configuration, backs up the database before upgrading, and finally checks that the app is reachable.

![The deployment guide: choose the version and the method, then give the prompt to your agent](https://static-docs.nocobase.com/20261030-studio-deploy-guide.webp)

When the deployment is done, click **I have deployed it — record as v1.1.0**. The **Production** column shows the version production runs and how many versions it's behind the latest.

> [!NOTE] Your first release in Studio
> While production has no recorded version, the deployment guide gives the commands for a first install. itam-lite was already deployed in Part 1, so when you give the prompt to your coding agent, add: itam-lite is already running on the server, so treat this as an upgrade, back up the database first, and keep the existing configuration and data.

Only the project lead can view the deployment guide and record the deployed version.

**Done when**: itam-lite's production runs `v1.1.0`, the **Production** column records the same version, and the asset manager can start the first quarterly stocktake in production.

## Looking back at Part 2

| | Part 1 | Part 2 |
| --- | --- | --- |
| Who moves the work forward | You and a few local coding agent sessions | The agent team on a shared runtime, around the clock |
| Who raises requests and accepts results | You | Xu Ning, the asset manager, raises requests, answers questions and accepts results directly in Studio |
| Where the background and experience live | Scattered across individual sessions | The knowledge base, skills and project memory |
| How it goes live | You deploy it on the server yourself | Merges go to staging automatically, a tag publishes the release, the deployment guide deploys it to production, and Studio records the version |

**Done when**: device stocktaking has been tried on staging, released as `v1.1.0` and deployed to production, and Studio records the version production runs.
