// Reads the docs content: every page of every language, and the sidebar menus described by the meta.json files.
//
// content/<language>/<section dir>/meta.json is the menu root of a section; a `folder` entry points at a directory that has its own meta.json.
// loadContent() resolves all of it and collects every problem it finds (a page missing from the menu, a page listed twice, a folder cycle, a menu that differs between languages…) into one error, so a single build shows all of them.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { parseFrontMatter } from './frontmatter.mjs';

export class ContentError extends Error {
  constructor(problems) {
    super(`The docs content has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n${problems.map(p => `  - ${p}`).join('\n')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

const ENTRY_KEYS = { page: ['type', 'path', 'title'], folder: ['type', 'path'], group: ['type', 'title', 'pages'], planned: ['type', 'title'] };
const FOLDER_META_KEYS = ['title', 'defaultOpen', 'pages'];
const SECTION_META_KEYS = ['title', 'pages'];

/** All .md files below a directory, as keys: paths relative to it, with forward slashes and without the extension. `skip`: names of top-level directories to leave out (the other languages' directories, when the default language's content is at the root). */
export function listPageKeys(root, skip = []) {
  const keys = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (prefix || !skip.includes(entry.name)) walk(join(dir, entry.name), `${prefix}${entry.name}/`); }
      else if (entry.name.endsWith('.md')) keys.push(`${prefix}${entry.name.slice(0, -3)}`);
    }
  };
  if (existsSync(root)) walk(root, '');
  return keys.sort();
}

const isObject = v => v && typeof v === 'object' && !Array.isArray(v);

/** Compares two menu skeletons (type, resolved path, nesting) and describes the first difference, or returns null. */
export function diffSkeleton(a, b, trail = 'menu') {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i], at = `${trail}[${i}]`;
    if (!x || !y) return `${at}: one language has ${describe(x ?? y)} where the other has nothing`;
    if (x.type !== y.type || x.key !== y.key || (x.defaultOpen ?? false) !== (y.defaultOpen ?? false)) return `${at}: ${describe(x)} versus ${describe(y)}`;
    if (x.children || y.children) {
      const inner = diffSkeleton(x.children ?? [], y.children ?? [], `${at}.pages`);
      if (inner) return inner;
    }
  }
  return null;
}
const describe = s => `${s.type}${s.key !== undefined ? ` "${s.key}"` : ''}${s.defaultOpen ? ' (defaultOpen)' : ''}`;

/**
 * The default language's content is at the root of `contentDir` (its `dir` is ''), the others are in contentDir/<dir>/ with the same structure.
 * @param {{ contentDir: string, languages: { code: string, dir: string }[], sections: { id: string, dir: string, extra?: string[] }[] }} options
 * @returns {{ languages: Map<string, { code: string, pages: Map<string, any>, sections: Map<string, { id: string, tree: any[], order: string[] }> }> }}
 */
export function loadContent({ contentDir, languages, sections }) {
  const problems = [];
  const result = new Map();
  const skeletons = new Map();
  // A language directory shares the content root with the default language's own directories, so it cannot have a section's name
  const taken = new Set(sections.flatMap(s => [s.dir, ...(s.extra ?? [])]).map(p => p.split('/')[0]).filter(Boolean));
  const otherDirs = languages.map(l => l.dir).filter(Boolean);
  for (const dir of otherDirs) if (taken.has(dir) || dir === 'index') problems.push(`The language directory "${dir}" has the same name as a top-level content directory of the default language`);
  for (const { code, dir } of languages) {
    const built = loadLanguage({ root: join(contentDir, dir), prefix: dir ? `${dir}/` : '', code, skip: dir ? [] : otherDirs, sections, problems });
    result.set(code, built);
    skeletons.set(code, built.skeletons);
  }
  // Both languages must have the same pages and the same menu structure (only titles may differ).
  const [firstLang, ...others] = languages;
  const first = firstLang.code;
  for (const { code } of others) {
    const a = result.get(first), b = result.get(code);
    for (const [key, page] of a.pages) if (!b.pages.has(key)) problems.push(`${page.relPath} has no counterpart in ${languages.find(l => l.code === code).dir || code}/ (every language must have the same pages; an untranslated page contains only front matter and "status: placeholder")`);
    for (const [key, page] of b.pages) if (!a.pages.has(key)) problems.push(`${page.relPath} has no counterpart in the default language`);
    for (const section of sections) {
      const diff = diffSkeleton(skeletons.get(first).get(section.id) ?? [], skeletons.get(code).get(section.id) ?? [], `section "${section.id}"`);
      if (diff) problems.push(`The menus of ${first} and ${code} differ in structure: ${diff}`);
    }
  }
  if (problems.length) throw new ContentError(problems);
  return { languages: result };
}

function loadLanguage({ root, prefix, code, skip, sections, problems }) {
  const rel = file => `${prefix}${file}`;
  const pages = new Map();
  for (const key of listPageKeys(root, skip)) {
    const file = join(root, `${key}.md`);
    try {
      const { data, body } = parseFrontMatter(readFileSync(file, 'utf8'));
      if (typeof data.title !== 'string' || !data.title.trim()) problems.push(`${rel(`${key}.md`)}: the front matter needs a title`);
      for (const field of ['description', 'metaDescription']) if (data[field] !== undefined && typeof data[field] !== 'string') problems.push(`${rel(`${key}.md`)}: ${field} must be a string`);
      const description = typeof data.description === 'string' ? data.description : '';
      pages.set(key, {
        key, lang: code, file, relPath: rel(`${key}.md`), data, body,
        // description is shown under the title; metaDescription, when set, replaces it in the meta description, llms.txt and the .md copy without being shown
        title: String(data.title ?? key), description, metaDescription: (typeof data.metaDescription === 'string' && data.metaDescription) || description,
        status: data.status === undefined ? '' : String(data.status), placeholder: data.status !== undefined && data.status !== null && data.status !== '',
        section: null, label: null, trail: [], refs: [],
      });
    } catch (error) {
      problems.push(`${rel(`${key}.md`)}: ${error.message}`);
    }
  }

  const folderDirs = new Map();
  const out = new Map();
  const skeletons = new Map();

  const readMeta = (dir, where, allowed) => {
    const file = join(root, dir, 'meta.json');
    const name = rel(posix.join(dir, 'meta.json'));
    let meta;
    try {
      meta = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      problems.push(`${name}${where}: ${error.code === 'ENOENT' ? 'the file does not exist' : `invalid JSON (${error.message})`}`);
      return null;
    }
    if (!isObject(meta)) { problems.push(`${name}: the top level must be an object like { "pages": [...] }`); return null; }
    for (const k of Object.keys(meta)) if (!allowed.includes(k)) problems.push(`${name}: unknown field "${k}" (allowed: ${allowed.join(', ')})`);
    if (!Array.isArray(meta.pages)) { problems.push(`${name}: "pages" must be an array`); return null; }
    return { meta, name };
  };

  /** Resolves one list of entries. `dir` is the directory the paths are relative to; `stack` the folder directories being resolved (cycle check). */
  const resolveEntries = (entries, { dir, name, section, stack, inGroup, trail }) => {
    const nodes = [];
    const skeleton = [];
    let link = null;
    entries.forEach((entry, i) => {
      const at = `${name} › pages[${i}]`;
      if (!isObject(entry) || typeof entry.type !== 'string') { problems.push(`${at}: every entry must be an object with a "type" ("page", "folder", "group" or "planned")`); return; }
      const allowed = ENTRY_KEYS[entry.type];
      if (!allowed) { problems.push(`${at}: unknown type "${entry.type}" (use page, folder, group or planned)`); return; }
      for (const k of Object.keys(entry)) if (!allowed.includes(k)) problems.push(`${at}: unknown field "${k}" for type "${entry.type}" (allowed: ${allowed.join(', ')})`);
      if (entry.type === 'planned') {
        if (typeof entry.title !== 'string' || !entry.title) { problems.push(`${at}: a planned entry needs a "title"`); return; }
        nodes.push({ type: 'planned', title: entry.title });
        skeleton.push({ type: 'planned' });
        return;
      }
      if (entry.type === 'group') {
        if (inGroup) { problems.push(`${at}: a group cannot contain another group`); return; }
        if (typeof entry.title !== 'string' || !entry.title) { problems.push(`${at}: a group needs a "title"`); return; }
        if (!Array.isArray(entry.pages)) { problems.push(`${at}: a group needs a "pages" array`); return; }
        const inner = resolveEntries(entry.pages, { dir, name: `${at} (group "${entry.title}")`, section, stack, inGroup: true, trail: [...trail, entry.title] });
        nodes.push({ type: 'group', title: entry.title, children: inner.nodes });
        skeleton.push({ type: 'group', children: inner.skeleton });
        return;
      }
      // page and folder have a path
      if (typeof entry.path !== 'string' || !entry.path) { problems.push(`${at}: a ${entry.type} entry needs a "path"`); return; }
      if (entry.path.startsWith('/') || entry.path.endsWith('.md')) { problems.push(`${at}: path "${entry.path}" must be relative to ${dir || 'the language root'}/ and have no .md extension`); return; }
      const key = posix.normalize(posix.join(dir, entry.path));
      const inside = section.dir === '' ? !key.startsWith('..') : key.startsWith(`${section.dir}/`);
      if (entry.type === 'page') {
        if (!inside && !(section.extra ?? []).includes(key)) { problems.push(`${at}: path "${entry.path}" resolves to "${key}", outside the section "${section.id}" (${section.dir}/); a menu cannot reference pages of another section`); return; }
        const page = pages.get(key);
        if (!page) { problems.push(`${at}: path "${entry.path}" points to ${rel(`${key}.md`)}, which does not exist`); return; }
        page.refs.push(at);
        page.section = section.id;
        page.label = typeof entry.title === 'string' && entry.title ? entry.title : page.title;
        page.trail = trail;
        if (entry.title !== undefined && typeof entry.title !== 'string') problems.push(`${at}: title must be a string`);
        const node = { type: 'page', key, title: page.label, placeholder: page.placeholder };
        // A folder's own index page is the folder title's link, not a child of its own
        if (!inGroup && stack.length > 1 && key === `${dir}/index` && dir === stack[stack.length - 1] && dir !== section.dir) link = node;
        else { nodes.push(node); skeleton.push({ type: 'page', key }); }
        return;
      }
      // folder
      if (!inside || key === section.dir) { problems.push(`${at}: folder "${entry.path}" resolves to "${key}", outside the section "${section.id}" (${section.dir}/)`); return; }
      const dirOnDisk = join(root, key);
      if (!existsSync(dirOnDisk) || !statSync(dirOnDisk).isDirectory()) { problems.push(`${at}: folder "${entry.path}" points to ${rel(`${key}/`)}, which is not a directory`); return; }
      if (stack.includes(key)) { problems.push(`${at}: folder "${entry.path}" (${key}/) is already being resolved higher up: folders form a cycle (${[...stack, key].join(' → ')})`); return; }
      if (folderDirs.has(key)) { problems.push(`${at}: the directory ${key}/ is already the folder of ${folderDirs.get(key)}; a directory can be referenced by only one folder`); return; }
      folderDirs.set(key, at);
      const loaded = readMeta(key, ` (the folder at ${at} needs its own meta.json)`, FOLDER_META_KEYS);
      if (!loaded) return;
      const { meta, name: metaName } = loaded;
      if (typeof meta.title !== 'string' || !meta.title) { problems.push(`${metaName}: a folder's meta.json needs a "title"`); return; }
      if (meta.defaultOpen !== undefined && typeof meta.defaultOpen !== 'boolean') problems.push(`${metaName}: defaultOpen must be true or false`);
      const inner = resolveEntries(meta.pages, { dir: key, name: metaName, section, stack: [...stack, key], inGroup: false, trail: [...trail, meta.title] });
      nodes.push({ type: 'folder', title: meta.title, defaultOpen: meta.defaultOpen === true, dir: key, link: inner.link, children: inner.nodes });
      skeleton.push({ type: 'folder', key, defaultOpen: meta.defaultOpen === true, children: [...(inner.link ? [{ type: 'page', key: inner.link.key }] : []), ...inner.skeleton] });
    });
    return { nodes, skeleton, link };
  };

  for (const section of sections) {
    const loaded = readMeta(section.dir, '', SECTION_META_KEYS);
    if (!loaded) continue;
    const { nodes, skeleton } = resolveEntries(loaded.meta.pages, { dir: section.dir, name: loaded.name, section, stack: [section.dir], inGroup: false, trail: [] });
    const order = [];
    const visit = list => {
      for (const node of list) {
        if (node.type === 'page') order.push(node.key);
        else if (node.type === 'folder') { if (node.link) order.push(node.link.key); visit(node.children); } else if (node.type === 'group') visit(node.children);
      }
    };
    visit(nodes);
    out.set(section.id, { id: section.id, tree: nodes, order });
    skeletons.set(section.id, skeleton);
  }

  for (const page of pages.values()) {
    if (page.refs.length === 0) problems.push(`${page.relPath} is not in any menu (add it to a meta.json)`);
    else if (page.refs.length > 1) problems.push(`${page.relPath} is listed ${page.refs.length} times: ${page.refs.join('; ')}`);
  }
  return { code, pages, sections: out, skeletons };
}
