# NocoBase 3 Documentation

```
doc/
├── src/           English content (Markdown), served at the site root; Core has full English and Chinese articles
│   └── zh-CN/     Simplified Chinese content, served under /zh-CN/; Chinese is the reference, and its structure matches English exactly
├── figures/       Inline figures (HTML fragments), referenced in content with ::figure name | caption
├── assets/        Styles, scripts and the logo
├── notes/         Tutorial verification and Skill review records (not published)
├── scripts/       Checks used by the build
├── build.mjs      Build script, writes to dist/ (not committed)
└── serve.mjs      Local preview
```

## Build and preview

```bash
cd doc && npm ci
node build.mjs     # writes doc/dist/
node serve.mjs     # preview at http://localhost:4321/
```

`dist/` has the same layout as the live site: every page is `<path>/index.html`, addresses have no extension and end with `/` (for example `/core/quickstart/`), and all internal links and assets use root-relative paths, so preview it through `serve.mjs` rather than opening the files directly. The root also contains `404.html`, `sitemap.xml`, `robots.txt`, `llms.txt` and a `.md` copy of every page. The site origin used for canonical, hreflang and the sitemap comes from the `DOCS_SITE_ORIGIN` environment variable and defaults to `https://docs.nocobase.com`; the output directory comes from `DOCS_OUT_DIR`.

This repository's GitHub Actions workflow (`.github/workflows/docs.yml`) builds the docs site on every pull request and push that changes `doc/`; a failed build shows up as a failed `Docs build` check on the pull request or commit. After a change lands on `main`, `Docs publish` runs in the `production` Environment: it uploads `dist/` to a timestamped directory in OSS, switches the CDN back-to-origin rules of `docs.nocobase.com` to it, refreshes the cache, and keeps only the newest two versions (the script is in `scripts/deploy-cdn/` at the repository root). The Alibaba Cloud keys, bucket, region and CDN domains used for publishing are secrets of that Environment; see "CI and publishing" in the root `AGENTS.md`.

Old addresses of the v2 documentation on `docs.nocobase.com` (top-level paths and language prefixes such as `/guide/`, `/api/` and `/cn/`) are redirected with a 301 to the same address on `nocode.docs.nocobase.com`, so the docs site must not have a top-level directory with any of those names. The list is in `scripts/v2-redirect-prefixes.txt` and is kept in sync with the CDN EdgeScript rule `v2_paths_to_nocode_301`; after generating the site, `build.mjs` checks it with `scripts/check-v2-redirect-prefixes.mjs`, and a name clash fails the build, so CI does not publish. If you really need one of the listed names, remove it from both the list and the EdgeScript rule.

## Writing

- All wording follows the NocoBase Product Definition and Standard Wording (in the [nocobase/nocobase-v3-standard](https://github.com/nocobase/nocobase-v3-standard) repository).
- To add a page, create the Markdown file under `src/zh-CN/`, put the English page at the same path under `src/` (if it is not translated yet, give it only front matter with `status: placeholder`), and register it in `SECTIONS` in `build.mjs`. The build fails when the menu and the source files disagree or a page appears more than once in the menu; each page has one owning group and one position in the reading order.
- A page whose front matter sets `status` is a placeholder (Chinese pages use 待编写 or 待改写): it is shown in a lighter color in the menu and is skipped by previous / next. An English placeholder with an empty body automatically points readers to the Chinese version.
- Write internal links as relative `.md` paths (for example `[My tasks](../use/my-tasks.md#views)`); the build turns them into final addresses, and a link to a page that does not exist fails the build.

- Use the actual language name for code fences. `text`, `plaintext`, `txt` and unlabeled blocks use a monospace font and wrap long lines; `prompt` uses a font and wrapping suited to natural-language instructions. Use `tree` for directory trees, or let plain-text trees containing `├──` or `└──` be detected automatically. Trees preserve indentation and horizontal scrolling, distinguish directories, files, connectors and comments starting with `#` after at least two spaces, and keep copied text unchanged.

## Core content

Core started from the content and menu of `nocobase/app-docs`, migrated from baseline `5d8bdbe93bf63c6066013b121b189b3f8fdcad33`. 22 articles were migrated in each language, followed by a plugin overview and 13 plugin development articles, giving 36 per language in `src/zh-CN/core/` and `src/core/`. They are maintained here and are not regenerated or overwritten from the old site. The earlier Core drafts and placeholder pages have been replaced; Getting started and Studio are kept, with only their links to Core and the example notes on the home page corrected.

The menu has six groups: Getting started, Developing apps, Developing plugins, Capabilities, Deployment and operations, and Reference. Developing plugins lists articles in reading order without internal subgroup headings: When to write a plugin, Create a plugin, Plugin structure, Write your first plugin, Pages and menus, Server APIs, ServiceProvider, Database and migrations, Localization, Extend the command line, Testing and verification, Write plugin skills, and Publish a plugin. All 13 have complete English and Chinese content under `core/extension-development/`. ServiceProvider covers client and server service registration, dependency use and lifecycle in one article. Contributing to the UI component library is no longer part of this chapter.

The three deployment guides are ordered Docker, app-installer, Studio. Capabilities provides concrete entries for the database, authentication and users, permissions, files, workflows, notifications, AI and external integrations. Localization appears only under Developing plugins, so its page ownership and previous / next links remain unambiguous. The plugin overview sits under Reference and lists the complete set of plugins, checked against the source. The remaining unwritten capability, reference and operations entries appear in `SECTIONS` as `{ planned: [English title, Chinese title] }`, shown as unclickable to-be-written items that generate no empty article and are left out of previous / next and the sitemap.

Plugin development starts in a standalone App created with create-app, with local plugins under its `packages/` workspace. Creation uses `pnpm create @nocobase/plugin@beta` to invoke `@nocobase/create-plugin`, explaining Agent and manual workflows, capability selection and dependency handling. Plugin structure uses an announcements plugin to explain the complete directory reference, entry points, source files and plugin/App builds. The first-plugin tutorial implements a public announcements API, an authenticated page and menu, English and Chinese translations, API and page tests, registration and an App build. Pages and menus uses `help-center` to demonstrate sidebar entries, nested pages, default redirects, history, localization and access policies. Publishing explains that local plugins ship with the App without publication, then uses Verdaccio to demonstrate a private registry, package preparation, publishing and installation in another App. Editable UI ownership follows UI Library conventions. When commands or scaffold structure change, update both languages and the related plugin-management and Core landing-page links.

The original articles keep their directories and file names with a `core/` prefix; MDX was converted to Markdown and internal links were changed to relative `.md` paths. Chinese addresses start with `/zh-CN/core/` and English addresses with `/core/`. Screenshots are stored in `assets/core/` and referenced from content as `/assets/core/...`; example download packages are stored in `assets/core/downloads/`. Only assets referenced by articles were migrated; the old site's framework, runtime data and local test accounts were not copied.

Chinese is the writing reference, while example code, application screens and screenshots use English. The two paths, with and without an Agent, are kept, along with key code, the original collapsible sections, source links pinned to fixed versions, and the scope of verification.

The later plugin articles use separate `notice-api`, `notice-services`, `notice-data`, `notice-i18n` and `notice-cli` examples for APIs, services, migrations, localization and commands. Testing and verification distinguishes plugin tests, App behavior and delivery checks; writing plugin Skills distinguishes maintained sources, synchronized copies and actual invocation. Tutorial verification and Skill findings are tracked in `notes/plugin-development-skill-review.md`, outside the public menu.
