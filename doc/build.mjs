#!/usr/bin/env node
// 生成 NocoBase 3 文档站的 HTML。Markdown 是正文的唯一来源：
//   src/**/*.md         → dist/**（英文，站点根路径；src/zh-CN/ 除外）
//   src/zh-CN/**/*.md   → dist/zh-CN/**（简体中文）
// 两种语言的目录结构完全相同，页面的键就是它相对语言根目录的路径（不带 .md）。产物沿用 CDN 回源规则的约定：每页输出成
// `<路径>/index.html`，地址不带扩展名、以 / 结尾，所有站内链接和资源都用根路径；根目录还有 404.html、
// sitemap.xml、robots.txt、llms.txt，以及每页去掉 front matter 的 .md 副本。
// 文档站分三部分：开始（index.md、start/）、Core（core/）、Studio（studio/），顶栏切换，左侧菜单只列当前部分。
// 运行：node doc/build.mjs（需要 marked@4.3.0，先在 doc/ 执行 npm ci）。站点域名读 DOCS_SITE_ORIGIN，默认
// https://docs.nocobase.com；输出目录读 DOCS_OUT_DIR，默认 doc/dist。本地预览：node doc/serve.mjs。
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import hljs from 'highlight.js';
import { assertNoV2RedirectConflicts } from './scripts/check-v2-redirect-prefixes.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const dependency = [join(dir, 'node_modules/marked/lib/marked.esm.js'), join(dir, '../node_modules/marked/lib/marked.esm.js')].find(existsSync);
if (!dependency) throw new Error('需要 marked@4.3.0：在 doc/ 执行 npm ci。');
const { marked } = await import(pathToFileURL(dependency).href);

const DATE = '2026-10-24';
const LUCIDE = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
// 样式表和脚本的地址带上内容的版本号，改了样式后浏览器不会继续用缓存里的旧文件
const VERSION = createHash('sha1').update(readFileSync(join(dir, 'assets/docs.css'))).update(readFileSync(join(dir, 'assets/docs.js'))).digest('hex').slice(0, 8);
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// 站点域名只能是 origin：带路径、查询串或片段都报错，避免 canonical、sitemap 拼出错误的地址
function siteOrigin(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error(`DOCS_SITE_ORIGIN 只能是 https://域名 这样的 origin，收到的是 ${value}`);
  }
  return url.origin;
}
const SITE_ORIGIN = siteOrigin(process.env.DOCS_SITE_ORIGIN || 'https://docs.nocobase.com');
const outDir = resolve(process.env.DOCS_OUT_DIR || join(dir, 'dist'));

/* ---------- 语言。英文在站点根路径，其他语言在 /<语言>/ 下 ---------- */
const LANGS = [
  {
    code: 'en',
    prefix: '',
    src: join(dir, 'src'),
    figures: 'en',
    label: 'English',
    ui: {
      site: 'NocoBase 3 Docs', docs: 'Docs', skip: 'Skip to content', sections: 'Documentation sections', links: 'Site links', menu: 'Contents',
      menuLabel: 'Documentation menu', toc: 'On this page', pager: 'Pages', prev: 'Previous', next: 'Next', draft: 'Draft', website: 'Website',
      websiteUrl: 'https://www.nocobase.com/', copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed', switchTo: 'Language',
      codeLabels: { text: 'Plain text', tree: 'Directory tree', prompt: 'Prompt' },
      callouts: { TIP: 'Tip', NOTE: 'Note', WARNING: 'Warning', PENDING: 'To be written' },
      notFound: ['Page not found', 'The page you are looking for does not exist or has moved.', 'Back to the documentation home'],
      untranslated: (href) => `This page has not been written in English yet. Read the <a href="${href}">Simplified Chinese version</a>.`,
      unwritten: 'This page has not been written yet.',
    },
  },
  {
    code: 'zh-CN',
    prefix: 'zh-CN/',
    src: join(dir, 'src/zh-CN'),
    label: '简体中文',
    ui: {
      site: 'NocoBase 3 文档', docs: '文档', skip: '跳到正文', sections: '文档分区', links: '站点链接', menu: '目录', menuLabel: '文档目录',
      toc: '本页内容', pager: '翻页', prev: '上一页', next: '下一页', draft: '草稿', website: '官网', websiteUrl: 'https://www.nocobase.com/zh-CN/',
      copy: '复制', copied: '已复制', copyFailed: '复制失败', switchTo: '语言',
      codeLabels: { text: '纯文本', tree: '目录结构', prompt: '提示词' },
      callouts: { TIP: '提示', NOTE: '说明', WARNING: '注意', PENDING: '待补充' },
      notFound: ['页面不存在', '你要找的页面不存在，或者已经移动到别的地址。', '回到文档首页'],
    },
  },
];
const DEFAULT_LANG = LANGS[0];

