// Docs-specific build steps: a fresh content cache for production builds, the checks on the output, and the Pagefind search index.
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';
import { checkLayout, findDeadLinks } from '../lib/checks.mjs';
import { DOC_ROOT } from '../lib/paths.mjs';
import { getSite } from '../lib/site.mjs';

export default function docs() {
  return {
    name: 'doc/build',
    hooks: {
      'astro:config:setup': ({ command }) => {
        // The content cache is keyed by the Markdown text only; figures, menus and plugins are not part of it, so a production build always starts clean.
        if (command === 'build') rmSync(join(DOC_ROOT, '.astro'), { recursive: true, force: true });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const { config } = getSite();
        const errors = [...checkLayout(root, { dirs: config.languages.map(l => l.dir).filter(Boolean) }), ...findDeadLinks(root)];
        if (errors.length) {
          for (const e of errors.slice(0, 100)) logger.error(e);
          throw new Error(`The output has ${errors.length} problem${errors.length === 1 ? '' : 's'} (listed above)`);
        }
        // Pagefind indexes the built pages: one index per <html lang>, only what is inside data-pagefind-body
        const { index } = await pagefind.createIndex({});
        const added = await index.addDirectory({ path: root });
        if (added.errors.length) throw new Error(`Pagefind: ${added.errors.join('; ')}`);
        const written = await index.writeFiles({ outputPath: join(root, 'pagefind') });
        if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join('; ')}`);
        await pagefind.close();
        logger.info(`search index: ${added.page_count} pages`);
      },
    },
  };
}
