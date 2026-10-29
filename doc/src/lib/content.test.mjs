import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ContentError, diffSkeleton, listPageKeys, loadContent } from './content.mjs';

const SECTIONS = [{ id: 'start', dir: 'start', extra: ['index'] }, { id: 'core', dir: 'core' }];
const LANGS = [{ code: 'en', dir: '' }, { code: 'zh', dir: 'zh' }];

/** files: { 'core/a.md': 'Title' | { title, status, front }, 'zh/core/meta.json': object } (front: extra front matter lines) → a temp content dir (English at the root, the others in their directory) */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'docs-content-'));
  for (const [path, value] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    if (path.endsWith('.json')) writeFileSync(file, JSON.stringify(value));
    else writeFileSync(file, `---\ntitle: ${typeof value === 'string' ? value : value.title}\n${value.status ? `status: ${value.status}\n` : ''}${value.front ? `${value.front}\n` : ''}---\nBody\n`);
  }
  return root;
}
const page = (path, title) => ({ type: 'page', path, ...(title ? { title } : {}) });
/** Both languages with the same files; `extra` adds or overrides entries for one language or both */
function both(files, overrides = {}) {
  const out = {};
  for (const { code, dir } of LANGS) for (const [path, value] of Object.entries({ ...files, ...(overrides[code] ?? {}) })) out[dir ? `${dir}/${path}` : path] = value;
  return out;
}
const BASE = {
  'index.md': 'Home',
  'start/meta.json': { pages: [page('../index', 'Home')] },
  'core/index.md': 'Core',
  'core/meta.json': { pages: [page('index')] },
};
const load = (files, sections = SECTIONS) => loadContent({ contentDir: fixture(files), languages: LANGS, sections });
const problemsOf = fn => { try { fn(); } catch (e) { if (e instanceof ContentError) return e.problems.join('\n'); throw e; } return ''; };

