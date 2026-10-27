// Checks on the generated site (run after the build by src/integrations/docs.mjs): the output layout the CDN rules depend on, and that every internal link, asset and anchor exists.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findV2RedirectConflicts } from '../../scripts/check-v2-redirect-prefixes.mjs';

const RESERVED_ROOT = ['en', 'api'];
const SKIP_DIRS = new Set(['_astro', 'pagefind']);

function htmlFiles(root) {
  const out = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (dir !== root || !SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name)); } else if (entry.name.endsWith('.html')) out.push(join(dir, entry.name));
    }
  };
  walk(root);
  return out;
}

/** The file a root-relative address is served from, following the CDN rules: a trailing / or no extension means <path>/index.html. */
export function fileOfUrl(root, pathname) {
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return join(root, pathname.endsWith('/') ? `${pathname}index.html` : last.includes('.') ? pathname : `${pathname}/index.html`);
}

/** Dead internal links, asset references and anchors of the HTML pages in `root`. */
export function findDeadLinks(root) {
  const pages = htmlFiles(root);
  const ids = new Map();
  const sources = new Map();
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    sources.set(file, html);
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'))));
  }
  const dead = [];
  for (const [file, html] of sources) {
    const from = `/${relative(root, file).split('\\').join('/')}`;
    for (const [, attr, raw] of html.matchAll(/\s(href|src)="(\/[^"]*)"/g)) {
      const url = raw.replace(/&amp;/g, '&');
      if (url.startsWith('//')) continue;
      const [beforeHash, hash] = url.split('#');
      const pathname = decodeURIComponent(beforeHash.split('?')[0]);
      const target = fileOfUrl(root, pathname);
      if (!existsSync(target) || !statSync(target).isFile()) { dead.push(`${from} → ${url} (${attr}: not found)`); continue; }
      if (hash && target.endsWith('.html') && attr === 'href') {
        const anchors = ids.get(target) ?? new Set([...readFileSync(target, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
        if (!anchors.has(decodeURIComponent(hash))) dead.push(`${from} → ${url} (no such anchor on the page)`);
      }
    }
  }
  return dead;
}

/** Problems with the output layout. `dirs`: the non-default language directories. */
export function checkLayout(root, { dirs = [] } = {}) {
  const errors = [];
  for (const name of RESERVED_ROOT) if (existsSync(join(root, name))) errors.push(`The output root must not contain "${name}" (the CDN rewrite rules treat it specially)`);
  for (const file of ['index.html', '404.html', 'robots.txt', 'llms.txt', 'sitemap-index.xml']) if (!existsSync(join(root, file))) errors.push(`The output root has no ${file}`);
  for (const dir of dirs) {
    if (existsSync(join(root, dir, '404.html'))) errors.push(`${dir}/404.html must not exist: the CDN serves a single 404 page (the English one at the root)`);
    for (const file of ['index.html', 'llms.txt']) if (!existsSync(join(root, dir, file))) errors.push(`The output has no ${dir}/${file}`);
  }
  const conflicts = findV2RedirectConflicts(root);
  if (conflicts.length) errors.push(`These top-level entries share a name with old v2 docs addresses that docs.nocobase.com redirects with a 301 (see packages/shared/v2-redirect-prefixes.txt): ${conflicts.join(', ')}`);
  return errors;
}
