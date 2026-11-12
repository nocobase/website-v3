// 更新日志：读取 content/changelog/ 的条目、排序、分页、Markdown 的安全处理和生成的页面。条目写在临时目录里，不依赖仓库里的数据。
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';
import { stringify } from 'yaml';
import { changelogPages, hasChangelog, pageId, pageNumbers, paginate, parseEntryFile, readEntries, renderNotes, sortEntries, stripAuthors } from './changelog.mjs';

const release = (channel, version, extra = {}) => ({
  type: 'release', tag: `${channel === 'beta' ? 'nocobase-v3-beta' : 'release'}/${version}`, channel, version,
  title: `NocoBase v3 ${channel === 'beta' ? 'Beta ' : ''}· ${version}`, date: version.split('.')[0], publishedAt: `${version.split('.')[0]}T08:00:00Z`,
  url: `https://github.com/nocobase/nocobase/releases/tag/x`, notes: { en: `### 🐛 Bug Fixes\n\n- **[Server]** Fix ${version}. ([#1](https://github.com/nocobase/nocobase/pull/1)) by @someone` }, ...extra,
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

test('without entries there is one page with the empty state', () => {
  const pages = changelogPages(dir({}));
  assert.equal(pages.length, 1);
  assert.match(pages[0].main, /cl-empty/);
  assert.doesNotMatch(pages[0].main, /<nav class="cl-pager"/);
});
