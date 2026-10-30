import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import siteFiles from '@nocobase/site-shared/integration';
import { noindexFilter, xDefaultSerializer } from '@nocobase/site-shared/sitemap';
import remarkCallouts from './plugins/remark-callouts.mjs';
import remarkFigures from './plugins/remark-figures.mjs';
import remarkLinks from './plugins/remark-links.mjs';
import rehypeDocs, { SPECIAL_LANGS } from './plugins/rehype-docs.mjs';
import docs from './src/integrations/docs.mjs';
import { docsFiles } from './src/lib/llms.mjs';
import { DIST } from './src/lib/paths.mjs';
import { getSite } from './src/lib/site.mjs';

// Output contract (the CDN's back-to-origin rules depend on it, see scripts/deploy-cdn/deploy-cdn.mjs): every page is <path>/index.html, addresses have no extension and end with /, English is at the root and other languages under /<dir>/, the root has one 404.html.
// DOCS_SITE_ORIGIN sets the site origin (docs.config.ts), DOCS_OUT_DIR the output directory (default doc/dist).
const site = getSite();
const { config } = site;
const noindex = [...site.pages.filter(p => p.placeholder).map(p => p.url), '/404.html'];

export default defineConfig({
  site: config.site.origin,
  outDir: DIST,
  trailingSlash: 'always',
  redirects: {
    '/guides/build-sustainable-enterprise-apps/': '/guides/what-nocobase-brings/',
    '/zh-CN/guides/build-sustainable-enterprise-apps/': '/zh-CN/guides/what-nocobase-brings/',
    '/core/getting-started/what-is-core-2/': '/core/getting-started/what-is-core/',
    '/core/getting-started/create-app-2/': '/core/getting-started/create-app/',
    '/core/tutorials/build-your-first-app-3/': '/core/tutorials/build-your-first-app/',
    '/core/tutorials/build-your-first-app-agent-first/': '/core/tutorials/build-your-first-app/',
    '/core/developing-apps/overview-2/': '/core/developing-apps/overview/',
    '/core/developing-apps/develop-with-an-agent-2/': '/core/developing-apps/develop-with-an-agent/',
    '/zh-CN/core/getting-started/what-is-core-2/': '/zh-CN/core/getting-started/what-is-core/',
    '/zh-CN/core/getting-started/create-app-2/': '/zh-CN/core/getting-started/create-app/',
    '/zh-CN/core/tutorials/build-your-first-app-3/': '/zh-CN/core/tutorials/build-your-first-app/',
    '/zh-CN/core/tutorials/build-your-first-app-agent-first/': '/zh-CN/core/tutorials/build-your-first-app/',
    '/zh-CN/core/developing-apps/overview-2/': '/zh-CN/core/developing-apps/overview/',
    '/zh-CN/core/developing-apps/develop-with-an-agent-2/': '/zh-CN/core/developing-apps/develop-with-an-agent/',
    '/core/tutorials/build-your-first-feature/': '/core/tutorials/build-your-first-app/',
    '/core/tutorials/build-your-first-feature-agent-first/': '/core/tutorials/build-your-first-app/',
    '/zh-CN/core/tutorials/build-your-first-feature/': '/zh-CN/core/tutorials/build-your-first-app/',
    '/zh-CN/core/tutorials/build-your-first-feature-agent-first/': '/zh-CN/core/tutorials/build-your-first-app/',
    '/core/framework/services/client-services/': '/core/framework/services/integration/',
    '/core/framework/services/server-services/': '/core/framework/services/integration/',
    '/zh-CN/core/framework/services/client-services/': '/zh-CN/core/framework/services/integration/',
    '/zh-CN/core/framework/services/server-services/': '/zh-CN/core/framework/services/integration/',
    '/core/extension-development/initial-data/': '/core/extension-development/database-and-migrations/',
    '/zh-CN/core/extension-development/initial-data/': '/zh-CN/core/extension-development/database-and-migrations/',
    '/core/developing-apps/initial-data/': '/core/developing-apps/data-models-and-migrations/',
    '/zh-CN/core/developing-apps/initial-data/': '/zh-CN/core/developing-apps/data-models-and-migrations/',
    '/core/developing-apps/localization-and-themes/': '/core/developing-apps/localization/',
    '/zh-CN/core/developing-apps/localization-and-themes/': '/zh-CN/core/developing-apps/localization/',
  },
  build: { format: 'directory', assets: '_astro', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: SPECIAL_LANGS },
    shikiConfig: {
      theme: 'css-variables',
      // The theme colors come from CSS variables (src/styles/docs.css); the toolbar and block look come from rehype-docs
      transformers: [{ pre(node) { delete node.properties.style; } }],
    },
    processor: unified({
      gfm: true,
      smartypants: false,
      remarkPlugins: [remarkFigures, remarkCallouts, remarkLinks],
      rehypePlugins: [rehypeDocs],
    }),
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: config.defaultLanguage.code, locales: Object.fromEntries(config.languages.map(l => [l.dir || l.code, l.hreflang])) },
      serialize: xDefaultSerializer({ dirs: config.languages.map(l => l.dir).filter(Boolean), defaultLang: config.defaultLanguage.hreflang }),
      filter: noindexFilter(noindex),
    }),
    siteFiles({ robots: { sitemap: 'sitemap-index.xml' }, ...docsFiles(site) }),
    docs(),
  ],
});
