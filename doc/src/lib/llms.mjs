// The data of the files the shared integration writes next to the pages: one llms.txt per language and a .md copy of every page.
import { stripFigures } from './figures.mjs';

/** A menu tree as llms.txt groups: top-level pages form untitled groups, groups and folders become titled ones. Planned entries and placeholder pages are left out. */
export function llmsGroups(tree, pageOf) {
  const groups = [];
  const pagesOf = nodes => nodes.flatMap(node => {
    if (node.type === 'page') return [node.key];
    if (node.type === 'folder') return [...(node.link ? [node.link.key] : []), ...pagesOf(node.children)];
    if (node.type === 'group') return pagesOf(node.children);
    return [];
  });
  const toPages = keys => keys.map(pageOf).filter(p => p && !p.placeholder).map(p => ({ title: p.title, description: p.description, path: p.mdUrl }));
  let loose = null;
  for (const node of tree) {
    if (node.type === 'page') {
      if (!loose) groups.push((loose = { pages: [] }));
      loose.pages.push(...toPages([node.key]));
      continue;
    }
    loose = null;
    if (node.type === 'planned') continue;
    groups.push({ title: node.title, pages: toPages(pagesOf([node])) });
  }
  return groups.filter(g => g.pages.length);
}

/** @returns {{ llms: object[], markdownCopies: object[] }} options for the shared integration */
export function docsFiles(site) {
  const { config } = site;
  const llms = [];
  const markdownCopies = [];
  for (const lang of config.languages) {
    const title = config.siteTitle(lang.code);
    const prefix = lang.dir ? `${lang.dir}/` : '';
    const pageOf = key => site.page(lang.code, key);
    llms.push({
      path: `${prefix}llms.txt`,
      title,
      summary: pageOf('index')?.description || title,
      sections: site.sections(lang.code).map(s => ({ title: s.title, groups: llmsGroups(s.tree, pageOf) })).filter(s => s.groups.length),
    });
    for (const page of site.pages.filter(p => p.lang === lang.code)) {
      markdownCopies.push({ path: `${prefix}${page.key}.md`, title: page.title, description: page.description, body: stripFigures(page.body) });
    }
  }
  return { llms, markdownCopies };
}
