// 正文里指向旧官网的地址的替换（legacySiteLinks、siteLink），CMS 导入和构建生成文章页都用它（pnpm test）。
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { legacySiteLinks, siteLink, siteLinksIn } from './links.mjs';

const site = { blog: new Set(['what-is-ai-no-code']), customers: new Set(['astrolab-nocobase']) };
const to = url => siteLink(url, site);

test('old blog posts that exist on the new site move to /blog/ and /zh-CN/blog/', () => {
  assert.deepEqual(to('https://www.nocobase.com/en/blog/what-is-ai-no-code'), { kind: 'blog', url: 'https://www.nocobase.com/blog/what-is-ai-no-code/' });
  assert.deepEqual(to('https://www.nocobase.com/cn/blog/what-is-ai-no-code/'), { kind: 'blog', url: 'https://www.nocobase.com/zh-CN/blog/what-is-ai-no-code/' });
});

test('old customer stories move to /customers/ and /zh-CN/customers/', () => {
  assert.deepEqual(to('https://www.nocobase.com/en/blog/astrolab-nocobase'), { kind: 'customers', url: 'https://www.nocobase.com/customers/astrolab-nocobase/' });
  assert.deepEqual(to('https://www.nocobase.com/cn/blog/astrolab-nocobase'), { kind: 'customers', url: 'https://www.nocobase.com/zh-CN/customers/astrolab-nocobase/' });
});

test('old Japanese posts move to /ja-JP/ only when the new site has a Japanese version', () => {
  const ja = { ...site, ja: { blog: new Set(['what-is-ai-no-code']), customers: new Set(['astrolab-nocobase']) } };
  assert.deepEqual(siteLink('https://www.nocobase.com/ja/blog/what-is-ai-no-code', ja), { kind: 'blog', url: 'https://www.nocobase.com/ja-JP/blog/what-is-ai-no-code/' });
  assert.deepEqual(siteLink('https://www.nocobase.com/ja/blog/astrolab-nocobase', ja), { kind: 'customers', url: 'https://www.nocobase.com/ja-JP/customers/astrolab-nocobase/' });
  assert.deepEqual(siteLink('https://www.nocobase.com/ja/blog/what-is-ai-no-code', site), { kind: 'nocode', url: 'https://nocode.nocobase.com/ja/blog/what-is-ai-no-code' });
});

test('old blog posts missing from the new site and other blog pages move to nocode.nocobase.com', () => {
  assert.deepEqual(to('https://www.nocobase.com/en/blog/gone'), { kind: 'nocode', url: 'https://nocode.nocobase.com/en/blog/gone' });
  assert.deepEqual(to('https://www.nocobase.com/cn/blog/tags/customer-stories'), { kind: 'nocode', url: 'https://nocode.nocobase.com/cn/blog/tags/customer-stories' });
  assert.deepEqual(to('https://www.nocobase.com/en/blog/timeline'), { kind: 'nocode', url: 'https://nocode.nocobase.com/en/blog/timeline' });
});

test('old home pages move to the new home pages', () => {
  assert.equal(to('https://www.nocobase.com/en').url, 'https://www.nocobase.com/');
  assert.equal(to('https://www.nocobase.com/en/').url, 'https://www.nocobase.com/');
  assert.equal(to('https://www.nocobase.com/cn').url, 'https://www.nocobase.com/zh-CN/');
  assert.equal(to('https://www.nocobase.com/cn/').kind, 'home');
});

