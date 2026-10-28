import { posix } from 'node:path';

/**
 * Turns a relative `.md` link of a page into the final address. Absolute, root-relative, anchor-only and scheme links are returned as they are.
 * Throws when a relative link is not a .md path or points at a page that does not exist.
 * @param {string} href
 * @param {{ key: string, lang: string, hasPage: (lang: string, key: string) => boolean, urlOf: (lang: string, key: string) => string }} ctx key: the page the link is on
 */
export function resolveLink(href, { key, lang, hasPage, urlOf }) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/') || href.startsWith('//')) return href;
  const [path, hash = ''] = href.split('#');
  if (!path.endsWith('.md')) throw new Error(`the link "${href}" must be a relative .md path (links between pages are written like ../use/my-tasks.md#views)`);
  const target = posix.normalize(posix.join(posix.dirname(key), path)).slice(0, -3);
  if (!hasPage(lang, target)) throw new Error(`the link "${href}" points to the page ${target}.md (${lang}), which does not exist`);
  return `${urlOf(lang, target)}${hash ? `#${hash}` : ''}`;
}
