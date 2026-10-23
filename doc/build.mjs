#!/usr/bin/env node
// 生成 NocoBase 3 文档站和文档方案的 HTML。Markdown 是正文的唯一来源：
//   src/**/*.md   → site/**/*.html（发布用的文档站，资源在 site/assets/；每次构建先清空 site/）
//   方案/*.md     → 方案/*.html（团队内部的文档方案）
// 文档站分三部分：开始（src/index.md、src/start/）、Core（src/core/）、Studio（src/studio/），顶栏切换，
// 左侧菜单只列当前部分。页面就是普通的文档站：顶栏，左侧菜单，右侧正文。
// 运行：node doc/build.mjs（需要 marked@4.3.0，复用上一级目录的 node_modules）。
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const dir = dirname(fileURLToPath(import.meta.url));
const dependency = [join(dir, 'node_modules/marked/lib/marked.esm.js'), join(dir, '../node_modules/marked/lib/marked.esm.js')].find(existsSync);
if (!dependency) throw new Error('需要 marked@4.3.0：在 doc/ 或上一级目录执行 npm install marked@4.3.0。');
const { marked } = await import(pathToFileURL(dependency).href);

const DATE = '2026-10-23';
const LUCIDE = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
// 样式表和脚本的地址带上内容的版本号，改了样式后浏览器不会继续用缓存里的旧文件
const VERSION = createHash('sha1').update(readFileSync(join(dir, 'assets/docs.css'))).update(readFileSync(join(dir, 'assets/docs.js'))).digest('hex').slice(0, 8);
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- 左侧菜单。front matter 写了 status 的是待编写或模块开发中的占位页 ----------
   每一部分的页面路径相对于 dir（src/ 下的目录）；菜单里的 { heading } 是分组内的小标题，不是页面。 */
const SECTIONS = [
  {
    key: 'start',
    title: '开始',
    dir: '',
    nav: [
      { items: ['index'] },
      { title: '开始', items: ['start/what-is-nocobase', 'start/editions', 'start/from-v2', 'start/glossary'] },
    ],
  },
  {
    key: 'core',
    title: 'Core',
    dir: 'core/',
    /* 顺序：先入门和开发应用，这是开发者都会读的；能力按「应用底座」页的 13 类排列；插件目录按能力分类排列；
       然后是部署与运维、扩展开发；最后是参考。 */
    nav: [
      { items: ['index'] },
      { title: '入门', items: ['intro/what-is-core', 'intro/how-an-app-gets-built', 'intro/concepts', 'intro/how-plugins-work', 'quickstart'] },
      {
        title: '开发应用',
        items: [
          'develop/working-with-agents', 'develop/app-structure', 'develop/plugins', 'develop/pages-and-ui-library',
          'develop/data-and-migrations', 'develop/api', 'develop/system-settings', 'develop/testing-and-acceptance', 'develop/upgrade',
        ],
      },
      {
        title: '能力',
        items: [
          'capabilities/index', 'capabilities/data', 'capabilities/files', 'capabilities/users', 'capabilities/permissions',
          'capabilities/workflows', 'capabilities/ai-agents', 'capabilities/knowledge', 'capabilities/mail', 'capabilities/notifications',
          'capabilities/integrations', 'capabilities/interface', 'capabilities/audit', 'capabilities/operations',
        ],
      },
      {
        title: '插件目录',
        items: [
          'plugins/index',
          { heading: '用户与权限' }, 'plugins/authentication', 'plugins/users', 'plugins/api-keys', 'plugins/authorization',
          'plugins/authz-default-access', 'plugins/authz-sharing-rules', 'plugins/authz-restriction-rules',
          { heading: '数据与文件' }, 'plugins/db', 'plugins/database-explorer', 'plugins/file', 'plugins/template-print',
          { heading: '流程' }, 'plugins/lifecycle', 'plugins/scheduler', 'plugins/approval', 'plugins/task-center',
          { heading: '消息' }, 'plugins/notification', 'plugins/notification-in-app', 'plugins/notification-providers',
          'plugins/notification-web-push', 'plugins/mail',
          { heading: 'AI 与 Agent' }, 'plugins/agents', 'plugins/agent-sessions', 'plugins/knowledge',
          { heading: '界面与运维' }, 'plugins/i18n', 'plugins/foundation',
          { heading: '研发协作' }, 'plugins/projects', 'plugins/releases',
          { heading: '基础库与工具' }, 'plugins/libraries', 'plugins/ui-library', 'plugins/tools',
        ],
      },
      {
        title: '部署与运维',
        items: [
          'operations/deployment', 'operations/config', 'operations/database', 'operations/storage', 'operations/jobs-and-scaling',
          'operations/upgrade-and-rollback', 'operations/backup', 'operations/logs-and-health', 'operations/security',
        ],
      },
      { title: '扩展开发', items: ['extend/when-to-write-a-plugin', 'extend/create-plugin', 'extend/plugin-structure', 'extend/publish', 'extend/skills', 'extend/ui-library'] },
      { title: '参考', items: ['reference/cli', 'reference/config', 'reference/http-api', 'reference/packages', 'reference/faq'] },
    ],
  },
  {
    key: 'studio',
    title: 'Studio',
    dir: 'studio/',
    /* 顺序：先入门、安装与上手和日常使用；后面的功能分组与 Studio 侧边栏一致（开发 → 质量 → 发布 → Agent 团队 → 设置）；最后是参考。 */
    nav: [
      { items: ['index'] },
      { title: '入门', items: ['intro/what-is-studio', 'intro/how-a-request-gets-done', 'intro/concepts', 'intro/interface-tour'] },
      { title: '安装与上手', items: ['install', 'quickstart'] },
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
      { title: '系统管理', items: ['admin/members-and-roles', 'admin/git', 'admin/api-keys', 'admin/notifications', 'admin/upgrade-and-backup'] },
      { title: '参考', items: ['reference/statuses-and-permissions', 'reference/glossary', 'reference/config', 'reference/cli', 'reference/faq'] },
    ],
  },
];

