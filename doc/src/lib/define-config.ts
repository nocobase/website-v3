// The shape of docs.config.ts. `defineDocsConfig` only gives editors type checking; the config is plain data.
export interface FooterLink { label: string; /** A path relative to the language's `website`, or an absolute URL. */ href: string; external?: boolean }
export interface FooterColumn { title: string; links: FooterLink[] }

/** Interface strings of one language. A language only needs the strings it changes: missing ones fall back to the first language (English). */
export interface DocsUi {
  docs?: string;
  skip?: string;
  /** aria-label of the section tabs */
  sections?: string;
  /** Label of the mobile menu button */
  menu?: string;
  /** aria-label of the sidebar */
  sidebar?: string;
  toc?: string;
  pager?: string;
  prev?: string;
  next?: string;
  website?: string;
  language?: string;
  /** Names of the languages by code, in this language (used in the "read the other version" hint) */
  languageNames?: Record<string, string>;
  copy?: string;
  copied?: string;
  copyFailed?: string;
  /** The buttons under the title: copy the page's Markdown, copy its link, open it in ChatGPT or Claude. `{url}` in the prompt is the .md address. */
  pageActions?: { copy?: string; copyLink?: string; chatgpt?: string; claude?: string; more?: string; prompt?: string };
  /** Label of a menu entry that has no page yet */
  planned?: string;
  codeLabels?: { text?: string; tree?: string; prompt?: string };
  callouts?: { TIP?: string; NOTE?: string; WARNING?: string; PENDING?: string };
  notFound?: { title?: string; lead?: string; back?: string };
  /** Hint on an empty placeholder page whose content exists in another language. `{href}` and `{language}` are filled in. */
  untranslated?: string;
  /** Hint on an empty placeholder page that is not written in any language */
  unwritten?: string;
  version?: { current?: string; currentDesc?: string; v2Desc?: string };
  search?: {
    label?: string; placeholder?: string; hint?: string; empty?: string; error?: string; loading?: string; close?: string; results?: string; shortcut?: string;
  };
  footer?: { tagline?: string; copyright?: string; columns?: FooterColumn[] };
}

export interface DocsLanguage {
  /** The key of the language: the directory under content/ and the id used in menus and figures */
  code: string;
  /** The URL directory: '' for the language served at the site root, otherwise the first path segment (for example `zh-CN`) */
  dir: string;
  /** <html lang> and hreflang */
  hreflang: string;
  /** Name in the language menu */
  label: string;
  /** The website's home page in this language (the "Website" link and the footer) */
  website: string;
  ui?: DocsUi;
}

export interface DocsSection {
  id: string;
  /** The directory (relative to content/<language>/) that holds the section's meta.json. Pages of the section live below it */
  dir: string;
  /** Pages outside `dir` that the section's menu may list, as keys relative to content/<language>/ (the Start section lists the docs home `index`) */
  extra?: string[];
  /** The page the section tab opens, as a key relative to content/<language>/ */
  home: string;
  /** Tab text by language code; a missing language falls back to the first one */
  title: Record<string, string>;
}

export interface DocsConfig {
  site: {
    origin: string;
    /** Site name by language code; used in <title>, Open Graph and llms.txt */
    title: Record<string, string>;
    logo: { src: string; alt: string; width: number; height: number };
  };
  languages: DocsLanguage[];
  sections: DocsSection[];
  nav: { github: string; website: string; versionSwitch: string };
  search: { provider: 'pagefind' };
  analytics: { ga4?: string; baidu?: string; clarity?: string };
}

export function defineDocsConfig(config: DocsConfig): DocsConfig {
  return config;
}
