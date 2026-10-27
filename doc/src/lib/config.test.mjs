import { expect, test } from 'vitest';
import { mergeUi, resolveConfig, siteOrigin } from './config.mjs';

test('the site origin is only an origin', () => {
  expect(siteOrigin('https://docs.example.com/')).toBe('https://docs.example.com');
  for (const bad of ['https://x.test/path', 'https://x.test/?q=1', 'ftp://x.test', 'nope']) expect(() => siteOrigin(bad)).toThrow(/origin/);
});

test('missing interface strings fall back to the first language, objects merging key by key', () => {
  expect(mergeUi({ a: 'x', n: { p: 1, q: 2 }, l: [1] }, { n: { q: 3 }, l: [2, 3] })).toEqual({ a: 'x', n: { p: 1, q: 3 }, l: [2, 3] });
  const config = resolveConfig({
    site: { origin: 'https://x.test', title: { en: 'Docs' } },
    languages: [{ code: 'en', dir: '', ui: { prev: 'Previous', codeLabels: { text: 'Plain' } } }, { code: 'fr', dir: 'fr', ui: { prev: 'Précédent' } }],
    sections: [{ id: 's', title: { en: 'Start' } }],
  });
  expect(config.byCode.fr.ui).toMatchObject({ prev: 'Précédent', codeLabels: { text: 'Plain' } });
  expect(config.siteTitle('fr')).toBe('Docs');
  expect(config.sectionTitle(config.sections[0], 'fr')).toBe('Start');
  expect(config.byCode.fr.url).toBe('/fr/');
});

test('the default language is at the root, and en or api cannot be a language directory', () => {
  const base = { site: { origin: 'https://x.test', title: {} }, sections: [] };
  expect(() => resolveConfig({ ...base, languages: [{ code: 'en', dir: 'en' }] })).toThrow(/site root/);
  expect(() => resolveConfig({ ...base, languages: [{ code: 'en', dir: '' }, { code: 'x', dir: 'api' }] })).toThrow(/cannot be a top-level/);
  expect(() => resolveConfig({ ...base, languages: [{ code: 'en', dir: '' }, { code: 'en', dir: 'x' }] })).toThrow(/duplicate/);
});
