# NocoBase 3 Documentation

The source of the NocoBase 3 docs site (`docs.nocobase.com`): an Astro static site in the pnpm workspace, sharing its header, footer, styles and fonts with the website through `packages/shared/`.

```
doc/
├── docs.config.ts   Site config: origin, languages (and their interface strings), sections, links, analytics
├── content/         The pages, one Markdown file per page; menus in meta.json files
│   ├── index.md, start/, core/, studio/   English, mirroring the URLs (served at the site root)
│   └── zh-CN/       Simplified Chinese, the same structure as the English tree (served under /zh-CN/)
├── figures/         Figure fragments (HTML), referenced from content with ::figure name | caption; figures/en/ has the English versions
├── plugins/         remark and rehype plugins (figures, callouts, links, code blocks, tables, images)
├── public/assets/   Files copied as they are (the Core screenshots and downloads, at /assets/core/...)
├── src/             The Astro app: pages/, layouts/, components/, lib/ (menus, config, checks), scripts/, styles/, integrations/
├── scripts/         The preview server and the v2 redirect prefix check
├── notes/           Tutorial verification, Skill review records, and unpublished drafts (not published)
└── dist/            The generated site (not committed)
```

## Commands

Run them from the repository root (`pnpm install` once), or inside `doc/` without the `doc:` prefix.

```bash
pnpm doc:dev       # Astro dev server on http://localhost:4321/ (no search index)
pnpm doc:build     # writes doc/dist/ and the search index; fails on any content problem
pnpm doc:preview   # serves doc/dist/ on http://localhost:4321/ the way the CDN rules map addresses
pnpm doc:test      # vitest: menus, links, plugins, llms.txt and the output checks
```

`dist/` has the layout of the live site: every page is `<path>/index.html`, addresses have no extension and end with `/` (for example `/core/getting-started/create-app/`), and internal links and assets are root-relative, so use the preview server rather than opening files directly. Besides the pages, the root has `404.html` (English only, the CDN serves a single 404 page), `sitemap-index.xml` and `sitemap-0.xml` (with `hreflang` alternates and `x-default`; placeholder pages and the 404 are left out), `robots.txt`, `llms.txt` and `zh-CN/llms.txt`, a `.md` copy of every page (`/core/index.md`, front matter stripped, title and description added, a `::figure` line replaced by its caption), the search index in `pagefind/`, and the bundled CSS, JavaScript and fonts in `_astro/`. `DOCS_SITE_ORIGIN` sets the site origin (default `https://docs.nocobase.com`), `DOCS_OUT_DIR` the output directory, and `GITHUB_STARS` the star count in the header (a raw number; the default is in `packages/shared/src/config.mjs`).

The Markdown content cache of Astro does not notice changes to figures, menus or plugins; `pnpm doc:build` always starts from a clean cache, and in the dev server you restart after editing those.

CI (`.github/workflows/docs.yml`) runs `pnpm install --frozen-lockfile`, `pnpm doc:test` and `pnpm doc:build` on every pull request and push that touches `doc/`, `packages/shared/`, the lockfile or the workflow; a failed build shows up as a failed `Docs build` check. After a change lands on `main`, `Docs publish` runs in the `production` Environment: it uploads `dist/` to a timestamped directory in OSS, switches the CDN back-to-origin rules of `docs.nocobase.com` to it, refreshes the cache, and keeps only the newest two versions (the script is in `scripts/deploy-cdn/`). The Alibaba Cloud keys, bucket, region and CDN domains are secrets of that Environment; see "CI and publishing" in the root `AGENTS.md`.

Old addresses of the v2 documentation (top-level paths and language prefixes such as `/guide/`, `/api/` and `/cn/`) are redirected with a 301 to `nocode.docs.nocobase.com`, so the output root must not have a directory with one of those names. The list is `packages/shared/v2-redirect-prefixes.txt`, kept in sync with the CDN EdgeScript rule `v2_paths_to_nocode_301`; the build fails on a clash (it also rejects `en` and `api` at the root). If you really need one of the names, remove it from both the list and the EdgeScript rule.

## docs.config.ts

