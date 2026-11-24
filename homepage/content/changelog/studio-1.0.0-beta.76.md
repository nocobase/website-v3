---
type: "release"
product: "studio"
tag: "v1.0.0-beta.76"
channel: "beta"
version: "1.0.0-beta.76"
title: "NocoBase Studio · v1.0.0-beta.76"
date: "2026-11-10"
publishedAt: "2026-11-10T15:48:11Z"
---

### 🎉 New Features

- **[Quality]** {{edition:enterprise}}
  - Quality metrics open the reports behind them, a new Follow-ups page lists every follow-up task quality tests registered, testing task titles start with the project name, and each dimension's card leads with its own count.
  - Choose the language core scenarios are written in from a project's quality settings; it follows the instance default language until set.
  - The quality overview and metrics show a running test's overall progress and each dimension's state, can switch to any earlier test of the same type, and a running test can be cancelled.
  - "Select issues to test" is now "Custom test", which can also test the whole project code, and the quality pages fit phones and tablets.
  - Quality tests write one report per dimension with a short delivery summary, name every checkpoint, show which scenarios automated tests proved, and list each problem with its follow-up task status.
- **[License]** {{edition:professional}}
  - Studio EE accepts only Enterprise Keys, and Studio locks when the customer portal reports the company has no matching edition
  - Set a NocoBase private registry token in Settings › License so runners can install commercial plugins when a project needs them.
- **[Studio]** Offer separate Studio and Studio EE images, with Quality available in Studio EE
- **[Account]** Choose in Account settings › Agent whether your work goes to personal or shared runtimes first; reminders and push moved to a new Notifications category.

### 🚀 Improvements

- **[Sign-in]** Configure Studio password recovery through auth.passwordReset.mailer and move existing auth.email.mailer references directly to it.
- **[Quality]** {{edition:enterprise}}
  - Improve project test coverage, parallel results, package vulnerability tracking and evidence in task activity.
  - On phones, the Releases and Quality pages choose a project from a bottom drawer instead of a long list, and Quality lists projects with a test running first.
  - Evidence files in a quality scenario's details now open in an in-page preview with zoom and switching between files, instead of a new window.
  - Quality tests now group failed automated tests into one follow-up per test and dependency vulnerabilities into one open task per project, and project tests report Vitest and Playwright results separately.
  - Quality tests register medium and low problems as follow-ups with matching priority, follow-up titles name the project and test date, the metrics table shows one row per metric, and long delivery reports scroll in place.
  - Quality tests mark scenarios unrelated to a dimension as not applicable, show whether each check was proved by an automated test or by the Agent, and run every dimension of a project test on the same scenario list.
  - Daily tests now run only on their schedule and a first daily test covers only tasks completed in the last three days; the quality page shows the next run time and the accumulated count.
  - Quality cards count every problem, and any card or count opens one dimension view with its problems, report and review scope; checkpoints show their names and the test case behind them.
  - Passing quality checks keep brief text evidence without screenshots; failed and unverified checks retain their diagnostic evidence.
  - Use lightweight code checks for development and page performance reports for daily, release and project tests, with extensible versioned quality methods.
  - The icons of running tests on the quality page spin again, and stay still when the system reduces motion.
  - Quality cards show "Awaiting inventory" with their problem count until the functional scenario inventory is final, problem details show labelled fields by source with advisory links, and dimension reports must use four short sections.
  - Performance and code quality problems show what is wrong, the impact and how to fix it with their related scenarios, and medium or high problems must have a follow-up task before results are accepted.
  - Quality pages now show tests awaiting acceptance or blocked by their real status instead of "Testing".

### 🐛 Bug Fixes

- **[Quality]** {{edition:enterprise}}
  - Prevent ordinary project members from changing quality test settings without project management permission.
  - Allow quality commands to read request bodies from JSON files.
- **[License]** {{edition:professional}} Deployments no longer ask for the license check address, which defaults to NocoBase's Customer Center.
- **[Issues]**
  - A long delivery report folds again with Expand / Collapse and scrolls with the page instead of in a box of its own.
  - On phones, the task comment box and the send-back box stay above the keyboard while typing.
- **[Agents]** Require reviewers to confirm an independent session before starting a code review. Move existing `jobs.<name>` and `queue.<name>` entries under `jobs.backends` and `queue.backends`; the old format is rejected at startup.