describe('menus', () => {
  test('resolves pages, groups, folders, planned entries and the folder index link', () => {
    const files = both({
      ...BASE,
      'core/meta.json': { pages: [page('index'), { type: 'group', title: 'G', pages: [page('x/a', 'Label A'), { type: 'planned', title: 'Soon' }] }, { type: 'folder', path: 'f' }, { type: 'folder', path: 'g', }] },
      'core/x/a.md': 'A',
      'core/f/meta.json': { title: 'Folder', defaultOpen: true, pages: [page('index'), page('b'), { type: 'group', title: 'Inner', pages: [page('c')] }] },
      'core/f/index.md': 'F index', 'core/f/b.md': 'B', 'core/f/c.md': 'C',
      'core/g/meta.json': { title: 'Plain', pages: [page('d')] },
      'core/g/d.md': { title: 'D', status: 'placeholder' },
    });
    const { languages } = load(files);
    const en = languages.get('en');
    const core = en.sections.get('core');
    expect(core.tree.map(n => n.type)).toEqual(['page', 'group', 'folder', 'folder']);
    expect(core.tree[1].children.map(n => n.title)).toEqual(['Label A', 'Soon']);
    const folder = core.tree[2];
    expect(folder).toMatchObject({ title: 'Folder', defaultOpen: true, link: { key: 'core/f/index' } });
    expect(folder.children.map(n => n.type)).toEqual(['page', 'group']);
    expect(core.order).toEqual(['core/index', 'core/x/a', 'core/f/index', 'core/f/b', 'core/f/c', 'core/g/d']);
    expect(en.pages.get('core/x/a')).toMatchObject({ section: 'core', label: 'Label A', trail: ['G'] });
    expect(en.pages.get('core/f/c').trail).toEqual(['Folder', 'Inner']);
    expect(en.pages.get('core/g/d').placeholder).toBe(true);
    expect(core.tree[3].link).toBeNull();
  });

  test('a directory without meta.json is only storage: pages are referenced by path', () => {
    const files = both({ ...BASE, 'core/meta.json': { pages: [page('index'), page('deep/er/a')] }, 'core/deep/er/a.md': 'A' });
    expect(load(files).languages.get('en').sections.get('core').order).toEqual(['core/index', 'core/deep/er/a']);
  });

  test('paths may use ../ inside the section', () => {
    const files = both({
      ...BASE,
      'core/meta.json': { pages: [page('index'), { type: 'folder', path: 'f' }, page('b')] },
      'core/f/meta.json': { title: 'F', pages: [page('../b2')] },
      'core/b.md': 'B', 'core/b2.md': 'B2',
    });
    expect(load(files).languages.get('en').pages.get('core/b2').section).toBe('core');
  });

  test('a page missing from every menu, listed twice, or pointing at a missing file is an error that names the file', () => {
    const files = both({ ...BASE, 'core/orphan.md': 'O', 'core/meta.json': { pages: [page('index'), page('gone'), page('index')] } });
    const text = problemsOf(() => load(files));
    expect(text).toContain('core/orphan.md is not in any menu');
    expect(text).toContain('core/index.md is listed 2 times');
    expect(text).toContain('core/meta.json › pages[1]: path "gone" points to core/gone.md, which does not exist');
  });

  test('a folder needs a directory with its own meta.json', () => {
    const files = both({ ...BASE, 'core/meta.json': { pages: [page('index'), { type: 'folder', path: 'nometa' }, { type: 'folder', path: 'nodir' }] }, 'core/nometa/a.md': 'A' });
    const text = problemsOf(() => load(files));
    expect(text).toContain('the folder at core/meta.json › pages[1] needs its own meta.json');
    expect(text).toContain('folder "nodir" points to core/nodir/, which is not a directory');
  });

  test('references cannot leave the section', () => {
    const files = both({
      ...BASE,
      'core/meta.json': { pages: [page('index'), page('../start/x'), page('../../up'), { type: 'folder', path: '../start' }] },
      'start/x.md': 'X',
    });
    const text = problemsOf(() => load(files));
    expect(text).toContain('resolves to "start/x", outside the section "core"');
    expect(text).toContain('resolves to "../up", outside the section "core"');
    expect(text).toContain('folder "../start" resolves to "start", outside the section "core"');
  });

  test('the start section may list its extra page only', () => {
    const files = both({ ...BASE, 'start/meta.json': { pages: [page('../index'), page('../core/index')] } });
    expect(problemsOf(() => load(files))).toContain('resolves to "core/index", outside the section "start"');
  });

  test('folders that form a cycle, or a directory used by two folders, are errors', () => {
    const cycle = both({
      ...BASE,
      'core/meta.json': { pages: [page('index'), { type: 'folder', path: 'a' }] },
      'core/a/meta.json': { title: 'A', pages: [{ type: 'folder', path: 'b' }] },
      'core/a/b/meta.json': { title: 'B', pages: [{ type: 'folder', path: '..' }] },
    });
    expect(problemsOf(() => load(cycle))).toContain('folders form a cycle (core → core/a → core/a/b → core/a)');
    const twice = both({
      ...BASE,
      'core/meta.json': { pages: [page('index'), { type: 'folder', path: 'a' }, { type: 'folder', path: 'a' }] },
      'core/a/meta.json': { title: 'A', pages: [page('x')] },
      'core/a/x.md': 'X',
    });
    expect(problemsOf(() => load(twice))).toContain('the directory core/a/ is already the folder of');
  });

  test('a group cannot contain a group, but a folder can contain one', () => {
    const files = both({ ...BASE, 'core/meta.json': { pages: [page('index'), { type: 'group', title: 'Outer', pages: [{ type: 'group', title: 'Inner', pages: [] }] }] } });
    expect(problemsOf(() => load(files))).toContain('a group cannot contain another group');
  });

  test('malformed entries are reported with their position', () => {
    const files = both({ ...BASE, 'core/meta.json': { pages: [page('index'), { type: 'nope' }, { type: 'page' }, { type: 'page', path: 'index.md' }, { type: 'planned' }, { type: 'page', path: 'index', extra: 1 }, 'text'] } });
    const text = problemsOf(() => load(files));
    for (const expected of ['unknown type "nope"', 'a page entry needs a "path"', 'must be relative to core/ and have no .md extension', 'a planned entry needs a "title"', 'unknown field "extra"', 'every entry must be an object']) expect(text).toContain(expected);
  });

  test('invalid JSON, a missing section meta.json and a missing title are reported', () => {
    const files = both({ ...BASE, 'core/index.md': { title: '' } });
    files['core/meta.json'] = { pages: 'x' };
    delete files['zh/core/meta.json'];
    const text = problemsOf(() => load(files));
    expect(text).toContain('core/meta.json: "pages" must be an array');
    expect(text).toContain('zh/core/meta.json: the file does not exist');
    expect(text).toContain('the front matter needs a title');
  });
});

