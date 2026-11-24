# Multi-app documentation verification

## Full local publication and HD screenshot refresh — 2026-11-16

This entry supersedes the older six-guide structure and screenshot conventions below. The current eight approved guides are Overview, Quickstart, Main and runtime nodes, Child development and deployment, Build artifacts, Application instances, Single sign-on and business permissions, and Existing application integration. All three languages share English-interface screenshots with localized captions.

### Baseline and isolation

- Pro branch: `feat/multi-app-project-deployment-pr155`, commit `4c8c7d2c34c1c9523ad6076f55a06ea709782ab2` (PR #155).
- OSS runtime pinned by that PR: `85d7e34150ed55b021369f6c1e1b1a33494bb767`. No framework upgrade or application source change was made for this capture.
- Built and published all 64 required source packages to an isolated Verdaccio registry. Exact local-package rules prevented these packages from falling back to npmjs. Generated applications installed from those packages outside the workspace.
- Local baseline versions: creator `0.1.0-beta.38`, Main template `0.1.0-beta.2`, child template `0.0.1`; deployed child version `0.0.1`, Linux x64, Node.js 24, SQLite.
- Workspace `/tmp/pr155-docs-hd`: registry port 14875, Main 15050, runtime node 15051, local child 15052. The existing 15040 preview was preserved. Screenshots show these test ports; the adaptable guide examples retain 13230, 13231 and 13240.
- LAN-only access, as requested. The private Main allowlist permits only the test Main HTTP origin. No temporary public tunnel was opened.

### Executed walkthrough

1. Published the packages locally, created `platform` from `multi-app`, initialized SQLite configuration, supplied a unique administrator password, configured the public origin and local node, and verified Main and the node were ready.
2. Created `child-app` from `sub-app`, initialized its separate database and configuration, started it on its own explicit development port and signed in locally. The template’s local default password was replaced with a unique value for the retained preview.
3. Ran project deployment `init`, browser authorization, `validate` and `doctor` against Main. Saved authorization remained outside source and screenshots.
4. Ran `artifact upload --build --yes`, reviewed a create plan and executed that exact plan with `instance create --plan ... --yes --wait`. `quickstart-child` reached Running at version `0.0.1`; the deployment record and logs confirmed success. The platform entry and SSO client were provisioned automatically.
5. Saved the generated instance administrator through the UI and acknowledged receipt. Signed in as the separate ordinary platform user `Quickstart Reader`, opened the instance through the workbench, completed the real OAuth callback, opened the application switcher and returned to Main. The child session was valid, its permission snapshot had `unrestricted: false`, and direct permission-set administration returned HTTP 403. Anonymous access returned 401. After signing out of the child, its local recovery login succeeded using the generated administrator, whose permission snapshot had `unrestricted: true`.
6. Created an external link-only entry named `Development preview`, pointing to the independently running local child. Opening it from the ordinary user’s workbench reached that application’s own login page; no SSO sharing was claimed.
7. Inspected the create-instance form with another instance name, package, version, node and SQLite selected, then discarded it without creating a second instance. Captured existing instance configuration, platform access, runtime logs, deployment records and version details without changing them.

Archive SHA-256: `7b3791456276798cc3a2a845be3e6d15aeb9c8a027df9ec4a5ef04b9a40b4d04`. The archive excluded application `config.yml`, application runtime databases and unique test credentials. Template `config.example.yml` and third-party dependency fixtures are present; they are not evidence of packaged application runtime data.

### Corrections established by the walkthrough

- This pinned development CLI selects its listening port independently from `config.yml`. The guides now pass `APP_SERVER_HOST` and `APP_SERVER_PORT` explicitly, keep the public origin aligned, and start Main before the child.
- `config init` does not ask for Main’s first-administrator password. The quickstart now sets it before startup using hidden Bash input and `config set --from-env`, with a separate child password. The command was exercised against the generated application.
- The bare child template contains prepared user and role pages but does not register them. The SSO guide now describes the required route registration when developing business features; no nonexistent fresh-template permission UI was staged for a screenshot.

### Screenshot coverage

23 original PNGs use a 1440 × 900 CSS viewport at device scale factor 2, producing 2880 × 1800 pixels. They were captured from real pages with the shared preview browser, without upscaling or UI reconstruction. Generated passwords remained masked. No tokens or client secrets appear in published screenshots. The consumed CLI authorization code is no longer an active credential.

The inventory is [multi-app-screenshots-20261116.json](multi-app-screenshots-20261116.json). Every guide in English, Chinese and Japanese embeds relevant images; the shared assets use the `hd-` prefix. Historical screenshots remain unmodified for old records but are not used by the new guides.

### Documentation validation

`pnpm doc:test` passed all 116 tests in 16 files, including shared HD dimensions and matching image order across languages. `pnpm doc:build` and `git diff --check` passed. Browser requests to all 24 localized article URLs returned HTTP 200; all 23 referenced PNGs decoded at 2880 × 1800. The Chinese quickstart was inspected in the live LAN preview with no horizontal overflow.

### Verification limits

This run validates local source-candidate publication and a fresh LAN SQLite installation. It does not establish public/commercial registry release availability. HTTPS/WSS proxying, remote nodes, PostgreSQL/MySQL, third-party OIDC enrollment, approvals, upgrades, data purge, backup recovery and CI deployment were not rerun. No business module or business-role assignment was implemented; the permission test establishes the ordinary-user versus local-administrator boundary on real protected APIs. No lifecycle operation was performed on existing user instances.

## Japanese translation aligned with the Chinese guides

All six Japanese multi-app guides now follow the approved outline and the Chinese baseline at commit `43a7fd89`; none remain placeholders. Commands and YAML examples match the Chinese guides. All twenty screenshot references reuse the seventeen existing English-interface images, with Japanese captions and English interface labels retained alongside Japanese descriptions where needed. Chinese and English articles, navigation structure, and both screenshot sets are unchanged. This supersedes the Japanese placeholder status recorded in the earlier entries.

Validation passed: `pnpm doc:test` (16 files, 112 tests), `pnpm doc:build`, and `git diff --check`. Regression checks now cover all three languages and compare both translations' executable examples and screenshot pairs with the Chinese baseline. All six Japanese pages were opened and visually inspected in the local preview. All twenty screenshot references loaded at 1440 by 900; headings and navigation rendered correctly, with no article overflow. Moving the English-label parentheses outside Markdown emphasis resolved literal bold markers found during preview; the repeated inspection found none remaining.

This was a documentation-only translation. No application settings, access grants, deployment operations, or business data were changed, and no application-runtime acceptance tests were rerun. The previously recorded commercial-registry and runtime-verification limits remain unchanged.

## English translation aligned with the Chinese guides

All six English multi-app guides now follow the approved outline and the Chinese baseline at commit `379dd332`. The English deployment-environment and template pages are no longer placeholders. Commands and YAML examples match the Chinese guides, and all twenty image references use the corresponding seventeen English-interface screenshots under `doc/public/assets/core/multi-app/`. Chinese articles, Japanese placeholders, and both screenshot sets are unchanged. This supersedes the pending English translation status recorded below.

Validation passed: `pnpm doc:test` (16 files, 104 tests), `pnpm doc:build`, and `git diff --check`. Regression coverage checks translated-page status, localized screenshot paths and 1440 by 900 dimensions, retired links, and matching executable examples and screenshot pairs in each English and Chinese guide. All six English pages were opened in the local preview and visually inspected; their headings and navigation rendered correctly, all twenty image references loaded at the expected dimensions, and no article overflow or unrendered bold markers were detected.

This translation adds no application-runtime acceptance results. Fresh commercial installation, independent enrollment, permission rejection and revocation, deployment, upgrade, archive, restore, and production recovery were not rerun. The earlier commercial-registry authentication limitation and runtime-verification boundaries still apply.

## Chinese-interface screenshot refresh

At the user's request, all twenty screenshot references across the six Chinese multi-app pages now use seventeen Chinese-interface assets under `doc/public/assets/core/multi-app/zh-CN/`. The previous English-interface assets remain unchanged. Main was already in Chinese; the child application's language menu was switched to Chinese for the application-switcher capture. Existing template, environment and account names were not renamed, and no deployment, configuration, membership or business-data changes were submitted. Registration dialogs were closed without saving, and no credentials were revealed.

The screenshots were inspected for Chinese interface labels and absence of browser-tool overlays; all measure 1440 by 900. Article prose and captions are unchanged. The screenshot regression now requires the localized asset directory as well as the image dimensions. This supersedes the shared-English-screenshot convention recorded in the earlier verification below.

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
