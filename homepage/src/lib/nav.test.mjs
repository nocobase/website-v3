// 导航规格和链接换算：站内链接换成各语言的地址、文档站链接按语言补 zh-CN/、星标数从共用配置来。
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { collectText, languageList, makeHref, navSpec } from './nav.mjs';

const resolve = name => ({ index: '/', core: '/core/', 'solution-crm': '/solution-crm/' })[name] ?? null;

test('source file names become the page address in the page language, other links stay', () => {
  const en = makeHref(name => { const u = resolve(name); return u; }, 'en');
  assert.equal(en('core.html'), '/core/');
  assert.equal(en('index.html'), '/');
  assert.equal(en('core.html#x'), '/core/#x');
  assert.equal(en('https://github.com/nocobase/nocobase'), 'https://github.com/nocobase/nocobase');
  assert.equal(en('missing.html'), 'missing.html');
  assert.equal(en('#'), '#');
});

test('Chinese pages link to the zh-CN docs, other languages to the English docs', () => {
  assert.equal(makeHref(resolve, 'zh')('https://docs.nocobase.com/'), 'https://docs.nocobase.com/zh-CN/');
  assert.equal(makeHref(resolve, 'zh-TW')('https://docs.nocobase.com/core/'), 'https://docs.nocobase.com/zh-CN/core/');
  assert.equal(makeHref(resolve, 'de')('https://docs.nocobase.com/'), 'https://docs.nocobase.com/');
  assert.equal(makeHref(resolve, 'zh')('https://nocode.nocobase.com/'), 'https://nocode.nocobase.com/');
});

test('the active page is highlighted in the menu, the mobile menu and nowhere else', () => {
  const { header } = navSpec('blog');
  const active = header.menu.flatMap(m => m.items ?? [m]).filter(i => i.active).map(i => i.href);
  assert.deepEqual(active, ['blog.html']);
  assert.deepEqual(header.mobile.flatMap(i => i.items ?? [i]).filter(i => i.active).map(i => i.href), ['blog.html']);
  assert.equal(navSpec('home').header.menu.flatMap(m => m.items ?? [m]).some(i => i.active), false);
});

test('the GitHub star count comes from the shared config and can be overridden with GITHUB_STARS', () => {
  const stars = spec => spec.header.links[0].label;
  assert.equal(stars(navSpec('home')), '24.6K');
  assert.equal(stars(navSpec('home', { stars: '30.1K' })), '30.1K');
  assert.equal(navSpec('home', { stars: '30.1K' }).header.mobile.at(-1).small, '30.1K');
});

test('every translatable string in the menus is bilingual or a plain name', () => {
  const { header, footer } = navSpec('');
  for (const [node, key] of [...collectText(header), ...collectText(footer)]) {
    const v = node[key];
    if (/[一-鿿]/.test(v)) assert.match(v, /<t-zh>.*<\/t-zh><t-en>.*<\/t-en>/s, v);
  }
});

test('the language list marks the current language and carries each page address', () => {
  const urls = Object.fromEntries(['en', 'zh', 'ja'].map(c => [c, '/' + c + '/']));
  const list = languageList('zh', urls);
  assert.equal(list.length, 12);
  assert.deepEqual(list.filter(l => l.current).map(l => l.html), ['zh-CN']);
  assert.equal(list.find(l => l.code === 'ja').url, '/ja/');
});
