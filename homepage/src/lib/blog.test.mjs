import assert from 'node:assert/strict';
import { test } from 'vitest';
import { prefixedPageLinks, withIds } from './blog.mjs';

test('H2 ids keep their published numbering while deeper headings join the table of contents', () => {
  const [body, toc] = withIds('<h2>A</h2><h3>B</h3><h4>C</h4><h2>D</h2><h5>E</h5><h6>F</h6>', 'en');
  assert.equal(body, '<h2 id="en-1">A</h2><h3 id="en-1-1">B</h3><h4 id="en-1-2">C</h4><h2 id="en-2">D</h2><h5 id="en-2-1">E</h5><h6 id="en-2-2">F</h6>');
  assert.deepEqual(toc, [['en-1', 'A', 0], ['en-1-1', 'B', 1], ['en-1-2', 'C', 2], ['en-2', 'D', 0], ['en-2-1', 'E', 3], ['en-2-2', 'F', 4]]);
});

test('indentation starts at the shallowest heading, and a stray H1 counts as an H2', () => {
  assert.deepEqual(withIds('<h3>A</h3><h4>B</h4>', 'zh')[1], [['zh-0-1', 'A', 0], ['zh-0-2', 'B', 1]]);
  const [body, toc] = withIds('<h2>A</h2><h1>B</h1><h2>C</h2>', 'en');
  assert.equal(body, '<h2 id="en-1">A</h2><h1 id="en-1-1">B</h1><h2 id="en-2">C</h2>');
  assert.deepEqual(toc.map(t => t[2]), [0, 0, 0]);
});

test('entries keep the escaped text, drop inline tags and skip headings without text', () => {
  const [body, toc] = withIds('<h2><img src="a.gif"></h2><h2>Routes &amp; <code>/v/</code></h2>', 'en');
  assert.match(body, /<h2 id="en-1"><img/);
  assert.deepEqual(toc, [['en-2', 'Routes &amp; /v/', 0]]);
});

test('site pages written with an old language prefix become source names the build resolves per language', () => {
  assert.equal(prefixedPageLinks('<a href="/en/core/">a</a><a href="/ja/pricing">b</a><a href="/cn/studio/#plans">c</a>'), '<a href="core.html">a</a><a href="pricing.html">b</a><a href="studio.html#plans">c</a>');
  const untouched = '<a href="/zh-CN/core/">a</a><a href="/en/blog/x/">b</a><a href="/en/">c</a><a href="https://example.com/en/core/">d</a>';
  assert.equal(prefixedPageLinks(untouched), untouched);
});