```ts
export default defineDocsConfig({
  site: { origin, title: { en, 'zh-CN' }, logo },
  languages: [{ code: 'en', dir: '', hreflang: 'en', label: 'English', website: 'https://www.nocobase.com/', ui: { ... } }, { code: 'zh-CN', dir: 'zh-CN', ... }],
  sections: [{ id: 'start', dir: 'start', extra: ['index'], home: 'index', title: { en: 'Start', 'zh-CN': '开始' } }, { id: 'core', dir: 'core', home: 'core/index', ... }, ...],
  nav: { github, website, versionSwitch },
  search: { provider: 'pagefind' },
  analytics: { ga4, baidu, clarity },
});
```

- `languages`: the first one is the default; it is served at the site root (`dir: ''`) and its content is at the root of `content/`. The others are served under `/<dir>/` and their content is in `content/<dir>/`. The language menu, `hreflang`, the sitemap and one `llms.txt` per language all derive from this list. `ui` holds the interface strings of the language (previous/next, "on this page", search, callout labels, the footer columns, the "not translated yet" hint, ...); a string a language does not set falls back to the first language's.
- `sections`: the tabs in the header. `dir` is the directory (inside each language's content) with the section's `meta.json` and all its pages; `extra` lists pages outside `dir` that the menu may include (Start lists the docs home); `home` is the page the tab opens.
- `analytics` has its own IDs (the same as the website for now), so the docs can change them without touching the website.

## Menus: meta.json

The sidebar of a section is the `meta.json` in the section's directory (`content/core/meta.json`, `content/zh-CN/core/meta.json`). It has a `pages` array of entries, and every entry is an object with a `type`:

| type | fields | meaning |
| --- | --- | --- |
| `page` | `path`, optional `title` | A page. `path` is relative to the directory of this `meta.json`, without `.md`; it may contain subdirectories and `../`. `title` is the sidebar text and may differ from the page's own title; when omitted the page's front matter `title` is used. |
| `folder` | `path` | A collapsible level for a directory that has its own `meta.json` (`{ "title": "...", "defaultOpen": true, "pages": [...] }`). If its `pages` has a `page` entry with `path: "index"`, clicking the folder title opens that page (the chevron toggles) and `index` is not listed again; otherwise the title only toggles. |
| `group` | `title`, `pages` | A non-collapsible heading with entries below it. A group cannot contain a group, but a folder can contain groups. |
| `planned` | `title` | A "coming soon" entry that is not a link and has no file. |

```json
{
  "pages": [
    { "type": "page", "path": "index" },
    {
      "type": "group",
      "title": "Getting started",
      "pages": [
        { "type": "page", "path": "getting-started/what-is-core" },
        { "type": "page", "path": "tutorials/build-your-first-feature", "title": "Build your first app" },
        { "type": "planned", "title": "Backup and restore" }
      ]
    },
    { "type": "folder", "path": "setup" }
  ]
}
```

`content/studio/setup/meta.json`:

```json
{
  "title": "Set up Studio",
  "defaultOpen": true,
  "pages": [
    { "type": "page", "path": "with-agent" },
    { "type": "group", "title": "Step by step", "pages": [{ "type": "page", "path": "install" }] }
  ]
}
```

There are two ways to use subdirectories:

1. A directory **without** `meta.json` is only a storage folder. Its pages are listed from a `meta.json` above with `page` entries whose `path` goes into it (`getting-started/what-is-core`), and no level appears in the sidebar. The Core menu uses this to mix pages of `getting-started/` and `tutorials/` in one group.
2. A directory **with** a `meta.json`, referenced by a `folder` entry, becomes a collapsible level (any depth). The levels that contain the current page are open; `defaultOpen: true` opens a level by default.

Rules, all checked by the build (the error names the file and the entry):

- Every `.md` file is listed exactly once, directly or through a folder, in each language.
- A `path` must point to an existing file or directory, and a `folder` needs a `meta.json`.
- A path cannot leave the section (`dir`, plus the section's `extra` pages); there are no references between sections.
- Folders cannot form a cycle, and a directory can be the folder of only one entry.
- The `meta.json` files of the languages have the same structure (the same `type`, `path`, nesting and `defaultOpen`; only titles may differ), and both languages have the same pages.
- A page whose front matter sets `status` is a placeholder: it is shown lighter in the menu, skipped by previous / next, kept out of the sitemap, `llms.txt` and search, and marked `noindex`. An English placeholder with an empty body shows a hint that points to the other language's version (or says the page is not written yet).

## Writing

- All wording follows the NocoBase Product Definition and Standard Wording (in the [nocobase/nocobase-v3-standard](https://github.com/nocobase/nocobase-v3-standard) repository).
- Pages are `.md` (not `.mdx`; some contain handwritten HTML) with YAML front matter: `title`, `description`, and `status` for a placeholder. The front matter must be valid YAML, so quote a value that contains a colon. The title becomes the `<h1>`; write the body from `##`.
- Write internal links as relative `.md` paths (`[My tasks](../use/my-tasks.md#views)`); the build turns them into final addresses, and a link to a page that does not exist fails the build. Heading anchors are the default Astro (GitHub-style) slugs; the build checks every in-site link and anchor on the generated pages.
- `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` and `> [!PENDING]` blockquotes become callouts (`> [!NOTE] Own title` replaces the default title), and a paragraph starting with `**Done when**:` (`**完成的标志**：` in Chinese) is highlighted.
- `::figure name | caption` on a line of its own inlines `figures/name.html` (or `figures/en/name.html` on English pages when it exists; `a+b` joins two figures, extra words after the names become classes).
- Code blocks are highlighted by Shiki with a theme driven by CSS variables (`src/styles/docs.css`). Use the real language name. `text`, `plaintext`, `txt` and unlabeled blocks use a monospace font and wrap; `prompt` uses a font suited to natural-language instructions; `tree` (or a plain block containing `├──` or `└──`) is a directory tree that keeps indentation, scrolls horizontally and colors directories, files, connectors and `#` comments. Every block has a copy button.
- Temporarily unpublished pages live in `notes/drafts/`, with the same relative paths as `content/` (English at the root, Chinese under `zh-CN/`). They are not built and appear in no menu, sitemap, `llms.txt` or search. Keep their source-relative links for restoration; to publish them again, move both languages back to `content/`, add them to both `meta.json` files, and restore incoming links.

## Search

`pnpm doc:build` indexes the generated pages with [Pagefind](https://pagefind.app/) (one index per `<html lang>`, only what is inside `data-pagefind-body`, placeholder pages excluded, the section as a filter). The header's search box and Cmd/Ctrl+K (or `/`) open the dialog in `src/scripts/search.js`; the index does not exist in the dev server. Chinese and Japanese pages are indexed character by character (`src/lib/cjk.mjs`): Pagefind segments these languages with a dictionary when indexing but with the browser's `Intl.Segmenter` when searching, and the two disagree, so a page containing 创建插件 would not be found by searching it. The build hands Pagefind a copy of each such page with its characters spaced apart (the files in `dist/` are unchanged), the dialog spaces the query the same way, searches it as an exact phrase first and then as all of its characters, puts pages whose title matches first, and removes the spaces again before showing titles and excerpts. Code block toolbars and the breadcrumb are left out of the index.

## How to add things

- **A page**: create the `.md` file in `content/zh-CN/` and at the same path in `content/` (an untranslated English page contains only front matter and `status: placeholder`), then add a `page` entry to the `meta.json` of both languages (with a `title` for the sidebar when it should differ). Moving or renaming a page means changing both `meta.json` files and every link to it.
- **A collapsible level**: create a directory with a `meta.json` in both languages and add a `folder` entry above it.
- **A language**: add an entry to `languages` in `docs.config.ts` (with its `ui` strings and `website` URL) and a directory `content/<dir>/` with the same structure; its name must not clash with a content directory (`core`, `studio`, ...) or the v2 redirect prefixes. If it has its own figures, put them in `figures/<code>/`. Add `@nocobase/site-shared`'s `inter.css` import in `src/layouts/Layout.astro` for languages that need Inter (Russian).
- **A section**: add it to `sections` with a `dir`, create `content/<dir>/meta.json` (and the same for every other language) and the section's pages. Sections are tabs in the header, so keep their number small. Check that `dir` is not one of the v2 prefixes.

## Core content

Core started from the content and menu of `nocobase/app-docs`, migrated from baseline `5d8bdbe93bf63c6066013b121b189b3f8fdcad33`. 22 articles were migrated in each language, followed by a plugin overview and 13 plugin development articles. Keeping the Studio deployment guide as an unpublished draft leaves 35 per language in `content/zh-CN/core/` and `content/core/`. They are maintained here and are not regenerated or overwritten from the old site. The earlier Core drafts and placeholder pages have been replaced.

The menu has six groups: Getting started, Developing apps, Developing plugins, Capabilities, Deployment and operations, and Reference. Developing plugins lists articles in reading order without internal subgroup headings: When to write a plugin, Create a plugin, Plugin structure, Write your first plugin, Pages and menus, Server APIs, ServiceProvider, Database and migrations, Localization, Extend the command line, Testing and verification, Write plugin skills, and Publish a plugin. All 13 have complete English and Chinese content under `core/extension-development/`. ServiceProvider covers client and server service registration, dependency use and lifecycle in one article. Contributing to the UI component library is no longer part of this chapter.

Core deployment covers independent production applications: Choose a deployment method, Deploy with Docker, Deploy with PM2 (app-installer), and Publish an application release. PM2 supervises the process; app-installer handles installation and updates. The app-installer guide keeps its `core/tutorials/deploy-with-app-installer` path. Studio installation, CI previews, and Studio-managed releases belong to the Studio section. The former `core/tutorials/deploy-to-studio` guide, retitled Upload and preview an application, is temporarily unpublished. Its English and Chinese sources are retained at `notes/drafts/studio/project/deploy-app.md` and `notes/drafts/zh-CN/studio/project/deploy-app.md` for later restoration to the Studio section. It has no menu entry, incoming links, or generated page. Studio's home page and deployment guidance direct readers to CI previews. Existing screenshot assets remain under `public/assets/core/tutorials/deployment/`.

Capabilities provides concrete entries for the database, authentication and users, permissions, files, workflows, notifications, AI and external integrations. Localization appears only under Developing plugins, so its page ownership and previous / next links remain unambiguous. The plugin overview sits under Reference and lists main and commercial application plugins plus database dialects, checked against the source. The example plugin inventory is omitted. The remaining unwritten capability, reference and operations entries appear in the Core `meta.json` as `planned` entries, shown as unclickable to-be-written items that generate no empty article and are left out of previous / next and the sitemap.

Plugin development starts in a standalone App created with create-app, with local plugins under its `packages/` workspace. Creation uses `pnpm create @nocobase/plugin@beta` to invoke `@nocobase/create-plugin`, explaining Agent and manual workflows, capability selection and dependency handling. Plugin structure uses an announcements plugin to explain the complete directory reference, entry points, source files and plugin/App builds. The first-plugin tutorial implements a public announcements API, an authenticated page and menu, English and Chinese translations, API and page tests, registration and an App build. Pages and menus uses `help-center` to demonstrate sidebar entries, nested pages, default redirects, history, localization and access policies. Publishing explains that local plugins ship with the App without publication, then uses Verdaccio to demonstrate a private registry, package preparation, publishing and installation in another App. Editable UI ownership follows UI Library conventions. When commands or scaffold structure change, update both languages and the related plugin-management and Core landing-page links.

The original articles keep their directories and file names with a `core/` prefix, except for the Studio guide described above; MDX was converted to Markdown and internal links were changed to relative `.md` paths. Core's Chinese addresses start with `/zh-CN/core/` and English addresses with `/core/`. Screenshots are stored in `public/assets/core/` and referenced from content as `/assets/core/...`; example download packages are stored in `public/assets/core/downloads/`. Only assets referenced by articles were migrated; the old site's framework, runtime data and local test accounts were not copied.

Chinese is the writing reference, while example code, application screens and screenshots use English. The two paths, with and without an Agent, are kept, along with key code, the original collapsible sections, source links pinned to fixed versions, and the scope of verification.

The later plugin articles use separate `notice-api`, `notice-services`, `notice-data`, `notice-i18n` and `notice-cli` examples for APIs, services, migrations, localization and commands. Testing and verification distinguishes plugin tests, App behavior and delivery checks; writing plugin Skills distinguishes maintained sources, synchronized copies and actual invocation. Tutorial verification and Skill findings are tracked in `notes/plugin-development-skill-review.md`, outside the public menu.
