import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, expect, test } from 'vitest';
import raw from '../../docs.config.ts';
import { footerProps, headerProps } from './chrome.mjs';
import { cjkQueries, unspaceCjk } from './cjk.mjs';
import { resolveConfig } from './config.mjs';
import { docsFiles } from './llms.mjs';
import { buildSite } from './site.mjs';

const root = mkdtempSync(join(tmpdir(), 'docs-japanese-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const config = resolveConfig(raw);

function fixture(name, omitJapanesePage = false) {
  const contentDir = join(root, name);
  const write = (path, body) => {
    const file = join(contentDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  for (const lang of config.languages) {
    const prefix = lang.dir ? `${lang.dir}/` : '';
    for (const key of [...config.sections.map(s => s.home), 'core/example']) {
      if (omitJapanesePage && lang.code === 'ja-JP' && key === 'core/example') continue;
      write(`${prefix}${key}.md`, `---\ntitle: "Fixture ${lang.code} ${key}"\n---\n`);
    }
    for (const section of config.sections) {
      const path = section.home === 'index' ? '../index' : section.home.slice(section.dir.length + 1);
      write(`${prefix}${section.dir}/meta.json`, JSON.stringify({ pages: [
        { type: 'page', path },
        ...(section.id === 'core' ? [{ type: 'page', path: 'example' }] : []),
      ] }));
    }
  }
  return () => buildSite({ config, contentDir });
}

test('Japanese uses the homepage locale, outside the legacy /ja/ redirect namespace', () => {
  expect(config.byCode['ja-JP']).toMatchObject({ dir: 'ja-JP', url: '/ja-JP/', hreflang: 'ja-JP', label: '日本語', website: 'https://www.nocobase.com/ja-JP/' });
  expect(config.languages.some(l => l.dir === 'ja')).toBe(false);
  expect(config.siteTitle('ja-JP')).toBe('NocoBase 3 ドキュメント');
});

test('Japanese defines every interface string explicitly, including nested messages and footer links', () => {
  const check = (source, translation, path = 'ui') => {
    for (const [key, value] of Object.entries(source)) {
      expect(translation, `${path}.${key}`).toHaveProperty(key);
      if (value && typeof value === 'object') check(value, translation[key], `${path}.${key}`);
      else if (typeof value === 'string') expect(translation[key], `${path}.${key}`).toEqual(expect.any(String));
    }
  };
  check(raw.languages[0].ui, raw.languages.find(l => l.code === 'ja-JP').ui);
});

test('the language menu keeps the page across English, Chinese and Japanese', () => {
  const site = fixture('navigation')();
  for (const lang of config.languages) {
    const header = headerProps(site, { lang: lang.code, sectionId: 'core', pageKey: 'core/example' });
    expect(header.languages.map(l => l.url)).toEqual(['/core/example/', '/zh-CN/core/example/', '/ja-JP/core/example/']);
    expect(header.languages.find(l => l.current)?.code).toBe(lang.code);
  }
  const header = headerProps(site, { lang: 'ja-JP', sectionId: 'core', pageKey: 'core/example' });
  expect(header.logo.href).toBe('/ja-JP/');
  expect(header.menu.map(m => m.href)).toEqual(['/ja-JP/getting-started/what-is-nocobase/', '/ja-JP/core/', '/ja-JP/studio/', '/ja-JP/guides/build-reliable-enterprise-apps/', '/ja-JP/faq/from-v2/']);
  expect(header.labels.language).toBe('言語');
  expect(header.search.label).toBe('ドキュメントを検索');
  expect(footerProps(site, { lang: 'ja-JP' }).columns[0].links[0].href).toBe('https://www.nocobase.com/ja-JP/core/');
});

test('Japanese Markdown copies and llms.txt keep the locale prefix', () => {
  const site = fixture('exports')();
  expect(site.page('ja-JP', 'core/example')).toMatchObject({ url: '/ja-JP/core/example/', mdUrl: '/ja-JP/core/example.md' });
  const files = docsFiles(site);
  expect(files.llms.find(f => f.path === 'ja-JP/llms.txt')).toMatchObject({ title: 'NocoBase 3 ドキュメント' });
  expect(files.markdownCopies.some(f => f.path === 'ja-JP/core/example.md')).toBe(true);
});

test('a missing Japanese article still fails content validation', () => {
  expect(fixture('missing-page', true)).toThrow(/core\/example\.md has no counterpart in ja-JP/);
});

test('Japanese search queries and excerpts preserve kana and Latin product names', () => {
  const query = 'プラグインを作成 NocoBase';
  expect(unspaceCjk('プ ラ グ イ ン を 作 成 NocoBase')).toBe(query);
  expect(cjkQueries(query)).toEqual(['"プ ラ グ イ ン を 作 成 NocoBase"', 'プ ラ グ イ ン を 作 成 NocoBase']);
});
