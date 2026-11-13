# Multi-app documentation verification

## Current Chinese operational-guide reorganization

The approved section now contains Overview, Quickstart, Manage deployment environments, Manage application templates, Manage hosted applications, and Connect independently deployed applications. The four Chinese operational guides replace the previous management, SSO, external-application, migration and deployment arrangement. Overview and Quickstart were compared with the pre-reorganization copies and are unchanged except for necessary Markdown links. English translation remains pending: existing English bodies are retained with link and title maintenance, and the two new pages are placeholders. Japanese remains title-only. Menus match across all three languages; old URLs redirect directly to their replacement pages.

Source verification uses the same OSS and Pro revisions recorded below. The Main template's registered identity provider provisions hosted-instance SSO clients and runtime variables; child source still needs the Platform SSO plugin, login composition, business-role mapping and AppSwitcher. Independent applications use the generated setup instructions and private server environment instead. The template portal's action menus, catalogue filters and setup-instruction masking were inspected alongside the Releases environment UI. The older multi-app Skill claim that automatic identity enrollment is disabled does not describe the current template provider registration and was not used as the guide's behavior contract.

The existing authenticated session was used to inspect environment settings, template creation and actions, instance access/configuration/upgrade dialogs, and independent-app registration. Forms were cancelled or left without submission. No application was deployed, upgraded, restarted, archived, granted access or modified for this pass. No secret was revealed or copied. Eleven additional English-interface screenshots were captured and visually inspected, with the six earlier images retained. All guide screenshots are 1440 by 900; browser extension borders, pointers and sidebar overlays are absent.

Validation: `pnpm doc:test` passed (16 files, 96 tests); `pnpm doc:build` passed (658 pages, 770 indexed pages); `git diff --check` passed. Regression checks cover the six-page menus, placeholders, retired-page redirects and screenshot dimensions. All four Chinese guides were opened in the docs dev server: their fifteen image references loaded at 1440 by 900, their headings and navigation matched the approved structure, and no raw bold markers or article overflow were present. The rendered pages were also visually inspected.

Fresh commercial-package installation, independent-app enrollment, unauthorized-user rejection, access revocation, deployment/upgrade/archive/restore and production backup recovery were not executed. Instructions for these operations are source- and interface-backed, not claims of newly completed runtime acceptance. The commercial registry's earlier HTTP 401 remains an unresolved release/installation verification limit.

The sections below are historical records of earlier drafts and verification passes, not the current article structure.

## Chinese refresh — 2026-11-12

This update changes only the seven Chinese guides under `doc/content/zh-CN/core/architecture/multi-app/` and adds six shared English-interface screenshots under `doc/public/assets/core/multi-app/`. The user approved the outline and requested Chinese review before English translation. Existing English, Japanese, navigation, redirect and test changes were already present and are preserved. The earlier sections below describe a previous verification pass, not the current content or runtime.

Source checks used OSS `88bc9ebbfea34933a713c04926267786f1cb3378` and Pro `58d291088e265d8c634ceacc131ceb02ff4ce00d`, after clean-tree fast-forward pulls. The Pro Main README, server configuration/provider registration and Identity Provider/Platform SSO integration Skills establish the complete Main template, empty initialization, disabled Host, explicit environment creation, HTTP callback policy and public AppSwitcher integration. No application source, instance deployment, membership or data was modified for this documentation pass.

The existing local browser session reached Main, its environment list, template versions, the create-instance form (cancelled without submission), and customer instance details. Both listed instances were Running at `1.0.0-beta.101`. Entry into Customer management, opening its lazy AppSwitcher, switching to Expense management and returning to Main succeeded. The current child UI has a sidebar switcher and eight displayed business records; it is not the three-row static UI described in the earlier memo. The quickstart's three-record request is a minimal suggested exercise, not a claim to reproduce that running UI. Screenshots illustrate platform operations and switching, not a verified full CRM or expense workflow.

