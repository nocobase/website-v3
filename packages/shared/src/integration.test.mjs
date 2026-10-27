import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';
import siteFiles, { robotsTxt } from './integration.mjs';

test('robots.txt points at the sitemap index of the site', () => {
  assert.equal(robotsTxt({ site: 'https://www.nocobase.com/' }), 'User-agent: *\nAllow: /\n\nSitemap: https://www.nocobase.com/sitemap-index.xml\n');
  assert.equal(robotsTxt({ site: 'https://x.test', sitemap: '/s.xml', disallow: ['/api/'] }), 'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://x.test/s.xml\n');
});

test('the integration writes robots.txt into the build output and nothing else', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-files-'));
  const integration = siteFiles({ robots: { sitemap: 'sitemap-index.xml' } });
  const logger = { info() {} };
  integration.hooks['astro:config:done']({ config: { site: 'https://www.nocobase.com' } });
  integration.hooks['astro:build:done']({ dir: pathToFileURL(dir + '/'), logger });
  assert.match(readFileSync(join(dir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/www\.nocobase\.com\/sitemap-index\.xml/);
});

test('without the robots option no file is written, and the llms and markdown options are reserved', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-files-'));
  const integration = siteFiles({});
  integration.hooks['astro:config:done']({ config: { site: 'https://x.test' } });
  integration.hooks['astro:build:done']({ dir: pathToFileURL(dir + '/'), logger: { info() {} } });
  expect(() => readFileSync(join(dir, 'robots.txt'))).toThrow();
  expect(() => siteFiles({ llms: {} })).toThrow(/llms/);
  expect(() => siteFiles({ markdownCopies: true })).toThrow(/markdownCopies/);
});
