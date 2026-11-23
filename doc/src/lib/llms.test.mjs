import { expect, test } from 'vitest';
import { stripFigures, parseFigureLine } from './figures.mjs';
import { docsFiles, llmsGroups } from './llms.mjs';

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

test('commercial editions are reflected in llms.txt descriptions and .md copies', () => {
  const editions = {
    pricing: 'Editions & Pricing',
    markdownLabel: 'Edition',
    professional: { badge: 'Professional+', short: 'Pro+', title: 'Available in Professional and Enterprise editions' },
    enterprise: { badge: 'Enterprise', short: 'EE', title: 'Available in Enterprise edition' },
  };
  const pageList = [
    { lang: 'en', key: 'index', title: 'Home', metaDescription: 'Overview', mdUrl: '/index.md', body: 'Home body' },
    { lang: 'en', key: 'core/free', title: 'Free', metaDescription: 'Open source', mdUrl: '/core/free.md', minimumEdition: 'community', body: 'Free body' },
    { lang: 'en', key: 'core/pro', title: 'Approvals', metaDescription: 'Human approvals', mdUrl: '/core/pro.md', minimumEdition: 'professional', body: 'Pro body' },
    { lang: 'en', key: 'studio/ent', title: 'Quality', metaDescription: '', mdUrl: '/studio/ent.md', minimumEdition: 'enterprise', body: 'Ent body' },
  ];
  const byKey = new Map(pageList.map(p => [p.key, p]));
  const site = {
    config: {
      languages: [{ code: 'en', dir: '', ui: { editions } }],
      siteTitle: () => 'Docs',
    },
    pages: pageList,
    page: (_lang, key) => byKey.get(key),
    sections: () => [{
      title: 'Core',
      tree: [{ type: 'page', key: 'core/free' }, { type: 'page', key: 'core/pro' }, { type: 'page', key: 'studio/ent' }],
    }],
  };
  const { llms, markdownCopies } = docsFiles(site);
  expect(llms[0].sections[0].groups[0].pages).toEqual([
    { title: 'Free', description: 'Open source', path: '/core/free.md' },
    { title: 'Approvals', description: '[Professional+] Human approvals', path: '/core/pro.md' },
    { title: 'Quality', description: '[Enterprise]', path: '/studio/ent.md' },
  ]);
  expect(markdownCopies.find(c => c.path === 'core/free.md').body).toBe('Free body');
  expect(markdownCopies.find(c => c.path === 'core/pro.md').body).toBe('> Edition: Professional+ · Available in Professional and Enterprise editions\n\nPro body');
  expect(markdownCopies.find(c => c.path === 'studio/ent.md').body).toBe('> Edition: Enterprise · Available in Enterprise edition\n\nEnt body');
});
