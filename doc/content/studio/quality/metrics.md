---
title: Quality metrics and standards
description: Look up checking methods, metrics, default standards, and scope for five dimensions.
---

In **Quality › Metrics**, choose a test type and time range to inspect results and trends. The overview also shows recent dimension results.

![Metrics distinguish recorded results from unverified items](https://static-docs.nocobase.com/studio-en-quality-metrics-20261111-normal-2x.webp)

## Metrics and standards by dimension

The tables list built-in checking methods, default standards, and descriptive metrics. Projects can override performance budgets; other rules come from the dimension's Skill. Tools produce raw data, the server parses and calculates metrics, and Agents coordinate execution and analysis.

<strong style="color: #b91c1c">Editorial check: Default thresholds for medium-severity findings, functions above complexity 15, unused exports, and test coverage remain unspecified in the reference. No values have been invented here; confirm the final standards before publishing.</strong>

### Functionality

| Check | Metrics and standards | Tools and method |
| --- | --- | --- |
| Task behavior and core scenarios | Failed scenarios = 0; expectations come from tasks, scenario definitions, and explicit business rules | Vitest, Playwright, and direct Agent operation |
| Automated tests | Failures caused by product defects = 0; record and investigate failures, skips, timeouts, and obsolete tests | Run existing Vitest and Playwright tests; quality runs do not add E2E tests |
| Scenario coverage | (Passed + failed) ÷ total scenarios; trend metric, with no fixed pass threshold | Scenario and checkpoint results |
| Pass and automation rates | Pass rate = passed ÷ verified; automation rate = scenarios proven by automated tests ÷ verified; no fixed pass threshold | Distinguish automation, Agent checks, and unverified items; a zero denominator does not establish a pass |

### Permissions

| Check | Metrics and standards | Tools and method |
| --- | --- | --- |
| Anonymous access | Unauthorized anonymous access = 0 | Permission engine requests endpoints anonymously |
| Unauthorized reads and writes | Unauthorized reads = 0; unauthorized writes = 0 | Read marked data without permission; read back after writes to detect changes |
| Positive controls | Failed positive controls = 0 | Repeat with an authorized identity; endpoint failure does not prove correct access control |
| Endpoint permission declarations | Endpoints without permission declarations = 0 | Vitest checks in task CI |

### Security

| Check | Metrics and standards | Tools and method |
| --- | --- | --- |
| Dependency vulnerabilities | Critical and high vulnerabilities = 0; distinguish production and development dependencies | Audit dependencies with pnpm audit; follow up by package |
| Leaked secrets | Leaked secrets = 0 | gitleaks scans current code and Git history |
| Security code review | Confirmed critical and high findings = 0 | Agent review against a security checklist, with evidence |
| Passive and active scans | Confirmed high findings = 0; retain medium and low findings; incomplete scans do not mean zero alerts | OWASP ZAP checks headers, cookies, disclosure, injection, and XSS; access violations belong to Permissions |

### Performance

| Check | Metrics and standards | Tools and method |
| --- | --- | --- |
| Page JavaScript size | Initial JavaScript, uncompressed, ≤ 2 MB | Measure pages with Lighthouse and record conditions |
| API response size | Response body ≤ 500 KB | Sample business GET requests actually issued by pages |
| SQL queries per request | SQL statements per request ≤ 20 | Trace SQL by request ID, excluding background jobs |
| API and SQL duration | Diagnostic budgets: P95 ≤ 500 ms; slowest SQL ≤ 50 ms. Do not judge shared-runner results on duration alone | Warm up each endpoint, then take 10 sequential samples; inspect slow SQL with PostgreSQL EXPLAIN |
| Page-load metrics | Lighthouse score, FCP, LCP, TBT, CLS, and SI are references and trend metrics, not a universal score gate | Compare the same pages, data scale, and conditions; use repeated core-page measurements and medians |

### Code quality

| Check | Metrics and standards | Tools and method |
| --- | --- | --- |
| Duplicated code | Duplication in new code ≤ 3% | jscpd detects duplicated blocks |
| Cognitive complexity | New functions with complexity > 50 = 0; track functions with complexity > 15 | eslint-plugin-sonarjs cognitive-complexity rule |
| Unused code | New unused files = 0; new unused dependencies = 0; track unused exports | knip |
| Circular dependencies | New circular dependencies = 0 | dependency-cruiser analyzes module imports |
| Test coverage | Record line and branch coverage; default minimums are not yet defined | Run the full test suite with Vitest coverage-v8 |
| Agent review | High-severity findings = 0 | Review design, project conventions, and test value by module; CI handles lint and type checking |

### Scope and checks not yet covered

Shared Runner load affects duration. Interpret page scores and timings with their measurement conditions and trends. Timing budgets are diagnostic references; a single fluctuation does not establish a product defect. Real-time messaging currently receives code inspection, not delivery measurements. Interaction latency, large datasets, concurrency and capacity, background jobs, bulk files, and sustained operation are not yet covered by completed performance measurements.

Permission checks do not yet cover every field-level write restriction. HTTPS and deployment security need the corresponding environment; an isolated HTTP test does not verify production deployment. Smoke and UX remain planned dimensions, outside the five current built-ins. Checks missing external services or data remain unverified.

Code quality standards apply to new code. Check the comparison baseline and scope. GitHub CI continues to enforce lint and types; totals for existing code do not automatically represent newly introduced issues.


## Metric definitions

| Data | Source |
| --- | --- |
| Task, scenario, and checkpoint outcomes | Explicit findings and evidence submitted by each dimension |
| Automated passes, failures, skips, and duration | Uploaded reports from Vitest, Playwright, and other test runners |
| Dependency vulnerabilities | Dependency audit output, separated into production and development dependencies |
| Page and API performance | Compare measurements for the same page or endpoint |
| Permission checks | Compare expected and observed access by role and action. Check which cases lack evidence |
| Scan findings | Inspect results submitted in SARIF format and the affected locations |
| Code quality | Findings and locations recorded in the code quality report |
| Follow-up tasks | Linked defects, questions, test cases, scenarios, and cleanup tasks |

Missing reports produce no corresponding metrics. An empty value does not mean zero problems. Unverified and not applicable do not mean passed.

## Trends and details

Open a metric to inspect the related tests, scenarios, or findings. Before comparing results, check the type, scope, code commit, and selected dimensions.

Adding or removing scenarios changes totals. Stable scenario keys support comparisons across tests. More tests or fewer issues only become meaningful alongside scope changes. Use [reports and evidence](runs.md#reports) to understand the difference.

## Dimension conclusions and individual outcomes

Dimension conclusions are Passed, Has issues, Partially unverified, or Unverified. Inspect confirmed issues and their evidence. When checks remain incomplete, the absence of confirmed issues does not establish a complete pass. A dimension with no usable conclusion is unverified.

Read individual scenario and checkpoint outcomes separately: passed, failed, unverified, or not applicable. Not applicable counts as neither a pass nor a failure. Execution progress is separate: running or completed describes execution, not whether quality standards were met.
