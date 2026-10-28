import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** `::figure name[+name] [extra classes] | caption` on a line of its own. */
export const FIGURE_LINE = /^::figure[ \t]+([\w+-]+)((?:[ \t]+[\w-]+)*)[ \t]*(?:\|[ \t]*(.*))?$/;
const FIGURE_LINES = new RegExp(FIGURE_LINE.source, 'gm');

/** Parses one line; returns { names, classes, caption } or null. */
export function parseFigureLine(line) {
  const m = FIGURE_LINE.exec(line.trim());
  return m ? { names: m[1].split('+'), classes: m[2].trim().split(/\s+/).filter(Boolean), caption: m[3]?.trim() ?? '' } : null;
}

/** The HTML of a figure fragment: figures/<language>/<name>.html when the language has its own version, otherwise figures/<name>.html. */
export function readFigure(figuresDir, lang, name) {
  const localized = join(figuresDir, lang, `${name}.html`);
  const file = existsSync(localized) ? localized : join(figuresDir, `${name}.html`);
  if (!existsSync(file)) throw new Error(`the figure "${name}" does not exist (expected figures/${name}.html)`);
  return readFileSync(file, 'utf8').trim();
}

/** For the .md copies: a figure line becomes its caption in italics (or nothing). */
export function stripFigures(markdown) {
  return markdown.replace(FIGURE_LINES, (_, _names, _classes, caption) => (caption ? `*${caption.trim()}*` : ''));
}
