# NocoBase 3 Documentation

```
doc/
├── src/           English content (Markdown), served at the site root; Core has full English and Chinese articles
│   └── zh-CN/     Simplified Chinese content, served under /zh-CN/; Chinese is the reference, and its structure matches English exactly
├── figures/       Inline figures (HTML fragments), referenced in content with ::figure name | caption
├── assets/        Styles, scripts and the logo
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
- To add a page, create the Markdown file under `src/zh-CN/`, put the English page at the same path under `src/` (if it is not translated yet, give it only front matter with `status: placeholder`), and register it in `SECTIONS` in `build.mjs`. The build fails when the menu and the source files disagree.
- A page whose front matter sets `status` is a placeholder (Chinese pages use 待编写 or 待改写): it is shown in a lighter color in the menu and is skipped by previous / next. An English placeholder with an empty body automatically points readers to the Chinese version.
- Write internal links as relative `.md` paths (for example `[My tasks](../use/my-tasks.md#views)`); the build turns them into final addresses, and a link to a page that does not exist fails the build.

## Core content

Core uses the existing content and menu of `nocobase/app-docs` in full, migrated from baseline `5d8bdbe93bf63c6066013b121b189b3f8fdcad33`. 22 articles were migrated in each language and a plugin overview was added in each, giving 23 per language, in `src/zh-CN/core/` and `src/core/`. They are maintained here from now on and are not regenerated or overwritten from the old site. The earlier Core drafts and placeholder pages have been replaced; Getting started and Studio are kept, with only their links to Core and the example notes on the home page corrected.

The menu has six groups: Getting started, Developing apps, Extending, Capabilities, Deployment and operations, and Reference. Extending lists When to write a plugin, Creating a plugin, Plugin structure, Publishing a plugin, Writing skills for a plugin, and Contributing to the UI component library, all six as unclickable to-be-written entries. The three deployment guides are ordered Docker, app-installer, Studio. Capabilities provides concrete entries for the database, authentication and users, permissions, files, workflows, notifications, AI and more, plus external integrations; the plugin overview sits under Reference and lists the complete set of plugins, checked against the source. The capabilities overview, database, authentication and users, access control and file management have been moved back to to-be-written; all capabilities, the remaining reference pages and some operations entries are not written yet and appear in `SECTIONS` as `{ planned: [English title, Chinese title] }`, shown as unclickable to-be-written items that generate no empty article and are left out of previous / next and the sitemap.

The original articles keep their directories and file names with a `core/` prefix; MDX was converted to Markdown and internal links were changed to relative `.md` paths. Chinese addresses start with `/zh-CN/core/` and English addresses with `/core/`. Screenshots are stored in `assets/core/` and referenced from content as `/assets/core/...`; example download packages are stored in `assets/core/downloads/`. Only assets referenced by articles were migrated; the old site's framework, runtime data and local test accounts were not copied.

Chinese is the writing reference, while example code, application screens and screenshots use English. The two paths, with and without an Agent, are kept, along with key code, the original collapsible sections, source links pinned to fixed versions, and the scope of verification.
