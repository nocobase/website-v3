// HTML tables and other handwritten markup need the same link resolution as Markdown.
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';
import { resolveLink } from '../src/lib/links.mjs';
import { getSite } from '../src/lib/site.mjs';
import { fileInfo } from './file-info.mjs';

export default function rehypeLinks({ site, contentDir } = {}) {
  const parse = rehypeRaw();
  return (tree, file) => {
    const info = fileInfo(file.path, contentDir, site?.config.languages);
    if (!info) return;
    const s = site ?? getSite();
    const ctx = { key: info.key, lang: info.lang, hasPage: (lang, key) => Boolean(s.page(lang, key)), urlOf: s.urlOf };
    const parsed = parse(tree, file);
    visit(parsed, 'element', node => {
      if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
      try {
        node.properties.href = resolveLink(node.properties.href, ctx);
      } catch (error) {
        throw new Error(`${info.rel}: ${error.message}`);
      }
    });
    return parsed;
  };
}
