# Multi-portal development guide verification

- Article: `core/architecture/multi-portal/develop.md` and its `zh-CN` version.
- OSS inspected: `origin/v3-develop`, `fcd59ee43a5e0d79fb37942c464a5587749601bc`, fetched on 2026-11-11. The primary checkout has unrelated local changes on `fix/v3-embedded-app-manifest`; it was not switched or overwritten. Inspected the fetched template through Git.
- Pro generator, template and switcher inspected: PR #131, `f7f049a2e6d8047e2ba919fbdb984c87ea6926c0`. The running app uses the unpublished PR plugin tarball and separate workbench routes. The article explicitly distinguishes this preview from installed templates without the separate workbench.
- Screenshot app: the existing locally generated empty multi-portal app with `portal-1`, no business data. English interface, Chromium, 1280 × 640 CSS pixels, device scale factor 2. PNG output is 2560 × 1280. No interface text or state was fabricated.
- Captured the real uninstalled state and Install menu, then reinstalled Portal 1 before capturing the workbench, portal homepage and switcher. The preview was left installed.
- Applied the article's Details page, route, navigation and locale snippets temporarily to the generated portal. Its TypeScript check passed. Browser checks passed for direct access, refresh and Overview → Details navigation. Original application sources were restored afterwards.
- Documentation validation: `pnpm doc:test` (90 tests) and `pnpm doc:build` passed. Screenshot behavior does not verify ordinary-user access or fully independent portal shells; those remain explicit reader verification steps.

- Examples-page screenshot: the final example replaces the temporary Details page with three static, translated records (Basic page, Navigation entry and Localized text). Its page, route, navigation and locale resource match the article. The preview retains Examples for review. `examples.png` is captured at 1280 × 640 CSS pixels and device scale factor 2. Verified direct access, refresh, navigation and a 390 px viewport; the generated package has no unit tests, so browser verification supplies the behavior checks.

- Layout example: applied the documented `mx-auto w-full max-w-5xl` container in the portal’s `client/layout.tsx`. Captured `layout.png` at 1600 × 800 CSS pixels with device scale factor 2 (3200 × 1600 PNG). Verified direct access, refresh, Overview → Examples navigation and no horizontal overflow at 390 px. The portal package check passed. The preview retains this layout for review.

## Portal management guide

- Rechecked OSS `origin/v3-develop` at `74f1bf8bf713b0867975bcf8be116aa7419e8c9d` and Pro `origin/develop` at `211a22b03a68fc98f04b610f4cac091cd729d975`. The primary OSS checkout still contains unrelated changes and was not overwritten; fetched source was inspected with Git.
- Reused the running minimal Portal 1 app and its PR #131 plugin snapshot for English screenshots. Captured management list, installed-portal action menu and uninstall confirmation at 1280 × 720 CSS pixels / DPR 2 (2560 × 1440 PNG). No UI state was fabricated. The confirmation was cancelled; the portal remains installed.
- Checked name search with a matching and non-matching query and verified the Open/Uninstall menu and cancellation. Installation, failure recovery, dependencies and upgrade behavior were checked against implementation; this screenshot session did not execute uninstall/reinstall, manufacture failures or test database recovery.

## Portal access and permissions guide

- Reused the OSS `74f1bf8bf713b0867975bcf8be116aa7419e8c9d` and Pro `211a22b03a68fc98f04b610f4cac091cd729d975` source checks for route authentication/authorization, administrator-only catalog APIs and installation checks. Corrected the obsolete claim that the administrator homepage is the workbench.
- Captured the actual administrator workbench, portal switcher and shared permission-management role list in the same minimal app, English UI, 1280 × 720 CSS pixels at DPR 2 (2560 × 1440 PNG). Waited for role table content before capture. No grants, users, portal installation state or business records were changed.
- User A/B and Portal 2 describe an integration target and reader verification cases, not a built ordinary-user portal catalog. Screenshots show existing defaults only. This session did not verify the proposed member grants, revocation, ordinary-user discovery or shared-data policies end to end.

### Agent-configured permission editor (2026-11-11)

- Supersedes the previous access-guide screenshot/scenario notes above. Re-fetched OSS `origin/v3-develop` at `74f1bf8bf713b0867975bcf8be116aa7419e8c9d`; unrelated local source changes remain untouched.
- Implemented application-owned portal entry grants, current-user directory, page filtering and the role editor in `/home/dev/NocoBase/app-multi-portal-empty`. This is not a published template feature. The local application is not a Git checkout; this revision has not been published to `docs-examples-v3` and no fixed source link is claimed.
- Real role-editor screenshots use English at 1440 × 1050 CSS pixels. The shared preview browser reports DPR 2, but its snapshot export resizes PNGs to 1280 × 933; these assets must not be described as native Retina exports.
- Created separate Portal reader/explorer roles. Existing Member grants were left unchanged. Browser-verified page grant save through the editor and read-back from the role API. Reader is restored to entry + Overview; Explorer has entry + Overview + Examples. No live test accounts were created or assigned.
- Isolated application tests cover authenticated/unauthenticated discovery, missing entry grants, management denial, installation/revocation, grant persistence, page/entry combinations and mounted access revocation. Editor tests cover retained page selections, draft access decisions, search and unrestricted read-only presentation. All 18 tests across six selected files pass after correcting Base UI aria-disabled assertions. Live ordinary-account end-to-end testing remains a reader verification step, not a claimed browser result.
- App TypeScript, scoped ESLint and production build passed. Documentation tests (90) and build passed. Both languages explain the draft-only preview and preserve separate server API/data authorization requirements.
- Follow-up clarification: explicitly distinguish application-owned Agent implementation from built-in multi-portal features in the opening callout, prompt and screenshot caption. Re-fetched OSS `origin/v3-develop` at `cf13b3f4c52913aacd598e7021a7c991cc076bdd`; the relevant authorization reference and template permission editor paths are unchanged from the prior inspection. The unrelated dirty OSS checkout was preserved rather than fast-forwarded across its working changes.

### Simplified permission editor

- Removed the Role preview and Check direct access panels at the user's request, including their state, unused translations and draft-decision helper. The editor uses a single column and retains portal entry switches, page selections, search, collapse and the separate-management-permissions note.
- Updated both language guides and replaced `role-editor.png` with an actual English screenshot at 1280 × 850 CSS pixels. Removed the obsolete `access-check.png` asset and its instructions. The preceding draft-preview verification notes describe the superseded design.
- TypeScript and the three targeted client test files passed (4 tests), including retained page selections and actual portal/page access boundaries. No role grants were changed for the screenshots.
