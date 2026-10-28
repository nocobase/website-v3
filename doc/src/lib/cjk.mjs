// Chinese and Japanese search: Pagefind segments these languages with a dictionary when indexing but with the browser's Intl.Segmenter when searching, and the two often disagree (Pagefind issues #1237, #1379), so a page that contains 创建插件 is not found by searching it. Instead both sides index and search single characters: the build puts a marker space between characters before handing a page to Pagefind, the search box does the same to the query, and the results are shown with those spaces removed again.
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}　-〿＀-￯]/u;
const CJK_ALL = new RegExp(CJK.source, 'gu');
// A thin space: Pagefind treats it as a word separator like any whitespace, and it never occurs in the content, so the display side can remove exactly the spaces added here
const MARK = ' ';

export const hasCjk = text => CJK.test(text);

// Puts a marker space around every CJK character of a piece of text
export const spaceCjk = text => text.replace(CJK_ALL, c => `${MARK}${c}${MARK}`);

// Applies spaceCjk to the text (not the tags or attributes) inside the element marked data-pagefind-body. Pagefind joins the text of a heading or paragraph to the next one without a separator in these languages, so a block that does not already end with punctuation gets a full stop, which keeps excerpts readable ("发布插件。本地插件可以…" instead of "发布插件本地插件可以…")
const BLOCK_END = /^<\/(h[1-6]|p|li|dt|dd|td|th|figcaption|summary)>/i;
const ENDS_WITH_PUNCT = /[\p{P}]\s*$/u;
export function spaceCjkHtml(html) {
  const start = html.search(/<[^>]*\sdata-pagefind-body[\s>=]/);
  if (start < 0) return html;
  const parts = html.slice(start).split(/(<[^>]*>)/);
  let raw = false;
  let text = '';
  const body = parts.map(part => {
    if (part.startsWith('<')) {
      if (/^<(script|style)\b/i.test(part)) raw = true;
      else if (/^<\/(script|style)>/i.test(part)) raw = false;
      else if (BLOCK_END.test(part) && text.trim() && !ENDS_WITH_PUNCT.test(text)) { text = '。'; return spaceCjk('。') + part; }
      return part;
    }
    if (raw) return part;
    if (part.trim()) text = part;
    return spaceCjk(part);
  }).join('');
  return html.slice(0, start) + body;
}

// Removes the spaces between characters from a title or an excerpt (HTML with <mark>). Pagefind turns the marker spaces into plain ones, so this removes any space between two CJK characters or next to CJK punctuation, skipping <mark> tags, and keeps the spaces between Chinese and Latin text that the writing style asks for
const C = '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]';
const P = '[\\u2018-\\u201f\\u3000-\\u303f\\uff00-\\uffef]';
const T = '(?:</?mark>)*';
const BETWEEN = new RegExp(`(${C}|${P})(${T})\\s+(${T})(?=${C}|${P})`, 'gu');
const BEFORE_PUNCT = new RegExp(`\\s+(${T})(?=${P})`, 'gu');
const AFTER_PUNCT = new RegExp(`(${P})(${T})\\s+`, 'gu');
export const unspaceCjk = text => text.replaceAll(MARK, ' ').replace(BETWEEN, '$1$2$3').replace(BEFORE_PUNCT, '$1').replace(AFTER_PUNCT, '$1$2').replace(/<\/mark>(\s*)<mark>/g, '$1');

// The searches to run for a query in a CJK language: first the whole query as an exact phrase of single characters, then every character and word anywhere on the page
export function cjkQueries(query) {
  const spaced = spaceCjk(query.replace(/["“”]/g, ' ')).replace(/\s+/g, ' ').trim();
  return [`"${spaced}"`, spaced];
}
