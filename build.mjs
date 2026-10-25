#!/usr/bin/env node
// Markdown 是正文的唯一来源。运行 node build.mjs 生成本目录文档的独立 HTML 阅读版。
// 版式与官网（html/homepage.html）一致：同一套颜色、字体和图标；Core 一节用深靛蓝，Studio 一节用浅底。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const dependency = [
  join(dir, 'node_modules/marked/lib/marked.esm.js'),
  join(dir, '../V1/node_modules/marked/lib/marked.esm.js'),
  join(dir, '../archive/V1/node_modules/marked/lib/marked.esm.js'),
].find(existsSync);
if (!dependency) throw new Error('需要 marked@4.3.0；可复用 V1/node_modules。');
const { marked } = await import(pathToFileURL(dependency).href);
marked.setOptions({ gfm: true, headerIds: false, mangle: false });

const docs = [
  { name: 'NocoBase 产品定义与标准表述', slug: 'product-definition', lang: 'zh-CN', label: '中文', version: '统一基准', description: 'NocoBase、Core、Studio、Solution 的定义、标准介绍与核心特色，以及为什么需要 NocoBase。' },
  { name: 'NocoBase Product Definition and Messaging', slug: 'product-definition-en', lang: 'en', label: 'English', version: 'Baseline', description: 'The definitions, standard descriptions, and key features of NocoBase, Core, Studio, and Solution, and why NocoBase exists.' },
];
const ui = {
  'zh-CN': { skip: '跳到正文', sections: '章节', copy: '复制', copied: '已复制', print: '打印', problem: '问题', solution: '方案', count: t => `${t.replace(/\s/g, '').length} 字` },
  en: { skip: 'Skip to content', sections: 'Sections', copy: 'Copy', copied: 'Copied', print: 'Print', problem: 'Problem', solution: 'Solution', count: t => `${t.trim().split(/\s+/).length} words · ${t.length} chars` },
};

// 章节：按标题识别，两种语言共用同一个锚点，切换语言时停在同一节
const sectionInfo = [
  { id: 'nocobase', titles: ['NocoBase'], nav: 'NocoBase', band: 'grid', logo: true },
  { id: 'why', titles: ['为什么需要 NocoBase', 'Why NocoBase'] },
  { id: 'core', titles: ['NocoBase Core'], nav: 'Core', band: 'deep', icon: 'blocks' },
  { id: 'studio', titles: ['NocoBase Studio'], nav: 'Studio', band: 'tint', icon: 'users-round' },
  { id: 'solution', titles: ['NocoBase Solution'], nav: 'Solution', icon: 'layout-grid' },
  { id: 'open', titles: ['开源与私有部署', 'Open source and self-hosting'], nav: { en: 'Open source' }, icon: 'code-xml' },
  { id: 'faq', titles: ['FAQ'], icon: 'message-circle-question' },
  { id: 'terms', titles: ['Terminology and style'], nav: { en: 'Terminology' }, icon: 'book-a' },
];
// 核心特色、开源要点的图标，与官网首页同一位置的图标一致
const featureIcons = {
  core: ['blocks', 'layout-template', 'lock-keyhole'],
  studio: ['bot', 'layout-dashboard', 'user-check', 'library'],
  solution: ['zap', 'user-check', 'wrench', 'package-open'],
  open: ['code-xml', 'server', 'shuffle', 'box'],
};
// 三级标题决定内容的版式
const kinds = {
  tagline: ['品牌表达', 'Tagline', '一句话理由', 'In one line'],
  definition: ['定义', 'Definition'],
  description: ['标准介绍', 'Standard description'],
  features: ['核心特色', 'Key features'],
  problems: ['问题与方案', 'Problems and solutions'],
};
const kindOf = title => Object.keys(kinds).find(k => kinds[k].includes(title)) || null;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const inline = md => marked.parseInline(md.trim());
const plain = md => inline(md).replace(/<[^>]+>/g, '')
  .replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);