/* ---------- 左侧菜单。front matter 写了 status 的是待编写或模块开发中的占位页 ----------
   每一部分的页面路径相对于 dir（语言根目录下的目录）；菜单里的 { heading } 是分组内的小标题，不是页面。
   标题写成 [英文, 中文]。 */
const SECTIONS = [
  {
    key: 'start',
    title: ['Start', '开始'],
    dir: '',
    nav: [
      { items: ['index'] },
      { title: ['Start', '开始'], items: ['start/what-is-nocobase', 'start/from-v2', 'start/glossary'] },
    ],
  },
  {
    key: 'core',
    title: ['Core', 'Core'],
    dir: 'core/',
    // Core follows app-docs; planned entries do not create placeholder pages.
    nav: [
      { items: ['index'] },
      {
        title: ['Getting started', '开始使用'],
        items: [
          'getting-started/what-is-core',
          'getting-started/create-app',
          'getting-started/project-structure',
          'tutorials/build-your-first-feature',
        ],
      },
      {
        title: ['Developing apps', '开发应用'],
        items: [
          'developing-apps/overview',
          'developing-apps/develop-with-an-agent',
          'developing-apps/data-models-and-migrations',
          'developing-apps/querying-data',
          'developing-apps/apis-and-services',
          'developing-apps/pages-routes-and-navigation',
          'developing-apps/pages-and-interactions',
          'developing-apps/configuration-and-settings',
          'developing-apps/localization-and-themes',
          'developing-apps/manage-plugins',
          'developing-apps/testing-and-acceptance',
        ],
      },
      {
        title: ['Developing plugins', '开发插件'],
        items: [
          'extension-development/when-to-write-a-plugin',
          'extension-development/create-plugin',
          'extension-development/plugin-structure',
          'extension-development/write-your-first-plugin',
          'extension-development/pages-and-menus',
          'extension-development/frontend-components',
          'extension-development/server-apis',
          'extension-development/service-provider',
          'extension-development/database-and-migrations',
          'extension-development/localization',
          'extension-development/extend-command-line',
          'extension-development/testing-and-verification',
          'extension-development/write-plugin-skills',
          'extension-development/publish-plugin',
        ],
      },
      {
        title: ['Capabilities', '能力'],
        items: [
          { planned: ['Capabilities overview', '能力总览'] },
          { planned: ['Database', '数据库'] },
          { planned: ['Authentication and users', '认证与用户'] },
          { planned: ['Access control', '权限控制'] },
          { planned: ['File management', '文件管理'] },
          { planned: ['Workflows', '工作流'] },
          { planned: ['Approvals', '审批'] },
          { planned: ['Scheduled tasks', '定时任务'] },
          { planned: ['Notifications', '消息通知'] },
          { planned: ['Email', '邮件'] },
          { planned: ['Agents', 'Agents'] },
          { planned: ['Knowledge base', '知识库'] },
          { planned: ['Template printing', '模板打印'] },
          { planned: ['External integrations', '外部集成'] },
          { planned: ['Theme customization', '主题定制'] },
        ],
      },
      {
        title: ['Deployment and operations', '部署与运维'],
        items: [
          'deployment/choose-a-deployment-method',
          'tutorials/deploy-with-docker',
          'tutorials/deploy-with-app-installer',
          'deployment/publish-app-release',
          { planned: ['Runtime configuration', '运行配置'] },
          'developing-apps/upgrade-nocobase-core',
          { planned: ['Backup and restore', '备份与恢复'] },
          { planned: ['Logs and troubleshooting', '日志与故障排查'] },
        ],
      },
      {
        title: ['Reference', '参考'],
        items: [
          'reference/plugins',
          { planned: ['Command line', '命令行'] },
          { planned: ['Configuration options', '配置项'] },
          { planned: ['FAQ', '常见问题'] },
        ],
      },
    ],
  },
  {
    key: 'studio',
    title: ['Studio', 'Studio'],
    dir: 'studio/',
    /* 顺序：按一家公司用起 Studio 的先后。入门之后，一个人先搭建（从安装到走完第一个需求、邀请成员），
       同事再加入（连接自己的电脑和运行环境），然后是日常使用、管理项目和系统管理。每组给一种角色看，
       组里的页面按这个角色做事的先后排列。 */
    nav: [
      { items: ['index'] },
      { title: ['Get started', '入门'], items: ['intro/what-is-studio', 'intro/how-a-request-gets-done', 'intro/agent-team', 'intro/concepts'] },
      {
        title: ['Set up Studio', '搭建 Studio'],
        items: [
          'setup/with-agent',
          { heading: ['Step by step', '分步说明'] }, 'setup/install', 'setup/git', 'setup/shared-runtimes', 'setup/agents', 'setup/new-project', 'setup/ci', 'setup/first-request', 'setup/invite',
        ],
      },
      { title: ['Join the team', '加入团队'], items: ['join/sign-in', 'join/connect-computer', 'join/local-agent', 'join/personal-runtime'] },
      { title: ['Daily use', '日常使用'], items: ['use/raise-a-request', 'use/sessions', 'use/my-tasks', 'use/follow-progress', 'use/answer', 'use/accept', 'use/inbox'] },
      {
        title: ['Manage projects', '管理项目'],
        items: ['project/settings', 'project/skills', 'project/knowledge-base', 'project/checks-and-review', 'project/project-memory', 'project/release', 'project/progress', 'project/usage'],
      },
      { title: ['Administration', '系统管理'], items: ['admin/environments', 'admin/members-and-roles', 'admin/api-keys', 'admin/notifications', 'admin/upgrade-and-backup'] },
      { title: ['Reference', '参考'], items: ['reference/statuses-and-permissions', 'reference/cli', 'reference/config', 'reference/faq'] },
    ],
  },
];
const textOf = (pair, lang) => (Array.isArray(pair) ? pair[lang === DEFAULT_LANG ? 0 : 1] : pair);

