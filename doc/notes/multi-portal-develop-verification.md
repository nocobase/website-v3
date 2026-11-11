# Multi-portal development guide verification

- Article: `core/architecture/multi-portal/develop.md` and its `zh-CN` version.
- OSS inspected: `origin/v3-develop`, `fcd59ee43a5e0d79fb37942c464a5587749601bc`, fetched on 2026-11-11. The primary checkout has unrelated local changes on `fix/v3-embedded-app-manifest`; it was not switched or overwritten. Inspected the fetched template through Git.
- Pro generator, template and switcher inspected: PR #131, `f7f049a2e6d8047e2ba919fbdb984c87ea6926c0`. The running app uses the unpublished PR plugin tarball and separate workbench routes. The article explicitly distinguishes this preview from installed templates without the separate workbench.
- Screenshot app: the existing locally generated empty multi-portal app with `portal-1`, no business data. English interface, Chromium, 1280 × 640 CSS pixels, device scale factor 2. PNG output is 2560 × 1280. No interface text or state was fabricated.
- Captured the real uninstalled state and Install menu, then reinstalled Portal 1 before capturing the workbench, portal homepage and switcher. The preview was left installed.
- Applied the article's Details page, route, navigation and locale snippets temporarily to the generated portal. Its TypeScript check passed. Browser checks passed for direct access, refresh and Overview → Details navigation. Original application sources were restored afterwards.
- Documentation validation: `pnpm doc:test` (90 tests) and `pnpm doc:build` passed. Screenshot behavior does not verify ordinary-user access or custom layouts; those remain explicit reader verification steps.

- Examples-page screenshot: the final example replaces the temporary Details page with three static, translated records (Basic page, Navigation entry and Localized text). Its page, route, navigation and locale resource match the article. The preview retains Examples for review. `examples.png` is captured at 1280 × 640 CSS pixels and device scale factor 2. Verified direct access, refresh, navigation and a 390 px viewport; the generated package has no unit tests, so browser verification supplies the behavior checks.
