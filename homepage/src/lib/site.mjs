// 官网的页面：收集所有页面（首页、子页面、博客、客户案例、更新日志）和它们的语言，按语言生成每个页面要渲染的内容（标题、描述、处理好语言的正文、导航页脚的参数、head 里的 canonical 和 hreflang）。
// Astro 的页面（content/pages/）用 getPaths() 列出地址，用 renderPage() 取内容，再交给 layouts/Base.astro 输出。
//
// 页面：
// - content/pages/home.html：首页，12 种语言。
// - content/pages/<名称>.body.html：子页面，头部写了 i18n: <组> 的有 12 种语言，没写的只有英文和简体中文（NocoReach）；404.body.html 只有英文。
// - content/blog/：博客、客户案例、更新日志（blog.mjs、changelog.mjs），只有英文和简体中文。
// 只有英文和简体中文的页面，语言菜单里其他语言链接到它的英文版。
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { githubStars } from '@nocobase/site-shared/config';
import { blogPages } from './blog.mjs';
import { changelogPages } from './changelog.mjs';
import { ALL, BY_CODE, LANGS, ORIGIN, ZH_EN } from './config.mjs';
import { Lingo, localize } from './html.mjs';
import * as i18n from './i18n.mjs';
import * as links from './links.mjs';
import { collectText, languageList, makeHref, navSpec } from './nav.mjs';
import { readHome, readPage } from './pages.mjs';
import { CONTENT } from './paths.mjs';

const warn = msg => console.warn('警告：' + msg);

export class Page {
  constructor(id, langs, meta, { main = '', style = '', after = '', kind = 'body' } = {}) {
    Object.assign(this, { id, langs, meta, main, style, after, kind });
    this.group = meta.i18n;
    this.noindex = meta.noindex === '1';
  }

  // 地址（以 / 开头）
  path(lang) {
    if (this.id === '404') return '/404.html';
    const d = BY_CODE[lang].dir;
    return '/' + (d ? d + '/' : '') + (this.id ? this.id + '/' : '');
  }

  url(lang) {
    return this.path(this.langs.includes(lang) ? lang : 'en');
  }
}

let SITE;
export function getSite() {
  if (SITE) return SITE;
  const home = readHome();
  const pages = [new Page('', ALL, home.meta, { main: home.main, after: home.after, kind: 'home' })];
  const dir = join(CONTENT, 'pages');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.body.html')).sort()) {
    const name = f.slice(0, -'.body.html'.length);
    const p = readPage(name), m = p.meta;
    const langs = m.langs ? m.langs.split(/\s+/) : m.i18n ? ALL : ZH_EN;
    pages.push(new Page(name, langs, m, p));
  }
  for (const it of [...blogPages(), ...changelogPages()]) pages.push(new Page(it.id, ZH_EN, it.meta, { main: it.main }));
  SITE = { pages, byId: new Map(pages.map(p => [p.id, p])) };
  return SITE;
}

// 每个页面和语言的（页面, 语言）对，Astro 的 getStaticPaths 用
export function pageLangs() {
  return getSite().pages.flatMap(page => page.langs.map(lang => ({ page, lang })));
}

const TR = new Map();
function translations(group, lang) {
  const key = group + '\0' + lang;
  if (!TR.has(key)) {
    const t = i18n.load(group, lang);
    if (t.errors.length) throw new Error(`译文有 ${t.errors.length} 个错误：\n  ` + t.errors.join('\n  '));
    if (t.missing.length) warn(`${group}.${lang} 缺 ${t.missing.length} 条译文（显示英文）：` + t.missing.slice(0, 5).map(m => m.slice(0, 60)).join('；') + (t.missing.length > 5 ? '……' : ''));
    TR.set(key, t);
  }
  return TR.get(key);
}

const inlineJson = v => JSON.stringify(v).replaceAll('</', '<\\/');
const sortKeys = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));

// 一个页面在一种语言的处理参数：中英文直接选，其他语言换上译文。home 的子页面译文要加上导航页脚那组（site）
function lingoFor(page, lang) {
  const m = page.meta;
  if (lang === 'zh' || lang === 'en') return { lingo: new Lingo(lang), title: m[`title_${lang}`], desc: m[`desc_${lang}`] };
  const t = translations(page.group, lang);
  const strings = page.group === 'home' ? t.strings : { ...translations('site', lang).strings, ...t.strings };
  const lingo = new Lingo(lang, strings, t.ui, page.group === 'home');
  return { lingo, title: t.meta.title ?? m.title_en, desc: t.meta.description ?? m.desc_en, t };
}

const NAV_LINGO = new Map();
function navLingo(lang) {
  if (!NAV_LINGO.has(lang)) NAV_LINGO.set(lang, lang === 'zh' || lang === 'en' ? new Lingo(lang) : new Lingo(lang, translations('site', lang).strings));
  return NAV_LINGO.get(lang);
}

