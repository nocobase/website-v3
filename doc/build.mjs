#!/usr/bin/env node
// 生成 Studio 文档和文档方案的 HTML。Markdown 是正文的唯一来源：
//   src/**/*.md   → site/**/*.html（发布用的文档站，资源在 site/assets/）
//   方案/*.md     → 方案/*.html（团队内部的文档方案）
// 页面就是普通的文档站：顶栏，左侧菜单，右侧正文。
// 运行：node doc/build.mjs（需要 marked@4.3.0，复用上一级目录的 node_modules）。
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const dir = dirname(fileURLToPath(import.meta.url));
const dependency = [join(dir, 'node_modules/marked/lib/marked.esm.js'), join(dir, '../node_modules/marked/lib/marked.esm.js')].find(existsSync);
if (!dependency) throw new Error('需要 marked@4.3.0：在 doc/ 或上一级目录执行 npm install marked@4.3.0。');
const { marked } = await import(pathToFileURL(dependency).href);

const DATE = '2026-10-22';
const LUCIDE = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
// 样式表和脚本的地址带上内容的版本号，改了样式后浏览器不会继续用缓存里的旧文件
const VERSION = createHash('sha1').update(readFileSync(join(dir, 'assets/docs.css'))).update(readFileSync(join(dir, 'assets/docs.js'))).digest('hex').slice(0, 8);
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- 左侧菜单：完整的 Studio 文档。front matter 写了 status 的是待编写或模块开发中的占位页 ----------
   顺序：先入门和日常使用；后面的功能分组与 Studio 侧边栏一致（开发 → 质量 → 发布 → Agent 团队 → 设置）；最后是参考。 */
const SITE_NAV = [
  { items: ['index'] },
  { title: '入门', items: ['intro/what-is-studio', 'intro/how-a-request-gets-done', 'intro/concepts', 'intro/interface-tour', 'quickstart'] },
  {
    title: '日常使用',
    items: [
      'daily/my-tasks', 'daily/sessions', 'daily/raise-a-request', 'daily/follow-progress', 'daily/answer-questions',
      'daily/accept', 'daily/knowledge', 'daily/inbox', 'daily/cli',
    ],
  },
  { title: '项目与代码', items: ['projects/create-project', 'projects/project-settings', 'projects/repos-and-prs', 'projects/ci-checks', 'projects/skills', 'projects/knowledge-admin'] },
  { title: '质量管理', items: ['quality/test-plans', 'quality/features-and-cases', 'quality/reports'] },
  { title: '发布与部署', items: ['release/previews', 'release/apps-and-environments', 'release/approval-and-rollback'] },
  { title: 'Agent 团队', items: ['agents/runtimes', 'agents/agents', 'agents/coordinator', 'agents/usage'] },
  { title: '系统管理', items: ['admin/deploy', 'admin/members-and-roles', 'admin/git', 'admin/api-keys', 'admin/notifications', 'admin/upgrade-and-backup'] },
  { title: '参考', items: ['reference/statuses-and-permissions', 'reference/glossary', 'reference/config', 'reference/cli', 'reference/faq'] },
];

const PLAN_DOCS = ['01-现有文档的问题', '02-文档结构与写作原则', '03-命名方案', '04-写作规范与术语', '05-进度与待确认事项'];

/* ---------- Markdown 渲染 ---------- */
function frontMatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match) return { meta: {}, body: source };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: source.slice(match[0].length) };
}