/* ---------- 地址 ---------- */
// 页面的键是它相对语言根目录的路径；地址不带扩展名，一律以 / 结尾，和页面输出成 <路径>/index.html 的目录结构一致。
// CDN 对不带 / 的地址同样回源到这个文件，canonical 和站内链接只用带 / 的写法。
const pathOf = (key) => (key === 'index' ? '' : key.endsWith('/index') ? key.slice(0, -'index'.length) : `${key}/`);
const urlOf = (lang, key) => `/${lang.prefix}${pathOf(key)}`;
// .md 副本：栏目首页是 <栏目>/index.md，其余是 <页面>.md，正文里的相对 .md 链接因此可以原样使用
const mdUrlOf = (lang, key) => `/${lang.prefix}${key}.md`;
const htmlFileOf = (lang, key) => join(outDir, lang.prefix, pathOf(key), 'index.html');

/* ---------- Markdown 渲染 ---------- */
function frontMatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
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

const FIGURE_LINE = /^::figure[ \t]+([\w+-]+)((?:[ \t]+[\w-]+)*)[ \t]*(?:\|[ \t]*(.*))?$/gm;

// 局部配图：正文里单独一行写 `::figure 名称[+名称] [附加类名] | 说明`，内容取自 figures/名称.html；英文页面优先用
// figures/en/名称.html，还没有英文版的配图沿用中文版。
function withFigures(markdown, lang) {
  const figures = [];
  const source = markdown.replace(FIGURE_LINE, (_, names, classes, caption) => {
    const parts = names.split('+').map((name) => {
      const localized = lang?.figures && join(dir, 'figures', lang.figures, `${name}.html`);
      const file = localized && existsSync(localized) ? localized : join(dir, 'figures', `${name}.html`);
      if (!existsSync(file)) throw new Error(`缺少配图 figures/${name}.html`);
      return readFileSync(file, 'utf8').trim();
    });
    figures.push(`<figure class="fig${classes.replace(/\s+/g, ' ')}">${parts.join('')}${caption ? `<figcaption>${marked.parseInline(caption)}</figcaption>` : ''}</figure>`);
    return `\n<div data-figure="${figures.length - 1}"></div>\n`;
  });
  return { source, figures };
}