Published-version queries with an explicit commercial scope registry failed with HTTP 401. A first query using only `--registry` was overridden by the existing scope configuration and reached npmjs; the quickstart now explicitly scopes the version check. Fresh registry installation, production deployment, ordinary-user negative authorization, revocation, recovery login, mobile switching and OIDC security regression were not executed. No latest published version is claimed.

Checks: `pnpm doc:test` passed (16 files, 94 tests); `pnpm doc:build` passed; `git diff --check` passed. The Chinese quickstart was opened in the existing docs dev server and its three article images decoded successfully. All six captured images were visually inspected for relevant content and exposed secrets.

## Scope

Eight approved articles under `doc/content/core/multi-app/` and `doc/content/zh-CN/core/multi-app/`. Japanese has matching title-only placeholders. The category is nested inside Developing apps immediately after Testing, with platform and child development merged into `development.md`. No application implementation, plugin packaging, deployment, or runtime data was changed.

The user explicitly approved `nocobase/app-example-multi-app` as this section's runnable example, rather than requiring migration into `docs-examples-v3`. The three named plugins are commercial dependencies. Their acquisition channel, installation method, and release versions are unresolved; do not invent install commands or describe them as built-in packages of the example platform.

## Source evidence

Repository visibility was also verified: GitHub reports `private: true`; unauthenticated commit and repository requests return 404. The SHA is remotely available to authorized users, not publicly accessible. The user plans to open-source the example and explicitly asked to omit its temporary private status from reader-facing instructions; retain this access finding only as an internal publication check. Do not change repository visibility or promise public cloning as part of this docs task.

Read in the requested order: project scenario Skills and plugin integration Skills, project docs, then the three plugins' public exports and integration source. Local source revision: `93df19773c27b67f7f99e8ebf9905e03b9025849`.

That local revision was not available from GitHub's commit API. Do not use it in public source links or push the example on behalf of a documentation task.

Remote reference revision: `2e2df1793ec51372ca9b3890b37e9d4748732689`, confirmed through GitHub's commit API. An isolated archive of that commit was read to check its README, startup behavior and authentication composition. All 13 referenced source paths exist in that fixed tree. Source citations pin this remote revision. The quickstart clones the repository's default branch without a checkout step.

The remote example still imports `@chenos/app-plugin-identity-provider` and `@chenos/app-plugin-platform-sso`; current local source uses the corresponding `@nocobase` names. At the user's request, historical package-name differences are kept out of reader-facing prose. Generic development guidance uses the three intended commercial names. Links to example authentication files illustrate composition locations; they are not represented as verbatim copies of the new package imports.

The source snapshot also differs in framework baseline and development-only LAN authentication behavior. The user removed the quickstart's environment and plugin preparation section. Build commands still reflect the example scripts; when those scripts change, align both languages. Do not put temporary repository status, release availability, or historical dependency names back into reader-facing prose.

## Checks performed

- `pnpm doc:test`: 15 test files and 90 tests passed.
- `pnpm doc:build`: succeeded, including menus, language counterparts, internal links, output layout and search generation.
- `git diff --check`: passed for tracked changes.
- Static review: eight English/Chinese article pairs with matching Japanese placeholders. Application development now has three approved sections focused on plugins and multi-app considerations; general application tutorials and code examples were removed.
- Source-link review: the remote commit is resolvable with authorized access and all 13 linked file/directory paths exist in its archive.

## Not verified

No fresh example dependency installation, Linux artifact build, application startup, live browser SSO, two-instance isolation, selective upgrade, production migration or recovery drill was executed for this documentation change. Reader checks describe expected outcomes, not new runtime acceptance evidence. Existing example verification records are historical evidence only.

No screenshots were added or recaptured. Japanese body translations remain unfinished and are explicitly marked as placeholders.

## Publication follow-up

Before presenting the quickstart as newly runtime-verified, execute the documented instructions against a recorded checkout revision in an isolated supported environment with a trusted HTTPS entry and record the results. When commercial packages have a confirmed delivery method, add only verified acquisition/version prerequisites. Keep source links, example names, commands and both full-language articles aligned when selecting a newer accessible example revision.
