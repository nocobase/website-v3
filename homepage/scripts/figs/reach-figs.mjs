// NocoReach 页的产品界面图：用产品自己的界面代码和样式表画，和产品完全一致；作为网页内容放进页面，不再是截图。
// 界面代码和数据来自 content/reach/figs.js（按 NocoReach main 渲染出的 class 写成，数据是宣传片里的 Acme 例子），样式来自
// content/reach/product.css（NocoReach main 编译出的 CSS）和 figs.html 里的几条补充样式。这里把它们变成官网能直接用的样子：
//   1. 在 Node 里运行 figs.js，得到每张图中英两份的 HTML；带侧栏的整页只取中间的页面部分（按 Studio 页的做法，一张图只画和这件事有关的那部分界面），
//      外面套一个和 Studio 界面图一样的窗口外框，写成 content/pages/snips/reach<图名>.html，正文里用 {{SNIP:reachInsights:1024}} 引用。
//   2. 把产品样式限定在 .nr-app 里面，并只保留这些图用到的规则：:root / html / body 换成 .nr-app，其余选择器前面加 .nr-app；
//      去掉 @layer（官网的样式不在 layer 里，留着 layer 产品的规则会被官网的盖过）；屏幕宽度的媒体查询按截图时的 1440 宽桌面算好，
//      成立的直接展开，不成立的删掉，图在手机上缩小显示时也保持桌面的排版；暗色主题和 theme-preview 的规则删掉。
//   3. 处理好的样式连同 content/pages/reach-ui.css（外框）写进 content/pages/solution-reach.body.html 的 /* REACH-UI */ 标记之间，只有这一页加载。
// 改图改 content/reach/figs.js，改外框改 reach-ui.css，产品改版后换 product.css，然后运行这个脚本（pnpm figs 会一起运行）。
// 用法（在 homepage 目录下）：node scripts/figs/reach-figs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { CONTENT } from '../../src/lib/paths.mjs';

const PAGES = join(CONTENT, 'pages');
const REACH = join(CONTENT, 'reach');
const T = (zh, en) => `<t-zh>${zh}</t-zh><t-en>${en}</t-en>`;
const I = (n) => `<i data-lucide="${n}"></i>`;

// 页面上用到的图：图名、页面里的名字、窗口外框面包屑（中、英）、要从图里去掉的部分。去掉的是和这一节无关、或让图高过页面上限（site.js 的 capH）
// 而被整体缩小的部分：写元素开头的标记，或 [元素开头的标记, 元素里的文字（中英不同时写成 [中, 英]）]，找到整个元素去掉，找不到就报错
const OPP = '<button class="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-left text-card-foreground';
const PB = '<div class="flex flex-col gap-1 rounded-lg border bg-card p-3 text-left text-card-foreground">';
const FIGS = [
  // 洞察：去掉底部的对话输入框
  ['insights', 'reachInsights', [['洞察', 'Insights']], ['<div class="flex flex-col gap-2 rounded-xl border bg-background p-2 shadow-sm">']],
  // 机会：左边列表留 4 条，和右边的详情一样高
  ['opportunities', 'reachOpportunities', [['机会', 'Opportunities']], [[OPP, 'O-25'], [OPP, 'O-26']]],
  ['review', 'reachReview', [['任务', 'Tasks'], ['T-34', 'T-34']]],
  ['memory', 'reachMemory', [['AI 团队', 'AI team'], ['项目知识', 'Project knowledge']]],
  // 做法：四类都留着（正文写了这四类），每类一行
  ['playbook', 'reachPlaybook', [['AI 团队', 'AI team'], ['做法', 'Playbooks']],
    [[PB, ['竞品对比', 'Competitor comparison']], [PB, ['新建文档页', 'New docs page']], [PB, ['写发布说明', 'Write release notes']]]],
  ['tasks', 'reachTasks', [['任务', 'Tasks']]],
  ['results', 'reachResults', [['成果', 'Results']]],
  ['aisearch', 'reachAisearch', [['搜索与市场', 'Search &amp; market'], ['AI 搜索', 'AI search']]],
  // 数据接入：这一节讲交给 Agent 接入，去掉「从官网找」和社区这一组
  ['connect', 'reachConnect', [['设置', 'Settings'], ['数据接入', 'Data sources']],
    [['<div class="nr-discovery-way">', ['从官网找可接入的数据', 'Find data sources on your website']], ['<section class="nr-source-group', ['>社区</h2>', '>Community</h2>']]]],
  ['health', 'reachHealth', [['设置', 'Settings'], ['数据接入', 'Data sources']]],
];

