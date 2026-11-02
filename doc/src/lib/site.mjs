// The docs site model: the normalized config plus the content (pages and menus of every language) and the addresses derived from them.
import raw from '../../docs.config.ts';
import { resolveConfig } from './config.mjs';
import { loadContent } from './content.mjs';
import { CONTENT_DIR } from './paths.mjs';

/** The address of a page key: the key without `.md`, as a directory that ends with `/`. `index` is the language root; `a/index` is `a/`. */
export function pathOfKey(key) {
  return key === 'index' ? '' : key.endsWith('/index') ? key.slice(0, -'index'.length) : `${key}/`;
}

/** Builds the site model. Pass `config` and `contentDir` to build it from other data (tests). */
export function buildSite({ config = resolveConfig(raw), contentDir = CONTENT_DIR } = {}) {
  const content = loadContent({ contentDir, languages: config.languages.map(l => ({ code: l.code, dir: l.dir })), sections: config.sections });
  const urlOf = (code, key) => `${config.byCode[code].url}${pathOfKey(key)}`;
  const pages = [];
  for (const lang of config.languages) {
    for (const page of content.languages.get(lang.code).pages.values()) pages.push({ ...page, url: urlOf(lang.code, page.key), mdUrl: `${config.byCode[lang.code].url}${page.key}.md` });
  }
  const byUrl = new Map(pages.map(p => [`${p.lang}:${p.key}`, p]));
  return {
    config,
    content,
    pages,
    urlOf,
    /** The page object of a language, or undefined */
    page: (code, key) => byUrl.get(`${code}:${key}`),
    sections: (code) => config.sections.map(s => ({ ...s, ...content.languages.get(code).sections.get(s.id), title: config.sectionTitle(s, code) })),
    absolute: path => `${config.site.origin}${path}`,
  };
}

// The config (with the Markdown plugins) and the pages each load their own copy of this module in the dev server, so the cache lives on globalThis for resetSite() to clear it for both.
const CACHE = Symbol.for('nocobase.doc.site');

/**
 * The site model, built once and kept until resetSite().
 * After a reset the content can be invalid for a while, such as a new page that is not in a menu yet. The last valid model stays in use then, because a Markdown plugin that fails on it would leave the page being saved out of the content collection until its next save. Without a valid model the error is thrown, which is what fails a build.
 */
export function getSite() {
  const state = (globalThis[CACHE] ??= {});
  if (state.fresh) return state.site;
  try {
    state.site = buildSite();
    state.fresh = true;
    state.problem = undefined;
  } catch (error) {
    if (!state.site) throw error;
    if (state.problem !== error.message) console.error((state.problem = error.message));
  }
  return state.site;
}

/** Makes the next getSite() read the content again. The dev server calls it when the content changes. */
export function resetSite() {
  if (globalThis[CACHE]) globalThis[CACHE].fresh = false;
}
