// Which languages the content collection renders. A build renders all of them; the dev server starts with the default language and adds another when one of its pages is first requested, because rendered Markdown is what takes the memory. The site model (site.mjs) always reads every language, so language menus, alternates and content checks do not depend on this.
// The integration and the content config each load their own copy of this module, so the state lives on globalThis.
const ACTIVE = Symbol.for('nocobase.doc.activeLanguages');

/** Renders only this language from now on, until activateLanguage() adds others. */
export function limitLanguages(code) {
  globalThis[ACTIVE] = new Set([code]);
}

export function activateLanguage(code) {
  globalThis[ACTIVE]?.add(code);
}

/** The glob pattern of the content to render: everything except the directories of languages that are not active. */
export function contentPattern(languages) {
  const active = globalThis[ACTIVE];
  const skipped = active ? languages.filter(l => l.dir && !active.has(l.code)) : [];
  return ['**/*.md', ...skipped.map(l => `!${l.dir}/**`)];
}

/** The language with its own directory that an address belongs to, or undefined (the default language is at the site root). */
export function languageOfPath(path, languages) {
  return languages.find(l => l.dir && (path === `/${l.dir}` || path.startsWith(`/${l.dir}/`)));
}
