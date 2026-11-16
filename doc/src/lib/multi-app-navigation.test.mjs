import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getSite } from './site.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pages = ['overview', 'quickstart', 'nodes', 'development', 'artifacts', 'management', 'single-sign-on', 'external-apps'];
const retiredPages = {
  environments: 'nodes',
  templates: 'artifacts',
  migration: 'external-apps',
  deployment: 'nodes',
};
const languages = [
  { code: 'en', directory: '', prefix: '', title: 'Multi-app' },
  { code: 'zh-CN', directory: 'zh-CN', prefix: '/zh-CN', title: '多应用' },
  { code: 'ja-JP', directory: 'ja-JP', prefix: '/ja-JP', title: 'マルチアプリ' },
];
const readMenu = (file) => JSON.parse(readFileSync(file, 'utf8'));

describe('multi-app architecture navigation', () => {
  it.each(languages)('places the eight guides under architecture for $code', (language) => {
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
      expect(Boolean(page.placeholder)).toBe(false);
    }
    for (const name of Object.keys(retiredPages)) {
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
      for (const name of ['overview', 'quickstart', 'development', 'management', 'single-sign-on', 'external-apps']) {
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
      // Current articles must not be shadowed by an old redirect.
      for (const name of pages) {
        expect(redirects.has(`${language.prefix}/core/architecture/multi-app/${name}/`)).toBe(false);
      }
    }
  });

  it.each(languages)('does not link to retired pages from the $code guides', (language) => {
    for (const name of pages) {
      const markdown = readFileSync(path.join(root, 'content', language.directory, `core/architecture/multi-app/${name}.md`), 'utf8');
      expect(markdown).not.toMatch(/\((?:environments|templates|migration|deployment)\.md(?:[)#])/);
    }
  });

  it.each(languages)('includes shared high-resolution screenshots in every $code guide', (language) => {
    const assets = new Set();
    const assetPattern = /^\/assets\/core\/multi-app\/hd-[^/]+\.png$/;
    for (const name of pages) {
      const markdown = readFileSync(path.join(root, 'content', language.directory, `core/architecture/multi-app/${name}.md`), 'utf8');
      const screenshots = [...markdown.matchAll(/!\[[^\]]*\]\((\/assets\/core\/multi-app\/[^)]+\.png)\)/g)];
      expect(screenshots.length, `${language.code}/${name}`).toBeGreaterThan(0);
      for (const match of screenshots) {
        expect(match[1]).toMatch(assetPattern);
        assets.add(match[1]);
      }
    }
    for (const asset of assets) {
      const buffer = readFileSync(path.join(root, 'public', asset));
      expect([...buffer.subarray(0, 8)], asset).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect([buffer.readUInt32BE(16), buffer.readUInt32BE(20)], asset).toEqual([2880, 1800]);
    }
  });

  it.each(
    languages.filter((language) => language.code !== 'zh-CN')
      .flatMap((language) => pages.map((name) => ({ ...language, name }))),
  )('keeps $code examples and screenshots aligned with Chinese in $name', (language) => {
    const { name } = language;
    const translation = readFileSync(path.join(root, 'content', language.directory, `core/architecture/multi-app/${name}.md`), 'utf8');
    const chinese = readFileSync(path.join(root, `content/zh-CN/core/architecture/multi-app/${name}.md`), 'utf8');
    const commands = (markdown) => [...markdown.matchAll(/^```(bash|yaml)\n([\s\S]*?)^```/gm)]
      .map((match) => ({ language: match[1], code: match[2].split('\n').filter((line) => !/^\s*#/.test(line)).join('\n') }));
    const screenshots = (markdown) => [...markdown.matchAll(/!\[[^\]]*\]\((\/assets\/core\/multi-app\/[^)]+\.png)\)/g)]
      .map((match) => match[1]);
    expect(commands(translation)).toEqual(commands(chinese));
    expect(screenshots(translation)).toEqual(screenshots(chinese));
  });
});
