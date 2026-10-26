// 更新日志：从 src/blog/releases.json（scripts/cms-import.mjs 生成）生成列表页 changelog 和每个版本的详情页 changelog/<版本>，中英双语的正文，构建时再按语言生成（只有英文和简体中文）。
// 只有 v3 的版本（筛选在 cms-import.mjs），按 Milestone / Latest / Beta / Alpha 筛选；有博客详情页的版本直接链到博客文章。
// v2 及更早的版本在旧官网的更新日志里，页面顶部有链接。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fmtDate } from './blog.mjs';
import { unescape } from './html.mjs';
import { SRC } from './paths.mjs';

const V2 = 'https://nocode.nocobase.com/{lang}/blog/timeline';
const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KINDS = [['milestone', '里程碑', 'Milestone', 'brand'], ['latest', '正式版', 'Latest', 'pass'], ['beta', '测试版', 'Beta', ''], ['alpha', '预览版', 'Alpha', 'soon']];
const KIND = Object.fromEntries(KINDS.map(([k, z, e, c]) => [k, [z, e, c]]));
const plain = s => unescape(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();

// 摘要：CMS 里大多数版本的描述只是「Release Note of vX」「vX 更新日志」，这时取正文第一条
function summary(e) {
  const d = e.desc.trim();
  if (d && !/^(release note|v?\d[\w.-]* ?更新日志)/i.test(d)) return d;
  const m = /<(li|p)>([\s\S]*?)<\/\1>/.exec(e.body);
  let s = m ? plain(m[2]) : '';
  // 去掉自动生成的更新日志里的 [undefined] 前缀和「( #PR ) by @作者」尾巴
  s = s.replace(/^\[undefined\]\s*/, '').replace(/\s*\(\s*#\d+\s*\)\s*by\s+@\S+.*$/, '');
  return [...s].length <= 140 ? s : [...s].slice(0, 138).join('').trimEnd() + '…';
}
function pill(k) {
  if (!(k in KIND)) return '';
  const [z, e, c] = KIND[k];
  return `<span class="pill ${c}">${T(z, e)}</span>`;
}

const STYLE = `<style>
.cl-list { margin-top: 32px; border-top: 1px solid var(--rule); }
.cl-year { margin: 40px 0 4px; font-size: 15px; font-weight: 600; color: var(--muted); }
.cl-row { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 4px 24px; padding: 18px 0; border-bottom: 1px solid var(--rule); color: inherit; text-decoration: none; }
.cl-row:hover b { color: var(--brand); }
.cl-row time { font-size: 14px; color: var(--muted); padding-top: 3px; }
.cl-row .hd { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.cl-row b { font-size: 17px; font-weight: 600; }
.cl-row p { margin: 6px 0 0; font-size: 14.5px; line-height: 1.7; color: var(--ink-2); }
.cl-row.milestone b { font-size: 19px; }
.cl-v2 { margin-top: 14px; font-size: 15px; color: var(--muted); }
.cl-v2 a { display: inline-flex; align-items: center; gap: 4px; color: var(--brand); }
.cl-v2 svg.lucide { width: 14px; height: 14px; }
.cl-empty { padding: 48px 0; color: var(--muted); font-size: 16px; }
@media (max-width: 640px) { .cl-row { grid-template-columns: 1fr; } }
</style>`;

export function changelogPages() {
  const releases = JSON.parse(readFileSync(join(SRC, 'blog', 'releases.json'), 'utf8'));
  const OUT = [];
  const key = k => [releases[k].en.date, k];
  const order = Object.keys(releases).sort((a, b) => { const x = key(a), y = key(b); return x[0] < y[0] ? 1 : x[0] > y[0] ? -1 : x[1] < y[1] ? 1 : x[1] > y[1] ? -1 : 0; });
  const href = slug => (releases[slug].post ? `blog/${slug}.html` : `changelog/${slug}.html`);
  const build = (id, tz, te, dz, de, main) => OUT.push({ id, meta: { page: 'changelog', title_zh: tz, title_en: te, desc_zh: dz, desc_en: de }, main });

  // 列表页
  const rows = [];
  let year = null;
  for (const s of order) {
    const r = releases[s], e = r.en, c = r.cn, y = e.date.slice(0, 4);
    if (y !== year) { rows.push(`<h2 class="cl-year" data-year="${y}">${y}</h2>`); year = y; }
    rows.push(`<a class="cl-row ${r.kind}" href="${href(s)}" data-k="${r.kind}"><time>${T(fmtDate(c.date, 'cn'), fmtDate(e.date, 'en'))}</time>` +
      `<span><span class="hd"><b>${T(esc(c.title), esc(e.title))}</b>${pill(r.kind)}</span>` +
      `<p>${T(esc(summary(c)), esc(summary(e)))}</p></span></a>`);
  }
  const present = new Set(order.map(s => releases[s].kind));
  const chips = '<button type="button" class="on" data-f="">' + T('全部', 'All') + '</button>' + KINDS.filter(([k]) => present.has(k)).map(([k, z, e]) => `<button type="button" data-f="${k}">${T(z, e)}</button>`).join('');
  if (!order.length) rows.push(`<p class="cl-empty">${T('NocoBase 3 的版本发布后会列在这里。', 'NocoBase 3 releases will be listed here.')}</p>`);
  const listing = `${STYLE}
<section class="phero">
  <div class="container">
    <p class="label"><b>${T('更新日志', 'Changelog')}</b></p>
    <h1>${T('每次版本迭代的<span class="m">新能力与改进。</span>', 'What shipped <span class="m">in every release.</span>')}</h1>
    <p class="lede">${T('NocoBase 3 每个版本的新功能、改进和问题修复。', 'New features, improvements, and fixes in every NocoBase 3 release.')}</p>
    <p class="cl-v2">${T(`NocoBase 2 及更早版本的更新日志：<a href="${V2.replace('{lang}', 'cn')}" target="_blank" rel="noopener">查看 NocoBase 2 更新日志<i data-lucide="arrow-up-right"></i></a>`, `Changelog for NocoBase 2 and earlier: <a href="${V2.replace('{lang}', 'en')}" target="_blank" rel="noopener">see the NocoBase 2 changelog<i data-lucide="arrow-up-right"></i></a>`)}</p>
  </div>
</section>
<section class="sec tight" style="padding-top:56px">
  <div class="container">
    ${order.length ? '<div class="bfilter" role="group" aria-label="Filter">' + chips + '</div>' : ''}
    <div class="cl-list" id="cl">${rows.join('')}</div>
  </div>
</section>
<script>
(function () {
  var chips = document.querySelectorAll('.bfilter button'), list = document.getElementById('cl');
  chips.forEach(function (b) { b.addEventListener('click', function () {
    chips.forEach(function (x) { x.classList.toggle('on', x === b); });
    var f = b.getAttribute('data-f'), shown = {};
    list.querySelectorAll('.cl-row').forEach(function (r) { r.hidden = !!f && r.getAttribute('data-k') !== f; });
    // 筛选后没有条目的年份标题一起隐藏
    var head = null, any = false;
    Array.prototype.forEach.call(list.children, function (el) {
      if (el.tagName === 'H2') { if (head) head.hidden = !any; head = el; any = false; }
      else if (!el.hidden) any = true;
    });
    if (head) head.hidden = !any;
  }); });
})();
</script>`;
  build('changelog', '更新日志 — NocoBase', 'Changelog — NocoBase', 'NocoBase 3 每个版本的新功能、改进和问题修复。', 'New features, improvements, and fixes in every NocoBase 3 release.', listing);

  // 详情页（有博客文章的版本不单独生成）
  order.forEach((s, i) => {
    const r = releases[s];
    if (r.post) return;
    const e = r.en, c = r.cn;
    const near = order.slice(Math.max(0, i - 3), i + 4).filter(k => k !== s).slice(0, 3);
    const more = near.map(k => `<a class="cl-row ${releases[k].kind}" href="${href(k)}"><time>${T(fmtDate(releases[k].cn.date, 'cn'), fmtDate(releases[k].en.date, 'en'))}</time>` +
      `<span><span class="hd"><b>${T(esc(releases[k].cn.title), esc(releases[k].en.title))}</b>${pill(releases[k].kind)}</span></span></a>`).join('');
    const body = `${STYLE}
<div class="container">
  <header class="post-hero">
    <p class="crumb"><a href="changelog.html">${T('更新日志', 'Changelog')}</a></p>
    <h1>${T(esc(c.title), esc(e.title))}</h1>
    <div class="bmeta">${pill(r.kind)}<span>${T(fmtDate(c.date, 'cn'), fmtDate(e.date, 'en'))}</span></div>
  </header>
  <div class="post-body">
    <article><div class="prose zh-only">${c.body}</div><div class="prose en-only">${e.body}</div></article>
    <div></div>
  </div>
  <section class="post-more">
    <h2>${T('相邻版本', 'Nearby releases')}</h2>
    <div class="cl-list">${more}</div>
  </section>
</div>`;
    build('changelog/' + s, c.title + ' — NocoBase', e.title + ' — NocoBase', summary(c).replaceAll('\n', ' '), summary(e).replaceAll('\n', ' '), body);
  });
  return OUT;
}
