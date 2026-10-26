// 在构建时按语言处理中英双语的 HTML：只留本页语言的 <t-zh>/<t-en>、.zh-only/.en-only，其他语言把 <t-en> 换成译文。
//
// 规则和以前 assets/site.js 的 applyI18n 在浏览器里做的一样：
// - 简体中文：留 <t-zh>、.zh-only，去掉 <t-en>、.en-only。
// - 英文：留 <t-en>、.en-only，去掉 <t-zh>、.zh-only。
// - 其他语言：去掉 <t-zh>、.zh-only；<t-en> 换成译文（键是 data-k，没有就是英文原文），缺的保留英文。
// - 界面示意图（.fit-in 里，以及 <template> 里）不翻译：繁体中文显示繁体中文界面——成对的 <t-zh>…<t-en>、.zh-only….en-only 里，英文那份换成中文那份按 ui 表逐个文本节点转成的繁体（表里没有的文本保留简体中文，记下来给构建打印警告）；其他语言显示英文界面。
// 表单上的 data-ph-* / data-text-* / data-ok-*：其他语言把英文换成译文，并按本页语言直接写好 placeholder 和选项文字。

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', times: '×', copy: '©', rarr: '→', larr: '←', yen: '¥', bull: '•' };
export function unescape(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}
export const escapeText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escapeAttr = s => escapeText(s).replace(/"/g, '&quot;');

function parseAttrs(s) {
  const attrs = {};
  const re = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(s))) attrs[m[1].toLowerCase()] = unescape(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

// 解析成元素树：每个元素记下开始标签、结束标签在源码里的位置。没有闭合的元素在父元素结束处截止。
export function parse(src) {
  const root = { tag: '#root', attrs: {}, start: 0, openEnd: 0, closeStart: src.length, end: src.length, children: [], parent: null };
  const stack = [root];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt + 4); i = e < 0 ? src.length : e + 3; continue; }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') { const e = src.indexOf('>', lt); i = e < 0 ? src.length : e + 1; continue; }
    if (src[lt + 1] === '/') {
      const m = /^<\/([a-zA-Z][\w-]*)\s*>/.exec(src.slice(lt, lt + 100));
      if (!m) { i = lt + 1; continue; }
      const tag = m[1].toLowerCase(), end = lt + m[0].length;
      if (stack.slice(1).some(n => n.tag === tag)) {
        while (stack.length > 1) {
          const n = stack.pop();
          if (n.tag === tag) { n.closeStart = lt; n.end = end; break; }
          n.closeStart = n.end = lt;
        }
      }
      i = end;
      continue;
    }
    const m = /^<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/.exec(src.slice(lt));
    if (!m) { i = lt + 1; continue; }
    const tag = m[1].toLowerCase(), openEnd = lt + m[0].length;
    const parent = stack[stack.length - 1];
    const node = { tag, attrs: parseAttrs(m[2]), start: lt, openEnd, closeStart: openEnd, end: openEnd, children: [], parent };
    parent.children.push(node);
    i = openEnd;
    if (RAW.has(tag)) {
      const close = src.toLowerCase().indexOf(`</${tag}`, openEnd);
      const e = close < 0 ? src.length : src.indexOf('>', close) + 1;
      node.closeStart = close < 0 ? src.length : close;
      node.end = e;
      i = e;
    } else if (!VOID.has(tag) && !m[0].endsWith('/>')) {
      stack.push(node);
    }
  }
  while (stack.length > 1) { const n = stack.pop(); n.closeStart = n.end = src.length; }
  return root;
}

const classes = n => (n.attrs.class || '').split(/\s+/).filter(Boolean);
const isZh = n => n.tag === 't-zh' || classes(n).includes('zh-only');
const isEn = n => n.tag === 't-en' || classes(n).includes('en-only');

// 界面示意图里和英文成对的中文：<t-zh> 在 <t-en> 前面，.zh-only 在 .en-only 前面
function pairedZh(n) {
  const sibs = n.parent.children, i = sibs.indexOf(n);
  const z = i > 0 ? sibs[i - 1] : null;
  if (!z) return null;
  if (n.tag === 't-en') return z.tag === 't-zh' ? z : null;
  return classes(z).includes('zh-only') ? z : null;
}

// 按文本节点把简体中文的界面转成繁体（ui 表的键是解码后的文本）。表里没有的保留简体中文，记进 missing。
function twHTML(h, ui, missing) {
  return h.split(/(<[^>]*>)/).map((seg, i) => {
    if (i % 2 || !seg || !/[一-鿿¥]/.test(seg)) return seg;
    const t = unescape(seg);
    if (ui[t]) return escapeText(ui[t]);
    missing.add(t);
    return seg;
  }).join('');
}

