// `::figure name | caption` on a line of its own becomes <figure class="fig">…<figcaption>caption</figcaption></figure>, with the fragment from figures/ inlined.
import { FIGURES_DIR } from '../src/lib/paths.mjs';
import { parseFigureLine, readFigure } from '../src/lib/figures.mjs';
import { fileInfo } from './file-info.mjs';

export default function remarkFigures({ figuresDir = FIGURES_DIR, contentDir, site } = {}) {
  const processor = this;
  return (tree, file) => {
    const info = fileInfo(file.path, contentDir, site?.config.languages);
    if (!info) return;
    const source = String(file.value);
    const out = [];
    for (const node of tree.children) {
      const slice = node.type === 'paragraph' && node.position ? source.slice(node.position.start.offset, node.position.end.offset) : '';
      const lines = slice ? slice.split('\n').map(parseFigureLine) : [];
      if (!lines.length || lines.some(l => !l)) { out.push(node); continue; }
      for (const fig of lines) {
        let html;
        try {
          html = fig.names.map(name => readFigure(figuresDir, info.lang, name)).join('');
        } catch (error) {
          throw new Error(`${info.rel}: ${error.message}`);
        }
        const children = [{ type: 'html', value: html }];
        if (fig.caption) children.push({ type: 'figcaption', data: { hName: 'figcaption' }, children: processor.parse(fig.caption).children[0]?.children ?? [] });
        out.push({ type: 'figure', data: { hName: 'figure', hProperties: { className: ['fig', ...fig.classes] } }, children });
      }
    }
    tree.children = out;
  };
}
