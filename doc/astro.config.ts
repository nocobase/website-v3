import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import siteFiles from '@nocobase/site-shared/integration';
import { noindexFilter, xDefaultSerializer } from '@nocobase/site-shared/sitemap';
import remarkCallouts from './plugins/remark-callouts.mjs';
import remarkFigures from './plugins/remark-figures.mjs';
import remarkLinks from './plugins/remark-links.mjs';
import rehypeDocs, { SPECIAL_LANGS, codeTitleTransformer } from './plugins/rehype-docs.mjs';
import docs from './src/integrations/docs.mjs';
import { docsFiles } from './src/lib/llms.mjs';
import { createAiProxy } from './src/lib/ai-proxy.mjs';
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
    '/studio/reference/agent-execution/': '/studio/intro/agent-team/',
    '/studio/reference/concepts/': '/studio/intro/concepts/',
    '/zh-CN/studio/reference/agent-execution/': '/zh-CN/studio/intro/agent-team/',
    '/zh-CN/studio/reference/concepts/': '/zh-CN/studio/intro/concepts/',
    '/ja-JP/studio/reference/agent-execution/': '/ja-JP/studio/intro/agent-team/',
    '/ja-JP/studio/reference/concepts/': '/ja-JP/studio/intro/concepts/',
    '/core/getting-started/create-app-with-database/': '/core/reference/database-configuration/',
    '/studio/setup/first-request/': '/getting-started/collaborate-with-studio/',
    '/getting-started/from-v2/': '/faq/from-v2/',
    '/getting-started/glossary/': '/getting-started/what-is-nocobase/',
    '/core/getting-started/create-app/': '/getting-started/develop-your-first-app/#create-and-start-the-application',
    '/core/getting-started/build-your-first-app/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/core/getting-started/develop-with-an-agent/': '/getting-started/develop-your-first-app/#refine-and-continue-developing',
    '/start/from-v2/': '/faq/from-v2/',
    '/start/glossary/': '/getting-started/what-is-nocobase/',
    '/zh-CN/core/getting-started/create-app-with-database/': '/zh-CN/core/reference/database-configuration/',
    '/zh-CN/studio/setup/first-request/': '/zh-CN/getting-started/collaborate-with-studio/',
    '/zh-CN/getting-started/from-v2/': '/zh-CN/faq/from-v2/',
    '/zh-CN/getting-started/glossary/': '/zh-CN/getting-started/what-is-nocobase/',
    '/zh-CN/core/getting-started/create-app/': '/zh-CN/getting-started/develop-your-first-app/#创建并启动应用',
    '/zh-CN/core/getting-started/build-your-first-app/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
    '/zh-CN/core/getting-started/develop-with-an-agent/': '/zh-CN/getting-started/develop-your-first-app/#调整功能并继续迭代',
    '/zh-CN/start/from-v2/': '/zh-CN/faq/from-v2/',
    '/zh-CN/start/glossary/': '/zh-CN/getting-started/what-is-nocobase/',
    '/ja-JP/core/getting-started/create-app-with-database/': '/ja-JP/core/reference/database-configuration/',
    '/ja-JP/studio/setup/first-request/': '/ja-JP/getting-started/collaborate-with-studio/',
    '/ja-JP/getting-started/from-v2/': '/ja-JP/faq/from-v2/',
    '/ja-JP/getting-started/glossary/': '/ja-JP/getting-started/what-is-nocobase/',
    '/ja-JP/core/getting-started/create-app/': '/ja-JP/getting-started/develop-your-first-app/#アプリを作成して起動する',
    '/ja-JP/core/getting-started/build-your-first-app/': '/ja-JP/getting-started/develop-your-first-app/#最初の業務要件を伝える',
    '/ja-JP/core/getting-started/develop-with-an-agent/': '/ja-JP/getting-started/develop-your-first-app/#改善して開発を続ける',
    '/ja-JP/start/from-v2/': '/ja-JP/faq/from-v2/',
    '/ja-JP/start/glossary/': '/ja-JP/getting-started/what-is-nocobase/',
    '/start/what-is-nocobase/': '/getting-started/what-is-nocobase/',
    '/zh-CN/start/what-is-nocobase/': '/zh-CN/getting-started/what-is-nocobase/',
    '/ja-JP/start/what-is-nocobase/': '/ja-JP/getting-started/what-is-nocobase/',

    '/studio/setup/with-agent/': '/studio/setup/',
    '/zh-CN/studio/setup/with-agent/': '/zh-CN/studio/setup/',
    '/ja-JP/studio/setup/with-agent/': '/ja-JP/studio/setup/',

    '/core/getting-started/what-is-core/': '/core/',
    '/core/getting-started/what-is-core-2/': '/core/',
    '/core/getting-started/create-app-2/': '/getting-started/develop-your-first-app/#create-and-start-the-application',
    '/core/getting-started/project-structure/': '/core/developing-apps/project-structure/',
    '/core/tutorials/build-your-first-app/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/core/tutorials/build-your-first-app-3/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/core/tutorials/build-your-first-app-agent-first/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/core/developing-apps/overview-2/': '/core/developing-apps/overview/',
    '/core/developing-apps/develop-with-an-agent/': '/getting-started/develop-your-first-app/#refine-and-continue-developing',
    '/core/developing-apps/develop-with-an-agent-2/': '/getting-started/develop-your-first-app/#refine-and-continue-developing',
    '/zh-CN/core/getting-started/what-is-core/': '/zh-CN/core/',
    '/zh-CN/core/getting-started/what-is-core-2/': '/zh-CN/core/',
    '/zh-CN/core/getting-started/create-app-2/': '/zh-CN/getting-started/develop-your-first-app/#创建并启动应用',
    '/zh-CN/core/getting-started/project-structure/': '/zh-CN/core/developing-apps/project-structure/',
    '/zh-CN/core/tutorials/build-your-first-app/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
    '/zh-CN/core/tutorials/build-your-first-app-3/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
    '/zh-CN/core/tutorials/build-your-first-app-agent-first/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
    '/zh-CN/core/developing-apps/overview-2/': '/zh-CN/core/developing-apps/overview/',
    '/zh-CN/core/developing-apps/develop-with-an-agent/': '/zh-CN/getting-started/develop-your-first-app/#调整功能并继续迭代',
    '/zh-CN/core/developing-apps/develop-with-an-agent-2/': '/zh-CN/getting-started/develop-your-first-app/#调整功能并继续迭代',
    '/core/tutorials/build-your-first-feature/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/core/tutorials/build-your-first-feature-agent-first/': '/getting-started/develop-your-first-app/#describe-your-first-business-requirement',
    '/zh-CN/core/tutorials/build-your-first-feature/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
    '/zh-CN/core/tutorials/build-your-first-feature-agent-first/': '/zh-CN/getting-started/develop-your-first-app/#提出第一个业务需求',
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
  vite: {
    build: { assetsInlineLimit: 0 },
    plugins: [{
      name: 'docs-local-ai-proxy',
      enforce: 'pre',
      configureServer(server) {
        const proxyAi = createAiProxy(process.env.DOCS_AI_PROXY_TARGET ?? 'http://127.0.0.1:3100');
        server.middlewares.use((req, res, next) => { if (!proxyAi(req, res)) next(); });
      },
    }],
  },
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: SPECIAL_LANGS },
    shikiConfig: {
      theme: 'css-variables',
      // The theme colors come from CSS variables (src/styles/docs.css); the toolbar and block look come from rehype-docs
      transformers: [codeTitleTransformer, { pre(node) { delete node.properties.style; } }],
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
