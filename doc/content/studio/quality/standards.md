---
title: Quality standards
description: Metrics, default pass criteria, and test methods for each dimension, and how a project adjusts them.
---

Studio includes a set of metrics and pass criteria for each dimension. During a test, the tools run and produce a result for each metric, and the server compares the results with the standards to decide whether they pass.

**Projects can define their own standards**: a dimension's Skill defines its checking methods and rules; [replace the Skill](settings.md#adjust-project-standards) or add a dimension to change them.

## Functional

| Metric | Standard | Tool | Method |
| --- | --- | --- | --- |
| Failed task scenarios | = 0 | Vitest, Playwright, browser | Split each task into scenarios by rule and verify each one |
| Failed core scenarios | = 0 | Vitest, Playwright, browser | Project tests verify each scenario in the core scenario inventory |
| Test failures caused by product defects | = 0 | Vitest, Playwright | Run the existing automated tests and analyze each failure's cause |

## Permissions

| Metric | Standard | Tool | Method |
| --- | --- | --- | --- |
| Unauthorized anonymous access | = 0 | Permission engine | Request every endpoint anonymously |
| Unauthorized reads | = 0 | Permission engine | Read data as an identity without permission and check the response for content it should not see |
| Unauthorized writes | = 0 | Permission engine | Write data as an identity without permission, then read back to confirm nothing changed |
| Failed positive controls | = 0 | Permission engine | Repeat the request as an authorized identity to confirm normal access works |
| Endpoints without permission declarations | = 0 | Vitest | Task CI checks that every endpoint declares the permission it requires |

## Security

| Metric | Standard | Tool | Method |
| --- | --- | --- | --- |
| Critical dependency vulnerabilities | = 0 | pnpm audit | Audit all dependencies |
| High dependency vulnerabilities | = 0 | pnpm audit | Audit all dependencies |
| Leaked secrets | = 0 | gitleaks | Scan current code and Git history |
| Critical code security issues | = 0 | Agent | Review code against the security checklist |
| High code security issues | = 0 | Agent | Review code against the security checklist |
| High alerts from passive scanning | = 0 | OWASP ZAP | Check every endpoint's headers, cookies, and information disclosure |
| High alerts from active scanning | = 0 | OWASP ZAP | Test every endpoint with injection, XSS, and other attacks |

Security tests run in an isolated environment the test prepares itself; they never scan the systems your team is using. The permissions dimension covers unauthorized access.

## Performance

| Metric | Standard | Tool | Method |
| --- | --- | --- | --- |
| Initial JS size | ≤ 2 MB | Lighthouse | Measure page loads |
| API P95 time | ≤ 500 ms | autocannon | Measure the endpoints pages use, 10 samples per endpoint |
| API response size | ≤ 500 KB | Collection script | Record each endpoint's response size |
| SQL statements per request | ≤ 20 | PostgreSQL | Count the SQL each request issues |
| Slowest SQL time | ≤ 50 ms | PostgreSQL (`EXPLAIN`) | Inspect execution plans for slow SQL |

## Code quality

| Metric | Standard | Tool | Method |
| --- | --- | --- | --- |
| Duplication rate | ≤ 3% | jscpd | Find duplicated code blocks |
| New functions with complexity > 50 | = 0 | eslint-plugin-sonarjs | Calculate each function's cognitive complexity |
| New unused files | = 0 | knip | Find files nothing references |
| New unused dependencies | = 0 | knip | Find dependencies nothing uses |
| New circular dependencies | = 0 | dependency-cruiser | Analyze imports between modules |
| High-level issues from Agent review | = 0 | Agent | Review design, project conventions, and test value by module |

Code quality judges only **new** code. Issues in existing code are counted separately and do not affect the conclusion. Lint and type checks run in CI, not in this dimension.

## User experience

Check desktop and mobile pages against the project’s UI standards. Record reproduction steps and screenshots. Must violations on the same page are grouped into one defect. Should findings appear as suggestions in the report. Pages that could not be checked are listed separately.
