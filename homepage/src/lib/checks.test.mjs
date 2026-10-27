// 构建后检查：根目录的保留名字、各语言页面数、产物里的站内链接。
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'vitest';
import { ALL } from './config.mjs';
import { checkCounts, checkRoot, countPages, expectedFiles, isArticleUrl, makeExists, readOutput, runChecks } from './checks.mjs';
import { Page } from './site.mjs';

test('the output root must not contain en or api, or a directory with a dot in its name', () => {
  assert.deepEqual(checkRoot(['index.html', 'core', 'zh-CN'], n => !n.includes('.')), []);
  assert.equal(checkRoot(['en']).length, 1);
  assert.equal(checkRoot(['api']).length, 1);
  assert.equal(checkRoot(['v1.0']).length, 1);
  assert.deepEqual(checkRoot(['robots.txt', 'sitemap-0.xml'], () => false), []);
  // 以前的白名单（assets 之类）不再检查：任何别的名字都可以
  assert.deepEqual(checkRoot(['_astro', 'favicon', 'anything']), []);
});

const mk = (id, langs) => new Page(id, langs, { page: id });
test('every language must have the same number of pages', () => {
  const pages = [mk('', ALL), mk('core', ALL), mk('blog', ['en', 'zh'])];
  assert.deepEqual(checkCounts(countPages(pages)), []);
  const bad = countPages(pages);
  bad.ja.all--;
  assert.match(checkCounts(bad)[0], /页面数不一致/);
  const zhEn = countPages([mk('x', ['en', 'zh']), mk('y', ['en', 'zh'])]);
  zhEn.zh['zh-en'] = 1;
  assert.match(checkCounts(zhEn).at(-1), /不一致/);
});

test('expected files follow the page paths of each language', () => {
  assert.deepEqual(expectedFiles([mk('core', ['en', 'zh'])]), ['/core/', '/zh-CN/core/']);
  assert.deepEqual(expectedFiles([mk('404', ['en'])]), ['/404.html']);
});

function site(files) {
  const dir = mkdtempSync(join(tmpdir(), 'dist-'));
  for (const [f, text] of Object.entries(files)) { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), text); }
  return dir;
}

test('internal links and files are checked against the output, the way the CDN maps them', () => {
  const dir = site({ 'index.html': '<a href="/core/">x</a><link href="/_astro/a.css"><a href="/missing/">y</a>', 'core/index.html': '<a href="/">home</a><a href="core.html">src name</a>', '_astro/a.css': '' });
  const exists = makeExists(dir);
  assert.equal(exists('/core/'), true);
  assert.equal(exists('/core'), true);
  assert.equal(exists('/_astro/a.css'), true);
  assert.equal(exists('/missing/'), false);
  assert.deepEqual(Object.keys(readOutput(dir)).sort(), ['/', '/core/']);
});

test('runChecks reports a broken link, a missing page and a reserved root name', () => {
  const dir = site({ 'index.html': '<a href="/nope/">x</a>', 'en/index.html': '', '404.html': '' });
  const pages = [mk('', ['en']), mk('core', ['en'])];
  const { errors } = runChecks(dir, pages);
  assert.ok(errors.some(e => e.includes('/nope/')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('缺少页面 /core/')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('不能有 en/')), errors.join('\n'));
});

test('articles are the blog, customer and changelog detail pages', () => {
  assert.equal(isArticleUrl('/blog/x/'), true);
  assert.equal(isArticleUrl('/zh-CN/customers/x/'), true);
  assert.equal(isArticleUrl('/core/'), false);
  assert.equal(isArticleUrl('/blog/'), false);
});
