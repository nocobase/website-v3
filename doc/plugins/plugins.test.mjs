import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { describe, expect, test } from 'vitest';
import rehypeDocs, { SPECIAL_LANGS, highlightTree } from './rehype-docs.mjs';
import remarkCallouts from './remark-callouts.mjs';
import remarkFigures from './remark-figures.mjs';
import remarkLinks from './remark-links.mjs';

const contentDir = mkdtempSync(join(tmpdir(), 'docs-plugins-'));
const figuresDir = join(contentDir, 'figures');
mkdirSync(join(figuresDir, 'en'), { recursive: true });
writeFileSync(join(figuresDir, 'one.html'), '<div class="sw">zh one</div>\n');
writeFileSync(join(figuresDir, 'en', 'one.html'), '<div class="sw">en one</div>\n');
writeFileSync(join(figuresDir, 'two.html'), '<div class="sw">two</div>\n');
const ui = { copy: 'Copy', copied: 'Copied', copyFailed: 'Failed', codeLabels: { text: 'Plain text', tree: 'Directory tree', prompt: 'Prompt' }, callouts: { NOTE: 'Note', TIP: 'Tip', WARNING: 'Warning', PENDING: 'To be written' } };
const pages = new Set(['en:core/a', 'en:core/b/c']);
const site = {
  config: { languages: [{ code: 'en', dir: '' }, { code: 'zh', dir: 'zh' }], byCode: { en: { ui }, zh: { ui: { ...ui, callouts: { NOTE: '说明' } } } } },
  page: (l, k) => (pages.has(`${l}:${k}`) ? {} : undefined),
  urlOf: (l, k) => `/${k}/`,
};
const opts = { site, contentDir, figuresDir };

async function render(markdown, lang = 'en', key = 'core/a') {
  const processor = await createMarkdownProcessor({
    gfm: true, smartypants: false,
    syntaxHighlight: { type: 'shiki', excludeLangs: SPECIAL_LANGS },
    shikiConfig: { theme: 'css-variables' },
    remarkPlugins: [[remarkFigures, opts], [remarkCallouts, opts], [remarkLinks, opts]],
    rehypePlugins: [[rehypeDocs, opts]],
  });
  const { code } = await processor.render(markdown, { fileURL: new URL(`file://${join(contentDir, lang === 'en' ? '' : lang, `${key}.md`)}`) });
  return code;
}

describe('figures', () => {
  test('a figure line inlines the fragment of the language, with a caption and extra classes', async () => {
    const html = await render('::figure one pair | The `caption`\n\nText');
    expect(html).toContain('<figure class="fig pair"><div class="sw">en one</div><figcaption>The <code>caption</code></figcaption></figure>');
    expect(await render('::figure one', 'zh')).toContain('zh one');
  });
  test('several names join and a missing figure fails with the page name', async () => {
    expect(await render('::figure one+two')).toMatch(/en one<\/div><div class="sw">two/);
    await expect(render('::figure nope')).rejects.toThrow(/core\/a\.md: the figure "nope" does not exist/);
  });
});

describe('callouts and done markers', () => {
  test('a callout becomes a note with a title', async () => {
    const html = await render('> [!TIP] Short way\n> Body text\n\n> [!NOTE]\n> Second');
    expect(html).toMatch(/<div class="note tip">\s*<strong>Short way<\/strong>/);
    expect(html).toContain('Body text');
    expect(html).toMatch(/<div class="note note">\s*<strong>Note<\/strong>/);
    expect(await render('> [!NOTE]\n> x', 'zh')).toContain('<strong>说明</strong>');
    expect(await render('> plain quote')).toContain('<blockquote>');
  });
  test('Done when and the Chinese marker', async () => {
    expect(await render('**Done when**: it works.')).toContain('<p class="done"><strong>Done when</strong>it works.</p>');
    expect(await render('**完成的标志**：好了。')).toContain('<p class="done"><strong>完成的标志</strong>好了。</p>');
    expect(await render('**Other**: x')).not.toContain('class="done"');
  });
});

describe('links', () => {
  test('relative .md links are resolved, and absolute ones open in a new tab', async () => {
    const html = await render('[a](../a.md#x) [c](c.md) [out](https://x.test/) [h](#here)', 'en', 'core/b/c');
    expect(html).toContain('href="/core/a/#x"');
    expect(html).toContain('href="/core/b/c/"');
    expect(html).toContain('<a href="https://x.test/" target="_blank" rel="noopener">out</a>');
    expect(html).toContain('href="#here"');
  });
  test('a broken link fails the page', async () => {
    await expect(render('[x](missing.md)')).rejects.toThrow(/core\/a\.md: the link "missing\.md"/);
  });
});

describe('code blocks, tables, images', () => {
  test('a highlighted block gets a toolbar with the language name and a copy button', async () => {
    const html = await render('```ts\nconst a = 1;\n```');
    expect(html).toContain('<div class="code-block"><div class="code-toolbar"><span class="code-language">TypeScript</span><button type="button" class="copy-button" data-copied="Copied" data-failed="Failed" aria-live="polite">Copy</button></div><pre class="astro-code');
    expect(html).toContain('var(--astro-code-token-keyword)');
    expect(html).not.toMatch(/<pre[^>]* style="[^"]*background-color/);
  });
  test('plain, prompt and tree blocks are left unhighlighted with their own look', async () => {
    expect(await render('```text\na < b\n```')).toContain('code-block wrap plain-text"><div class="code-toolbar"><span class="code-language">Plain text');
    expect(await render('```\nnothing\n```')).toContain('wrap plain-text');
    expect(await render('```prompt\nDo it\n```')).toContain('code-block wrap code-prompt');
    const tree = await render('```tree\nmy-app/\n├── src/   # code\n└── a.ts\n```');
    expect(tree).toContain('code-block plain-text code-tree');
    expect(tree).toContain('<span class="tree-directory">my-app/</span>');
    expect(tree).toContain('<span class="tree-comment">   # code</span>');
    // a plain-text block that looks like a tree is detected
    expect(await render('```text\n├── a\n└── b\n```')).toContain('code-tree');
  });
  test('tree highlighting keeps every character', () => {
    const code = 'a/\n│   ├── b.ts  # note\n└── c/';
    const text = n => (n.type === 'text' ? n.value : n.children.map(text).join(''));
    expect(highlightTree(code).map(text).join('')).toBe(code);
  });
  test('tables scroll in a wrapper and a lone image becomes a figure', async () => {
    expect(await render('| a | b |\n| - | - |\n| 1 | 2 |')).toMatch(/<div class="table-wrap">\s*<table>/);
    const html = await render('![A caption](/assets/x.png)');
    expect(html).toContain('<figure class="fig"><img src="/assets/x.png" alt="A caption" loading="lazy"><figcaption>A caption</figcaption></figure>');
    expect(html).not.toContain('<p><figure');
  });
});
