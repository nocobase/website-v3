# Studio tutorial migration

## Scope

The user approved a five-lesson outline on 2026-11-15. Lessons 15–19 preserve the legacy Studio sequence: connect a project, delegate a requirement, involve a business colleague, capture knowledge, and release. The CRM scenarios follow `worklog/2026-11-09-crm-tutorial-plan/course-plan.md`: quote revision comparison and customer handover. The current Core catalog contains 14 lessons, so the former plan's topics 21–25 become lessons 15–19.

English, Simplified Chinese, and Japanese have full articles, matching lesson numbers, menu entries, and course cards. Legacy articles and their original links remain archived. Existing uncommitted Core migration work was retained.

## Browser evidence

Captured the English UI at `https://studio.demo.nocobase.com/main` on 2026-11-15. The footer reported `v1.0.0-beta.77`. T3 preview failed twice because its root process could not start the Chrome sandbox. Used local Playwright Chromium with a fresh browser context, 1440 × 1000 viewport, and English locale instead. No Studio data was saved, no invitations were sent, and no Agent tasks, merges, tags, or deployments were started.

The demo is read-only and contains generated scenario data and simulated Git/CI links. Its delivery reports and check results are UI examples, not evidence that the tutorial CRM features were implemented or tested during this migration. No screenshot text was replaced or fabricated. The checks image is a direct browser capture clipped to the PR/checks region; it excludes preview credentials.

Assets are in `doc/public/assets/guides/studio/`, shared by all three languages:

| Asset | Screen |
| --- | --- |
| `repositories.png` | CRM System → Settings → Code repositories |
| `checks.png` | CRM repository → Edit Checks; source choices and preview configuration |
| `new-session.png` | My sessions → New conversation; CRM System selected, no message sent |
| `issues-board.png` | CRM System → Issues → Board |
| `issue-checks.png` | CRM issue PM-8239 → Code & previews; selected source and individual results |
| `quote-task.png` | Completed CRM quote-revision issue PM-8251 and delivery report |
| `members.png` | CRM System → Members |
| `session.png` | Existing Studio Platform conversation and linked issues; illustrates the shared conversation UI |
| `knowledge.png` | CRM System → Knowledge → CRM release acceptance |
| `default-skills.png` | CRM System → Settings → Default skills |
| `memory.png` | CRM System → Memory, after repository entries finished loading |
| `releases.png` | CRM System → Releases → Pending release |
| `staging-guide.png` | Staging → Deployment guide |
| `publish.png` | Release → How to publish |

The demo's production guide was inspected but its screenshot was not included: the selected version/header and the record-deployment button displayed different version labels. No record action was attempted. Production documentation explains the flow and links to its maintained manual; actual production installation/upgrade was not verified.

## Screenshot refresh for Lesson 16

Revisited the live demo for `agent-team-request` after the user requested a current UI check. The CRM project still offers Table and Board; the user confirmed keeping the board, so article structure and view instructions are unchanged. Recaptured `new-session.png`, `issues-board.png`, `issue-checks.png`, and `quote-task.png` from the live pages. For the full-page captures, hid only the banner’s “Demo mode · Switch account” button with temporary browser styling, as requested. The checks capture remains cropped to the PR/check results, excluding preview credentials. Waited for the temporary demo notification to disappear before the final delivery-report capture. No business content was edited and no changes were saved to Studio.

## Source-stage alignment and outstanding implementation

The adjacent `doc-demo-crm` repository was inspected read-only, including its AGENTS.md and project-owned tutorial Git history Skill. Local tags currently run through `lesson-7`, and the repository has unrelated uncommitted work. Lessons 8–14 in the website include placeholders. No existing stage 14 baseline or stages 15–19 were found locally; this task did not create, rewrite, or publish CRM history.

| Lesson | Article | Intended source progression | Status |
| --- | --- | --- | --- |
| 15 | `bring-into-studio.md` | `lesson-14` → `lesson-15` | Studio setup exercise written; matching source stage unavailable |
| 16 | `agent-team-request.md` | `lesson-15` → `lesson-16` | Quote comparison exercise written; implementation and stage unavailable |
| 17 | `business-colleagues.md` | `lesson-16` → `lesson-17` | Customer handover exercise written; implementation and stage unavailable |
| 18 | `capture-knowledge.md` | `lesson-17` → `lesson-18` | Knowledge/Skill/memory exercise written; matching stage unavailable |
| 19 | `release.md` | `lesson-18` → `lesson-19` | Release exercise written; matching stage unavailable |

Do not create those tags at the current lesson-7 commit or link to nonexistent snapshots. Before providing completed-stage source links, implement the missing stages in course order in `doc-demo-crm`, preserve existing data, verify each stage, and follow that repository's history instructions. This migration links prerequisites to existing course pages and describes exercises on the reader's CRM; it does not claim a downloadable implementation of lessons 15–19.

Quote revision prompts preserve submitted versions and avoid inventing legacy history. Customer handover extends lesson 7's existing ownership/sharing model with audit records; it does not recreate ownership or silently change explicit sharing grants. Sales manager Morgan and salespeople Alex/Taylor retain their existing tutorial roles.

## Validation

- `pnpm doc:test`: 15 test files, 90 tests passed.
- `pnpm doc:build`: succeeded, including multilingual menu, internal link/anchor, asset, output layout, and search generation checks.
- Checked all 15 new article files for lesson numbering, asset references, and legacy ITAM/TODO residue.
- Inspected every retained screenshot; replaced the initial loading-state memory capture and replaced the completed quote's PR-only screenshot with a CRM issue showing actual demo check results.
- `git diff --check`: passed.
- Not verified: sending invitations, a real Agent development run, CRM migration/permissions tests, CI setup against a real repository, PR acceptance/merge, stage tags, staging or production deployments.