// 导航和页脚的文字一起处理：用不会出现在文案里的分隔符连起来，localize 一次，再拆开放回去
function localizeAll(spec, lang) {
  const refs = collectText(spec);
  const SEP = '\u0001';
  const out = localize(refs.map(([n, k]) => n[k]).join(SEP), navLingo(lang)).split(SEP);
  refs.forEach(([n, k], i) => { n[k] = out[i]; });
}

function mapHrefs(node, fn) {
  if (Array.isArray(node)) node.forEach(n => mapHrefs(n, fn));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'href' && typeof v === 'string') node[k] = fn(v);
      else if (typeof v === 'object') mapHrefs(v, fn);
    }
  }
}

// 页面里 <script>…</script>（没有 src 的）等 DOM 解析完、打包的脚本（图标库等）执行之后再运行：打包的脚本是 module，延迟到解析完才执行
export function deferInlineScripts(html) {
  return html.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => `<script>document.addEventListener('DOMContentLoaded', function () {\n${code}\n});</script>`);
}

/**
 * 一个页面在一种语言的全部渲染内容。
 * 返回 { code, htmlLang, title, description, canonical, alternates, noindex, inline, pageId, band, mainId, style, main, after, header, footer }
 */
export function renderPage(page, lang) {
  const { byId } = getSite();
  const L = BY_CODE[lang], m = page.meta;
  const resolve = name => {
    const target = byId.get(name === 'index' ? '' : name);
    return target ? target.url(lang) : null;
  };
  const finish = text => {
    text = links.rewrite(text, resolve);
    return lang === 'zh' || lang === 'zh-TW' ? links.zhDocLinks(text) : text;
  };
  const { lingo, title, desc, t } = lingoFor(page, lang);
  const main = localize(page.main, lingo);
  if (lingo.missingUi.size) warn(`${page.id || 'home'} 繁体中文缺 ${lingo.missingUi.size} 条界面文字（显示简体中文）：` + [...lingo.missingUi].sort().slice(0, 5).join('；'));

  let inline = `window.__lang = ${JSON.stringify(lang)};`;
  if (page.kind === 'home' && lang !== 'zh' && lang !== 'en') {
    // 首页脚本里 M() 要用的译文，繁体中文另有界面文字（L() 和数据里的中文 → 繁体）
    const script = page.after.slice(page.after.lastIndexOf('<script>'));
    const keys = i18n.scriptKeys();
    const used = sortKeys(Object.fromEntries(Object.entries(t.strings).filter(([k]) => keys.has(k) || script.includes(`'${k.replaceAll("'", "\\'")}'`))));
    const data = Object.keys(t.ui).length ? { strings: used, ui: sortKeys(t.ui) } : { strings: used };
    inline += ` window.NB_I18N = {}; window.NB_I18N[${JSON.stringify(lang)}] = ${inlineJson(data)};`;
  }
  if (page.kind !== 'home' && /\bdata-public-form-zh\b/.test(page.main) && lang !== 'zh' && lang !== 'en') {
    // 表单脚本在浏览器里要用的译文（提示语、下拉和多选的选项）
    const keys = [...new Set([...i18n.formKeys('site'), ...(page.group ? i18n.formKeys(page.group) : [])])].sort();
    inline += ` window.NB_STRINGS = ${inlineJson(Object.fromEntries(keys.map(k => [k, lingo.tr(k)]).filter(([k, v]) => v !== k)))};`;
  }

  const { header, footer } = navSpec(m.page);
  localizeAll(header, lang);
  localizeAll(footer, lang);
  const href = makeHref(resolve, lang);
  mapHrefs(header, href);
  mapHrefs(footer, href);
  const urls = Object.fromEntries(LANGS.map(l => [l.code, page.url(l.code)]));
  header.languages = languageList(lang, urls);
  header.labels = { menu: 'Menu', language: 'Language' };

  const alternates = page.noindex ? [] : [...ALL.filter(c => page.langs.includes(c)).map(c => [BY_CODE[c].html, ORIGIN + page.path(c)]), ['x-default', ORIGIN + page.path('en')]];
  return {
    code: lang,
    htmlLang: L.html,
    title, description: desc,
    canonical: page.noindex ? null : ORIGIN + page.path(lang),
    alternates, noindex: page.noindex,
    inline,
    pageId: page.kind === 'home' ? '' : m.page,
    band: /class="(?:[^"]*\s)?band(?:\s[^"]*)?"/.test(page.main),
    mainId: page.kind === 'home' ? 'top' : undefined,
    style: page.style,
    main: finish(main),
    after: deferInlineScripts(finish(page.after)),
    header, footer,
    stars: githubStars(),
  };
}
