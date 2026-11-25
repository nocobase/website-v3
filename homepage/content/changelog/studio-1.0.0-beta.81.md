---
type: "release"
product: "studio"
tag: "v1.0.0-beta.81"
channel: "beta"
version: "1.0.0-beta.81"
title: "NocoBase Studio · v1.0.0-beta.81"
date: "2026-11-17"
publishedAt: "2026-11-17T14:22:48Z"
---

### 🎉 New Features

- **[Studio]**
  - Export sanitized Studio and runtime logs with live progress, configured date ranges and copyable request IDs for failures.
  - Run Studio with KingbaseES as its application database
- **[Quality]** {{edition:enterprise}}
  - Dimension reports show scenario results, automated tests and code issues in their own tabs, with scenario coverage, pass rate and automation rate first.
  - Quality dimensions accept SARIF files from scanners such as gitleaks, ZAP and Semgrep and list their findings in a new Scan findings tab.
  - The permissions dimension shows a Permission checks tab and an escalation card from the permission engine's results, and registers each escalation as a defect.
- **[Agents]** Choose and confirm a runtime in an existing Runner conversation; the change takes effect with the next message.

### 🚀 Improvements

- **[Issues]** Count each task waiting for you once in My tasks, including waiting subtasks and followed tasks.
- **[Quality]** {{edition:enterprise}}
  - Dimension reports open as tabs, and performance reports list every measured page and interface with page titles and a comparison with the previous test.
  - Functional quality tests now design checks for defaults, boundaries and error paths, and raise unclear business rules as questions to confirm.
  - Quality tests now split core scenarios by user goal, check that pages and write operations are covered, and choose regression scenarios for daily and release tests by priority.
  - Quality cards, dimension reports and the test summary now show the same conclusion, cards keep at most three detail lines, and results and progress appear while a test is still running.
  - Security reports get Dependency vulnerabilities and Checks tabs, with production and development dependencies apart and scans that reached no conclusion named in the overview.
  - Quality test defects and questions now follow a template, show their screenshots in the task and get a type prefix in the test's language; tests no longer open separate tasks for scenario updates or test automation.
  - Quality tests no longer stop test data preparation or the security active scan at a fixed time limit, and each dimension report records how long each stage took.
  - Permission tests now check refused writes and allowed identities on every interface and report each check as a JUnit case.
- **[Releases]** Allow configuring preview archive checksum and extraction timeouts with an environment variable.

### 🐛 Bug Fixes

- **[Issues]** Typing @ right after focusing a task's comment or reply box now lists the Lead Agent and other agents as soon as they load, not only the members.
- **[Sign-in]** Return visitors to their original page with its filters and fragment after signing in.
- **[Account]** Fix the first click on Change password in account settings doing nothing.
- **[My sessions]** On phones, the floating My sessions button no longer covers the send button of a task's comment, reply or send-back box, and can be dragged up and down out of the way.
- **[Skills]** Fixed built-in skills directing agents to unrelated CI repositories while preserving customized skills
- **[Git]** Let external CI repositories report checks through `nb-studio check report` with their repository CI key.
