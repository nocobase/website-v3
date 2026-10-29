// Docs-specific build steps: a fresh content cache for production builds, the checks on the output, and the Pagefind search index. In the dev server it also serves the pages' .md copies, which the build writes.
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as pagefind from 'pagefind';
import { markdownCopy } from '@nocobase/site-shared/integration';
import { checkLayout, findDeadLinks } from '../lib/checks.mjs';
import { spaceCjkHtml } from '../lib/cjk.mjs';
import { DOC_ROOT } from '../lib/paths.mjs';
import { docsFiles } from '../lib/llms.mjs';
import { buildSite, getSite } from '../lib/site.mjs';

export default function docs() {
  return {
    name: 'doc/build',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        // Figures, menus and plugins are not part of the Markdown cache key, so builds need a fresh cache.
        // Keep it separate: .astro contains the running dev server's content store.
        if (command === 'build') {
          const cacheDir = pathToFileURL(join(DOC_ROOT, 'node_modules', '.astro-build') + '/');
          rmSync(cacheDir, { recursive: true, force: true });
          updateConfig({ cacheDir });
        }
      },
      // The Copy Markdown button fetches <page>.md. The content is read again on every request, so an edited page is copied as it is now.
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const path = decodeURIComponent((req.url ?? '').split('?')[0]);
          if (!path.endsWith('.md')) return next();
          let copy;
          try { copy = docsFiles(buildSite()).markdownCopies.find(c => `/${c.path}` === path); } catch { /* a content error is reported on the page itself */ }
          if (!copy) return next();
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.end(markdownCopy(copy));
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const { config } = getSite();
        const errors = [...checkLayout(root, { dirs: config.languages.map(l => l.dir).filter(Boolean) }), ...findDeadLinks(root)];
        if (errors.length) {
          for (const e of errors.slice(0, 100)) logger.error(e);
          throw new Error(`The output has ${errors.length} problem${errors.length === 1 ? '' : 's'} (listed above)`);
        }
        // Pagefind indexes the built pages: one index per <html lang>, only what is inside data-pagefind-body. Chinese and Japanese pages are indexed character by character (lib/cjk.mjs); the files on disk are not changed.
        const { index } = await pagefind.createIndex({});
        let pages = 0;
        for (const file of readdirSync(root, { recursive: true }).filter(f => f.endsWith('.html')).sort()) {
          const html = readFileSync(join(root, file), 'utf8');
          const lang = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1] ?? '';
          const added = await index.addHTMLFile({ sourcePath: file, content: /^(zh|ja)\b/i.test(lang) ? spaceCjkHtml(html) : html });
          if (added.errors.length) throw new Error(`Pagefind (${file}): ${added.errors.join('; ')}`);
          if (added.file) pages++;
        }
        const written = await index.writeFiles({ outputPath: join(root, 'pagefind') });
        if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join('; ')}`);
        await pagefind.close();
        logger.info(`search index: ${pages} pages`);
      },
    },
  };
}
