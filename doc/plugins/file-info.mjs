import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_DIR } from '../src/lib/paths.mjs';
import { getSite } from '../src/lib/site.mjs';

/**
 * The language and page key of a content file, from its path. The default language's pages are at the root of content/ (content/core/x.md is { lang: 'en', key: 'core/x' }), the others in content/<dir>/ (content/zh-CN/core/x.md is { lang: 'zh-CN', key: 'core/x' }). Null for files outside content/.
 * @param languages [{ code, dir }]; defaults to the languages of docs.config.ts
 */
export function fileInfo(file, contentDir = CONTENT_DIR, languages = getSite().config.languages) {
  if (!file) return null;
  const path = typeof file === 'string' && file.startsWith('file:') ? fileURLToPath(file) : String(file);
  const rel = relative(contentDir, path).split(sep).join('/');
  if (rel.startsWith('..') || !rel.endsWith('.md')) return null;
  const first = rel.split('/')[0];
  const other = languages.find(l => l.dir && l.dir === first);
  const lang = other ?? languages.find(l => !l.dir);
  return { lang: lang.code, key: (other ? rel.slice(first.length + 1) : rel).slice(0, -3), rel };
}
