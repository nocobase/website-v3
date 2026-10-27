// The props of the shared Header and Footer for a docs page. Text goes to the components as HTML, so everything from the config is escaped here.
import { githubStars } from '@nocobase/site-shared/config';

export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * @param site the site model (lib/site.mjs)
 * @param {{ lang: string, sectionId?: string, pageKey?: string, stars?: string }} page pageKey: the page the language menu keeps; omitted, the menu goes to each language's home
 */
export function headerProps(site, { lang, sectionId, pageKey, stars = githubStars() }) {
  const { config } = site;
  const l = config.byCode[lang];
  const ui = l.ui;
  const home = site.urlOf(lang, 'index');
  const tabs = config.sections.map(s => ({ title: config.sectionTitle(s, lang), href: site.urlOf(lang, s.home), active: s.id === sectionId }));
  return {
    logo: { href: home, src: config.site.logo.src, alt: config.site.logo.alt, width: config.site.logo.width, height: config.site.logo.height },
    version: {
      label: '3',
      ariaLabel: 'NocoBase 3',
      items: [
        { href: home, icon: 'check', title: 'NocoBase 3', tag: escapeHtml(ui.version.current), kind: 'cur', desc: escapeHtml(ui.version.currentDesc) },
        { href: config.nav.versionSwitch, icon: 'mouse-pointer-click', title: 'NocoBase 2', arrow: true, external: true, kind: 'ext', desc: escapeHtml(ui.version.v2Desc) },
      ],
    },
    label: escapeHtml(ui.docs),
    menu: tabs.map(t => ({ label: escapeHtml(t.title), href: t.href, active: t.active })),
    mobile: [
      ...tabs.map(t => ({ label: escapeHtml(t.title), href: t.href, active: t.active })),
      { href: l.website, label: escapeHtml(ui.website), small: '↗', external: true },
      { href: config.nav.github, label: 'GitHub', small: stars, external: true },
    ],
    languages: config.languages.map(x => ({
      code: x.code, name: x.label, html: x.hreflang, current: x.code === lang,
      url: pageKey && site.page(x.code, pageKey) ? site.urlOf(x.code, pageKey) : site.urlOf(x.code, 'index'),
    })),
    links: [
      { href: config.nav.github, icon: 'github', label: stars, external: true },
      { href: l.website, label: `${escapeHtml(ui.website)} ↗`, external: true },
    ],
    labels: { menu: ui.menu, language: ui.language, primary: ui.sections },
    search: { label: ui.search.label, placeholder: ui.search.placeholder, shortcut: ui.search.shortcut },
  };
}

export function footerProps(site, { lang }) {
  const { config } = site;
  const l = config.byCode[lang];
  const f = l.ui.footer;
  const href = h => (/^https?:/.test(h) ? h : `${l.website}${h}`);
  return {
    logo: { src: config.site.logo.src, alt: config.site.logo.alt, width: config.site.logo.width, height: config.site.logo.height },
    tagline: escapeHtml(f.tagline),
    columns: f.columns.map(c => ({ title: escapeHtml(c.title), links: c.links.map(x => ({ href: href(x.href), label: escapeHtml(x.label), external: x.external })) })),
    copyright: escapeHtml(f.copyright),
  };
}