/* 文档方案按菜单分组；上一篇 / 下一篇按这里的顺序 */
const PLAN_GROUPS = [
  { title: 'Core 与统一文档站', items: ['06-读者与需求', '07-Core文档的问题', '08-Core文档结构与写作原则', '09-统一文档站', '10-Core进度与待确认事项'] },
  { title: 'Studio 文档', items: ['01-现有文档的问题', '02-文档结构与写作原则', '03-命名方案', '04-写作规范与术语', '05-进度与待确认事项'] },
];

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
function shell({ title, description, crumb, body, toc, menu, pager, base, home, footerLinks, tabs = '' }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} - NocoBase 3 文档</title>
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
<a class="brand" href="${home}"><img class="brand-logo" src="${base}assets/logo.png" alt="NocoBase"><span class="version">3</span><span class="doc-label">文档</span></a>
${tabs ? `<nav class="sections" aria-label="文档分区">${tabs}</nav>` : ''}
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
<footer class="page-foot"><span>NocoBase 3 文档 · 草稿 ${DATE}</span><span>${footerLinks}</span></footer>
</main>
<aside class="toc" aria-label="本页内容">${toc}</aside>
</div>
<script src="${LUCIDE}"></script>
<script src="${base}assets/docs.js?v=${VERSION}"></script>
</body>
</html>
`;
}

const menuOf = (groups, current) => groups.map((group) => `<div class="menu-group">${group.title ? `<p class="menu-title">${escape(group.title)}</p>` : ''}<ul>${group.items.map((x) => x.heading
  ? `<li class="menu-sub">${escape(x.heading)}</li>`
  : `<li><a href="${x.href}"${x.todo ? ' class="todo"' : ''}${x.key === current ? ' aria-current="page"' : ''}>${escape(x.label)}</a></li>`).join('')}</ul></div>`).join('');

// 右侧的本页目录：列出二级标题
const tocOf = (headings) => headings.length < 2 ? '' :
  `<p class="toc-title">本页内容</p><ul>${headings.map((h) => `<li><a href="#${encodeURIComponent(h.id)}">${escape(h.text)}</a></li>`).join('')}</ul>`;

const pagerOf = (prev, next) => `<nav class="pager" aria-label="翻页">${prev ? `<a class="prev" href="${prev.href}"><small>上一页</small>${escape(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${next.href}"><small>下一页</small>${escape(next.title)}</a>` : ''}</nav>`;

/* ---------- 文档站 ---------- */
const srcDir = join(dir, 'src');
const siteDir = join(dir, 'site');
// 页面的键是它在 src/ 下的路径（不带 .md），也是它在 site/ 下的路径
const pages = new Map();
for (const section of SECTIONS) {
  section.groups = section.nav.map((group) => ({
    title: group.title,
    items: group.items.map((item) => (typeof item === 'string' ? `${section.dir}${item}` : item)),
  }));
  for (const group of section.groups) {
    for (const page of group.items) {
      if (typeof page !== 'string') continue;
      const file = join(srcDir, `${page}.md`);
      if (!existsSync(file)) throw new Error(`缺少 ${relative(dir, file)}`);
      const { meta, body } = frontMatter(readFileSync(file, 'utf8'));
      pages.set(page, { meta, body, group: group.title, section });
    }
  }
  // 上一页 / 下一页只在同一部分里、已经写好的页面之间跳
  section.order = section.groups.flatMap((g) => g.items).filter((p) => typeof p === 'string' && !pages.get(p).meta.status);
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(join(siteDir, 'assets'), { recursive: true });
cpSync(join(dir, 'assets'), join(siteDir, 'assets'), { recursive: true });
if (existsSync(join(srcDir, 'images'))) cpSync(join(srcDir, 'images'), join(siteDir, 'images'), { recursive: true });

for (const [page, info] of pages) {
  const { section } = info;
  const base = '../'.repeat(page.split('/').length - 1);
  const hrefOf = (p) => `${base}${p}.html`;
  const menu = menuOf(section.groups.map((g) => ({
    title: g.title,
    items: g.items.map((p) => (typeof p === 'string'
      ? { key: p, href: hrefOf(p), label: pages.get(p).meta.nav || pages.get(p).meta.title, todo: Boolean(pages.get(p).meta.status) }
      : p)),
  })), page);
  const tabs = SECTIONS.map((s) => `<a href="${hrefOf(`${s.dir}index`)}"${s === section ? ' aria-current="true"' : ''}>${escape(s.title)}</a>`).join('');
  const i = section.order.indexOf(page);
  const link = (p) => p && { href: hrefOf(p), title: pages.get(p).meta.title };
  const pager = i < 0 ? '' : pagerOf(link(section.order[i - 1]), link(section.order[i + 1]));
  const out = join(siteDir, `${page}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, shell({
    title: info.meta.title,
    description: info.meta.description,
    crumb: [section.key === 'start' ? '' : section.title, info.group].filter(Boolean).join(' · '),
    ...(() => { const r = render(info.body); return { body: r.html.replaceAll('{{base}}', base), toc: tocOf(r.headings) }; })(),
    menu,
    tabs,
    pager,
    base,
    home: `${base}index.html`,
    footerLinks: `<a href="${base}../方案/${encodeURI(PLAN_GROUPS[0].items[0])}.html">文档方案</a>`,
  }));
}
console.log(`文档站：已生成 ${pages.size} 页 → ${relative(process.cwd(), siteDir)}/`);

