import assert from 'node:assert/strict';
import { test } from 'vitest';
import { noindexFilter, xDefaultSerializer } from './sitemap.mjs';

const ser = xDefaultSerializer({ dirs: ['zh-CN', 'ja-JP'] });
const O = 'https://www.nocobase.com';

test('x-default points at the English version of the page', () => {
  const links = [{ url: O + '/core/', lang: 'en' }, { url: O + '/zh-CN/core/', lang: 'zh-CN' }];
  const out = ser({ url: O + '/zh-CN/core/', links });
  assert.deepEqual(out.links.at(-1), { url: O + '/core/', lang: 'x-default' });
  assert.equal(out.links.length, 3);
  assert.equal(out.url, O + '/zh-CN/core/');
});

test('an English-only page gets itself and x-default, and a page not in English gets nothing invented', () => {
  assert.deepEqual(ser({ url: O + '/x/' }).links, [{ url: O + '/x/', lang: 'en' }, { url: O + '/x/', lang: 'x-default' }]);
  assert.equal(ser({ url: O + '/ja-JP/x/' }).links, undefined);
});

test('an existing x-default is kept', () => {
  const item = { url: O + '/', links: [{ url: O + '/', lang: 'en' }, { url: O + '/', lang: 'x-default' }] };
  assert.equal(ser(item), item);
});

test('noindex pages are filtered out, with or without the trailing slash', () => {
  const f = noindexFilter(['/404.html', '/hidden/']);
  assert.equal(f(O + '/hidden/'), false);
  assert.equal(f(O + '/404.html'), false);
  assert.equal(f(O + '/core/'), true);
  assert.equal(f(O + '/zh-CN/hidden/'), true);
});
