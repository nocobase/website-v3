// 更新日志：content/changelog/ 里每个条目一组 Markdown 文件（<id>.md 英文，<id>.zh-CN.md、<id>.ja-JP.md 翻译，YAML front matter 加正文），生成分页的时间线 changelog、changelog/page/<n>，每页 PAGE_SIZE 条，每条直接显示完整的更新说明，没有单独的详情页。
// 条目由 nocobase 仓库的发版流程自动提交（格式见 content/changelog/README.md）：
// - 发版条目（type: release）：<channel>-<version>.md，front matter 是标题、渠道（beta / stable）、日期、GitHub Release 地址，正文是这个版本在 CHANGELOG.md（翻译文件对应 CHANGELOG.zh-CN.md、CHANGELOG.ja-JP.md）里的那一节。
// - 公告条目（type: announcement）：大版本发布时手写的，只有标题和摘要（各语言文件各写各的），整张卡片链接到博客文章（href 写源文件名 blog/<slug>.html，或 https 地址）。
// 排序：date 倒序，同一天按版本号的 <n> 倒序，再按 publishedAt 倒序；同一天的公告排在发版条目前面。
// 页面有英文、简体中文和日文（ja-JP）；某种语言的更新说明缺了显示英文。其他语言在语言菜单里链接到英文版，繁体中文链接到简体中文版。
// 每条有 id（英文文件名去掉 .md），卡片标题链接到第一页的 #<id>；条目翻到后面的页以后，第一页的脚本按 id 跳到它所在的页，已经发出去的链接不会失效。
// 预览：环境变量 CHANGELOG_DIR 换成另一个目录（比如示例数据），不要把假的条目提交进 content/changelog/。
// v2 及更早的版本在旧官网的更新日志里，页面顶部有链接。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { marked } from 'marked';
import { parse } from 'yaml';
import { escapeAttr, escapeText } from './html.mjs';
import { CONTENT } from './paths.mjs';

export const PAGE_SIZE = 10;
export const changelogDir = () => (process.env.CHANGELOG_DIR ? resolve(process.env.CHANGELOG_DIR) : join(CONTENT, 'changelog'));

const LANGS = ['en', 'zh', 'ja'];
// 页面语言 → 条目里的语言键
const NOTE_KEY = { en: 'en', zh: 'zh-CN', ja: 'ja-JP' };
const V2 = { en: 'https://nocode.nocobase.com/en/blog/timeline', zh: 'https://nocode.nocobase.com/cn/blog/timeline', ja: 'https://nocode.nocobase.com/ja/blog/timeline' };
const GITHUB = 'https://github.com/nocobase/nocobase';

// 界面文字：[英文, 简体中文, 日文]
const UI = {
  // 标题和导语与 v2 的更新日志页一致
  h1: ['Release Notes', '更新日志', 'リリースノート'],
  lede: ['Learn about the latest features, improvements, and bug fixes.', '了解最新的功能、改进和问题修复。', '最新の機能、改善、バグ修正をご確認ください。'],
  v2: ['Changelog for NocoBase 2 and earlier: <a href="{v2}" target="_blank" rel="noopener">see the NocoBase 2 changelog<i data-lucide="arrow-up-right"></i></a>', 'NocoBase 2 及更早版本的更新日志：<a href="{v2}" target="_blank" rel="noopener">查看 NocoBase 2 更新日志<i data-lucide="arrow-up-right"></i></a>', 'NocoBase 2 以前の変更履歴：<a href="{v2}" target="_blank" rel="noopener">NocoBase 2 の変更履歴を見る<i data-lucide="arrow-up-right"></i></a>'],
  beta: ['Beta', '测试版', 'ベータ版'],
  stable: ['Stable', '正式版', '安定版'],
  major: ['Major release', '大版本发布', 'メジャーリリース'],
  github: ['View release on GitHub', '在 GitHub 查看此版本', 'GitHub でリリースを見る'],
  read: ['Read the announcement', '阅读发布公告', 'お知らせを読む'],
  permalink: ['Link to this release', '本条目的链接', 'このリリースへのリンク'],
  empty: ['NocoBase 3 releases will be listed here.', 'NocoBase 3 的版本发布后会列在这里。', 'NocoBase 3 のリリースはここに掲載されます。'],
  newer: ['Previous', '上一页', '前へ'],
  older: ['Next', '下一页', '次へ'],
  pages: ['Pages', '分页', 'ページ'],
  title: ['Release Notes — NocoBase', '更新日志 — NocoBase', 'リリースノート — NocoBase'],
  titleN: ['Release Notes — Page {n} — NocoBase', '更新日志 — 第 {n} 页 — NocoBase', 'リリースノート — {n} ページ目 — NocoBase'],
  desc: ['Learn about the latest features, improvements, and bug fixes in NocoBase 3.', '了解 NocoBase 3 最新的功能、改进和问题修复。', 'NocoBase 3 の最新の機能、改善、バグ修正をご確認ください。'],
};
const ui = (k, lang) => UI[k][LANGS.indexOf(lang)];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(d, lang) {
  const [y, m, dd] = d.split('-').map(Number);
  return lang === 'en' ? `${MONTHS[m - 1]} ${dd}, ${y}` : `${y}年${m}月${dd}日`;
}

