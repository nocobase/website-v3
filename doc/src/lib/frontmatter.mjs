import { parse } from 'yaml';

/**
 * Splits a Markdown source into its YAML front matter and body. Throws when the front matter is not valid YAML or not a mapping.
 * @param {string} source
 * @returns {{ data: Record<string, unknown>, body: string }}
 */
export function parseFrontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!match) return { data: {}, body: source };
  const data = parse(match[1]) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('the front matter must be a YAML mapping');
  return { data, body: source.slice(match[0].length) };
}
