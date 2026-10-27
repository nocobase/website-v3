// Markup of the docs prose: code blocks get a toolbar (language label and copy button), the special blocks (tree, prompt, plain text) get their own look, tables scroll inside a wrapper, images become figures, and absolute links open in a new tab.
import { bundledLanguagesInfo } from 'shiki';
import { visit } from 'unist-util-visit';
import { getSite } from '../src/lib/site.mjs';
import { fileInfo } from './file-info.mjs';

// Languages Shiki must leave alone: the plugin renders them itself
export const PLAIN_LANGS = ['', 'text', 'plaintext', 'txt'];
export const SPECIAL_LANGS = ['tree', 'prompt', ...PLAIN_LANGS.filter(Boolean)];

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = value => ({ type: 'text', value });
const textOf = node => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''));
const classes = node => [node.properties?.className ?? [], String(node.properties?.class ?? '').split(/\s+/)].flat().map(String).filter(Boolean);

const NAMES = new Map();
for (const info of bundledLanguagesInfo) for (const id of [info.id, ...(info.aliases ?? [])]) NAMES.set(id, info.name);
for (const id of ['bash', 'sh', 'shell', 'zsh']) NAMES.set(id, 'Bash');
export const languageLabel = lang => (lang === 'tsx' ? 'TSX' : NAMES.get(lang) ?? lang);

/** Directory-tree highlighting: only annotates the connectors, directories, files and `#` comments; every source character is kept so alignment and copying are unchanged. Returns hast nodes. */
export function highlightTree(code) {
  const nodes = [];
  code.split('\n').forEach((line, i) => {
    if (i) nodes.push(text('\n'));
    const branch = /^([ \t│]*[├└]─{2,}[ \t]+)(.*)$/.exec(line);
    const content = branch ? branch[2] : line;
    const [, name, comment = ''] = /^(.*?)([ \t]{2,}#.*)?$/.exec(content);
    if (!branch && !name.trimEnd().endsWith('/')) {
      nodes.push(/^[ \t│]+$/.test(line) ? el('span', { className: ['tree-guide'] }, [text(line)]) : text(line));
      return;
    }
    if (branch) nodes.push(el('span', { className: ['tree-guide'] }, [text(branch[1])]));
    nodes.push(el('span', { className: [`tree-${name.trimEnd().endsWith('/') ? 'directory' : 'file'}`] }, [text(name)]));
    if (comment) nodes.push(el('span', { className: ['tree-comment'] }, [text(comment)]));
  });
  return nodes;
}

export default function rehypeDocs({ site, contentDir } = {}) {
  return (tree, file) => {
    const info = fileInfo(file.path, contentDir, site?.config.languages);
    if (!info) return;
    const ui = (site ?? getSite()).config.byCode[info.lang].ui;

    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.tagName === 'pre') {
        const code = node.children.find(c => c.type === 'element' && c.tagName === 'code');
        const highlighted = classes(node).includes('astro-code');
        let lang = highlighted ? String(node.properties.dataLanguage ?? '') : (classes(code ?? node).map(c => /^language-(.+)$/.exec(c)?.[1]).find(Boolean) ?? '').toLowerCase();
        if (highlighted && PLAIN_LANGS.includes(lang)) lang = '';
        const source = textOf(node);
        const plain = !highlighted && PLAIN_LANGS.includes(lang);
        const tree_ = !highlighted && (lang === 'tree' || (plain && /^[ \t│]*[├└]─{2,}[ \t]+/m.test(source)));
        const prompt = !highlighted && lang === 'prompt';
        const kind = tree_ ? ['plain-text', 'code-tree'] : prompt ? ['wrap', 'code-prompt'] : plain ? ['wrap', 'plain-text'] : [];
        const label = tree_ ? ui.codeLabels.tree : prompt ? ui.codeLabels.prompt : plain ? ui.codeLabels.text : languageLabel(lang);
        if (!highlighted && code) {
          // Unhighlighted blocks drop the trailing newline Markdown leaves and keep the source otherwise
          const body = source.replace(/\n$/, '');
          code.children = tree_ ? highlightTree(body) : [text(body)];
        }
        node.properties = { ...node.properties, tabIndex: 0 };
        delete node.properties.style;
        const wrapper = el('div', { className: ['code-block', ...kind] }, [
          el('div', { className: ['code-toolbar'] }, [
            el('span', { className: ['code-language'] }, [text(label)]),
            el('button', { type: 'button', className: ['copy-button'], dataCopied: ui.copied, dataFailed: ui.copyFailed, ariaLive: 'polite' }, [text(ui.copy)]),
          ]),
          node,
        ]);
        parent.children[index] = wrapper;
        return 'skip';
      }

      if (node.tagName === 'table') {
        parent.children[index] = el('div', { className: ['table-wrap'] }, [node]);
        return 'skip';
      }

      if (node.tagName === 'img') {
        const alt = String(node.properties.alt ?? '');
        const figure = el('figure', { className: ['fig'] }, [{ ...node, properties: { ...node.properties, loading: 'lazy' } }, ...(alt ? [el('figcaption', {}, [text(alt)])] : [])]);
        // A paragraph that holds only the image is replaced by the figure
        const only = parent.tagName === 'p' && parent.children.filter(c => !(c.type === 'text' && !c.value.trim())).length === 1;
        if (only) parent.tagName = 'figure', parent.properties = { className: ['fig'] }, parent.children = figure.children;
        else parent.children[index] = figure;
        return 'skip';
      }

      if (node.tagName === 'a' && /^https?:/i.test(String(node.properties.href ?? ''))) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener'];
      }
    });
  };
}