// ---------- 1. 运行 figs.js，得到每张图的 HTML ----------
const logos = readFileSync(join(REACH, 'logos.js'), 'utf8');
const figsJs = readFileSync(join(REACH, 'figs.js'), 'utf8');
function render(fig, lang) {
  const shot = { style: {}, innerHTML: '', textContent: '' };
  const window = { addEventListener() {} };
  const document = { documentElement: { dataset: {} }, getElementById: () => shot, fonts: { ready: Promise.resolve() } };
  const ctx = vm.createContext({ window, document, location: { search: `?fig=${fig}&lang=${lang}` }, URLSearchParams });
  vm.runInContext(logos, ctx);
  vm.runInContext(figsJs, ctx);
  if (!shot.innerHTML) throw new Error(`figs.js 没有画出 ${fig}：${shot.textContent}`);
  let html = shot.innerHTML;
  // 带侧栏和顶栏的整页：只取 <main> 里的页面
  const open = '<main class="min-w-0 flex-1 overflow-hidden">';
  const i = html.indexOf(open);
  if (i >= 0) html = html.slice(i + open.length, html.lastIndexOf('</main>'));
  return html.replace(/\n\s*/g, ' ').trim();
}
// 找一个元素：spec 是元素开头的标记，或 [开头的标记, 元素里的文字]（按同名标签的开闭配对找到结尾），返回 [开头, 结尾] 的位置
function locate(html, spec, fig, lang) {
  const [start, has] = Array.isArray(spec) ? spec : [spec];
  const text = Array.isArray(has) ? has[lang === 'zh' ? 0 : 1] : has;
  const at = text ? html.indexOf(text) : 0;
  const i = at < 0 ? -1 : text ? html.lastIndexOf(start, at) : html.indexOf(start);
  if (i < 0) throw new Error(`${fig}（${lang}）里找不到：${start} ${text ?? ''}`);
  const tag = start.match(/^<(\w+)/)[1], re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g');
  re.lastIndex = i + 1;
  for (let depth = 1, m; (m = re.exec(html));) {
    if ((depth += m[0][1] === '/' ? -1 : 1) !== 0) continue;
    if (text && m.index < at) break; // 找到的元素没有包住这段文字
    return [i, m.index + m[0].length];
  }
  throw new Error(`${fig}（${lang}）里 ${start} ${text ?? ''} 没有找到完整的元素`);
}
const cut = (html, spec, fig, lang) => { const [i, j] = locate(html, spec, fig, lang); return html.slice(0, i) + html.slice(j); };

// NocoReach 的标识，和产品里画的一样：三根柱子，最高一根的顶面是紫色
const MARK = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="#0B0B0F"/>' +
  [[18, 42], [32, 33], [46, 21]].map(([x, top], k) => {
    const tp = `M${x - 7} ${top - 4}L${x} ${top - 8}L${x + 7} ${top - 4}L${x} ${top}Z`;
    return `<path d="M${x - 7} ${top - 4}L${x} ${top}V52L${x - 7} 48Z" fill="#fff"/><path d="M${x} ${top}L${x + 7} ${top - 4}V48L${x} 52Z" fill="#fff" fill-opacity=".72"/>` +
      `<path d="${tp}" fill="${k === 2 ? '#7C6CFF' : '#fff'}" fill-opacity="${k === 2 ? 1 : 0.45}"/>`;
  }).join('') + '</svg>';
// 窗口外框：NocoReach 标识 + 面包屑，右边是当前项目 Acme 和头像；里面是产品界面
function win(crumbs, zh, en) {
  const cr = crumbs.map((c, k) => (k === crumbs.length - 1 ? `<b>${T(...c)}</b>` : `<span>${T(...c)}</span>` + I('chevron-right'))).join('');
  return `<div class="sv-win"><div class="sv-top"><span class="rx-brand">${MARK}NocoReach</span><i class="sep"></i>${cr}` +
    `<span class="r"><span class="rx-proj"><i>A</i>Acme${I('chevrons-up-down')}</span><span class="st-av">${T('苏', 'SQ')}</span></span></div>` +
    `<div class="nr-app">${T(zh, en)}</div></div>`;
}

const out = {};
const draw = (fig, lang, cuts) => cuts.reduce((h, c) => cut(h, c, fig, lang), render(fig, lang));
for (const [fig, name, crumbs, cuts = []] of FIGS) out[name] = win(crumbs, draw(fig, 'zh', cuts), draw(fig, 'en', cuts));