const icon = name => `<i data-lucide="${name}"></i>`;

// 列表项：粗体标题 + 下一级列表
const itemTitle = item => (item.tokens.find(t => t.type === 'text') || { text: '' }).text;
const itemChildren = item => (item.tokens.find(t => t.type === 'list') || { items: [] }).items;
const quoteText = token => token.tokens.filter(t => t.type === 'paragraph').map(t => t.text).join('\n\n');

function parse(md) {
  const tokens = marked.lexer(md);
  const doc = { title: '', preface: [], revised: '', sections: [] };
  let section = null, group = null;
  for (const t of tokens) {
    if (t.type === 'space') continue;
    if (t.type === 'heading' && t.depth === 1) { doc.title = t.text; continue; }
    if (t.type === 'heading' && t.depth === 2) {
      const info = sectionInfo.find(s => s.titles.includes(t.text)) || { id: `section-${doc.sections.length + 1}` };
      section = { ...info, title: t.text, groups: [] };
      group = { title: null, tokens: [] };
      section.groups.push(group);
      doc.sections.push(section);
      continue;
    }
    if (t.type === 'heading' && t.depth === 3 && section) {
      group = { title: t.text, tokens: [] };
      section.groups.push(group);
      continue;
    }
    if (!section) {
      if (t.type === 'paragraph' && /^(修订日期|Last revised)/.test(t.text)) doc.revised = plain(t.text).replace(/[。.]$/, '');
      else doc.preface.push(t);
      continue;
    }
    group.tokens.push(t);
  }
  return doc;
}

