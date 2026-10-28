import { expect, test } from 'vitest';
import { resolveLink } from './links.mjs';

const pages = new Set(['en:core/a', 'en:core/x/b', 'en:index', 'en:core/index']);
const ctx = { key: 'core/x/b', lang: 'en', hasPage: (l, k) => pages.has(`${l}:${k}`), urlOf: (l, k) => `/${k === 'index' ? '' : k.endsWith('/index') ? k.slice(0, -5) : `${k}/`}` };

test('relative .md links become page addresses and keep the anchor', () => {
  expect(resolveLink('../a.md', ctx)).toBe('/core/a/');
  expect(resolveLink('../a.md#some-heading', ctx)).toBe('/core/a/#some-heading');
  expect(resolveLink('../index.md', ctx)).toBe('/core/');
  expect(resolveLink('../../index.md', ctx)).toBe('/');
});

test('anchors, root-relative paths and URLs are left alone', () => {
  for (const href of ['#top', '/assets/core/x.png', 'https://x.test/a', 'mailto:a@b.c', '//cdn.test/x', '']) expect(resolveLink(href, ctx)).toBe(href);
});

test('a link that is not .md or points to a missing page throws', () => {
  expect(() => resolveLink('../a', ctx)).toThrow(/relative \.md path/);
  expect(() => resolveLink('../missing.md', ctx)).toThrow(/the page core\/missing\.md \(en\), which does not exist/);
});
