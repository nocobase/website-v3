// 更新日志：读取 content/changelog/ 的条目、排序、分页、Markdown 的安全处理和生成的页面。条目写在临时目录里，不依赖仓库里的数据。
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';
import { stringify } from 'yaml';
import { changelogPages, groupByDay, hasChangelog, pageId, pageNumbers, paginate, parseEntryFile, readEntries, renderNotes, sortEntries, stripAuthors } from './changelog.mjs';

const release = (channel, version, extra = {}) => ({
  type: 'release', tag: `${channel === 'beta' ? 'nocobase-v3-beta' : 'release'}/${version}`, channel, version,
  title: `NocoBase v3 ${channel === 'beta' ? 'Beta ' : ''}· ${version}`, date: version.split('.')[0], publishedAt: `${version.split('.')[0]}T08:00:00Z`,
  url: `https://github.com/nocobase/nocobase/releases/tag/x`, notes: { en: `### 🐛 Bug Fixes\n\n- **[Server]** Fix ${version}. ([#1](https://github.com/nocobase/nocobase/pull/1)) by @someone` }, ...extra,
});
// Studio 发版条目：没有 url，版本号是 1.0.0-beta.<n>
const studio = (version, date, extra = {}) => ({
  type: 'release', product: 'studio', tag: `v${version}`, channel: /-beta\./.test(version) ? 'beta' : 'stable', version,
  title: `NocoBase Studio · v${version}`, date, publishedAt: `${date}T09:00:00Z`, notes: { en: `### 🎉 New Features\n\n- **[Quality]** Studio ${version}.` }, ...extra,
});
// 条目对象 → 发版流程写出的文件：<id>.md（英文）和 <id>.<语言>.md，front matter 加正文
const SUFFIX = { en: '', 'zh-CN': '.zh-CN', 'ja-JP': '.ja-JP' };
const file = (data, body = '') => `---\n${stringify(data)}---\n\n${body}\n`;
function entryFiles(id, e) {
  const out = {};
  if (e.type === 'release') {
    const { notes, ...fm } = e;
    for (const [l, body] of Object.entries(notes)) out[`${id}${SUFFIX[l]}.md`] = file(fm, body);
  } else {
    const per = v => (typeof v === 'string' ? { en: v } : v || {});
    const { title, summary, ...fm } = e;
    for (const l of Object.keys(per(title))) out[`${id}${SUFFIX[l]}.md`] = file({ ...fm, title: per(title)[l], ...(per(summary)[l] && { summary: per(summary)[l] }) });
  }
  return out;
}
// 键是文件名（带 .md 或其他后缀）时原样写，否则键是条目 id、值是条目对象
function dir(files) {
  const d = mkdtempSync(join(tmpdir(), 'changelog-'));
  for (const [name, v] of Object.entries(files)) {
    if (typeof v === 'string') writeFileSync(join(d, name), v);
    else for (const [f, text] of Object.entries(entryFiles(name, v))) writeFileSync(join(d, f), text);
  }
  return d;
}

test('entries are read from Markdown files, with the English file name as id and translations merged in', () => {
  const d = dir({ 'beta-2026-11-12.1': release('beta', '2026-11-12.1', { notes: { en: '- English', 'zh-CN': '- 中文' } }), 'README.md': '# not an entry', '.gitkeep': '' });
  const [e] = readEntries(d);
  assert.equal(readEntries(d).length, 1);
  assert.equal(e.id, 'beta-2026-11-12.1');
  assert.deepEqual(e.notes, { en: '- English', 'zh-CN': '- 中文' });
  assert.equal(e.date, '2026-11-12');
  assert.equal(e.version, '2026-11-12.1');
  assert.equal(hasChangelog(d), true);
  assert.equal(hasChangelog(dir({ 'README.md': '' })), false);
  assert.deepEqual(readEntries(join(d, 'missing')), []);
});

test('dates stay plain strings whatever the YAML says', () => {
  const { data, body } = parseEntryFile('---\ndate: 2026-11-12\npublishedAt: 2026-11-12T08:31:00Z\nversion: 2026-11-12.1\nn: 3\n---\n\n- note\n', 'x.md');
  assert.deepEqual(data, { date: '2026-11-12', publishedAt: '2026-11-12T08:31:00Z', version: '2026-11-12.1', n: '3' });
  assert.equal(body, '- note');
  assert.equal(parseEntryFile('---\ndate: !!timestamp 2026-11-12\n---\n', 'x.md').data.date, '2026-11-12');
});

