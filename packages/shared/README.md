# @nocobase/site-shared

What the NocoBase website (`homepage/`) and the docs site (`doc/`) have in common. It is a private package of the pnpm workspace; sites import from it by name (`@nocobase/site-shared/Header.astro`, `@nocobase/site-shared/styles/shell.css`, and so on; see `exports` in `package.json`).

| Path | What it is |
| --- | --- |
| `src/Header.astro`, `src/HeaderItem.astro` | The top navigation. Fully driven by props: the logo, an optional version switch next to it, the menu (dropdowns or plain links), the mobile menu links, the language list with the address of the current page in each language, and the links on the right (such as GitHub and its star count). All text is HTML that the caller has already localized, and all addresses are final. The website passes product menus; the docs site passes its section tabs as plain menu links. Three optional props are for the docs only: `label` (the "Docs" text after the version switch), `search` (a search button with `data-search-open`; the page's script opens the dialog) and the named slot `mobile` (the sidebar, shown in the mobile menu panel). Without them the output is the website's. |
| `src/Footer.astro` | The footer: logo, tagline, link columns and the copyright line, also all props. |
| `src/Analytics.astro` | Google Analytics 4, Baidu Tongji and Microsoft Clarity. Each site passes its own IDs (`ga4`, `baidu`, `clarity`); one that is missing is not loaded. |
| `src/shell.js` | The header's behavior: the mobile menu (it closes when a link in it is clicked) and the mobile language select. Import it from a bundled `<script>`. |
| `src/styles/tokens.css` | Color and font variables, the reset, per-language fonts and line breaking. |
| `src/styles/shell.css` | Styles of the header, language menu, version switch and footer. |
| `src/fonts/` | The Latin fonts (Archivo, IBM Plex Mono, Inter) and their `fonts.css` / `inter.css`. `pnpm fonts` in `homepage/` downloads them. |
| `src/languages.mjs` | The table of the 12 languages (code, directory, `<html lang>`, name) and the locale map for Astro's i18n and sitemap options. |
| `src/config.mjs` | `readV2RedirectPrefixes()` and the GitHub star count: a static default (`GITHUB_STARS_DEFAULT`), overridden at build time by the environment variable `GITHUB_STARS` (a raw number, formatted as `24.6K`). The star count is never requested from the browser. |
| `src/sitemap.mjs` | `serialize()` and `filter()` for `@astrojs/sitemap`: adds `x-default` (the default language) to each address and leaves noindex pages out. |
| `src/integration.mjs` | An Astro integration for the files next to the pages. Options, all optional: `robots` (`{ sitemap: 'sitemap-index.xml' }` writes `robots.txt`), `llms` (an array, or a function returning one, of `{ path, title, summary, sections: [{ title, groups: [{ title?, pages: [{ title, description?, path }] }] }] }`, each written as an `llms.txt` whose links point to the pages' `.md` copies) and `markdownCopies` (an array or function of `{ path, title, description?, body }`, each written as a `.md` file: the title, the description as a quote, then the body). The docs site enables `llms` and `markdownCopies`; the website only `robots`. `llmsTxt()` and `markdownCopy()` are exported for tests. |
| `v2-redirect-prefixes.txt` | The first path segments of the old v2 docs addresses that `docs.nocobase.com` redirects with a 301 to `nocode.docs.nocobase.com`. The docs build fails when its output root has one of them, and the website reads it for its link rewriting. It has to stay in sync with the CDN EdgeScript rule `v2_paths_to_nocode_301`; ask before changing it. |

The tests (`src/*.test.mjs`) run with the website's: `pnpm homepage:test` at the repository root.

A change to this package triggers both workflows (`.github/workflows/site.yml` and `docs.yml` watch `packages/shared/**`). After changing a component or style here, rebuild both sites; the website's output must change only where you meant it to (build `homepage` before and after and compare `homepage/dist/`). Keep site-specific things out of it: the website's menus and the docs' sidebar are built by each site and passed in as props.
