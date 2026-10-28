// Relative .md links between pages become the final addresses; a link to a page that does not exist fails the build.
import { visit } from 'unist-util-visit';
import { resolveLink } from '../src/lib/links.mjs';
import { getSite } from '../src/lib/site.mjs';
import { fileInfo } from './file-info.mjs';

export default function remarkLinks({ site, contentDir } = {}) {
  return (tree, file) => {
    const info = fileInfo(file.path, contentDir, site?.config.languages);
    if (!info) return;
    const s = site ?? getSite();
    const ctx = { key: info.key, lang: info.lang, hasPage: (lang, key) => Boolean(s.page(lang, key)), urlOf: s.urlOf };
    visit(tree, ['link', 'definition'], node => {
      try {
        node.url = resolveLink(node.url, ctx);
      } catch (error) {
        throw new Error(`${info.rel}: ${error.message}`);
      }
    });
  };
}
