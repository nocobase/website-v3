---
title: Prepare your development environment
metaDescription: Install Node.js 24, pnpm 11.7 and Git, and set up WSL if you're on Windows.
---

You need Node.js 24 or later, pnpm 11.7 or later and Git, and all commands run in a Unix-like terminal.

## Windows users: install WSL first

Run this in PowerShell opened as administrator, restart when prompted, then open "Ubuntu". From then on, keep all tools, commands and app directories inside WSL. See [Microsoft's WSL installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).

```powershell
wsl --install
```

## Install Node.js and pnpm

Install nvm by following [nvm's instructions](https://github.com/nvm-sh/nvm#installing-and-updating), then run:

```bash
nvm install 24
```

If you use fnm, install fnm by following [fnm's instructions](https://github.com/Schniz/fnm#installation), then run:

```bash
fnm install 24
```

Then install pnpm:

```bash
npm install -g pnpm@11
```

Open a new terminal when you're done.

## Install Git

On macOS, run `git --version` and follow the prompt to install the command line developer tools. On Linux and WSL, install it with the package manager, for example `sudo apt install git`. Then set your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

**Done when**: `node --version` shows `v24` or later, `pnpm --version` shows 11.7 or later, and `git config user.name` shows your name.