// ======================= 读取和排序 =======================

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// 翻译文件的后缀（<id>.zh-CN.md、<id>.ja-JP.md），英文是 <id>.md
const TRANSLATIONS = ['zh-CN', 'ja-JP'];

// 拆出 YAML front matter 和正文。yaml 默认的 core schema 不把 2026-11-12 解析成 Date（不会按时区偏一天），这里再统一转成字符串
export function parseEntryFile(src, name) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(src.replace(/^\uFEFF/, ''));
  if (!m) throw new Error(`更新日志条目 ${name}：开头要有 --- 包起来的 front matter`);
  let data;
  try {
    data = parse(m[1]) ?? {};
  } catch (err) {
    throw new Error(`更新日志条目 ${name}：front matter 不是合法的 YAML：${err.message}`);
  }
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error(`更新日志条目 ${name}：front matter 要是键值对`);
  for (const k of Object.keys(data)) if (data[k] instanceof Date) data[k] = data[k].toISOString().replace(/T00:00:00\.000Z$/, '');
  for (const k of Object.keys(data)) if (typeof data[k] === 'number') data[k] = String(data[k]);
  return { data, body: m[2].trim() };
}

// 读一个目录里的条目：<id>.md 是英文（必需），<id>.zh-CN.md、<id>.ja-JP.md 是可选的翻译，README.md 和其他文件不管。
// 合成和以前一样的结构：{ id, type, date, …, notes: { en, 'zh-CN', 'ja-JP' } }（发版条目），公告的 title、summary 是 { en, 'zh-CN', 'ja-JP' }。
// 格式不对直接报错，让构建失败（线上保持上一个版本），而不是悄悄少一条。
export function readEntries(dir = changelogDir()) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(f => f.endsWith('.md') && !/^readme\.md$/i.test(f)).sort();
  const groups = new Map();
  for (const f of files) {
    const base = f.slice(0, -'.md'.length);
    const lang = TRANSLATIONS.find(l => base.endsWith('.' + l)) ?? 'en';
    const id = lang === 'en' ? base : base.slice(0, -(lang.length + 1));
    if (!groups.has(id)) groups.set(id, {});
    groups.get(id)[lang] = { f, ...parseEntryFile(readFileSync(join(dir, f), 'utf8'), f) };
  }
  return [...groups].map(([id, langs]) => {
    const en = langs.en;
    if (!en) throw new Error(`更新日志条目 ${Object.values(langs)[0].f}：只有翻译，没有英文的 ${id}.md`);
    const bad = msg => new Error(`更新日志条目 ${en.f}：${msg}`);
    if (!/^[a-z0-9][a-z0-9.-]*$/i.test(id)) throw bad('文件名只能有字母、数字、点和连字符');
    const e = { ...en.data, id };
    if (!DATE.test(e.date || '')) throw bad('date 要写成 YYYY-MM-DD');
    if (e.type === 'release') {
      if (!['beta', 'stable'].includes(e.channel)) throw bad('channel 只能是 beta 或 stable');
      if (!e.title || !e.version) throw bad('发版条目要有 title 和 version');
      if (!en.body) throw bad('发版条目的英文正文（更新说明）不能为空');
      e.notes = { en: en.body };
      for (const l of TRANSLATIONS) if (langs[l]?.body) e.notes[l] = langs[l].body;
    } else if (e.type === 'announcement') {
      if (!e.title || !e.href) throw bad('公告条目要有 title 和 href');
      if (!/^(https:\/\/|blog\/[^/]+\.html$|[a-z][a-z0-9-]*\.html$)/.test(e.href)) throw bad('href 要写源文件名（blog/<slug>.html）或 https 地址');
      for (const k of ['title', 'summary']) e[k] = Object.fromEntries([['en', en.data[k]], ...TRANSLATIONS.map(l => [l, langs[l]?.data[k]])].filter(([, v]) => v));
    } else throw bad('type 只能是 release 或 announcement');
    return e;
  });
}

