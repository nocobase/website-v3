---
type: "release"
product: "studio"
tag: "v1.0.0-beta.91"
channel: "beta"
version: "1.0.0-beta.91"
title: "NocoBase Studio · v1.0.0-beta.91"
date: "2026-11-25"
publishedAt: "2026-11-25T15:47:52Z"
---

### 🎉 New Features

- **[Issues]**
  - Mentioning the Lead Agent in a comment on your done or cancelled task moves it back to In progress and the Lead Agent picks up the comment.
  - Each project now has a Workflow tab showing how its tasks move between people and agents, each task follows one workflow chosen from a chip, the built-in workflows and quality skills can no longer be changed, and with a separate requester neither the requester nor the owner can replace the other alone.
- **[Quality]** {{edition:enterprise}} Choose who daily, release and project tests run as in quality settings, and give new follow-up tasks to the testing task's current owner without a takeover or requirement confirmation.
- **[Git]** Several Git connections can now share one SSH key, chosen or created in the connection dialog and managed on the new Settings › Git › SSH keys tab, and a passing "Test SSH connection" is all an SSH connection needs.

### 🚀 Improvements

- **[Agents]** Studio preserves its chat, inbox, settings pages and Agent page access while disabling framework storage administration, application-hosted model services and framework system key, member key and rule administration by default.
- **[Quality]** {{edition:enterprise}}
  - A quality test with slow tests now updates the project's open test timing task instead of opening a new one, and the code quality cleanup task's title date follows the latest test.
  - A quality dimension without problems now opens its details on the overview, and its empty problems tab says no problems were found this time.
  - The Problems tab of a quality dimension now lists the most severe problems first by default.
  - A project's Quality tab now shows the project's quality itself — overview, testing issues, core scenarios, follow-ups, metrics, settings and Run test — instead of a link to the Quality page.
- **[Releases]** The update dialog shows Japanese release notes in a Japanese interface, and every release now also has Japanese notes and changelog.
- **[Issues]**
  - A retried run in the execution log shows its total time over all attempts, the number of attempts, and each attempt's time and why it ended.
  - Task progress appears sooner when opening a task from the list or its own page.
- **[Projects]** On a project's page, the Releases tab now comes right after Quality.
- **[Skills]** Agents can read and change the skill library again for the person who woke them, and the built-in skills accept UI screenshots in another language when the owner has not asked for English.

### 🐛 Bug Fixes

- **[Quality]** {{edition:enterprise}}
  - The Quality page no longer jumps while it loads, and its overview loads faster.
  - Fix failed-scenario problems losing their follow-up task when it was registered by its task number before the results were submitted.
- **[Runtimes]** Allow runtimes to resume task checkouts with benign submodule worktree metadata, surface concise Git errors, and automatically tighten non-writable permission drift on owned run temporary directories.
- **[Agents]** Restore the earlier Agents, Runtimes, Skills and Usage pages; a part of a page your role may not view now says so instead of failing.
- **[Git]** HTTPS connections release their SSH keys on upgrade or when switching from SSH, so administrators can delete unused keys
