import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { LOCALE_CODES, DIRS } from '@nocobase/site-shared/languages';
import siteFiles from '@nocobase/site-shared/integration';
import { noindexFilter, xDefaultSerializer } from '@nocobase/site-shared/sitemap';
import checks from './src/integrations/checks.mjs';
import { ORIGIN } from './src/lib/config.mjs';
import { DIST } from './src/lib/paths.mjs';
import { getSite } from './src/lib/site.mjs';

// 站点地址读 SITE_ORIGIN（canonical、hreflang、sitemap 都用它），输出目录读 SITE_OUT_DIR（默认 homepage/dist）。
// 产物的约定（CDN 回源规则依赖它，见 scripts/deploy-cdn/deploy-cdn.mjs 的 REWRITE_RULES）：每页 <路径>/index.html，地址不带扩展名、以 / 结尾，英文在根目录，根目录有 404.html。
const noindex = getSite().pages.filter(p => p.noindex).flatMap(p => p.langs.map(l => p.path(l)));

export default defineConfig({
  site: ORIGIN,
  outDir: DIST,
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_astro', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: LOCALE_CODES },
      serialize: xDefaultSerializer({ dirs: DIRS }),
      filter: noindexFilter(noindex),
    }),
    siteFiles({ robots: { sitemap: 'sitemap-index.xml' } }),
    checks(),
  ],
});