test('a malformed entry fails the build with the file name', () => {
  assert.throws(() => readEntries(dir({ 'beta-x.md': '- no front matter' })), /beta-x\.md/);
  assert.throws(() => readEntries(dir({ 'beta-x.md': '---\ntitle: [unclosed\n---\n' })), /beta-x\.md.*YAML/);
  assert.throws(() => readEntries(dir({ a: release('nightly', '2026-11-12.1') })), /channel/);
  assert.throws(() => readEntries(dir({ a: release('beta', '2026-11-12.1', { date: '12/11/2026' }) })), /date/);
  assert.throws(() => readEntries(dir({ a: release('beta', '2026-11-12.1', { notes: { en: '' } }) })), /正文/);
  assert.throws(() => readEntries(dir({ a: { type: 'announcement', date: '2026-12-01', title: 'x', href: 'javascript:alert(1)' } })), /href/);
  // 只有翻译没有英文
  assert.throws(() => readEntries(dir({ a: release('beta', '2026-11-12.1', { notes: { 'zh-CN': '- 中文' } }) })), /a\.zh-CN\.md.*a\.md/);
  assert.throws(() => readEntries(dir({ a: release('beta', '2026-11-12.1', { product: 'cloud' }) })), /a\.md.*product/);
});

test('product defaults to nocobase and may be studio', () => {
  const entries = readEntries(dir({ 'beta-2026-11-12.1': release('beta', '2026-11-12.1'), 'studio-1.0.0-beta.90': studio('1.0.0-beta.90', '2026-11-12') }));
  assert.deepEqual(Object.fromEntries(entries.map(e => [e.id, e.product])), { 'beta-2026-11-12.1': 'nocobase', 'studio-1.0.0-beta.90': 'studio' });
});

test('newest date first, then the release number, then publishedAt; announcements lead their day', () => {
  const entries = [
    { ...release('beta', '2026-11-10.1'), id: 'b10-1' },
    { ...release('beta', '2026-11-10.2'), id: 'b10-2' },
    { ...release('stable', '2026-11-10.2', { publishedAt: '2026-11-10T09:00:00Z' }), id: 's10-2' },
    { ...release('beta', '2026-11-12.1'), id: 'b12-1' },
    { ...release('beta', '2026-11-09.10'), id: 'b09-10' },
    { ...release('beta', '2026-11-09.9'), id: 'b09-9' },
    { type: 'announcement', date: '2026-11-10', title: 'x', href: 'blog/x.html', id: 'v3-0' },
  ];
  assert.deepEqual(sortEntries(entries).map(e => e.id), ['b12-1', 'v3-0', 's10-2', 'b10-2', 'b10-1', 'b09-10', 'b09-9']);
});

test('Studio and NocoBase releases mix by publishedAt; the version number only breaks ties between NocoBase releases', () => {
  const entries = [
    { ...release('beta', '2026-11-17.1', { publishedAt: '2026-11-17T05:00:00Z' }), id: 'b17-1' },
    { ...release('beta', '2026-11-17.2', { publishedAt: '2026-11-17T10:00:00Z' }), id: 'b17-2' },
    { ...studio('1.0.0-beta.90', '2026-11-17', { publishedAt: '2026-11-17T08:00:00Z' }), id: 'studio-1.0.0-beta.90' },
    // 同一时间发的两个 Studio 版本：版本号不参与比较，按 id
    { ...studio('1.0.0-beta.100', '2026-11-16', { publishedAt: '2026-11-16T08:00:00Z' }), id: 'studio-1.0.0-beta.100' },
    { ...studio('1.0.0-beta.99', '2026-11-16', { publishedAt: '2026-11-16T08:00:00Z' }), id: 'studio-1.0.0-beta.99' },
    { ...studio('1.0.0-beta.91', '2026-11-18', { publishedAt: '2026-11-18T23:00:00Z' }), id: 'studio-1.0.0-beta.91' },
    { type: 'announcement', date: '2026-11-17', title: 'x', href: 'blog/x.html', id: 'v3-0' },
  ];
  assert.deepEqual(sortEntries(entries).map(e => e.id), ['studio-1.0.0-beta.91', 'v3-0', 'b17-2', 'studio-1.0.0-beta.90', 'b17-1', 'studio-1.0.0-beta.100', 'studio-1.0.0-beta.99']);
});

