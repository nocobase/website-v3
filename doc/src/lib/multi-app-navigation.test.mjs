import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getSite } from './site.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pages = ['overview', 'quickstart', 'environments', 'templates', 'management', 'external-apps'];
const retiredPages = {
  'single-sign-on': 'external-apps',
  migration: 'external-apps',
  deployment: 'environments',
};
const languages = [
  { code: 'en', directory: '', prefix: '', title: 'Multi-app' },
  { code: 'zh-CN', directory: 'zh-CN', prefix: '/zh-CN', title: '多应用' },
  { code: 'ja-JP', directory: 'ja-JP', prefix: '/ja-JP', title: 'マルチアプリ' },
];
const readMenu = (file) => JSON.parse(readFileSync(file, 'utf8'));

describe('multi-app architecture navigation', () => {
  it.each(languages)('places the six guides under architecture for $code', (language) => {
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
      const page = site.page(language.code, `core/architecture/multi-app/${name}`);
      expect(page).toMatchObject({ url: `${language.prefix}/core/architecture/multi-app/${name}/` });
      expect(site.page(language.code, `core/multi-app/${name}`)).toBeUndefined();
      expect(Boolean(page.placeholder)).toBe(
        language.code === 'ja-JP' || (language.code === 'en' && ['environments', 'templates'].includes(name)),
      );
    }
    for (const name of ['development', ...Object.keys(retiredPages)]) {
      expect(site.page(language.code, `core/architecture/multi-app/${name}`)).toBeUndefined();
      expect(existsSync(path.join(core, `architecture/multi-app/${name}.md`))).toBe(false);
    }
  });

  it('redirects former article URLs directly to their localized replacement guides', () => {
    const config = readFileSync(path.join(root, 'astro.config.ts'), 'utf8');
    const redirects = new Map(
      [...config.matchAll(/['"]([^'"]+)['"]:\s*['"]([^'"]+)['"]/g)].map((match) => [match[1], match[2]]),
    );
    for (const language of languages) {
      for (const name of ['overview', 'quickstart', 'management', 'external-apps']) {
        expect(redirects.get(`${language.prefix}/core/multi-app/${name}/`)).toBe(
          `${language.prefix}/core/architecture/multi-app/${name}/`,
        );
      }
      for (const [previous, current] of Object.entries(retiredPages)) {
        for (const directory of ['core/multi-app', 'core/architecture/multi-app']) {
          expect(redirects.get(`${language.prefix}/${directory}/${previous}/`)).toBe(
            `${language.prefix}/core/architecture/multi-app/${current}/`,
          );
        }
      }
      for (const source of ['core/multi-app/development', 'core/architecture/multi-app/development']) {
        expect(redirects.get(`${language.prefix}/${source}/`)).toBe(
          `${language.prefix}/core/developing-apps/overview/`,
        );
      }
    }
  });

  it('does not link to retired pages from the Chinese multi-app guides', () => {
    for (const name of pages) {
      const markdown = readFileSync(path.join(root, `content/zh-CN/core/architecture/multi-app/${name}.md`), 'utf8');
      expect(markdown).not.toMatch(/\((?:single-sign-on|migration|deployment)\.md(?:[)#])/);
    }
  });

  it('uses localized 1440 by 900 PNG screenshots in the multi-app guides', () => {
    const assets = new Set();
    for (const name of pages) {
      const markdown = readFileSync(path.join(root, `content/zh-CN/core/architecture/multi-app/${name}.md`), 'utf8');
      for (const match of markdown.matchAll(/!\[[^\]]*\]\((\/assets\/core\/multi-app\/[^)]+\.png)\)/g)) {
        expect(match[1]).toMatch(/^\/assets\/core\/multi-app\/zh-CN\//);
        assets.add(match[1]);
      }
    }
    expect(assets.size).toBeGreaterThan(6);
    for (const asset of assets) {
      const buffer = readFileSync(path.join(root, 'public', asset));
      expect([...buffer.subarray(0, 8)], asset).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect([buffer.readUInt32BE(16), buffer.readUInt32BE(20)], asset).toEqual([1440, 900]);
    }
  });
});