// ---------- 2. 产品样式：限定在 .nr-app 里，只留用到的规则 ----------
// 用到的 class：图里写的，加上 Lucide 换成 SVG 时加的 lucide、lucide-<名字>
const used = new Set(['lucide']);
for (const html of Object.values(out)) {
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  for (const m of html.matchAll(/data-lucide="([^"]+)"/g)) used.add('lucide-' + m[1]);
}

// 一个够用的 CSS 解析器：规则、声明、@ 规则（含嵌套），认得注释、引号和括号
function parse(css) {
  let i = 0;
  function block() {
    const nodes = [];
    for (;;) {
      while (i < css.length) {
        if (/\s/.test(css[i])) i++;
        else if (css.startsWith('/*', i)) i = css.indexOf('*/', i + 2) + 2;
        else break;
      }
      if (i >= css.length || css[i] === '}') { i++; return nodes; }
      let j = i, depth = 0, q = null;
      for (; j < css.length; j++) {
        const ch = css[j];
        if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
        if (ch === '\\') { j++; continue; }
        if (ch === '"' || ch === "'") q = ch;
        else if (ch === '(' || ch === '[') depth++;
        else if (ch === ')' || ch === ']') depth--;
        else if (depth === 0 && (ch === '{' || ch === ';' || ch === '}')) break;
        else if (css.startsWith('/*', j)) { j = css.indexOf('*/', j + 2) + 1; }
      }
      const pre = css.slice(i, j).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (css[j] === '{') { i = j + 1; const kids = block(); nodes.push(pre.startsWith('@') ? { at: pre, kids } : { sel: pre, kids }); }
      else { i = css[j] === ';' ? j + 1 : j; if (pre) nodes.push({ decl: pre }); }
    }
  }
  return block();
}
const str = (nodes) => nodes.map((n) => (n.decl !== undefined ? n.decl + ';' : `${n.at ?? n.sel}{${str(n.kids)}}`)).join('');