// Only annotate directory-tree tokens; preserve every source character for alignment and copying.
function highlightTree(code) {
  return code.split('\n').map((line) => {
    const branch = /^([ \t│]*[├└]─{2,}[ \t]+)(.*)$/.exec(line);
    const content = branch ? branch[2] : line;
    const [, name, comment = ''] = /^(.*?)([ \t]{2,}#.*)?$/.exec(content);
    if (!branch && !name.trimEnd().endsWith('/')) {
      return /^[ \t│]+$/.test(line) ? `<span class="tree-guide">${escape(line)}</span>` : escape(line);
    }
    const guide = branch ? `<span class="tree-guide">${escape(branch[1])}</span>` : '';
    const kind = name.trimEnd().endsWith('/') ? 'directory' : 'file';
    return `${guide}<span class="tree-${kind}">${escape(name)}</span>${comment ? `<span class="tree-comment">${escape(comment)}</span>` : ''}`;
  }).join('\n');
}

// resolveLink 把正文里的相对链接换成最终地址；解析不到的站内链接让构建失败，免得发布出死链
function render(markdown, { lang, ui, resolveLink = (href) => href }) {
  const { source, figures } = withFigures(markdown, lang);
  const used = new Map();
  const headings = [];
  const renderer = {
    heading(text, level) {
      let id = slugOf(text);
      const n = used.get(id) ?? 0;
      used.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;
      if (level >= 2 && level <= 4) headings.push({ id, level, text: text.replace(/<[^>]+>/g, '') });
      return `<h${level} id="${escape(id)}">${text}</h${level}>\n`;
    },
    code(code, info) {
      const lang = (info || '').trim().split(/\s+/)[0].toLowerCase();
      const plain = ['', 'text', 'plaintext', 'txt'].includes(lang);
      const tree = lang === 'tree' || (plain && /^[ \t│]*[├└]─{2,}[ \t]+/m.test(code));
      const prompt = lang === 'prompt';
      const classes = tree ? ' plain-text code-tree' : prompt ? ' wrap code-prompt' : plain ? ' wrap plain-text' : '';
      const language = lang === 'tsx' ? 'typescript' : lang;
      const grammar = hljs.getLanguage(language);
      const highlighted = tree ? highlightTree(code) : grammar && !plain && !prompt
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : escape(code);
      const label = tree ? ui.codeLabels.tree : prompt ? ui.codeLabels.prompt : plain ? ui.codeLabels.text : lang === 'tsx' ? 'TSX' : grammar?.name || lang;
      return `<div class="code-block${classes}"><div class="code-toolbar"><span class="code-language">${escape(label)}</span><button type="button" class="copy-button" data-copied="${escape(ui.copied)}" data-failed="${escape(ui.copyFailed)}" aria-live="polite">${escape(ui.copy)}</button></div><pre tabindex="0"><code>${highlighted}</code></pre></div>\n`;
    },
    blockquote(quote) {
      const m = /^<p>\[!(TIP|NOTE|WARNING|PENDING)\][ \t]*([^\n<]*)\n?/.exec(quote);
      if (!m) return `<blockquote>\n${quote}</blockquote>\n`;
      const kind = m[1].toLowerCase();
      const rest = quote.slice(m[0].length).replace(/^<\/p>\n?/, '');
      const body = rest.trim() ? (rest.startsWith('<') ? rest : `<p>${rest}`) : '';
      return `<div class="note ${kind}"><strong>${m[2].trim() || ui.callouts[m[1]]}</strong>${body}</div>\n`;
    },
    table(header, body) {
      return `<div class="table-wrap"><table>\n<thead>\n${header}</thead>\n<tbody>${body}</tbody></table></div>\n`;
    },
    image(href, title, text) {
      return `<figure class="fig"><img src="${escape(href)}" alt="${escape(text)}" loading="lazy"><figcaption>${text}</figcaption></figure>`;
    },
    link(href, title, text) {
      const target = resolveLink(href || '');
      const external = /^https?:/i.test(target) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ''}${external}>${text}</a>`;
    },
  };
  const instance = Object.assign(new marked.Renderer(), renderer);
  const html = marked.parse(source, { gfm: true, headerIds: false, mangle: false, renderer: instance })
    .replace(/<p>(<figure[\s\S]*?<\/figure>)<\/p>/g, '$1')
    .replace(/<div data-figure="(\d+)"><\/div>/g, (_, i) => figures[Number(i)])
    .replace(/<p><strong>完成的标志<\/strong>：/g, '<p class="done"><strong>完成的标志</strong>')
    .replace(/<p><strong>Done when<\/strong>:\s*/g, '<p class="done"><strong>Done when</strong>');
  return { html, headings };
}

/* ---------- 页面外壳 ---------- */
// head 是 canonical、hreflang 等额外的 <head> 内容；base 是资源的前缀，文档站用根路径 /
function shell({ lang, title, description, crumb, body, toc, menu, pager, base, home, tabs = '', head = '', switcher = '', robots = '' }) {
  const { ui } = lang;
  return `<!doctype html>
<html lang="${lang.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} - ${escape(ui.site)}</title>
<meta name="description" content="${escape(description || title)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}${head}<link rel="icon" type="image/png" sizes="32x32" href="https://static-docs.nocobase.com/nocobase-favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="https://static-docs.nocobase.com/nocobase-favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://static-docs.nocobase.com/nocobase-apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${base}assets/docs.css?v=${VERSION}">
</head>
<body>
<a class="skip-link" href="#content">${escape(ui.skip)}</a>
<header class="topbar">
<a class="brand" href="${home}"><img class="brand-logo" src="${base}assets/logo.png" alt="NocoBase"><span class="version">3</span><span class="doc-label">${escape(ui.docs)}</span></a>
${tabs ? `<nav class="sections" aria-label="${escape(ui.sections)}">${tabs}</nav>` : ''}
<nav class="toplinks" aria-label="${escape(ui.links)}">${switcher}<a href="https://github.com/nocobase/nocobase" target="_blank" rel="noopener">GitHub ↗</a><a href="${ui.websiteUrl}" target="_blank" rel="noopener">${escape(ui.website)} ↗</a></nav>
</header>
<div class="layout">
<aside class="sidebar"><details class="menu" open><summary>${escape(ui.menu)}</summary><nav aria-label="${escape(ui.menuLabel)}">${menu}</nav></details></aside>
<main id="content" class="content">
${crumb ? `<p class="crumb">${escape(crumb)}</p>` : ''}<h1>${escape(title)}</h1>
${description ? `<p class="lead">${escape(description)}</p>` : ''}
<article class="prose">
${body}
</article>
${pager}
<footer class="page-foot"><span>${escape(ui.site)} · ${escape(ui.draft)} ${DATE}</span></footer>
</main>
<aside class="toc" aria-label="${escape(ui.toc)}">${toc}</aside>
</div>
<script src="${LUCIDE}"></script>
<script src="${base}assets/docs.js?v=${VERSION}"></script>
</body>
</html>
`;
}

const menuOf = (groups, current) => groups.map((group) => `<div class="menu-group">${group.title ? `<p class="menu-title">${escape(group.title)}</p>` : ''}<ul>${group.items.map((x) => x.heading
  ? `<li class="menu-sub">${escape(x.heading)}</li>`
  : x.planned ? `<li><span class="menu-planned">${escape(x.planned)} <small>${escape(x.plannedLabel)}</small></span></li>`
  : `<li><a href="${x.href}"${x.todo ? ' class="todo"' : ''}${x.key === current ? ' aria-current="page"' : ''}>${escape(x.label)}</a></li>`).join('')}</ul></div>`).join('');

// On-page navigation includes headings from h2 through h4.
const tocOf = (headings, ui) => headings.length < 2 ? '' :
  `<p class="toc-title">${escape(ui.toc)}</p><ul>${headings.map((h) => `<li class="toc-level-${h.level}"><a href="#${encodeURIComponent(h.id)}">${escape(h.text)}</a></li>`).join('')}</ul>`;

const pagerOf = (prev, next, ui) => `<nav class="pager" aria-label="${escape(ui.pager)}">${prev ? `<a class="prev" href="${prev.href}"><small>${escape(ui.prev)}</small>${escape(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${next.href}"><small>${escape(ui.next)}</small>${escape(next.title)}</a>` : ''}</nav>`;

/* ---------- 读取页面 ---------- */
// 列出语言根目录下的全部 Markdown 页面键；英文的根目录里有 zh-CN/，要跳过其他语言的目录
function pageKeysIn(root) {
  const skip = new Set(LANGS.filter((l) => l.prefix).map((l) => join(DEFAULT_LANG.src, l.prefix.slice(0, -1))));
  const keys = [];
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) { if (!skip.has(path)) walk(path); } else if (entry.name.endsWith('.md')) keys.push(relative(root, path).split('\\').join('/').slice(0, -3));
    }
  };
  walk(root);
  return keys.sort();
}

// pages：语言代码 → 页面键 → { meta, body, group, section }
const pages = new Map(LANGS.map((lang) => [lang.code, new Map()]));
const problems = [];
const menuKeys = new Set();
for (const section of SECTIONS) {
  section.keys = section.nav.flatMap((group) => group.items.filter((item) => typeof item === 'string').map((item) => `${section.dir}${item}`));
  for (const key of section.keys) {
    if (menuKeys.has(key)) problems.push(`Duplicate menu page: ${key}`);
    menuKeys.add(key);
  }
}
for (const lang of LANGS) {
  const langPages = pages.get(lang.code);
  for (const section of SECTIONS) {
    for (const group of section.nav) {
      for (const item of group.items) {
        if (typeof item !== 'string') continue;
        const key = `${section.dir}${item}`;
        const file = join(lang.src, `${key}.md`);
        if (!existsSync(file)) { problems.push(`菜单里有、源文件里没有：${relative(dir, file)}`); continue; }
        const { meta, body } = frontMatter(readFileSync(file, 'utf8'));
        if (!meta.title) problems.push(`缺少 title：${relative(dir, file)}`);
        langPages.set(key, { meta, body, group: group.title, section });
      }
    }
  }
  for (const key of pageKeysIn(lang.src)) {
    if (!langPages.has(key)) problems.push(`源文件里有、菜单里没有：${relative(dir, join(lang.src, `${key}.md`))}`);
  }
}
if (problems.length) throw new Error(`文档结构有问题：\n${problems.join('\n')}`);

/* ---------- 文档站 ---------- */
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'assets'), { recursive: true });
cpSync(join(dir, 'assets'), join(outDir, 'assets'), { recursive: true });

const absolute = (path) => `${SITE_ORIGIN}${path}`;
const alternatesOf = (key) => LANGS.filter((l) => pages.get(l.code).has(key)).map((l) => ({ lang: l, url: absolute(urlOf(l, key)) }));
const headOf = (lang, key, title) => {
  const alternates = alternatesOf(key);
  return [
    `<link rel="canonical" href="${absolute(urlOf(lang, key))}">`,
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.lang.code}" href="${a.url}">`),
    `<link rel="alternate" hreflang="x-default" href="${absolute(urlOf(DEFAULT_LANG, key))}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escape(lang.ui.site)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:url" content="${absolute(urlOf(lang, key))}">`,
    `<meta property="og:locale" content="${lang.code.replace('-', '_')}">`,
  ].join('\n') + '\n';
};
// 语言菜单：悬停或聚焦时展开，列出全部语言，当前语言打勾；某种语言没有这一页时链到它的首页
const ICON_GLOBE = '<svg class="lang-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
const ICON_CHEVRON = '<svg class="lang-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const ICON_CHECK = '<svg class="lang-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const switcherOf = (lang, key) => `<div class="lang-menu"><button type="button" aria-haspopup="true" aria-label="${escape(lang.ui.switchTo)}">${ICON_GLOBE}<span>${escape(lang.label)}</span>${ICON_CHEVRON}</button><div class="lang-dd">${LANGS.map((l) => (l === lang
  ? `<a href="${urlOf(l, key)}" hreflang="${l.code}" lang="${l.code}" aria-current="true" class="on">${ICON_CHECK}${escape(l.label)}</a>`
  : `<a href="${urlOf(l, pages.get(l.code).has(key) ? key : 'index')}" hreflang="${l.code}" lang="${l.code}"><span class="lang-check"></span>${escape(l.label)}</a>`)).join('')}</div></div>`;

const brokenLinks = [];
// 正文里的相对 .md 链接按页面所在目录解析成页面键，再换成同一语言的地址；锚点保留
function linkResolver(lang, key) {
  return (href) => {
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/')) return href;
    const [path, hash = ''] = href.split('#');
    const target = posix.normalize(posix.join(posix.dirname(key), path)).slice(0, -3);
    if (!path.endsWith('.md') || !pages.get(lang.code).has(target)) {
      brokenLinks.push(`${lang.prefix}${key}.md → ${href}`);
      return href;
    }
    return `${urlOf(lang, target)}${hash ? `#${hash}` : ''}`;
  };
}

const sitemapEntries = [];
for (const lang of LANGS) {
  const langPages = pages.get(lang.code);
  const { ui } = lang;
  for (const section of SECTIONS) {
    section.order = section.keys.filter((key) => !langPages.get(key).meta.status);
  }
  for (const [key, info] of langPages) {
    const { section, meta } = info;
    const menu = menuOf(section.nav.map((group) => ({
      title: textOf(group.title, lang),
      items: group.items.map((item) => {
        if (typeof item !== 'string') return item.planned
          ? { planned: textOf(item.planned, lang), plannedLabel: lang.code === 'zh-CN' ? '待编写' : 'Planned' }
          : { heading: textOf(item.heading, lang) };
        const p = `${section.dir}${item}`;
        const m = langPages.get(p).meta;
        return { key: p, href: urlOf(lang, p), label: m.nav || m.title, todo: Boolean(m.status) };
      }),
    })), key);
    const tabs = SECTIONS.map((s) => `<a href="${urlOf(lang, `${s.dir}index`)}"${s === section ? ' aria-current="true"' : ''}>${escape(textOf(s.title, lang))}</a>`).join('');
    // 上一页 / 下一页只在同一部分里、已经写好的页面之间跳
    const i = section.order.indexOf(key);
    const link = (p) => p && { href: urlOf(lang, p), title: langPages.get(p).meta.title };
    const pager = i < 0 ? '' : pagerOf(link(section.order[i - 1]), link(section.order[i + 1]), ui);
    let markdown = info.body;
    // 还没有英文的占位页：指向写好了的其他语言版本
    if (meta.status && !markdown.trim() && lang !== LANGS[1]) {
      const zh = pages.get(LANGS[1].code).get(key);
      markdown = zh && !zh.meta.status ? `<p>${ui.untranslated(urlOf(LANGS[1], key))}</p>` : `<p>${ui.unwritten}</p>`;
    }
    const r = render(markdown, { lang, ui, resolveLink: linkResolver(lang, key) });
    const out = htmlFileOf(lang, key);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, shell({
      lang,
      title: meta.title,
      description: meta.description,
      crumb: [section.key === 'start' ? '' : textOf(section.title, lang), textOf(info.group, lang)].filter(Boolean).join(' · '),
      body: r.html.replaceAll('{{base}}', '/'),
      toc: tocOf(r.headings, ui),
      menu,
      tabs,
      pager,
      base: '/',
      home: urlOf(lang, 'index'),
      head: headOf(lang, key, meta.title),
      switcher: switcherOf(lang, key),
    }));
    // .md 副本：给 Agent 和 llms.txt 用，配图行换成它的说明
    const md = `# ${meta.title}\n\n${meta.description ? `> ${meta.description}\n\n` : ''}${info.body.replace(FIGURE_LINE, (_, names, classes, caption) => (caption ? `*${caption}*` : '')).trim()}\n`;
    const mdOut = join(outDir, lang.prefix, `${key}.md`);
    mkdirSync(dirname(mdOut), { recursive: true });
    writeFileSync(mdOut, md);
    sitemapEntries.push({ lang, key });
  }

  // 404：CDN 回源找不到文件时返回它；英文的放在根目录，发布时还要单独传一份到 bucket 根目录
  const home = urlOf(lang, 'index');
  const [title, lead, back] = ui.notFound;
  mkdirSync(join(outDir, lang.prefix), { recursive: true });
  writeFileSync(join(outDir, lang.prefix, '404.html'), shell({
    lang,
    title,
    description: lead,
    body: `<p><a href="${home}">${escape(back)}</a></p>`,
    toc: '',
    menu: menuOf([{ items: SECTIONS.map((s) => ({ key: s.key, href: urlOf(lang, `${s.dir}index`), label: textOf(s.title, lang) })) }], ''),
    tabs: SECTIONS.map((s) => `<a href="${urlOf(lang, `${s.dir}index`)}">${escape(textOf(s.title, lang))}</a>`).join(''),
    pager: '',
    base: '/',
    home,
    robots: 'noindex',
    switcher: switcherOf(lang, 'index'),
  }));

  // llms.txt：按部分和分组列出页面，链接指向 .md 副本
  const llms = [`# ${ui.site}`, '', `> ${pages.get(lang.code).get('index').meta.description || ui.site}`, ''];
  for (const section of SECTIONS) {
    llms.push(`## ${textOf(section.title, lang)}`, '');
    for (const group of section.nav) {
      const title = textOf(group.title, lang);
      if (title) llms.push(`### ${title}`, '');
      for (const item of group.items) {
        if (typeof item !== 'string') continue;
        const key = `${section.dir}${item}`;
        const { meta } = langPages.get(key);
        llms.push(`- [${meta.title}](${absolute(mdUrlOf(lang, key))})${meta.description ? `: ${meta.description}` : ''}`);
      }
      llms.push('');
    }
  }
  writeFileSync(join(outDir, lang.prefix, 'llms.txt'), llms.join('\n'));
}

