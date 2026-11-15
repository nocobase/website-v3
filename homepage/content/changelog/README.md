# Changelog entries

Each entry of the changelog at `/changelog/` (`src/lib/changelog.mjs`) is a group of Markdown files with YAML front matter: `<id>.md` in English (required), plus `<id>.zh-CN.md` and `<id>.ja-JP.md` when there is a translation. A missing translation shows the English version; a translation without its English file fails the build, and so does any entry that is not valid. `<id>` is the entry's anchor on the page (`/changelog/#<id>`), so do not rename a published entry. This `README.md` is not an entry.

## Release entries

The release pipeline of the nocobase repository writes one entry per v3 release, with `<id>` = `<channel>-<version>` (such as `beta-2026-11-12.1.md`). Do not write these by hand.

```markdown
---
type: release
tag: nocobase-v3-beta/2026-11-12.1
channel: beta
version: 2026-11-12.1
title: NocoBase v3 Beta · 2026-11-12.1
date: 2026-11-12
publishedAt: 2026-11-12T08:31:00Z
url: https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1
---

### 🎉 New Features

- **[Server]** … ([#11489](https://github.com/nocobase/nocobase/pull/11489))
```

- The front matter comes from the English file (translations carry the same values). `channel` is `beta` or `stable`; `date` is `YYYY-MM-DD`.
- The body is the release's section of `CHANGELOG.md` (`CHANGELOG.zh-CN.md`, `CHANGELOG.ja-JP.md` for the translations) and must not be empty in English. Raw HTML in it is shown as text, and a PR author credit at the end of a line (`by @user`) is not shown.
- Order on the page: `date` (newest first), then the `<n>` of `version`, then `publishedAt`.

## Announcement entries

For a major release, add an entry by hand, such as `v3-0.md` (plus `v3-0.zh-CN.md` and `v3-0.ja-JP.md`). It shows as a highlighted card whose whole area links to `href`, ahead of the releases of the same day. The body is not used.

```markdown
---
type: announcement
date: 2026-12-01
title: NocoBase 3.0
summary: One or two sentences.
href: blog/nocobase-3-0.html
---
```

Each language file has its own `title` and `summary`; `type`, `date` and `href` come from the English file. `href` is a site source file name (`blog/<slug>.html`, rewritten to each language's address; the post must exist or the build fails) or an `https://` address.