test('plugin pages move to the v2 docs plugin list, like the CDN redirect', () => {
  assert.equal(to('https://www.nocobase.com/plugins.html').url, 'https://nocode.docs.nocobase.com/plugins');
  assert.equal(to('https://www.nocobase.com/plugins-cn.html').url, 'https://nocode.docs.nocobase.com/cn/plugins');
  assert.equal(to('https://www.nocobase.com/en/plugins').url, 'https://nocode.docs.nocobase.com/plugins');
  assert.equal(to('https://www.nocobase.com/en/plugins/foo').url, 'https://nocode.docs.nocobase.com/plugins');
  assert.equal(to('https://www.nocobase.com/cn/plugins/').url, 'https://nocode.docs.nocobase.com/cn/plugins');
  assert.equal(to('https://www.nocobase.com/ja/plugins').url, 'https://nocode.docs.nocobase.com/ja/plugins');
  assert.equal(to('https://www.nocobase.com/fr/plugins').url, 'https://nocode.docs.nocobase.com/fr/plugins');
  assert.equal(to('https://www.nocobase.com/de/plugins').url, 'https://nocode.nocobase.com/de/plugins');
  assert.equal(to('https://www.nocobase.com/en/plugins-commercial').url, 'https://nocode.nocobase.com/en/plugins-commercial');
});

test('other old pages keep their path on nocode.nocobase.com', () => {
  for (const p of ['/en/commercial', '/cn/community', '/tw/', '/ja', '/ko/pricing', '/ru/x', '/es/x', '/fr/x', '/de/x', '/pt/x', '/id/x', '/vi/x', '/en/agreement', '/contact-cn.html', '/commercial.html']) {
    assert.deepEqual(to(`https://www.nocobase.com${p}`), { kind: 'nocode', url: `https://nocode.nocobase.com${p}` }, p);
  }
});

test('query strings and anchors are kept, and http becomes https', () => {
  assert.equal(to('http://www.nocobase.com/en/blog/what-is-ai-no-code?utm=1#intro').url, 'https://www.nocobase.com/blog/what-is-ai-no-code/?utm=1#intro');
  assert.equal(to('http://nocobase.com/cn/commercial#price').url, 'https://nocode.nocobase.com/cn/commercial#price');
  assert.equal(to('https://nocobase.com/cn?x=1').url, 'https://www.nocobase.com/zh-CN/?x=1');
  assert.equal(to('http://www.nocobase.com/plugins-cn.html?a=b').url, 'https://nocode.docs.nocobase.com/cn/plugins?a=b');
});

test('links to the new site and to other hosts are left alone', () => {
  for (const u of ['https://www.nocobase.com/', 'https://www.nocobase.com', 'https://www.nocobase.com/?utm_source=x', 'https://www.nocobase.com/core/', 'https://www.nocobase.com/zh-CN/pricing/', 'https://www.nocobase.com/ja-JP/', 'https://www.nocobase.com/blog/what-is-ai-no-code/', 'https://www.nocobase.com/commercial']) {
    assert.deepEqual(to(u), { kind: 'keep', url: u }, u);
  }
  const other = 'https://static-docs.nocobase.com/en/a.png https://nocode.nocobase.com/en/blog/x https://docs.nocobase.com/cn/ https://www.nocobase.com.cn/en/ https://forum.nocobase.com/cn/x';
  assert.equal(legacySiteLinks(other, site), other);
});

test('rewrites every link in HTML and Markdown and leaves trailing punctuation outside the link', () => {
  const html = '<a href="https://www.nocobase.com/en/blog/what-is-ai-no-code">https://www.nocobase.com/en/blog/what-is-ai-no-code</a>. See [pricing](https://www.nocobase.com/cn/commercial) or https://www.nocobase.com/en.';
  assert.equal(legacySiteLinks(html, site), '<a href="https://www.nocobase.com/blog/what-is-ai-no-code/">https://www.nocobase.com/blog/what-is-ai-no-code/</a>. See [pricing](https://nocode.nocobase.com/cn/commercial) or https://www.nocobase.com/.');
  assert.deepEqual(siteLinksIn(html, site).map(x => x.kind), ['blog', 'blog', 'nocode', 'home']);
});

test('rewriting is idempotent', () => {
  const text = 'https://www.nocobase.com/cn/blog/astrolab-nocobase https://www.nocobase.com/en/plugins https://www.nocobase.com/en/commercial https://www.nocobase.com/cn/';
  const once = legacySiteLinks(text, site);
  assert.equal(legacySiteLinks(once, site), once);
});