// 版本号 <date>.<n> 里的 n；公告没有版本号，同一天排在发版条目前面
const seq = e => (e.type === 'announcement' ? Infinity : Number(/\.(\d+)$/.exec(e.version)?.[1] ?? 0));
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export function sortEntries(entries) {
  return [...entries].sort((a, b) => cmp(b.date, a.date) || seq(b) - seq(a) || cmp(b.publishedAt || '', a.publishedAt || '') || cmp(a.id, b.id));
}

// 分成每页 size 条；没有条目时也有一页（空状态）
export function paginate(entries, size = PAGE_SIZE) {
  const pages = [];
  for (let i = 0; i < entries.length; i += size) pages.push(entries.slice(i, i + size));
  return pages.length ? pages : [[]];
}

// 第 n 页（从 1 开始）的页面 id 和站内链接的源文件名
export const pageId = n => (n === 1 ? 'changelog' : `changelog/page/${n}`);
const pageSrc = n => pageId(n) + '.html';

// 导航和页脚的「更新日志」：有条目才是链接，没有时置灰
export const hasChangelog = (dir = changelogDir()) => readEntries(dir).length > 0;

// ======================= Markdown =======================

// 更新说明来自 CHANGELOG.md，构建时用 marked 转成 HTML。原样的 HTML 一律转义成文字（不会带进脚本或样式），
// 链接只留 http(s) 和 mailto，相对地址按 GitHub 上这个 tag 的仓库文件补全。
// 时间线上不显示 PR 作者：每行末尾的「by @用户」（含 by [@用户](…)、多个作者用逗号或 and 连起来的）去掉。发版流程生成的数据本来就不带，这里给旧数据和手写的数据兜底。
// 作者可能是 GitHub App（@app/nocobase-studio）或机器人（@renovate[bot]）
const USER = String.raw`@[A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)?(?:\[bot\])?`;
const AUTHOR = String.raw`(?:${USER}|\[${USER}\]\([^)\s]*\))`;
const BY = new RegExp(String.raw`[ \t]+by[ \t]+${AUTHOR}(?:[ \t]*(?:,|and)[ \t]*${AUTHOR})*[ \t]*$`, 'gm');
export const stripAuthors = md => md.replace(BY, '');
const safeUrl = (href, base) => {
  try {
    const u = new URL(href, base);
    return /^(https?|mailto):$/.test(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
export function renderNotes(md, tag = '') {
  const base = `${GITHUB}/blob/${tag || 'main'}/`;
  const r = new marked.Renderer();
  r.html = html => escapeText(html);
  r.link = (href, title, text) => {
    const u = safeUrl(href, base);
    if (!u) return text;
    const ext = !u.startsWith('mailto:');
    return `<a href="${escapeAttr(u)}"${title ? ` title="${escapeAttr(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  };
  r.image = (href, title, text) => {
    const u = safeUrl(href, base);
    return u && u.startsWith('https:') ? `<img src="${escapeAttr(u)}" alt="${escapeAttr(text || '')}" loading="lazy">` : escapeText(text || '');
  };
  return marked.parse(stripAuthors(md), { renderer: r, gfm: true, headerIds: false, mangle: false }).trim();
}

// ======================= 页面 =======================

const text = (v, lang) => (typeof v === 'string' ? v : v ? v[NOTE_KEY[lang]] ?? v.en ?? '' : '');

function releaseCard(e, lang) {
  const key = NOTE_KEY[lang];
  const own = typeof e.notes[key] === 'string' && e.notes[key].trim();
  const md = own ? e.notes[key] : e.notes.en;
  const notes = renderNotes(md, e.tag);
  return `<article class="cl-item" id="${e.id}">
  <div class="cl-date"><time datetime="${e.date}">${fmtDate(e.date, lang)}</time></div>
  <div class="cl-card">
    <header class="cl-hd"><h2><a href="${pageSrc(1)}#${e.id}" title="${escapeAttr(ui('permalink', lang))}">${escapeText(e.title)}</a></h2><span class="pill ${e.channel === 'stable' ? 'pass' : 'beta'}">${ui(e.channel, lang)}</span></header>
    <div class="cl-notes prose"${own ? '' : ' lang="en"'}>${notes}</div>
    ${e.url ? `<p class="cl-gh"><a href="${escapeAttr(safeUrl(e.url) || GITHUB + '/releases')}" target="_blank" rel="noopener"><i data-lucide="github"></i>${ui('github', lang)}<i data-lucide="arrow-up-right"></i></a></p>` : ''}
  </div>
</article>`;
}

function announcementCard(e, lang) {
  const ext = /^https:/.test(e.href);
  return `<article class="cl-item cl-ann" id="${e.id}">
  <div class="cl-date"><time datetime="${e.date}">${fmtDate(e.date, lang)}</time></div>
  <a class="cl-card" href="${escapeAttr(e.href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>
    <span class="cl-kicker"><i data-lucide="sparkles"></i>${ui('major', lang)}</span>
    <h2>${escapeText(text(e.title, lang))}</h2>
    ${text(e.summary, lang) ? `<p>${escapeText(text(e.summary, lang))}</p>` : ''}
    <span class="cl-more">${ui('read', lang)}<i data-lucide="arrow-right"></i></span>
  </a>
</article>`;
}

// 页码：总页数不多时全列出来，多了只留第一页、最后一页和当前页前后各一页，中间用省略号
export function pageNumbers(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, cur - 1, cur, cur + 1].filter(n => n >= 1 && n <= total));
  const out = [];
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (out.length && n - out.at(-1) > 1) out.push(n - out.at(-1) === 2 ? n - 1 : null);
    out.push(n);
  }
  return out;
}

function pager(cur, total, lang) {
  if (total < 2) return '';
  const nums = pageNumbers(cur, total).map(n => n === null ? '<span class="gap">…</span>'
    : n === cur ? `<span class="on" aria-current="page">${n}</span>` : `<a href="${pageSrc(n)}">${n}</a>`).join('');
  const prev = cur > 1 ? `<a class="step" href="${pageSrc(cur - 1)}" rel="prev"><i data-lucide="arrow-left"></i>${ui('newer', lang)}</a>` : `<span class="step off"><i data-lucide="arrow-left"></i>${ui('newer', lang)}</span>`;
  const next = cur < total ? `<a class="step" href="${pageSrc(cur + 1)}" rel="next">${ui('older', lang)}<i data-lucide="arrow-right"></i></a>` : `<span class="step off">${ui('older', lang)}<i data-lucide="arrow-right"></i></span>`;
  return `<nav class="cl-pager" aria-label="${ui('pages', lang)}">${prev}<span class="nums">${nums}</span>${next}</nav>`;
}

const STYLE = `<style>
.cl-v2 { margin-top: 14px; font-size: 15px; color: var(--muted); }
.cl-v2 a { display: inline-flex; align-items: center; gap: 4px; color: var(--brand); }
.cl-v2 svg.lucide { width: 14px; height: 14px; }
.cl-empty { padding: 48px 0; color: var(--muted); font-size: 16px; }
/* 时间线：左边日期，中间竖线和圆点，右边卡片 */
.cl-tl { position: relative; display: grid; gap: 28px; }
.cl-tl::before { content: ""; position: absolute; top: 8px; bottom: 8px; left: 180px; width: 2px; background: var(--rule); }
.cl-item { display: grid; grid-template-columns: 156px minmax(0, 1fr); gap: 48px; position: relative; scroll-margin-top: 90px; }
.cl-item::before { content: ""; position: absolute; left: 175px; top: 22px; width: 12px; height: 12px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 0 4px var(--paper); }
.cl-date { position: sticky; top: 96px; align-self: start; z-index: 1; }
.cl-date time { display: block; padding: 10px 14px; border: 1px solid var(--rule); border-radius: 10px; background: var(--card); font-size: 14.5px; font-weight: 500; color: var(--ink-2); text-align: center; white-space: nowrap; }
.cl-card { display: block; min-width: 0; padding: 26px 30px 24px; border: 1px solid var(--rule); border-radius: 14px; background: var(--card); }
.cl-item:target .cl-card { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-tint); }
.cl-hd { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.cl-hd h2 { font-size: 21px; line-height: 1.4; font-weight: 650; letter-spacing: -0.01em; }
.cl-hd h2 a { color: inherit; }
.cl-hd h2 a:hover { color: var(--brand); }
.pill.beta { border-color: transparent; background: var(--orange-tint); color: var(--orange-ink); }
.cl-card .prose { max-width: none; margin-top: 6px; font-size: 15.5px; line-height: 1.75; }
.cl-card .prose h3 { margin-top: 1.3em; font-size: 16.5px; }
.cl-card .prose h4 { margin-top: 1.1em; font-size: 15.5px; }
.cl-card .prose > * + * { margin-top: 0.7em; }
.cl-card .prose li + li { margin-top: 0.3em; }
.cl-card .prose a { text-decoration: none; }
.cl-card .prose a:hover { text-decoration: underline; }
.cl-gh { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--rule); font-size: 14px; }
.cl-gh a { display: inline-flex; align-items: center; gap: 6px; color: var(--brand); }
.cl-gh svg.lucide { width: 15px; height: 15px; }
/* 大版本公告：深色卡片，整张可点 */
.cl-ann::before { width: 18px; height: 18px; left: 172px; top: 19px; background: var(--card); border: 5px solid var(--brand); box-sizing: border-box; }
.cl-ann .cl-date time { border-color: transparent; background: var(--brand-tint); color: var(--brand); font-weight: 600; }
.cl-ann .cl-card { padding: 30px 32px; border: 0; background: var(--deep); color: var(--on-deep); transition: background 0.15s; }
.cl-ann .cl-card:hover { background: var(--deep-2); }
.cl-kicker { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; color: var(--deep-accent); text-transform: uppercase; }
.cl-kicker svg.lucide { width: 15px; height: 15px; }
.cl-ann h2 { margin-top: 10px; font-size: 28px; line-height: 1.3; font-weight: 650; letter-spacing: -0.015em; }
.cl-ann p { margin-top: 10px; max-width: 760px; font-size: 16px; line-height: 1.75; color: var(--on-deep-2); }
.cl-more { display: inline-flex; align-items: center; gap: 6px; margin-top: 18px; font-size: 15px; font-weight: 500; color: var(--on-deep); }
.cl-more svg.lucide { width: 16px; height: 16px; transition: transform 0.15s; }
.cl-ann .cl-card:hover .cl-more svg.lucide { transform: translateX(3px); }
/* 分页 */
.cl-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; margin-top: 48px; font-size: 15px; }
.cl-pager .nums { display: flex; gap: 4px; }
.cl-pager .nums > * { display: inline-grid; place-items: center; min-width: 38px; height: 38px; padding: 0 6px; border-radius: 8px; color: var(--ink-2); }
.cl-pager .nums a:hover { background: var(--paper-2); color: var(--ink); }
.cl-pager .nums .on { background: var(--brand); color: var(--on-brand); font-weight: 600; }
.cl-pager .nums .gap { min-width: 20px; color: var(--muted); }
.cl-pager .step { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: 1px solid var(--rule-2); border-radius: 8px; background: var(--card); color: var(--ink); }
.cl-pager a.step:hover { border-color: var(--brand); color: var(--brand); }
.cl-pager .step.off { color: var(--muted); border-color: var(--rule); background: none; }
.cl-pager svg.lucide { width: 15px; height: 15px; }
@media (max-width: 760px) {
  .cl-tl::before { left: 5px; }
  .cl-item { grid-template-columns: minmax(0, 1fr); gap: 10px; padding-left: 28px; }
  .cl-item::before { left: 0; top: 9px; }
  .cl-ann::before { left: -3px; top: 6px; }
  .cl-date { position: static; }
  .cl-date time { display: inline-block; padding: 0; border: 0; background: none; text-align: left; }
  .cl-ann .cl-date time { padding: 2px 10px; }
  .cl-card { padding: 20px 18px; }
  .cl-ann .cl-card { padding: 22px 20px; }
  .cl-hd h2 { font-size: 18px; }
  .cl-ann h2 { font-size: 23px; }
  .cl-pager .step { padding: 0 10px; }
}
</style>`;

function render(entries, n, total, jump, lang) {
  const items = entries.map(e => (e.type === 'announcement' ? announcementCard(e, lang) : releaseCard(e, lang))).join('\n');
  // 第一页：#<id> 不在这一页时，跳到条目所在的页（条目随新版本往后翻页，已经发出去的链接仍然有效）
  const script = jump && Object.keys(jump).length ? `
<script>
(function () {
  var pages = ${JSON.stringify(jump).replaceAll('</', '<\\/')};
  function go() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || document.getElementById(id) || !pages[id]) return;
    location.replace(location.pathname.replace(/\\/?$/, '/') + 'page/' + pages[id] + '/' + location.hash);
  }
  go();
  window.addEventListener('hashchange', go);
})();
</script>` : '';
  return `${STYLE}
<section class="phero">
  <div class="container">
    <h1>${ui('h1', lang)}</h1>
    <p class="lede">${ui('lede', lang)}</p>
    <p class="cl-v2">${ui('v2', lang).replace('{v2}', V2[lang])}</p>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    ${items ? `<div class="cl-tl">${items}</div>` : `<p class="cl-empty">${ui('empty', lang)}</p>`}
    ${pager(n, total, lang)}
  </div>
</section>${script}`;
}

// 每页一项：{ id, langs, meta, main（英文）, mains: { zh, ja } }，site.mjs 按语言生成
export function changelogPages(dir = changelogDir()) {
  const pages = paginate(sortEntries(readEntries(dir)));
  const total = pages.length;
  const jump = {};
  pages.forEach((p, i) => { if (i) for (const e of p) jump[e.id] = i + 1; });
  return pages.map((entries, i) => {
    const n = i + 1;
    const [en, zh, ja] = LANGS.map(lang => render(entries, n, total, n === 1 ? jump : null, lang));
    const title = lang => (n === 1 ? ui('title', lang) : ui('titleN', lang).replace('{n}', n));
    const meta = { page: 'changelog', title_en: title('en'), title_zh: title('zh'), title_ja: title('ja'), desc_en: ui('desc', 'en'), desc_zh: ui('desc', 'zh'), desc_ja: ui('desc', 'ja') };
    return { id: pageId(n), langs: LANGS, meta, main: en, mains: { zh, ja } };
  });
}
