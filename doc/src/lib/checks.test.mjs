import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, test } from 'vitest';
import { checkHeaderAction, checkLayout, fileOfUrl, findDeadLinks } from './checks.mjs';

function site(files) {
  const root = mkdtempSync(join(tmpdir(), 'docs-out-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

test('addresses map to files the way the CDN rules do', () => {
  expect(fileOfUrl('/r', '/a/')).toBe('/r/a/index.html');
  expect(fileOfUrl('/r', '/a')).toBe('/r/a/index.html');
  expect(fileOfUrl('/r', '/a/x.md')).toBe('/r/a/x.md');
});

test('dead links, missing assets and missing anchors are found', () => {
  const root = site({
    'index.html': '<h2 id="top">T</h2><a href="/a/#sec">ok</a><a href="/a/#nope">bad</a><a href="/missing/">gone</a><img src="/assets/x.png"><a href="https://ext.test/">e</a>',
    'a/index.html': '<h2 id="sec">S</h2>',
  });
  const dead = findDeadLinks(root);
  expect(dead).toHaveLength(3);
  expect(dead.join('\n')).toMatch(/\/#nope|\/a\/#nope/);
  expect(dead.join('\n')).toContain('/missing/');
  expect(dead.join('\n')).toContain('/assets/x.png');
});

test('the layout check: required files, no en or api, no second 404, no v2 prefix clash', () => {
  const good = site({ 'index.html': '', '404.html': '', 'robots.txt': '', 'llms.txt': '', 'sitemap-index.xml': '', 'zh-CN/index.html': '', 'zh-CN/llms.txt': '' });
  expect(checkLayout(good, { dirs: ['zh-CN'] })).toEqual([]);
  const bad = site({ 'index.html': '', 'en/index.html': '', 'api/index.html': '', 'guide/index.html': '', 'zh-CN/404.html': '' });
  const text = checkLayout(bad, { dirs: ['zh-CN'] }).join('\n');
  expect(text).toContain('"en"');
  expect(text).toContain('"api"');
  expect(text).toContain('zh-CN/404.html must not exist');
  expect(text).toContain('guide/');
  expect(text).toContain('no 404.html');
});

test('default builds require a search button in every page header, including localized pages and 404', () => {
  const paths = ['index.html', 'getting-started/index.html', 'zh-CN/index.html', 'zh-CN/getting-started/index.html', 'ja-JP/index.html', 'ja-JP/getting-started/index.html', '404.html'];
  const root = site(Object.fromEntries(paths.map(path => [path, '<header><button data-search-open aria-label="Search"></button></header>'])));
  expect(checkHeaderAction(root)).toEqual([]);
  for (const path of paths) {
    writeFileSync(join(root, path), '<header></header><dialog id="docSearch"></dialog><script>"data-search-open"</script><button data-search-open></button>');
  }
  expect(checkHeaderAction(root)).toHaveLength(paths.length);
});

test('AI builds require the AI header button, while default builds still require search', () => {
  const root = site({ 'index.html': '<header><button data-chat-open></button></header>' });
  expect(checkHeaderAction(root, { aiEnabled: true })).toEqual([]);
  expect(checkHeaderAction(root)).toHaveLength(1);
  writeFileSync(join(root, 'index.html'), '<header><button data-search-open></button></header>');
  expect(checkHeaderAction(root, { aiEnabled: true })).toHaveLength(1);
});

test('redirect stubs do not need a header action', () => {
  const root = site({ 'old/index.html': '<meta http-equiv="refresh" content="0;url=/new/">' });
  expect(checkHeaderAction(root)).toEqual([]);
  expect(checkHeaderAction(root, { aiEnabled: true })).toEqual([]);
});