const slugOf = (text) => text.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, '').trim().toLowerCase()
  .replace(/[\s/]+/g, '-').replace(/[^\p{L}\p{N}\-]/gu, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'section';

const CALLOUTS = { TIP: ['tip', '提示'], NOTE: ['note', '说明'], WARNING: ['warning', '注意'], PENDING: ['pending', '待补充'] };

// 局部配图：正文里单独一行写 `::figure 名称[+名称] [附加类名] | 说明`，内容取自 src/figures/名称.html。
function withFigures(markdown) {
  const figures = [];
  const source = markdown.replace(/^::figure[ \t]+([\w+-]+)((?:[ \t]+[\w-]+)*)[ \t]*(?:\|[ \t]*(.*))?$/gm, (_, names, classes, caption) => {
    const parts = names.split('+').map((name) => {
      const file = join(dir, 'src/figures', `${name}.html`);
      if (!existsSync(file)) throw new Error(`缺少配图 src/figures/${name}.html`);
      return readFileSync(file, 'utf8').trim();
    });
    figures.push(`<figure class="fig${classes.replace(/\s+/g, ' ')}">${parts.join('')}${caption ? `<figcaption>${marked.parseInline(caption)}</figcaption>` : ''}</figure>`);
    return `\n<div data-figure="${figures.length - 1}"></div>\n`;
  });
  return { source, figures };
}

function render(markdown) {
  const { source, figures } = withFigures(markdown);
  const used = new Map();
  const headings = [];
  const renderer = {
    heading(text, level) {
      let id = slugOf(text);
      const n = used.get(id) ?? 0;
      used.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;
      if (level === 2) headings.push({ id, text: text.replace(/<[^>]+>/g, '') });
      return `<h${level} id="${escape(id)}">${text}</h${level}>\n`;
    },
    code(code, info) {
      const lang = (info || '').trim().split(/\s+/)[0];
      const wrap = ['text', 'prompt'].includes(lang) ? ' wrap' : '';
      return `<div class="code-block${wrap}"><button type="button" class="copy-button">复制</button><pre><code>${escape(code)}</code></pre></div>\n`;
    },
    blockquote(quote) {
      const m = /^<p>\[!(TIP|NOTE|WARNING|PENDING)\][ \t]*([^\n<]*)\n?/.exec(quote);
      if (!m) return `<blockquote>\n${quote}</blockquote>\n`;
      const [kind, fallback] = CALLOUTS[m[1]];
      const rest = quote.slice(m[0].length).replace(/^<\/p>\n?/, '');
      const body = rest.trim() ? (rest.startsWith('<') ? rest : `<p>${rest}`) : '';
      return `<div class="note ${kind}"><strong>${m[2].trim() || fallback}</strong>${body}</div>\n`;
    },
    table(header, body) {
      return `<div class="table-wrap"><table>\n<thead>\n${header}</thead>\n<tbody>${body}</tbody></table></div>\n`;
    },
    image(href, title, text) {
      return `<figure class="fig"><img src="${escape(href)}" alt="${escape(text)}" loading="lazy"><figcaption>${text}</figcaption></figure>`;
    },
    link(href, title, text) {
      let target = href || '';
      if (!/^[a-z]+:/i.test(target)) target = target.replace(/\.md(#|$)/, '.html$1');
      const external = /^https?:/i.test(target) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ''}${external}>${text}</a>`;
    },
  };
  const instance = Object.assign(new marked.Renderer(), renderer);
  const html = marked.parse(source, { gfm: true, headerIds: false, mangle: false, renderer: instance })
    .replace(/<p>(<figure[\s\S]*?<\/figure>)<\/p>/g, '$1')
    .replace(/<div data-figure="(\d+)"><\/div>/g, (_, i) => figures[Number(i)])
    .replace(/<p><strong>完成的标志<\/strong>：/g, '<p class="done"><strong>完成的标志</strong>');
  return { html, headings };
}

/* ---------- 页面外壳 ---------- */
function shell({ title, description, crumb, body, toc, menu, pager, base, home, footerLinks }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} - NocoBase Studio 文档</title>
<meta name="description" content="${escape(description || title)}">
<link rel="icon" href="https://www.nocobase.com/images/favicon/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${base}assets/docs.css?v=${VERSION}">
</head>
<body>
<a class="skip-link" href="#content">跳到正文</a>
<header class="topbar">
<a class="brand" href="${home}"><img class="brand-logo" src="${base}assets/logo.png" alt="NocoBase"><span class="version">3</span><span class="doc-label">Studio 文档</span></a>
<nav class="toplinks" aria-label="站点链接"><a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub ↗</a><a href="https://www.nocobase.com/cn/" target="_blank" rel="noopener">官网 ↗</a></nav>
</header>
<div class="layout">
<aside class="sidebar"><details class="menu" open><summary>目录</summary><nav aria-label="文档目录">${menu}</nav></details></aside>
<main id="content" class="content">
${crumb ? `<p class="crumb">${escape(crumb)}</p>` : ''}<h1>${escape(title)}</h1>
${description ? `<p class="lead">${escape(description)}</p>` : ''}
<article class="prose">
${body}
</article>
${pager}
<footer class="page-foot"><span>NocoBase Studio 文档 · 草稿 ${DATE}</span><span>${footerLinks}</span></footer>
</main>
<aside class="toc" aria-label="本页内容">${toc}</aside>
</div>
<script src="${LUCIDE}"></script>
<script src="${base}assets/docs.js?v=${VERSION}"></script>
</body>
</html>
`;
}

const menuOf = (groups, current) => groups.map((group) => `<div class="menu-group">${group.title ? `<p class="menu-title">${escape(group.title)}</p>` : ''}<ul>${group.items.map((x) =>
  `<li><a href="${x.href}"${x.todo ? ' class="todo"' : ''}${x.key === current ? ' aria-current="page"' : ''}>${escape(x.label)}</a></li>`).join('')}</ul></div>`).join('');

// 右侧的本页目录：列出二级标题
const tocOf = (headings) => headings.length < 2 ? '' :
  `<p class="toc-title">本页内容</p><ul>${headings.map((h) => `<li><a href="#${encodeURIComponent(h.id)}">${escape(h.text)}</a></li>`).join('')}</ul>`;

const pagerOf = (prev, next) => `<nav class="pager" aria-label="翻页">${prev ? `<a class="prev" href="${prev.href}"><small>上一页</small>${escape(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${next.href}"><small>下一页</small>${escape(next.title)}</a>` : ''}</nav>`;

/* ---------- 文档站 ---------- */
const srcDir = join(dir, 'src');
const siteDir = join(dir, 'site');
const pages = new Map();
for (const group of SITE_NAV) {
  for (const page of group.items) {
    const file = join(srcDir, `${page}.md`);
    if (!existsSync(file)) throw new Error(`缺少 ${relative(dir, file)}`);
    const { meta, body } = frontMatter(readFileSync(file, 'utf8'));
    pages.set(page, { meta, body, group: group.title });
  }
}
// 上一页 / 下一页只在已经写好的页面之间跳
const order = [...pages.keys()].filter((p) => !pages.get(p).meta.status);

mkdirSync(join(siteDir, 'assets'), { recursive: true });
cpSync(join(dir, 'assets'), join(siteDir, 'assets'), { recursive: true });
if (existsSync(join(srcDir, 'images'))) cpSync(join(srcDir, 'images'), join(siteDir, 'images'), { recursive: true });

for (const [page, info] of pages) {
  const base = '../'.repeat(page.split('/').length - 1);
  const hrefOf = (p) => `${base}${p}.html`;
  const menu = menuOf(SITE_NAV.map((g) => ({ title: g.title, items: g.items.map((p) => ({ key: p, href: hrefOf(p), label: pages.get(p).meta.nav || pages.get(p).meta.title, todo: Boolean(pages.get(p).meta.status) })) })), page);
  const i = order.indexOf(page);
  const link = (p) => p && { href: hrefOf(p), title: pages.get(p).meta.title };
  const pager = i < 0 ? '' : pagerOf(link(order[i - 1]), link(order[i + 1]));
  const out = join(siteDir, `${page}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, shell({
    title: info.meta.title,
    description: info.meta.description,
    crumb: info.group,
    ...(() => { const r = render(info.body); return { body: r.html.replaceAll('{{base}}', base), toc: tocOf(r.headings) }; })(),
    menu,
    pager,
    base,
    home: `${base}index.html`,
    footerLinks: `<a href="${base}../方案/01-现有文档的问题.html">文档方案</a>`,
  }));
}
console.log(`文档站：已生成 ${pages.size} 页 → ${relative(process.cwd(), siteDir)}/`);

/* ---------- 文档方案 ---------- */
const planDir = join(dir, '方案');
const plans = PLAN_DOCS.map((name) => {
  const { meta, body } = frontMatter(readFileSync(join(planDir, `${name}.md`), 'utf8'));
  return { name, meta, body };
});
const planMenu = (current) => menuOf([
  { title: 'Studio 文档方案', items: plans.map((p) => ({ key: p.name, href: `${encodeURI(p.name)}.html`, label: p.meta.title })) },
  { title: '文档草稿', items: [{ key: 'site', href: '../site/index.html', label: '打开文档站' }] },
], current);
for (const [i, plan] of plans.entries()) {
  const link = (p) => p && { href: `${encodeURI(p.name)}.html`, title: p.meta.title };
  writeFileSync(join(planDir, `${plan.name}.html`), shell({
    title: plan.meta.title,
    description: plan.meta.description,
    crumb: 'Studio 文档方案',
    ...(() => { const r = render(plan.body); return { body: r.html.replaceAll('{{base}}', '../site/'), toc: tocOf(r.headings) }; })(),
    menu: planMenu(plan.name),
    pager: pagerOf(link(plans[i - 1]), link(plans[i + 1])),
    base: '../site/',
    home: '../site/index.html',
    footerLinks: '<a href="../site/index.html">文档站</a>',
  }));
}
console.log(`文档方案：已生成 ${plans.length} 篇 → ${relative(process.cwd(), planDir)}/`);
