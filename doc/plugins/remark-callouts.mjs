// `> [!NOTE] Title` blockquotes become <div class="note note-kind">, and a paragraph starting with **Done when**: (or **完成的标志**：) gets the class `done`.
import { visit } from 'unist-util-visit';
import { getSite } from '../src/lib/site.mjs';
import { fileInfo } from './file-info.mjs';

const KINDS = ['TIP', 'NOTE', 'WARNING', 'PENDING'];
const DONE = ['完成的标志', 'Done when'];

export default function remarkCallouts({ site, contentDir } = {}) {
  return (tree, file) => {
    const info = fileInfo(file.path, contentDir, site?.config.languages);
    if (!info) return;
    const ui = (site ?? getSite()).config.byCode[info.lang].ui;
    visit(tree, 'blockquote', node => {
      const first = node.children[0];
      const text = first?.type === 'paragraph' ? first.children[0] : null;
      const m = text?.type === 'text' ? new RegExp(`^\\[!(${KINDS.join('|')})\\][ \\t]*([^\\n]*)\\n?`).exec(text.value) : null;
      if (!m) return;
      const title = m[2].trim() || ui.callouts?.[m[1]] || m[1];
      text.value = text.value.slice(m[0].length);
      if (!text.value) first.children.shift();
      node.children = [{ type: 'strong', children: [{ type: 'text', value: title }] }, ...(first.children.length ? [first] : []), ...node.children.slice(1)];
      node.data = { hName: 'div', hProperties: { className: ['note', m[1].toLowerCase()] } };
    });
    visit(tree, 'paragraph', node => {
      const [strong, rest] = node.children;
      if (strong?.type !== 'strong' || strong.children.length !== 1 || !DONE.includes(strong.children[0].value) || rest?.type !== 'text' || !/^[：:]/.test(rest.value)) return;
      rest.value = rest.value.replace(/^[：:]\s*/, '');
      node.data = { hProperties: { className: ['done'] } };
    });
  };
}
