// 官网构建：从 html/src 的源文件生成每种语言的静态页面，输出到 html/dist/（不提交，CI 构建后发布）。
//
//   pnpm build                                # 在 html/ 下；SITE_OUT_DIR 可以换输出目录
//   SITE_ORIGIN=https://www.nocobase.com      # canonical、hreflang、sitemap 用的站点地址（默认就是它）
//
// 产物的约定（CDN 回源规则依赖它，见 scripts/deploy-cdn/deploy-cdn.mjs 的 REWRITE_RULES）：每页输出成 <路径>/index.html，地址不带扩展名、以 / 结尾；英文在根目录，其他语言在 /<语言目录>/ 下（zh-CN、ja-JP……，见 lib/config.mjs）；站内链接和资源都用根路径；根目录有 404.html、sitemap.xml、robots.txt。
//
// 页面：
// - src/pages/home.html：首页，12 种语言。
// - src/pages/<名称>.body.html：子页面，头部写了 i18n: <组> 的有 12 种语言，没写的只有英文和简体中文（NocoReach）；404.body.html 只有英文。
// - src/blog/：博客、客户案例、更新日志（lib/blog.mjs、lib/changelog.mjs），只有英文和简体中文。
// 只有英文和简体中文的页面，语言菜单里其他语言链接到它的英文版。
//
// 构建时检查（不通过就失败）：译文格式、站内链接指向的页面和文件都存在、每种语言的页面数一致、根目录没有会被 CDN 规则误处理的名字（en、api）。缺的译文（显示英文）和繁体中文缺的界面文字（显示简体中文）只打印警告。
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { blogPages } from './lib/blog.mjs';
import { changelogPages } from './lib/changelog.mjs';
import { ALL, BY_CODE, LANGS, ORIGIN, ZH_EN } from './lib/config.mjs';
import { Lingo, localize, unescape } from './lib/html.mjs';
import * as i18n from './lib/i18n.mjs';
import * as links from './lib/links.mjs';
import { readPage } from './lib/pages.mjs';
import { DIST, SRC } from './lib/paths.mjs';
import * as shell from './lib/shell.mjs';

const errors = [], warnings = [];

class Page {
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

function collect() {
  const pages = [new Page('', ALL, { page: 'home', i18n: 'home' }, { main: readFileSync(join(SRC, 'pages', 'home.html'), 'utf8'), kind: 'home' })];
  for (const f of readdirSync(join(SRC, 'pages')).filter(f => f.endsWith('.body.html')).sort()) {
    const name = f.slice(0, -'.body.html'.length);
    const p = readPage(name), m = p.meta;
    const langs = m.langs ? m.langs.split(/\s+/) : m.i18n ? ALL : ZH_EN;
    pages.push(new Page(name, langs, m, p));
  }
  for (const it of [...blogPages(), ...changelogPages()]) pages.push(new Page(it.id, ZH_EN, it.meta, { main: it.main }));
  return pages;
}

const TR = new Map();
function translations(group, lang) {
  const key = group + '\0' + lang;
  if (!TR.has(key)) {
    const t = i18n.load(group, lang);
    errors.push(...t.errors);
    if (t.missing.length) warnings.push(`${group}.${lang} 缺 ${t.missing.length} 条译文（显示英文）：` + t.missing.slice(0, 5).map(m => m.slice(0, 60)).join('；') + (t.missing.length > 5 ? '……' : ''));
    TR.set(key, t);
  }
  return TR.get(key);
}

const inlineJson = v => JSON.stringify(v).replaceAll('</', '<\\/');
const sortKeys = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));

