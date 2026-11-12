# Changelog entries

Each file here is one entry of the changelog at `/changelog/` (`src/lib/changelog.mjs`). Files that do not end in `.json` are ignored. The file name without `.json` is the entry's `id` and its anchor on the page (`/changelog/#<id>`), so do not rename a published file. An entry that is not valid fails the build.

## Release entries

The release pipeline of the nocobase repository commits one file per v3 release, named `<channel>-<version>.json` (such as `beta-2026-11-12.1.json`). Do not write these by hand.

```json
{
  "type": "release",
  "tag": "nocobase-v3-beta/2026-11-12.1",
  "channel": "beta",
  "version": "2026-11-12.1",
  "title": "NocoBase v3 Beta · 2026-11-12.1",
  "date": "2026-11-12",
  "publishedAt": "2026-11-12T08:31:00Z",
  "url": "https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1",
  "notes": {
    "en": "### 🎉 New Features\n\n- **[Server]** …",
    "zh-CN": "### 🎉 新特性\n\n- …",
    "ja-JP": "### 🎉 新機能\n\n- …"
  }
}
```

- `channel` is `beta` or `stable`.
- `notes` holds the Markdown of the release's section in `CHANGELOG.md`, `CHANGELOG.zh-CN.md` and `CHANGELOG.ja-JP.md`. `en` is required; a missing language shows the English notes. Raw HTML in the notes is shown as text, and a PR author credit at the end of a line (`by @user`) is not shown.
- Order on the page: `date` (newest first), then the `<n>` of `version`, then `publishedAt`.

## Announcement entries

For a major release, add a file by hand, such as `v3-0.json`. It shows as a highlighted card whose whole area links to `href`, ahead of the releases of the same day.

```json
{
  "type": "announcement",
  "date": "2026-12-01",
  "title": { "en": "NocoBase 3.0", "zh-CN": "NocoBase 3.0", "ja-JP": "NocoBase 3.0" },
  "summary": { "en": "One or two sentences.", "zh-CN": "…", "ja-JP": "…" },
  "href": "blog/nocobase-3-0.html"
}
```

`href` is a site source file name (`blog/<slug>.html`, rewritten to each language's address; the post must exist or the build fails) or an `https://` address. `title` and `summary` can also be plain strings; a missing language shows English.
