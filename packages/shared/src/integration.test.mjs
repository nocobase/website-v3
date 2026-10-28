import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';
import siteFiles, { llmsTxt, markdownCopy, robotsTxt } from './integration.mjs';

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

test('without any option no file is written', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-files-'));
  const integration = siteFiles({});
  integration.hooks['astro:config:done']({ config: { site: 'https://x.test' } });
  integration.hooks['astro:build:done']({ dir: pathToFileURL(dir + '/'), logger: { info() {} } });
  expect(readdirSync(dir)).toEqual([]);
});

test('llms.txt lists the pages by section and group and links to the .md copies', () => {
  const text = llmsTxt({
    title: 'Docs', summary: 'Everything.',
    sections: [
      { title: 'Start', groups: [{ pages: [{ title: 'Home', path: '/index.md' }] }, { title: 'Basics', pages: [{ title: 'A', description: 'About A', path: '/a.md' }] }] },
    ],
  }, 'https://x.test/');
  assert.equal(text, ['# Docs', '', '> Everything.', '', '## Start', '', '- [Home](https://x.test/index.md)', '', '### Basics', '', '- [A](https://x.test/a.md): About A', ''].join('\n'));
  assert.match(llmsTxt({ title: 'T', sections: [] }, 'https://x.test'), /^# T\n\n> T\n/);
});

test('a markdown copy has the title, the quoted description and the trimmed body', () => {
  assert.equal(markdownCopy({ title: 'T', description: 'D', body: '\nBody\n\n' }), '# T\n\n> D\n\nBody\n');
  assert.equal(markdownCopy({ title: 'T', body: 'B' }), '# T\n\nB\n');
});

test('the integration writes llms.txt files and .md copies, from arrays or functions, into nested directories', () => {
  const dir = mkdtempSync(join(tmpdir(), 'site-files-'));
  const integration = siteFiles({
    llms: [{ path: 'zh-CN/llms.txt', title: 'Z', sections: [] }],
    markdownCopies: () => [{ path: 'core/index.md', title: 'Core', body: 'Hi' }],
  });
  integration.hooks['astro:config:done']({ config: { site: 'https://x.test' } });
  integration.hooks['astro:build:done']({ dir: pathToFileURL(dir + '/'), logger: { info() {} } });
  assert.match(readFileSync(join(dir, 'zh-CN/llms.txt'), 'utf8'), /^# Z/);
  assert.equal(readFileSync(join(dir, 'core/index.md'), 'utf8'), '# Core\n\nHi\n');
});