// 首页模板里的界面示意：按整段（<t-zh> 的整个内容）查表，和首页脚本里的 L() 一样；表里没有的保留简体中文
function twWhole(h, ui, missing) {
  if (ui[h]) return ui[h];
  if (/[一-鿿¥]/.test(h)) missing.add(h);
  return h;
}

// 一种语言的处理参数：code 是语言代码（zh、en、de……），strings 是译文（以英文原文或 data-k 为键），ui 是繁体中文的界面文字（简体 → 繁体）
export class Lingo {
  constructor(code, strings = {}, ui = {}, uiWhole = false) {
    this.code = code;
    this.uiWhole = uiWhole; // 首页：繁体界面按整段查表（见 twWhole）；子页面按文本节点查表
    this.strings = strings;
    // 键也按解码后的文本查一次：首页的键是浏览器里 innerHTML 的写法，正文源里可能写成实体
    this.loose = Object.fromEntries(Object.entries(strings).map(([k, v]) => [unescape(k), v]));
    this.ui = ui;
    this.missingUi = new Set();
    this.missing = new Set();
  }

  tr(en, k) {
    if (k && k in this.strings) return this.strings[k];
    const v = this.strings[en] ?? this.loose[unescape(en)];
    if (v === undefined) { this.missing.add(k || en); return en; }
    return v;
  }
}

export function localize(src, lingo) {
  const code = lingo.code, root = parse(src), edits = [];
  const inner = n => src.slice(n.openEnd, n.closeStart);

  function formAttrs(n) {
    const a = n.attrs;
    if (!['data-ph-en', 'data-text-en', 'data-ok-en', 'data-ph-zh', 'data-text-zh'].some(k => k in a)) return;
    const tag = src.slice(n.start, n.openEnd);
    let neu = tag;
    const pick = {};
    for (const kind of ['ph', 'text', 'ok']) {
      const zh = a[`data-${kind}-zh`];
      let en = a[`data-${kind}-en`];
      if (en !== undefined && code !== 'zh' && code !== 'en') {
        const t = lingo.tr(en);
        neu = neu.replace(new RegExp(`(\\sdata-${kind}-en=")[^"]*(")`), (m, p1, p2) => p1 + escapeAttr(t) + p2);
        en = t;
      }
      pick[kind] = code === 'zh' && zh !== undefined ? zh : en;
    }
    if (pick.ph !== undefined && ('data-ph-zh' in a || 'data-ph-en' in a)) {
      neu = neu.replace(/\splaceholder="[^"]*"/, '');
      neu = neu.replace(/\s*\/?>$/, '') + ` placeholder="${escapeAttr(pick.ph)}">`;
    }
    if (neu !== tag) edits.push([n.start, n.openEnd, neu]);
    if (pick.text !== undefined && ('data-text-zh' in a || 'data-text-en' in a)) edits.push([n.openEnd, n.closeStart, escapeText(pick.text)]);
  }

  function visit(n, ui, noTw) {
    if (RAW.has(n.tag)) return;
    if (n.tag === 'template' || classes(n).includes('fit-in')) ui = true;
    if (code === 'zh') {
      if (isEn(n)) { edits.push([n.start, n.end, '']); return; }
    } else {
      if (isZh(n)) { edits.push([n.start, n.end, '']); return; }
      if (isEn(n) && code !== 'en') {
        if (ui) {
          const z = code === 'zh-TW' && !noTw ? pairedZh(n) : null;
          if (z) { edits.push([n.openEnd, n.closeStart, lingo.uiWhole ? twWhole(inner(z), lingo.ui, lingo.missingUi) : twHTML(inner(z), lingo.ui, lingo.missingUi)]); return; }
          if (n.tag !== 't-en') noTw = true; // 没有中文成对的 .en-only：里面保持英文界面
        } else if (n.tag === 't-en') {
          const v = lingo.tr(inner(n), n.attrs['data-k']);
          if (v !== inner(n)) edits.push([n.openEnd, n.closeStart, v]);
          return;
        }
      }
    }
    formAttrs(n);
    for (const c of n.children) visit(c, ui, noTw);
  }

  for (const c of root.children) visit(c, false, false);
  edits.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  let out = '', pos = 0;
  for (const [s, e, r] of edits) {
    if (s < pos) throw new Error(`overlapping edits at ${s}: ${src.slice(s, s + 80)}`);
    out += src.slice(pos, s) + r;
    pos = e;
  }
  return out + src.slice(pos);
}