// 按逗号拆选择器（括号、方括号里的逗号不算）
function splitSel(s) {
  const parts = []; let depth = 0, cur = '';
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (ch === '\\') { cur += ch + s[++k]; continue; }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
// 选择器要求元素带的 class（:not() 里的不算）
function classesOf(s) {
  const t = s.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
  return [...t.matchAll(/\.((?:\\[0-9a-fA-F]{1,6}\s?|\\.|[\w-])+)/g)].map((m) =>
    m[1].replace(/\\([0-9a-fA-F]{1,6})\s?/g, (x, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1'));
}
const ROOT = /^(?::root|html|:host|body)(?:\[data-theme=['"](?:compact|default)['"]\])?(?![\w-])/;
function mapSel(sel) {
  const keep = [];
  for (const s of splitSel(sel)) {
    if (/(^|[\s(,>+~:])\.dark(?![\w\\-])/.test(s) || s.includes('.theme-preview') || s.includes('data-theme=\'default\'') && !ROOT.test(s)) continue;
    if (!classesOf(s).every((c) => used.has(c))) continue;
    const m = s.match(ROOT);
    const scoped = m ? '.nr-app' + s.slice(m[0].length) : '.nr-app ' + s;
    if (!keep.includes(scoped)) keep.push(scoped);
  }
  return keep.join(',');
}
// 屏幕宽度的媒体查询：截图时是 1440 宽的桌面，成立返回 true，不成立 false，不是只看宽度的返回 null（原样保留）
const W = 1440;
function mediaHolds(q) {
  if (/prefers-color-scheme:\s*dark|\bprint\b/.test(q)) return false;
  const conds = q.replace(/^@media\s*/, '').split(/\s+and\s+/);
  let all = true;
  for (const c of conds) {
    const m = c.match(/^\((?:(min-width|max-width):\s*|width\s*(>=|<=|<|>)\s*)([\d.]+)(px|rem|em)\)$/);
    if (!m) return null;
    const v = parseFloat(m[3]) * (m[4] === 'px' ? 1 : 16), op = m[1] === 'min-width' ? '>=' : m[1] === 'max-width' ? '<=' : m[2];
    const ok = op === '>=' ? W >= v : op === '>' ? W > v : op === '<=' ? W <= v : W < v;
    all = all && ok;
  }
  return all;
}
// 规则里面嵌套的 @media 也按同样的办法展开或删掉
function inner(nodes) {
  const res = [];
  for (const n of nodes) {
    if (n.at && n.at.startsWith('@media')) {
      const h = mediaHolds(n.at);
      if (h === true) res.push(...inner(n.kids));
      else if (h === null) res.push({ at: n.at, kids: inner(n.kids) });
    } else if (n.kids) res.push({ ...n, kids: inner(n.kids) });
    else res.push(n);
  }
  return res;
}
function scope(nodes) {
  const res = [];
  for (const n of nodes) {
    if (n.decl !== undefined) continue; // @layer a, b; 这类声明
    if (n.at) {
      const name = n.at.match(/^@[\w-]+/)[0];
      if (name === '@layer') res.push(...scope(n.kids));
      else if (name === '@media') {
        const h = mediaHolds(n.at);
        if (h === true) res.push(...scope(n.kids));
        else if (h === null) { const k = scope(n.kids); if (k.length) res.push({ at: n.at, kids: k }); }
      } else if (name === '@supports' || name === '@container') { const k = scope(n.kids); if (k.length) res.push({ at: n.at, kids: k }); }
      else res.push(n); // @keyframes、@property、@font-face：原样，后面按是否用到再筛
      continue;
    }
    const sel = mapSel(n.sel);
    if (sel) res.push({ sel, kids: inner(n.kids) });
  }
  return res;
}
// figs.html 里给截图补的样式（#shot 就是产品界面的容器）
const figsHtml = readFileSync(join(REACH, 'figs.html'), 'utf8');
const extra = figsHtml.slice(figsHtml.indexOf('<style>') + 7, figsHtml.indexOf('</style>'))
  .replace(/^\s*html, body \{[^}]*\}\s*$/m, '').replace(/^\s*body \{[^}]*\}\s*$/m, '').replace(/#shot \{/g, ':root {').replace(/#shot /g, '');
let nodes = scope([...parse(readFileSync(join(REACH, 'product.css'), 'utf8')), ...parse(extra)]);

// 自定义属性、@property、@keyframes 只留用到的。.nr-app 上定义的变量（产品的主题变量）按引用关系往回找
const text = () => str(nodes) + Object.values(out).join('');
const refs = new Set();
const addRefs = (s) => { for (const m of s.matchAll(/var\(\s*(--[\w-]+)/g)) refs.add(m[1]); for (const m of s.matchAll(/\((--[\w-]+)\)/g)) refs.add(m[1]); };
const isTheme = (n) => n.sel === '.nr-app';
addRefs(str(nodes.filter((n) => !isTheme(n))) + Object.values(out).join(''));
for (const n of nodes) if (isTheme(n)) for (const d of n.kids) if (d.decl !== undefined && !d.decl.startsWith('--')) addRefs(d.decl);
for (let grew = true; grew;) {
  grew = false;
  for (const n of nodes) if (isTheme(n)) for (const d of n.kids) {
    const m = d.decl?.match(/^(--[\w-]+)\s*:/);
    if (m && refs.has(m[1])) { const before = refs.size; addRefs(d.decl.slice(m[0].length)); if (refs.size > before) grew = true; }
  }
}
nodes = nodes.map((n) => (isTheme(n) ? { ...n, kids: n.kids.filter((d) => { const m = d.decl?.match(/^(--[\w-]+)\s*:/); return !m || refs.has(m[1]); }) } : n))
  .filter((n) => !n.kids || n.kids.length || n.at);
const all = text();
nodes = nodes.filter((n) => {
  if (!n.at) return true;
  const m = n.at.match(/^@(property|keyframes)\s+([\w-]+)/);
  if (!m) return true;
  return all.split(m[2]).length > 2;
});
const productCss = str(nodes);

// ---------- 3. 写文件 ----------
for (const [name, html] of Object.entries(out)) writeFileSync(join(PAGES, 'snips', name + '.html'), html, 'utf8');
const ui = readFileSync(join(PAGES, 'reach-ui.css'), 'utf8');
const block = `/* REACH-UI */\n${ui}/* NocoReach 产品样式（content/reach/product.css 处理后，只含这些图用到的部分） */\n${productCss}\n/* /REACH-UI */\n`;
const p = join(PAGES, 'solution-reach.body.html');
let s = readFileSync(p, 'utf8'), n = 0;
s = s.replace(/\/\* REACH-UI \*\/\n[\s\S]*?\/\* \/REACH-UI \*\/\n/g, () => (n++, block));
if (!n) {
  if (s.split('</style>\n').length < 2) throw new Error('solution-reach.body.html 开头没有 <style> 块');
  s = s.replace('</style>\n', () => block + '</style>\n');
}
writeFileSync(p, s, 'utf8');
console.log('ok', Object.entries(out).map(([k, v]) => `${k} ${[...v].length}`).join(', '), `· css ${Math.round(productCss.length / 1024)} KB`);