test('consecutive entries of the same date form one day group', () => {
  const days = groupByDay([{ id: 'a', date: '2026-11-17' }, { id: 'b', date: '2026-11-17' }, { id: 'c', date: '2026-11-16' }]);
  assert.deepEqual(days.map(d => [d.date, d.entries.map(e => e.id)]), [['2026-11-17', ['a', 'b']], ['2026-11-16', ['c']]]);
  assert.deepEqual(groupByDay([]), []);
});

test('pages hold ten entries, and there is always a first page', () => {
  const list = Array.from({ length: 23 }, (_, i) => i);
  assert.deepEqual(paginate(list).map(p => p.length), [10, 10, 3]);
  assert.deepEqual(paginate([]), [[]]);
  assert.equal(pageId(1), 'changelog');
  assert.equal(pageId(3), 'changelog/page/3');
});

test('page numbers keep the ends and the neighbours of the current page', () => {
  assert.deepEqual(pageNumbers(2, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageNumbers(1, 20), [1, 2, null, 20]);
  assert.deepEqual(pageNumbers(10, 20), [1, null, 9, 10, 11, null, 20]);
  assert.deepEqual(pageNumbers(4, 20), [1, 2, 3, 4, 5, null, 20]);
});

test('release notes keep links but never raw HTML or script links', () => {
  const html = renderNotes('- **[Server]** Fix ([#1](https://github.com/nocobase/nocobase/pull/1)) by @chenos\n- Fix <script>alert(1)</script> and [x](javascript:alert(1)) in `@nocobase/server`\n- [guide](docs/guide.md)\n\n<iframe src="https://example.com"></iframe>', 'release/2026-11-12.1');
  assert.match(html, /<strong>\[Server\]<\/strong>/);
  assert.match(html, /<a href="https:\/\/github.com\/nocobase\/nocobase\/pull\/1" target="_blank" rel="noopener">#1<\/a>/);
  assert.doesNotMatch(html, /chenos|by/);
  assert.doesNotMatch(html, /<script|<iframe|javascript:/);
  assert.match(html, /and x in/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<code>@nocobase\/server<\/code>/);
  assert.match(html, /href="https:\/\/github.com\/nocobase\/nocobase\/blob\/release\/2026-11-12.1\/docs\/guide.md"/);
});

test('edition markers become badges in the page language, and nothing else in braces does', () => {
  const md = '- **[Quality]** {{edition:enterprise}} Review gates\n- **[Quality]** {{edition:professional}}\n  - Nested item\n- `{{edition:enterprise}}` {{edition:team}} {{ edition:enterprise }} {{edition:enterprise}}<script>alert(1)</script>\n- [{{edition:enterprise}}](https://example.com "{{edition:professional}}")';
  const en = renderNotes(md, '', { product: 'studio' });
  assert.match(en, /<strong>\[Quality\]<\/strong> <span class="edition-badge enterprise" title="Available in Enterprise edition" aria-label="Available in Enterprise edition">Enterprise<\/span> Review gates/);
  assert.match(en, /<span class="edition-badge professional" title="Available in Professional and Enterprise editions" aria-label="Available in Professional and Enterprise editions">Professional\+<\/span><ul>\s*<li>Nested item/);
  assert.match(renderNotes(md, '', { lang: 'zh' }), /<span class="edition-badge enterprise" title="仅适用于企业版" aria-label="仅适用于企业版">企业版<\/span>.*<span class="edition-badge professional" title="适用于专业版和企业版" aria-label="适用于专业版和企业版">专业版\+<\/span>/s);
  assert.match(renderNotes(md, '', { lang: 'ja' }), /<span class="edition-badge enterprise" title="エンタープライズ版で利用可能" aria-label="エンタープライズ版で利用可能">エンタープライズ版<\/span>.*<span class="edition-badge professional" title="プロフェッショナル版およびエンタープライズ版で利用可能" aria-label="プロフェッショナル版およびエンタープライズ版で利用可能">プロフェッショナル版\+<\/span>/s);
  // 代码里、链接的 title 属性里不替换；其他 {{…}} 原样当文字；标记旁边的原样 HTML 仍然转义
  assert.match(en, /<code>\{\{edition:enterprise\}\}<\/code> \{\{edition:team\}\} \{\{ edition:enterprise \}\} <span class="edition-badge enterprise"[^>]*>Enterprise<\/span>&lt;script&gt;/);
  assert.match(en, /title="\{\{edition:professional\}\}"/);
  assert.doesNotMatch(en, /<script/);
});

test('Studio notes do not resolve relative links against the NocoBase repository', () => {
  assert.doesNotMatch(renderNotes('- [guide](docs/guide.md) and [site](https://www.nocobase.com/)', 'v1.0.0', { product: 'studio' }), /href="[^"]*guide/);
  assert.match(renderNotes('- [site](https://www.nocobase.com/)', 'v1.0.0', { product: 'studio' }), /href="https:\/\/www\.nocobase\.com\/"/);
});

test('PR author credits at the end of a line are dropped, other @ text stays', () => {
  const md = [
    '- **[Agents]** Show quota windows ([#11483](https://github.com/nocobase/nocobase/pull/11483)) by @2013xile',
    '  - Nested fix. ([#1](https://github.com/nocobase/nocobase/pull/1)) by [@chenos](https://github.com/chenos)',
    '- Two authors ([#2](u)) by @a-b, @c and [@d](https://github.com/d)',
    '- Bot change ([#3](u)) by @app/nocobase-studio',
    '- Bot change ([#4](u)) by [@renovate[bot]](https://github.com/apps/renovate)',
    '- Uses `@nocobase/server` as written by the team',
    '- Mention @someone in the middle',
  ].join('\n');
  assert.equal(stripAuthors(md), [
    '- **[Agents]** Show quota windows ([#11483](https://github.com/nocobase/nocobase/pull/11483))',
    '  - Nested fix. ([#1](https://github.com/nocobase/nocobase/pull/1))',
    '- Two authors ([#2](u))',
    '- Bot change ([#3](u))',
    '- Bot change ([#4](u))',
    '- Uses `@nocobase/server` as written by the team',
    '- Mention @someone in the middle',
  ].join('\n'));
  assert.doesNotMatch(renderNotes(md), /2013xile|chenos|@d\b/);
});

test('pages in English, Chinese and Japanese, with English notes when a language is missing', () => {
  const files = {};
  for (let d = 1; d <= 12; d++) {
    const v = `2026-11-${String(d).padStart(2, '0')}.1`;
    files[`beta-${v}`] = release('beta', v, d === 12 ? { notes: { en: '- English note', 'zh-CN': '- 中文说明' } } : {});
  }
  files['v3-0'] = { type: 'announcement', date: '2026-11-01', title: { en: 'NocoBase 3.0', 'zh-CN': 'NocoBase 3.0 发布' }, summary: { en: 'Big one.' }, href: 'blog/nocobase-3-0.html' };
  const pages = changelogPages(dir(files));
  assert.deepEqual(pages.map(p => p.id), ['changelog', 'changelog/page/2']);
  const [first, second] = pages;
  assert.deepEqual(first.langs, ['en', 'zh', 'ja']);
  assert.match(first.main, /id="beta-2026-11-12\.1"/);
  assert.match(first.main, /English note/);
  assert.match(first.mains.zh, /中文说明/);
  // 日文缺了显示英文，标上 lang="en"
  assert.match(first.mains.ja, /<div class="cl-notes prose" lang="en"><ul>\s*<li>English note/);
  assert.match(first.main, /href="changelog\/page\/2\.html" rel="next"/);
  // 第一页带上后面各页条目的页码，#<id> 链接翻页后仍然有效
  assert.match(first.main, /"v3-0":2/);
  assert.doesNotMatch(second.main, /<script>/);
  assert.match(second.main, /class="cl-item cl-ann" id="v3-0"/);
  assert.match(second.mains.zh, /NocoBase 3\.0 发布/);
  assert.match(second.mains.ja, /NocoBase 3\.0</);
  assert.match(second.main, /href="blog\/nocobase-3-0\.html"/);
  assert.equal(second.meta.title_zh, '更新日志 — 第 2 页 — NocoBase');
});

test('a Studio card is a release card without the GitHub footer, with edition badges in each language', () => {
  const marked = '### 🎉 New Features\n\n- **[Quality]** {{edition:enterprise}} Review gates';
  const [page] = changelogPages(dir({
    'beta-2026-11-17.1': release('beta', '2026-11-17.1'),
    'studio-1.0.0-beta.90': studio('1.0.0-beta.90', '2026-11-17', { notes: { en: marked, 'zh-CN': marked.replace('Review gates', '评审关卡') } }),
  }));
  const card = html => /<article class="cl-item" id="studio-1\.0\.0-beta\.90">[\s\S]*?<\/article>/.exec(html)[0];
  const en = card(page.main);
  assert.match(en, /<h2><a href="changelog\.html#studio-1\.0\.0-beta\.90"[^>]*>NocoBase Studio · v1\.0\.0-beta\.90<\/a><\/h2><span class="pill beta">Beta<\/span>/);
  assert.doesNotMatch(en, /cl-gh|github/i);
  assert.match(en, />Enterprise<\/span> Review gates/);
  assert.match(card(page.mains.zh), />企业版<\/span> 评审关卡/);
  // 日文缺了显示英文正文，标签按页面语言
  assert.match(card(page.mains.ja), /lang="en"[\s\S]*>エンタープライズ版<\/span> Review gates/);
  // NocoBase 卡片仍然有 GitHub 链接
  assert.match(page.main, /class="cl-gh"/);
});

test('the date shows once per day on a page, and again on the next page when a day spans two', () => {
  const files = { 'v3-0': { type: 'announcement', date: '2026-11-17', title: 'NocoBase 3.0', href: 'blog/nocobase-3-0.html' } };
  // 11-17：公告 + 1 个 NocoBase + 1 个 Studio；11-16：1 个 NocoBase；11-05 到 11-12 各 1 个；11-04：2 个，分在第 1、2 页
  files['beta-2026-11-17.1'] = release('beta', '2026-11-17.1');
  files['studio-1.0.0-beta.90'] = studio('1.0.0-beta.90', '2026-11-17');
  files['beta-2026-11-16.1'] = release('beta', '2026-11-16.1');
  for (let d = 5; d <= 9; d++) files[`beta-2026-11-0${d}.1`] = release('beta', `2026-11-0${d}.1`);
  files['beta-2026-11-04.2'] = release('beta', '2026-11-04.2');
  files['beta-2026-11-04.1'] = release('beta', '2026-11-04.1');
  const [first, second] = changelogPages(dir(files));
  const days = html => [...html.matchAll(/<div class="cl-day( cl-day-ann)?">\n<div class="cl-date"><time datetime="([\d-]+)">/g)].map(m => m[2] + (m[1] ? '*' : ''));
  const ids = html => [...html.matchAll(/<article class="cl-item[^"]*" id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(days(first.main), ['2026-11-17*', '2026-11-16', '2026-11-09', '2026-11-08', '2026-11-07', '2026-11-06', '2026-11-05', '2026-11-04']);
  assert.equal(first.main.match(/class="cl-date"/g).length, 8);
  assert.deepEqual(ids(first.main), ['v3-0', 'studio-1.0.0-beta.90', 'beta-2026-11-17.1', 'beta-2026-11-16.1', 'beta-2026-11-09.1', 'beta-2026-11-08.1', 'beta-2026-11-07.1', 'beta-2026-11-06.1', 'beta-2026-11-05.1', 'beta-2026-11-04.2']);
  // 同一天的卡片在同一个组里
  assert.match(first.main, /<div class="cl-day cl-day-ann">\n<div class="cl-date"><time datetime="2026-11-17">Nov 17, 2026<\/time><\/div>\n<div class="cl-items">\n<article class="cl-item cl-ann" id="v3-0">[\s\S]*?<article class="cl-item" id="studio-1\.0\.0-beta\.90">[\s\S]*?<article class="cl-item" id="beta-2026-11-17\.1">[\s\S]*?<\/article>\n<\/div>\n<\/div>/);
  assert.match(first.mains.zh, /<time datetime="2026-11-17">2026年11月17日<\/time>/);
  // 11-04 跨页：第 2 页再显示一次日期，第一页的跳页表里有它
  assert.deepEqual(days(second.main), ['2026-11-04']);
  assert.deepEqual(ids(second.main), ['beta-2026-11-04.1']);
  assert.match(first.main, /"beta-2026-11-04\.1":2/);
});

test('without entries there is one page with the empty state', () => {
  const pages = changelogPages(dir({}));
  assert.equal(pages.length, 1);
  assert.match(pages[0].main, /cl-empty/);
  assert.doesNotMatch(pages[0].main, /<nav class="cl-pager"/);
});
