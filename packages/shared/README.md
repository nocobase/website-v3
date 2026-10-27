# @nocobase/site-shared

What the NocoBase website (`homepage/`) and, in a later change, the docs site (`doc/`) have in common. It is a private package of the pnpm workspace; sites import from it by name (`@nocobase/site-shared/Header.astro`, `@nocobase/site-shared/styles/shell.css`, and so on; see `exports` in `package.json`).

| Path | What it is |
| --- | --- |
| `src/Header.astro`, `src/HeaderItem.astro` | The top navigation. Fully driven by props: the logo, an optional version switch next to it, the menu (dropdowns or plain links), the mobile menu links, the language list with the address of the current page in each language, and the links on the right (such as GitHub and its star count). All text is HTML that the caller has already localized, and all addresses are final. The website passes product menus; the docs site will pass its section tabs. |
| `src/Footer.astro` | The footer: logo, tagline, link columns and the copyright line, also all props. |
| `src/Analytics.astro` | Google Analytics 4, Baidu Tongji and Microsoft Clarity. Each site passes its own IDs (`ga4`, `baidu`, `clarity`); one that is missing is not loaded. |
| `src/shell.js` | The header's behavior: the mobile menu (it closes when a link in it is clicked) and the mobile language select. Import it from a bundled `<script>`. |
| `src/styles/tokens.css` | Color and font variables, the reset, per-language fonts and line breaking. |
| `src/styles/shell.css` | Styles of the header, language menu, version switch and footer. |
| `src/fonts/` | The Latin fonts (Archivo, IBM Plex Mono, Inter) and their `fonts.css` / `inter.css`. `pnpm fonts` in `homepage/` downloads them. |
| `src/languages.mjs` | The table of the 12 languages (code, directory, `<html lang>`, name) and the locale map for Astro's i18n and sitemap options. |
| `src/config.mjs` | `readV2RedirectPrefixes()` and the GitHub star count: a static default (`GITHUB_STARS_DEFAULT`), overridden at build time by the environment variable `GITHUB_STARS` (a raw number, formatted as `24.6K`). The star count is never requested from the browser. |
| `src/sitemap.mjs` | `serialize()` and `filter()` for `@astrojs/sitemap`: adds `x-default` (the default language) to each address and leaves noindex pages out. |
| `src/integration.mjs` | An Astro integration for the files next to the pages. It writes `robots.txt` today (`robots: { sitemap: 'sitemap-index.xml' }`); `llms` (the `llms.txt` files) and `markdownCopies` (a `.md` copy of each page) are reserved options for the docs site and throw when passed. |
| `v2-redirect-prefixes.txt` | The first path segments of the old v2 docs addresses that `docs.nocobase.com` redirects with a 301 to `nocode.docs.nocobase.com`. The docs build fails when its output root has one of them, and the website reads it for its link rewriting. It has to stay in sync with the CDN EdgeScript rule `v2_paths_to_nocode_301`; ask before changing it. |

The tests (`src/*.test.mjs`) run with the website's: `pnpm homepage:test` at the repository root.

A change to this package triggers the website's workflow (`.github/workflows/site.yml` watches `packages/shared/**`); a change to `v2-redirect-prefixes.txt` also triggers the docs workflow. Keep website-specific things out of it.