/* ---------- 文档方案 ---------- */
const planDir = join(dir, '方案');
const plans = PLAN_GROUPS.flatMap((group) => group.items.map((name) => {
  const { meta, body } = frontMatter(readFileSync(join(planDir, `${name}.md`), 'utf8'));
  return { name, meta, body, group: group.title };
}));
const planHref = (name) => `${encodeURI(name)}.html`;
const planMenu = (current) => menuOf([
  ...PLAN_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map((name) => ({ key: name, href: planHref(name), label: plans.find((p) => p.name === name).meta.title })),
  })),
  { title: '文档草稿', items: [{ key: 'site', href: '../site/index.html', label: '打开文档站' }] },
], current);
for (const [i, plan] of plans.entries()) {
  const link = (p) => p && { href: planHref(p.name), title: p.meta.title };
  writeFileSync(join(planDir, `${plan.name}.html`), shell({
    title: plan.meta.title,
    description: plan.meta.description,
    crumb: `文档方案 · ${plan.group}`,
    ...(() => { const r = render(plan.body); return { body: r.html.replaceAll('{{base}}', '../site/'), toc: tocOf(r.headings) }; })(),
    menu: planMenu(plan.name),
    pager: pagerOf(link(plans[i - 1]), link(plans[i + 1])),
    base: '../site/',
    home: '../site/index.html',
    footerLinks: '<a href="../site/index.html">文档站</a>',
  }));
}
console.log(`文档方案：已生成 ${plans.length} 篇 → ${relative(process.cwd(), planDir)}/`);
