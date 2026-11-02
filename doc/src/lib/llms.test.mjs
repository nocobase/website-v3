import { expect, test } from 'vitest';
import { stripFigures, parseFigureLine } from './figures.mjs';
import { llmsGroups } from './llms.mjs';

const pages = new Map(Object.entries({
  home: { title: 'Home', metaDescription: 'd', mdUrl: '/index.md' },
  a: { title: 'A', metaDescription: '', mdUrl: '/a.md' },
  b: { title: 'B', metaDescription: 'bd', mdUrl: '/b.md' },
  p: { title: 'P', placeholder: true, mdUrl: '/p.md' },
}));
const pageOf = key => pages.get(key);

test('llms groups: loose pages, groups and folders; planned entries and placeholders are left out', () => {
  const tree = [
    { type: 'page', key: 'home' },
    { type: 'group', title: 'G', children: [{ type: 'page', key: 'a' }, { type: 'planned', title: 'Soon' }, { type: 'page', key: 'p' }] },
    { type: 'folder', title: 'F', link: { key: 'b' }, children: [{ type: 'group', title: 'In', children: [{ type: 'page', key: 'a' }] }] },
    { type: 'group', title: 'Empty', children: [{ type: 'planned', title: 'x' }] },
  ];
  expect(llmsGroups(tree, pageOf)).toEqual([
    { pages: [{ title: 'Home', description: 'd', path: '/index.md' }] },
    { title: 'G', pages: [{ title: 'A', description: '', path: '/a.md' }] },
    { title: 'F', pages: [{ title: 'B', description: 'bd', path: '/b.md' }, { title: 'A', description: '', path: '/a.md' }] },
  ]);
});

test('figure lines are parsed, and the .md copies replace them with their caption', () => {
  expect(parseFigureLine('::figure a+b wide | The *caption*')).toEqual({ names: ['a', 'b'], classes: ['wide'], caption: 'The *caption*' });
  expect(parseFigureLine('::figure a')).toEqual({ names: ['a'], classes: [], caption: '' });
  expect(parseFigureLine('plain text')).toBeNull();
  expect(stripFigures('Before\n\n::figure a | Caption\n\n::figure b\n\nAfter')).toBe('Before\n\n*Caption*\n\n\n\nAfter');
});