if (brokenLinks.length) throw new Error(`正文里有 ${brokenLinks.length} 个链接指向不存在的页面（站内链接要写成相对的 .md 路径）：\n${brokenLinks.join('\n')}`);

// sitemap：每个页面一条，带上各语言版本的 alternate
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemapEntries.map(({ lang, key }) => [
    `<url><loc>${absolute(urlOf(lang, key))}</loc>`,
    ...alternatesOf(key).map((a) => `<xhtml:link rel="alternate" hreflang="${a.lang.code}" href="${a.url}"/>`),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(urlOf(DEFAULT_LANG, key))}"/></url>`,
  ].join('')),
  '</urlset>',
  '',
].join('\n');
writeFileSync(join(outDir, 'sitemap.xml'), sitemap);
writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`);

// 自检：sitemap 里的每个地址都有对应的 index.html，页面里的站内链接都指向生成了的页面，带锚点的链接指向页面里存在的标题
const htmlOf = new Map();
for (const { lang, key } of sitemapEntries) {
  if (!existsSync(htmlFileOf(lang, key))) throw new Error(`缺少产物 ${relative(outDir, htmlFileOf(lang, key))}`);
  htmlOf.set(urlOf(lang, key), readFileSync(htmlFileOf(lang, key), 'utf8'));
}
const idsOf = new Map([...htmlOf].map(([url, html]) => [url, new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')))]));
const deadLinks = [];
for (const [url, html] of htmlOf) {
  for (const [, href] of html.matchAll(/href="(\/[^"?]*)/g)) {
    const [path, hash] = href.split('#');
    if (path.startsWith('/assets/')) continue;
    if (!htmlOf.has(path)) deadLinks.push(`${url} → ${href}（页面不存在）`);
    else if (hash && !idsOf.get(path).has(decodeURIComponent(hash))) deadLinks.push(`${url} → ${href}（页面里没有这个锚点）`);
  }
}
if (deadLinks.length) throw new Error(`有 ${deadLinks.length} 个站内链接指向不存在的页面或锚点：\n${deadLinks.join('\n')}`);
// docs.nocobase.com 会把 v2 旧地址的一级路径 301 到 nocode.docs，顶层目录不能和它们同名
assertNoV2RedirectConflicts(outDir);
console.log(`文档站：已生成 ${sitemapEntries.length} 页（${LANGS.map((l) => `${l.code} ${pages.get(l.code).size}`).join('，')}）→ ${relative(process.cwd(), outDir) || '.'}/，站点域名 ${SITE_ORIGIN}`);
