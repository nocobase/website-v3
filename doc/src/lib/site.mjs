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

let cached;
/** The site model, built once per process. */
export function getSite() {
  return (cached ??= buildSite());
}
