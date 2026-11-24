---
title: "Create an app"
metaDescription: Prepare your development environment and Skill, ask an agent to create and start the CRM app, explore its project guidance and foundation, and save the first version.
lesson: 1
---

<div class="course-example">
<div class="table-wrap">
<table>
<caption><span class="course-example-caption"><span class="course-example-label">Example project<span class="course-example-help"><button type="button" aria-label="How to use the example project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button><span class="course-example-popover"><a href="../../guides/core-capabilities/index.md#example-project">How to use example project tags</a></span></span></span></span></caption>
<tbody>
<tr><th scope="row">Start</th><td>An empty directory</td></tr>
<tr><th scope="row">Finish</th><td><a href="https://github.com/nocobase/doc-demo-crm/tree/lesson-1"><code>lesson-1</code></a></td></tr>
<tr><th scope="row">Lesson notes</th><td><a href="https://github.com/nocobase/doc-demo-crm/blob/lesson-1/docs/lesson-1.md">Installation and run instructions</a></td></tr>
<tr><th scope="row">Modules covered</th><td><a href="../../core/using-plugins/application-support/foundation.md">App foundation</a> · <a href="../../core/using-plugins/authentication/sign-in.md">Authentication</a></td></tr>
</tbody>
</table>
</div>
</div>

## Prepare your environment and agent

You need Node.js 24 or later, pnpm 11, and Git. On Windows, work in WSL. The commands below use a Unix-like shell such as Bash.

### Install development tools

On Windows, follow [Microsoft's WSL installation instructions](https://learn.microsoft.com/en-us/windows/wsl/install). Run `wsl --install` in PowerShell as an administrator, restart when prompted, and open Ubuntu. Install the remaining tools and develop your app inside WSL.

Follow the [nvm installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating), then install Node.js and pnpm:

```bash
nvm install 24
npm install -g pnpm@11
```

If you already use fnm, you can install Node.js with `fnm install 24`, then run the pnpm installation command above.

On macOS, run `git --version` and follow the prompt to install the command line developer tools. On Linux and WSL, install Git with your system package manager, for example `sudo apt install git` on Ubuntu.

### Check your environment and prepare an agent

Open a new terminal and check the tool versions:

```bash
node --version
pnpm --version
git --version
```

Confirm that Node.js is version 24 or later, pnpm is version 11, and Git runs successfully.

Install and sign in to a coding agent that can read project files and run terminal commands, such as Codex or Claude Code. You will give it requests from the application directory, then check the running app in your browser.

## Install the app creation Skill

Run this in your terminal and select your coding tool when prompted:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Start a new agent session after installation so it loads the Skill. This Skill creates the application; the project's own development Skills take over once it exists.

## Create, start, and sign in to the app

Create an empty directory called `my-crm` and open your agent there:

```bash
mkdir my-crm
cd my-crm
```

The tutorial example uses SQLite, which needs no separate database server. Your app can follow your existing database requirements; see [Create an app with a different database](../../core/reference/database-configuration.md) for connection settings.

```prompt
I want a CRM for customers and follow-ups. First, create a NocoBase 3 app that I can open and sign in to on my computer. We will add the business features later.
Start it and tell me the address and initial sign-in credentials.
```

The agent checks the environment, creates the project, installs dependencies, generates local configuration, and starts the app. To run the commands yourself, follow [Create the app manually](../../getting-started/develop-your-first-app.md#run-the-commands-yourself).

Open the address supplied by the agent, including its application path, such as `/main/`. If you start the server yourself, use the full `Local:` URL printed in the terminal rather than guessing the port. Sign in with the initial account. The example's local learning account is `nocobase`, with password `admin123`; change it before making the app accessible to others.

You should see **Home** and a **System settings** sidebar entry. There is no **Customers** page yet; you will build it in Lesson 3. The example was created with default template `1.0.0-beta.92`, so later versions may look slightly different.

Keep the development server running. After stopping it, run `pnpm dev` in the application directory to start it again. If the host or port changes, ask the agent to check `app.publicOrigin`: it should match your browser's protocol, host, and port, without `/main/`.

## Explore project guidance and the app foundation

Look at the project files in your editor, then open **System settings → App usage**:

| Location           | Purpose                                                                                                                    | Maintained by                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`        | Rules and an index the agent reads before development, including where code belongs and which existing capabilities to use | You and the agent                                                  |
| `.agents/rules/`   | Business and development conventions for this application                                                                  | You and the agent, committed with the code                         |
| `.agents/skills/`  | Development guidance matching the installed dependency versions                                                            | Synchronized when dependencies are installed; do not edit manually |
| **App usage** | An overview of Core capabilities connected to the app                                                                      | Reflects the app's registered capabilities                         |

The next lesson defines CRM requirements and a prototype before implementing customer follow-up with data, pages, and authentication. A capability listed in the foundation does not mean its business pages have already been built.

## Save the first version

In the agent session opened in your application directory, send:

```prompt
Save this working version so I can return to the stage where the app starts and supports sign-in.
```

Review the changed files before committing. `config.yml` contains local settings and secrets; the database, `storage/`, `node_modules/`, and synchronized `.agents/skills/` must also stay out of Git. The example's `.gitignore` excludes them. Commit business code, the lockfile, and project conventions.

**Done when**: the administrator can sign in and open Home and App usage, and `git log -1` shows the first commit.


Next: [Build customer follow-up](customers-and-follow-ups.md).