function render(doc, meta) {
  const t = ui[meta.lang];
  const copyBtn = text => `<button type="button" class="cp" data-copy="${esc(text)}" aria-label="${t.copy}">${icon('copy')}<span>${t.copy}</span></button>`;

  // 品牌表达按第一个逗号或句号分成两段，后半段用浅色，和官网的板块标题一样
  const tagline = md => {
    const html = inline(md);
    const m = html.match(/^(.+?[，。]|.+?\. )(.+)$/);
    return m ? `${m[1].trim()}${/[，。]$/.test(m[1]) ? '' : ' '}<span class="m">${m[2]}</span>` : html;
  };

  const specRow = (label, kind, md) => {
    const text = plain(md);
    const body = kind === 'tagline' ? `<p class="v-tag">${tagline(md)}</p>`
      : kind === 'definition' ? `<p class="v-def">${inline(md)}</p>`
      : `<div class="v-desc">${md.split(/\n\n+/).map(p => `<p>${inline(p)}</p>`).join('')}</div>`;
    return `<div class="row ${kind}"><div class="k"><b>${esc(label)}</b><span class="n">${t.count(text)}</span>${copyBtn(text)}</div><div class="v">${body}</div></div>`;
  };

  const features = (sec, list) => {
    const icons = featureIcons[sec.id] || [];
    const items = list.items.map((item, i) => {
      const title = itemTitle(item), desc = itemChildren(item).map(c => c.text).join(' ');
      return `<li><h4>${icons[i] ? icon(icons[i]) : ''}${inline(title)}</h4><p>${inline(desc)}</p>${copyBtn(`${plain(title)}\n${plain(desc)}`)}</li>`;
    }).join('');
    return `<ul class="feat n${list.items.length}">${items}</ul>`;
  };

  const problems = list => `<ol class="probs">${list.items.map((item, i) => {
    const [problem, answer] = itemChildren(item).map(c => c.text);
    const product = /^Studio\b/.test(answer) ? 'studio' : 'core';
    const title = itemTitle(item);
    return `<li><div class="p-h"><span class="no">${String(i + 1).padStart(2, '0')}</span><h4>${inline(title)}</h4></div>
<div class="p-q"><small>${t.problem}</small><p>${inline(problem)}</p></div>
<div class="p-a"><small>${t.solution}<span class="chip ${product}">${icon(product === 'core' ? 'blocks' : 'users-round')}${product === 'core' ? 'Core' : 'Studio'}</span></small><p>${inline(answer)}</p></div>
${copyBtn(`${plain(title)}\n${plain(problem)}\n${plain(answer)}`)}</li>`;
  }).join('')}</ol>`;

  const faq = list => list.items.map(item => {
    const [answerItem] = itemChildren(item);
    const answer = itemTitle(answerItem);
    const rows = itemChildren(answerItem).map(dim => {
      const sides = itemChildren(dim).map(c => {
        const m = c.text.match(/^(.+?)(：|: )([\s\S]+)$/);
        return m ? { who: m[1], text: m[3] } : { who: '', text: c.text };
      });
      const [vc, nb] = sides;
      return `<div class="cmp"><h4>${inline(itemTitle(dim))}</h4><div class="vc"><small>${esc(vc.who)}</small><p>${inline(vc.text)}</p></div><div class="nb"><small>${icon('check')}${esc(nb.who)}</small><p>${inline(nb.text)}</p></div></div>`;
    }).join('');
    return `<div class="faq"><h3 class="q">${inline(itemTitle(item))}</h3><div class="ans"><p>${inline(answer)}</p>${copyBtn(plain(answer))}</div><div class="cmps">${rows}</div></div>`;
  }).join('');

  const generic = (sec, tokens) => tokens.map(tok => {
    if (tok.type === 'blockquote') { const md = quoteText(tok); return `<div class="summary"><p>${inline(md)}</p>${copyBtn(plain(md))}</div>`; }
    if (tok.type === 'list' && sec.id === 'faq') return faq(tok);
    if (tok.type === 'list' && featureIcons[sec.id]) return features(sec, tok);
    if (tok.type === 'paragraph') return `<p class="note">${inline(tok.text)}</p>`;
    if (tok.type === 'table') return `<div class="table-wrap">${marked.parser([tok])}</div>`;
    if (tok.type === 'list') return marked.parser([tok]).replace(/^<ul>/, '<ul class="bullets">');
    return marked.parser([tok]);
  }).join('\n');

  const renderSection = (sec, index) => {
    let html = '', spec = [];
    const flush = () => { if (spec.length) html += `<div class="spec">${spec.join('')}</div>`; spec = []; };
    for (const g of sec.groups) {
      const kind = kindOf(g.title);
      const quote = g.tokens.find(x => x.type === 'blockquote');
      if (['tagline', 'definition', 'description'].includes(kind) && quote) { spec.push(specRow(g.title, kind, quoteText(quote))); continue; }
      flush();
      if (!g.title && !g.tokens.length) continue;
      const list = g.tokens.find(x => x.type === 'list');
      const lead = g.tokens.filter(x => x.type === 'paragraph').map(x => `<p class="note">${inline(x.text)}</p>`).join('');
      if (kind === 'features' && list) html += `<div class="block"><h3 class="sub">${esc(g.title)}</h3>${lead}${features(sec, list)}</div>`;
      else if (kind === 'problems' && list) html += `<div class="block"><h3 class="sub">${esc(g.title)}</h3>${lead}${problems(list)}</div>`;
      else html += `<div class="block">${g.title ? `<h3 class="sub">${esc(g.title)}</h3>` : ''}${generic(sec, g.tokens)}</div>`;
    }
    flush();
    const mark = sec.logo ? `<img class="mark-logo" src="https://static-docs.nocobase.com/logo-nocobase.png" alt="">` : sec.icon ? `<span class="mark">${icon(sec.icon)}</span>` : '';
    const name = sec.logo ? `<span class="vh">${esc(sec.title)}</span>` : esc(sec.title);
    return `<section class="sec${sec.band ? ` band-${sec.band}` : ''}" id="${sec.id}">
<div class="container">
<div class="sec-h"><span class="no">${String(index + 1).padStart(2, '0')}</span><h2>${mark}${name}</h2></div>
${html}
</div>
</section>`;
  };

  const other = docs.find(d => d !== meta);
  const navLabel = s => typeof s.nav === 'object' ? s.nav[meta.lang] || s.title : s.nav || s.title;
  const nav = doc.sections.map(s => `<a href="#${s.id}" data-id="${s.id}">${esc(navLabel(s))}</a>`).join('');
  const langs = docs.map(d => d === meta ? `<span aria-current="true">${d.label}</span>` : `<a href="${d.slug}.html" class="lang-link">${d.label}</a>`).join('');
  const preface = doc.preface.map(tok => tok.type === 'paragraph' ? `<p>${inline(tok.text)}</p>` : marked.parser([tok])).join('');

  return `<!doctype html>
<html lang="${meta.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(meta.description)}">
<title>${esc(doc.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&display=swap">
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<style>${readFileSync(join(dir, 'document.css'), 'utf8')}</style>
</head>
<body>
<a class="skip-link" href="#content">${t.skip}</a>
<header class="bar">
<div class="container in">
<a class="logo" href="#top" aria-label="NocoBase"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"></a>
<nav class="toc" aria-label="${t.sections}">${nav}</nav>
<div class="tools">
<div class="langs">${langs}</div>
<a class="tool" href="${encodeURIComponent(meta.name)}.md" title="Markdown">${icon('file-text')}<span>Markdown</span></a>
<button class="tool" type="button" onclick="window.print()" title="${t.print}">${icon('printer')}<span>${t.print}</span></button>
</div>
</div>
</header>
<main id="content">
<header class="dochead" id="top">
<div class="container">
<p class="label"><b>NocoBase 3</b><i></i>${esc(meta.version)}</p>
<h1>${esc(doc.title)}</h1>
<div class="preface">${preface}</div>
${doc.revised ? `<p class="revised">${icon('calendar')}${esc(doc.revised)}</p>` : ''}
</div>
</header>
${doc.sections.map(renderSection).join('\n')}
</main>
<footer>
<div class="container"><img src="https://static-docs.nocobase.com/logo-nocobase.png" alt="NocoBase" width="150" height="22"><span>${esc(doc.title)} · ${esc(meta.version)}${doc.revised ? ` · ${esc(doc.revised)}` : ''}</span><a href="${other.slug}.html" class="lang-link">${other.label}</a></div>
</footer>
<script>
(function () {
  if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  var done = ${JSON.stringify(t.copied)};
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); return ok;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.cp');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var show = function () {
      var label = b.querySelector('span'), old = label.textContent;
      b.classList.add('ok'); label.textContent = done;
      setTimeout(function () { b.classList.remove('ok'); label.textContent = old; }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(show, function () { if (fallback(text)) show(); });
    else if (fallback(text)) show();
  });
  // 切换语言时停在同一节
  document.querySelectorAll('.lang-link').forEach(function (a) {
    a.addEventListener('click', function () { if (location.hash) a.href = a.href.split('#')[0] + location.hash; });
  });
  // 当前章节高亮，并把它滚到导航条可见处
  var toc = document.querySelector('.toc'), links = {};
  toc.querySelectorAll('a').forEach(function (a) { links[a.dataset.id] = a; });
  var current = null;
  function mark(id) {
    if (id === current) return; current = id;
    Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === id); });
    var a = links[id];
    if (a) toc.scrollTo({ left: a.offsetLeft - toc.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
  }
  var secs = [].slice.call(document.querySelectorAll('.sec'));
  function spy() {
    var y = window.scrollY + 140, id = null;
    secs.forEach(function (s) { if (s.offsetTop <= y) id = s.id; });
    mark(id);
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();
})();
</script>
</body>
</html>`;
}

for (const meta of docs) {
  const doc = parse(readFileSync(join(dir, `${meta.name}.md`), 'utf8'));
  writeFileSync(join(dir, `${meta.slug}.html`), render(doc, meta));
  console.log(`已生成 ${meta.slug}.html（${doc.sections.length} 节）`);
}
