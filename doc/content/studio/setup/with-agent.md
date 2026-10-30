---
title: Install and configure with an agent
description: Use a local Coding Agent to deploy Studio and initialize your first project.
---

## Ask your agent

Give your local Coding Agent the following request, replacing the server and project details:

```prompt
Read https://docs.nocobase.com/studio/setup/with-agent/ and its linked deployment steps. Install an empty NocoBase Studio on my server at https://studio.example.com/main/.

Connect my GitHub organization, create a private repository for “Supplier Management,” and initialize it with the NocoBase application template. Connect the prepared runtime and coding tools, and configure the agent team. I want to be able to add business tasks when setup is complete.

The image and server access are ready. Tell me when I need to authorize access or sign in through the browser.
```

Mention any existing database or reverse proxy so the agent can use your setup.

## Prepare the details

| Item | What to provide |
| --- | --- |
| Deployment | The local machine or accessible server, installation directory, and Studio URL |
| Studio image | [Contact us](https://www.nocobase.com/contact/) for this commercial product and follow the supplied access instructions |
| Code host | GitHub, and the target account or organization |
| Runtime | The machine that will execute tasks and its installed, signed-in coding tools |
| Storage and email | A persistent local directory or private object storage, plus sender accounts for invitations and password resets |
| First project | A project name and the name of a new repository |

Provide credentials through a credential manager or restricted local configuration file. Keep them out of prompts. Browser authorization and coding-tool sign-in may require your participation.

## Installation path

| Step | Result |
| --- | --- |
| [Deploy Studio](install.md) | An empty instance with a working URL, file and artifact storage, and invitation and password reset email |
| [Connect a Git platform](git.md) | A Git connection with permission to create and access new repositories |
| [Connect a runtime](shared-runtimes.md) | An online runner with signed-in coding tools |
| [Configure agents](agents.md) | Available models, work descriptions, and Lead Agent choices |
| [Create your first project](new-project.md) | A newly created repository initialized as a NocoBase application |
| [Configure checks and previews](ci.md) | Agent self-checks or CI, plus a way to preview changes |

Store administrator credentials and encryption keys in restricted configuration files. The agent should report their location without displaying their values. Keep one-time installation credentials out of shared records too.

After checks and previews are ready, [invite members](invite.md). Members follow [Get started](../join/index.md) to sign in and submit requests.

## Check the result

1. Sign in to Studio as the administrator.
2. Confirm that the runtime is online and its coding tools are signed in.
3. Check the enabled agents and the Lead Agent's primary and fallback choices.
4. Open the first project and confirm that initialization is complete and the repository contains the application.
5. Confirm that you can create a business task.

Restart Studio and confirm that the project and settings persist. Ask the agent to leave the deployment location, version, backup locations, and any unfinished configuration.
