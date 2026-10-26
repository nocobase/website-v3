// 读取页面正文源文件 src/pages/<名称>.body.html：头部的元信息、正文开头的 <style>、正文，以及 <!-- AFTER-MAIN --> 之后页面自己的脚本。
// 正文里的 {{SNIP:名称:宽度}} 换成 src/pages/snips/ 里的界面示意（由 scripts/figs/ 的脚本生成），{{DOCS}} 换成文档站地址。
//
// 正文头部（--- 之前）每行「键: 值」：
//   page        页面标识，导航里高亮当前页用（core、studio、crm……）
//   title_zh / title_en / desc_zh / desc_en   中英文的标题和描述；其他语言的写在 src/i18n/<组>.<语言>.yaml 的 title、description
//   i18n        这页的译文组名。写了就生成 12 种语言，不写只生成英文和简体中文
//   scripts     页面另外加载的脚本，空格分隔，如 assets/public-form.js
//   langs       只生成这些语言（空格分隔，如 404 页写 en）
//   noindex     写 1 时不进 sitemap，不写 canonical 和 hreflang，加 noindex（404 页）
// 构建用 readPage() 得到这些内容再生成各语言的页面；renderBilingual() 给出中英双语的整页 HTML，抽取译文条目和首页取内页的图时用。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SRC } from './paths.mjs';

const PAGES = join(SRC, 'pages');
export const DOCS = 'https://docs.nocobase.com/';
const read = p => readFileSync(p, 'utf8');
const escAttr = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

export function expand(body) {
  body = body.replace(/\{\{SNIP:(\w+):(\d+)\}\}/g, (m, name, w) => `<div class="fit" data-w="${w}"><div class="fit-in">${read(join(PAGES, 'snips', `${name}.html`))}</div></div>`);
  return body.split('{{DOCS}}').join(DOCS);
}

export function parsePage(text) {
  const i = text.indexOf('\n---\n');
  const meta = Object.fromEntries(text.slice(0, i).trim().split('\n').map(l => [l.slice(0, l.indexOf(': ')), l.slice(l.indexOf(': ') + 2)]));
  let body = text.slice(i + 5), style = '', after = '';
  if (body.startsWith('<style>')) {
    const j = body.indexOf('</style>\n');
    style = body.slice(0, j) + '</style>\n';
    body = body.slice(j + '</style>\n'.length);
  }
  const k = body.indexOf('\n<!-- AFTER-MAIN -->\n');
  if (k >= 0) {
    after = body.slice(k + '\n<!-- AFTER-MAIN -->\n'.length);
    body = body.slice(0, k);
  }
  return { meta, style, main: expand(body).trim(), after };
}

export const readPage = name => parsePage(read(join(PAGES, `${name}.body.html`)));

// 中英双语的整页 HTML（不含导航和页脚）：标题和描述写在 <title>、<meta> 的 data-zh / data-en 上
export function renderBilingual(name) {
  const { meta: m, style, main, after } = readPage(name);
  return `<!doctype html>\n<html lang="en">\n<head>\n<title data-zh="${escAttr(m.title_zh)}" data-en="${escAttr(m.title_en)}">${escText(m.title_en)}</title>\n` +
    `<meta name="description" content="${escAttr(m.desc_en)}" data-zh="${escAttr(m.desc_zh)}" data-en="${escAttr(m.desc_en)}">\n${style}</head>\n` +
    `<body data-page="${m.page}">\n<main>\n${main}\n</main>\n${after}</body>\n</html>\n`;
}
