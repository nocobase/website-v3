import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getSite } from './site.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pages = [
  'overview',
  'quickstart',
  'development',
  'management',
  'single-sign-on',
  'external-apps',
  'migration',
  'deployment',
];
const languages = [
  { code: 'en', directory: '', prefix: '', title: 'Multi-app' },
  { code: 'zh-CN', directory: 'zh-CN', prefix: '/zh-CN', title: '多应用' },
  { code: 'ja-JP', directory: 'ja-JP', prefix: '/ja-JP', title: 'マルチアプリ' },
];
const readMenu = (file) => JSON.parse(readFileSync(file, 'utf8'));

describe('multi-app architecture navigation', () => {
  it.each(languages)('places all eight guides under architecture for $code', (language) => {
    const core = path.join(root, 'content', language.directory, 'core');
    const architecture = readMenu(path.join(core, 'architecture/meta.json'));
    expect(architecture.pages.filter((entry) => entry.path === 'multi-app')).toEqual([
      { type: 'folder', path: 'multi-app' },
    ]);
    expect(architecture.pages.some((entry) => entry.type === 'planned' && entry.title === language.title)).toBe(false);
    const development = readMenu(path.join(core, 'developing-apps/meta.json'));
    expect(development.pages.some((entry) => entry.path === '../multi-app')).toBe(false);
    const catalog = readMenu(path.join(core, 'architecture/multi-app/meta.json'));
    expect(catalog.pages.map((entry) => entry.path)).toEqual(pages);
    expect(existsSync(path.join(core, 'multi-app'))).toBe(false);

    const site = getSite();
    for (const name of pages) {
      expect(site.page(language.code, `core/architecture/multi-app/${name}`)).toMatchObject({
        url: `${language.prefix}/core/architecture/multi-app/${name}/`,
      });
      expect(site.page(language.code, `core/multi-app/${name}`)).toBeUndefined();
      expect(Boolean(site.page(language.code, `core/architecture/multi-app/${name}`).placeholder)).toBe(
        language.code === 'ja-JP',
      );
    }
  });

  it('redirects all former article URLs to their matching localized architecture guides', () => {
    const config = readFileSync(path.join(root, 'astro.config.ts'), 'utf8');
    const redirects = new Map(
      [...config.matchAll(/['"]([^'"]+)['"]:\s*['"]([^'"]+)['"]/g)].map((match) => [match[1], match[2]]),
    );
    for (const language of languages) {
      for (const name of pages) {
        expect(redirects.get(`${language.prefix}/core/multi-app/${name}/`)).toBe(
          `${language.prefix}/core/architecture/multi-app/${name}/`,
        );
      }
    }
  });
});