// 只留本页语言：中英文直接选，其他语言换上译文
function choose(src, page, lang) {
  const m = page.meta;
  let lingo, title, desc;
  if (lang === 'zh' || lang === 'en') {
    lingo = new Lingo(lang);
    title = m[`title_${lang}`];
    desc = m[`desc_${lang}`];
  } else {
    const t = translations(page.group, lang);
    const strings = page.group === 'home' ? t.strings : { ...translations('site', lang).strings, ...t.strings };
    lingo = new Lingo(lang, strings, t.ui, page.group === 'home');
    title = t.meta.title ?? m.title_en;
    desc = t.meta.description ?? m.desc_en;
  }
  const html = localize(src, lingo);
  if (lingo.missingUi.size) warnings.push(`${page.id || 'home'} 繁体中文缺 ${lingo.missingUi.size} 条界面文字（显示简体中文）：` + [...lingo.missingUi].sort().slice(0, 5).join('；'));
  return { html, title, desc, lingo };
}

function finish(text, lang, resolve) {
  text = links.rewrite(text, name => resolve(name, lang));
  return lang === 'zh' || lang === 'zh-TW' ? links.zhDocLinks(text) : text;
}

function render(page, lang, byId) {
  const L = BY_CODE[lang];
  const resolve = (name, l) => {
    const target = byId.get(name === 'index' ? '' : name);
    return target ? target.url(l) : null;
  };
  const urls = Object.fromEntries(LANGS.map(l => [l.code, page.url(l.code)]));
  const [desk, mobile] = shell.langMenus(lang, urls);
  const alternates = page.noindex ? [] : [...ALL.filter(c => page.langs.includes(c)).map(c => [BY_CODE[c].html, page.path(c)]), ['x-default', page.path('en')]];
  let inline = `window.__lang = ${JSON.stringify(lang)};`;

  if (page.kind === 'home') {
    const src = page.main.replace('<!-- LANG-MENU -->', desk).replace('<!-- LANG-MENU-M -->', mobile);
    const m = /<title data-zh="([^"]*)" data-en="([^"]*)">[^<]*<\/title>\n<meta name="description" content="[^"]*" data-zh="([^"]*)" data-en="([^"]*)">\n/.exec(src);
    if (!m) throw new Error('首页缺少带 data-zh / data-en 的 <title> 和 <meta name="description">');
    Object.assign(page.meta, { title_zh: unescape(m[1]), title_en: unescape(m[2]), desc_zh: unescape(m[3]), desc_en: unescape(m[4]) });
    let { html: body, title, desc } = choose(src, page, lang);
    if (lang !== 'zh' && lang !== 'en') {
      // 首页脚本里 M() 要用的译文，繁体中文另有界面文字（L() 和数据里的中文 → 繁体）
      const t = translations('home', lang), script = body.slice(body.lastIndexOf('<script>'));
      const keys = i18n.scriptKeys();
      const used = sortKeys(Object.fromEntries(Object.entries(t.strings).filter(([k]) => keys.has(k) || script.includes(`'${k.replaceAll("'", "\\'")}'`))));
      const data = Object.keys(t.ui).length ? { strings: used, ui: sortKeys(t.ui) } : { strings: used };
      inline += ` window.NB_I18N = {}; window.NB_I18N[${JSON.stringify(lang)}] = ${inlineJson(data)};`;
    }
    const head = /<title data-zh[^\n]*\n<meta name="description"[^\n]*\n<!-- HEAD:[^\n]*-->\n/.exec(body);
    if (!head) throw new Error('首页缺少 <!-- HEAD: … --> 标记');
    body = body.slice(0, head.index) + `<title>${shell.esc(title)}</title>\n<meta name="description" content="${shell.esc(desc)}">\n` + shell.headExtra(L, page.path(lang), alternates, page.noindex, inline) + body.slice(head.index + head[0].length);
    if (!body.startsWith('<!doctype html>\n<html lang="en">\n')) throw new Error('首页应以 <!doctype html> 和 <html lang="en"> 开头');
    body = body.replace('<html lang="en">', `<html lang="${L.html}">`);
    return finish(body, lang, resolve);
  }

  const m = page.meta;
  const band = /class="(?:[^"]*\s)?band(?:\s[^"]*)?"/.test(page.main) ? ' class="has-band"' : '';
  const bilingual = shell.header(m.page, desk, mobile) + '\n<main>\n' + page.main + '\n</main>\n' + shell.footer() + '\n';
  const { html: body, title, desc, lingo } = choose(bilingual, page, lang);
  const scripts = (m.scripts || '').split(/\s+/).filter(Boolean);
  if ((scripts.includes('assets/public-form.js') || page.main.includes('assets/public-form.js')) && lang !== 'zh' && lang !== 'en') {
    // 表单脚本在浏览器里要用的译文（提示语、下拉和多选的选项）
    const keys = [...new Set([...i18n.formKeys('site'), ...(page.group ? i18n.formKeys(page.group) : [])])].sort();
    inline += ` window.NB_STRINGS = ${inlineJson(Object.fromEntries(keys.map(k => [k, lingo.tr(k)]).filter(([k, v]) => v !== k)))};`;
  }
  const out = `<!doctype html>\n<html lang="${L.html}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<title>${shell.esc(title)}</title>\n<meta name="description" content="${shell.esc(desc)}">\n` +
    shell.headExtra(L, page.path(lang), alternates, page.noindex, inline) +
    '<link rel="icon" type="image/png" sizes="32x32" href="https://static-docs.nocobase.com/nocobase-favicon-32x32.png">\n' +
    '<link rel="icon" type="image/png" sizes="16x16" href="https://static-docs.nocobase.com/nocobase-favicon-16x16.png">\n' +
    '<link rel="apple-touch-icon" sizes="180x180" href="https://static-docs.nocobase.com/nocobase-apple-touch-icon.png">\n' +
    '<link rel="stylesheet" href="/assets/fonts/fonts.css">\n' +
    '<script src="/assets/vendor/lucide-0.460.0/lucide.min.js"></script>\n' +
    '<link rel="stylesheet" href="/assets/site.css">\n' + page.style +
    `</head>\n<body data-page="${m.page}"${band}>\n` + body +
    '<script src="/assets/site.js"></script>\n' + scripts.map(s => `<script src="/${s}"></script>\n`).join('') + page.after + '</body>\n</html>\n';
  return finish(out, lang, resolve);
}

const outFile = url => join(DIST, url.endsWith('/') ? url.slice(1) + 'index.html' : url.slice(1));
const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function main() {
  const pages = collect();
  const byId = new Map(pages.map(p => [p.id, p]));
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  // 资源原样复制；assets/reach/ 是截图上传到 static-docs 之前的暂存目录，不发布
  cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true, filter: s => !/(^|[\\/])(\.DS_Store|reach)$/.test(s.slice(join(SRC, 'assets').length)) });

  const files = {};
  const counts = Object.fromEntries(ALL.map(c => [c, { all: 0, 'zh-en': 0, 'en-only': 0 }]));
  for (const page of pages) {
    const kind = page.langs.length === ALL.length ? 'all' : page.langs.join() === ZH_EN.join() ? 'zh-en' : 'en-only';
    for (const lang of page.langs) {
      files[page.path(lang)] = render(page, lang, byId);
      counts[lang][kind]++;
    }
  }
  for (const [url, text] of Object.entries(files)) {
    mkdirSync(dirname(outFile(url)), { recursive: true });
    writeFileSync(outFile(url), text);
  }

  // sitemap.xml：每个地址列出这页所有语言的地址（hreflang）和 x-default（英文）
  const urls = [];
  for (const page of pages) {
    if (page.noindex) continue;
    const langs = ALL.filter(c => page.langs.includes(c));
    const alt = langs.map(c => `<xhtml:link rel="alternate" hreflang="${BY_CODE[c].html}" href="${xml(ORIGIN + page.path(c))}"/>`).join('') +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${xml(ORIGIN + page.path('en'))}"/>`;
    for (const lang of langs) urls.push(`<url><loc>${xml(ORIGIN + page.path(lang))}</loc>${alt}</url>`);
  }
  writeFileSync(join(DIST, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + '\n</urlset>\n');
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

  // 检查：站内链接（地址按 CDN 回源规则映射到文件：以 / 结尾或最后一段不带点号的读 index.html）
  const exists = path => {
    path = path.replace(/\/+/g, '/');
    const last = path.slice(path.lastIndexOf('/') + 1);
    const f = path.endsWith('/') ? outFile(path) : last.includes('.') ? join(DIST, path.slice(1)) : join(DIST, path.slice(1), 'index.html');
    return existsSync(f) && statSync(f).isFile();
  };
  const checked = links.check(files, exists, url => /^\/(?:zh-CN\/)?(?:blog|customers|changelog)\/[^/]+\/$/.test(url));
  errors.push(...checked.errors);
  if (checked.warnings.length) warnings.push(`文章正文里有 ${checked.warnings.length} 个相对链接（多是 CMS 里写坏的 Markdown 链接，构建前就是坏的）：\n    ` + checked.warnings.join('\n    '));

  // 检查：每种语言的页面数一致（12 种语言的页面每种语言一样多；只有中英文的页面英文和简体中文一样多）
  if (new Set(ALL.map(c => counts[c].all)).size !== 1) errors.push('各语言的页面数不一致：' + JSON.stringify(Object.fromEntries(ALL.map(c => [c, counts[c].all]))));
  if (counts.en['zh-en'] !== counts.zh['zh-en']) errors.push(`只有中英文的页面，英文 ${counts.en['zh-en']} 页、简体中文 ${counts.zh['zh-en']} 页，不一致`);

  // 检查：根目录不能有会被 CDN 回源规则误处理的名字（/en/ 会被去掉前缀映射到根目录，/api/ai/ 原样透传），也不能有多出来的东西
  const top = readdirSync(DIST);
  for (const bad of ['en', 'api']) if (top.includes(bad)) errors.push(`产物根目录不能有 ${bad}/（CDN 回源规则会把 /${bad}/… 映射到别处）`);
  const allowed = new Set(['assets', 'index.html', '404.html', 'sitemap.xml', 'robots.txt', ...LANGS.filter(l => l.dir).map(l => l.dir), ...pages.filter(p => p.id && p.id !== '404').map(p => p.id.split('/')[0])]);
  for (const name of top.filter(n => !allowed.has(n)).sort()) errors.push(`产物根目录多出了 ${name}`);
  for (const name of top) if (name.includes('.') && statSync(join(DIST, name)).isDirectory()) errors.push(`根目录的 ${name}/ 名字里有点号，不带 / 的地址会被 CDN 当成文件`);
  const dotted = Object.keys(files).filter(u => u.endsWith('/') && u.slice(0, -1).split('/').pop().includes('.')).sort();
  if (dotted.length) warnings.push(`${dotted.length} 个地址的最后一段带点号（如 ${dotted[0]}），只有以 / 结尾的写法能访问：CDN 规则把不带 / 且含点号的地址当成文件`);

  for (const w of warnings) console.log('警告：' + w);
  console.log('页面数（12 种语言的页面 / 只有中英文的页面 / 只有英文的页面）：');
  for (const l of LANGS) {
    const c = counts[l.code];
    console.log(`  ${l.code.padEnd(6)} ${(l.dir || '(根)').padEnd(6)} ${String(c.all).padStart(3)} / ${String(c['zh-en']).padStart(3)} / ${c['en-only']}`);
  }
  console.log(`共 ${Object.keys(files).length} 个 HTML 文件，输出到 ${DIST}`);
  if (errors.length) {
    for (const e of errors.slice(0, 200)) console.log('错误：' + e);
    console.log(`构建失败：${errors.length} 个错误`);
    process.exit(1);
  }
}

main();
