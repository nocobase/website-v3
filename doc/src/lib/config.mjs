// Normalizes docs.config.ts: validates it, fills in the interface strings a language does not translate with the first language's, and derives what the rest of the site needs.

/** A site origin is only https://host (no path, query or fragment) so canonical, hreflang and the sitemap cannot get a wrong address. */
export function siteOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`DOCS_SITE_ORIGIN must be an origin like https://docs.nocobase.com, got ${value}`); }
  if (!/^https?:$/.test(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error(`DOCS_SITE_ORIGIN must be an origin like https://docs.nocobase.com, got ${value}`);
  }
  return url.origin;
}

const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
/** Objects merge key by key; arrays and scalars of the override replace the base. */
export function mergeUi(base, override) {
  if (!isObject(base) || !isObject(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) out[k] = k in base ? mergeUi(base[k], v) : v;
  return out;
}

export function resolveConfig(raw) {
  const languages = raw.languages;
  if (!languages?.length) throw new Error('docs.config: languages is empty');
  if (languages[0].dir !== '') throw new Error(`docs.config: the first language (${languages[0].code}) is the default and must be served at the site root (dir: '')`);
  const codes = new Set();
  const dirs = new Set();
  for (const l of languages) {
    if (codes.has(l.code)) throw new Error(`docs.config: duplicate language code ${l.code}`);
    codes.add(l.code);
    if (l.dir && (dirs.has(l.dir) || /[/\\]/.test(l.dir))) throw new Error(`docs.config: language directory "${l.dir}" is duplicated or not a single path segment`);
    dirs.add(l.dir);
    if (l.dir === 'en' || l.dir === 'api') throw new Error(`docs.config: "${l.dir}" cannot be a top-level directory (the CDN rewrite rules reserve it)`);
  }
  const first = languages[0];
  const resolved = languages.map(l => ({ ...l, ui: mergeUi(first.ui ?? {}, l.ui ?? {}), url: `/${l.dir ? `${l.dir}/` : ''}` }));
  const pick = (record, code) => record?.[code] ?? record?.[first.code] ?? '';
  return {
    ...raw,
    site: { ...raw.site, origin: siteOrigin(raw.site.origin) },
    languages: resolved,
    byCode: Object.fromEntries(resolved.map(l => [l.code, l])),
    defaultLanguage: resolved[0],
    /** Site name in a language */
    siteTitle: code => pick(raw.site.title, code),
    /** Section tab text in a language */
    sectionTitle: (section, code) => pick(section.title, code),
  };
}