describe('languages', () => {
  test('both languages need the same pages and the same menu structure; only titles may differ', () => {
    const files = both({ ...BASE, 'core/a.md': 'A', 'core/meta.json': { pages: [page('index'), page('a', 'English')] } }, { zh: { 'core/meta.json': { pages: [page('index'), page('a', '中文')] } } });
    expect(() => load(files)).not.toThrow();
  });

  test('a page, a type, a path or the nesting that differs fails the build', () => {
    const base = { ...BASE, 'core/a.md': 'A', 'core/b.md': 'B' };
    const differentPath = both({ ...base, 'core/meta.json': { pages: [page('index'), page('a')] } }, { zh: { 'core/meta.json': { pages: [page('index'), page('b')] } } });
    expect(problemsOf(() => load(differentPath))).toContain('differ in structure: section "core"[1]: page "core/a" versus page "core/b"');
    const nesting = both({ ...base, 'core/meta.json': { pages: [page('index'), page('a')] } }, { zh: { 'core/meta.json': { pages: [page('index'), { type: 'group', title: 'G', pages: [page('a')] }] } } });
    expect(problemsOf(() => load(nesting))).toContain('page "core/a" versus group');
    const missingPage = both(base, { zh: { 'core/b.md': undefined } });
    delete missingPage['zh/core/b.md'];
    expect(problemsOf(() => load(missingPage))).toContain('core/b.md has no counterpart in zh/');
  });

  test('defaultOpen is part of the structure', () => {
    const f = open => ({ 'core/f/meta.json': { title: 'F', defaultOpen: open, pages: [page('x')] } });
    const files = both({ ...BASE, 'core/meta.json': { pages: [page('index'), { type: 'folder', path: 'f' }] }, 'core/f/x.md': 'X', ...f(true) }, { zh: f(false) });
    expect(problemsOf(() => load(files))).toContain('(defaultOpen)');
  });
});

test('a language directory cannot have the name of a content directory, and the default language skips the language directories', () => {
  const files = both(BASE);
  const text = problemsOf(() => loadContent({ contentDir: fixture(files), languages: [{ code: 'en', dir: '' }, { code: 'zh', dir: 'core' }], sections: SECTIONS }));
  expect(text).toContain('The language directory "core" has the same name as a top-level content directory');
  const { languages } = load(files);
  expect([...languages.get('en').pages.keys()].sort()).toEqual(['core/index', 'index']);
  expect([...languages.get('zh').pages.keys()].sort()).toEqual(['core/index', 'index']);
});

test('metaDescription replaces the description only in the meta description, and both must be strings', () => {
  const { languages } = load(both({ ...BASE, 'index.md': { title: 'Home', front: 'description: Shown\nmetaDescription: For search' }, 'core/index.md': { title: 'Core', front: 'description: Both' } }));
  const pages = languages.get('en').pages;
  expect(pages.get('index')).toMatchObject({ description: 'Shown', metaDescription: 'For search' });
  expect(pages.get('core/index')).toMatchObject({ description: 'Both', metaDescription: 'Both' });
  const text = problemsOf(() => load(both({ ...BASE, 'index.md': { title: 'Home', front: 'description: 1\nmetaDescription: [a]' } })));
  expect(text).toContain('description must be a string');
  expect(text).toContain('metaDescription must be a string');
});

test('diffSkeleton and listPageKeys', () => {
  expect(diffSkeleton([{ type: 'page', key: 'a' }], [{ type: 'page', key: 'a' }])).toBeNull();
  expect(diffSkeleton([{ type: 'page', key: 'a' }], [])).toContain('nothing');
  const root = fixture({ 'a.md': 'A', 'x/b.md': 'B', 'x/skip.txt': 'no' });
  expect(listPageKeys(root)).toEqual(['a', 'x/b']);
  expect(listPageKeys(root, ['x'])).toEqual(['a']);
});
