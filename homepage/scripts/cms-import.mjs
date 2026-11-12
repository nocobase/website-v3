#!/usr/bin/env node
// 把 CMS 推送的文章（content/blog/cms/articles/<slug>/metadata.json、index.md、index.cn.md）合并进 content/blog/posts.json，构建时由 lib/blog.mjs 生成页面。
// 推送由 CMS 工作流「Website_v3_github_sync」完成，格式和旧官网 nocobase/website 的 content/articles 相同。
// 显示规则沿用旧官网：status 为 published 且没有 hideDetailPage 的文章有详情页；再没有 hideOnListPage 的进博客列表。
// 草稿（status 为 drafted）也有详情页，供 CMS 里的「预览」按钮打开：记为 draft: true，不进任何列表、相关文章和 sitemap，页面加 noindex。
// 有日文正文（index.ja.md）的文章另记一份 ja（标题、描述取 title_ja、description_ja，标签取标签表的 title_ja），构建时生成 /ja-JP/ 下的页面。
// hideOnBlog 的文章旧官网不进 /blog 首页，但出现在标签页和侧栏；v3 照此处理：记为 onBlog: false，博客列表「全部」里不显示，按标签筛选时显示。
// 更新日志不从 CMS 来：v3 的每次发版由 nocobase 仓库的发版流程写进 content/changelog/（lib/changelog.mjs）；CMS 里的版本说明文章照常是博客文章。
// 正文里指向 v2 文档和旧官网的地址换成新地址（规则见 lib/links.mjs 的 legacyDocLinks、legacySiteLinks）；旧官网地址的替换也作用于手工抓取的文章和 cs-posts.json。
// 运行：在 homepage/ 下 pnpm cms:import（先 pnpm install）。
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { articleSlugs } from '../src/lib/blog.mjs';
import { legacyDocLinks, legacySiteLinks } from '../src/lib/links.mjs';
import { CONTENT } from '../src/lib/paths.mjs';

const here = join(CONTENT, 'blog');
marked.setOptions({ gfm: true, headerIds: false, mangle: false });

// 指向 v2 文档的旧地址统一换成 v2 文档站 nocode.docs.nocobase.com（规则见 lib/links.mjs 的 legacyDocLinks）：docs.nocobase.com/en/… 去掉 en/，v2 的一级路径和语言前缀换主机、路径不变，docs-cn.nocobase.com/… 换成 /cn/…；指向 v3 文档的不变。构建生成博客页面时再按同样的规则换一次。
const root = join(here, 'cms', 'articles');
const postsPath = join(here, 'posts.json');
const csPath = join(here, 'cs-posts.json');
const posts = JSON.parse(readFileSync(postsPath, 'utf8'));
const cs = JSON.parse(readFileSync(csPath, 'utf8'));
const read = p => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// 日期取 UTC 的那一天，和 nocobase.com 现在显示的一致
const day = iso => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

// 上次从 CMS 导入的文章先去掉，CMS 里取消发布或隐藏的文章才会从官网消失；手工抓取的旧文章（没有 source）保持不变
for (const slug of Object.keys(posts)) if (posts[slug].source === 'cms') delete posts[slug];

// 标签以 cms/article-tags.json（CMS 推到旧官网 content/tags/article-tags.json 的标签表）为准：文章 metadata 里的标签是
// 文章上次同步时的快照，标签改过名（如 AI & No-Code 曾叫 News、No-Code News）或改过 displayOnBlog 的，快照还是旧的。
const tagsPath = join(here, 'cms', 'article-tags.json');
const TAGS = new Map((existsSync(tagsPath) ? JSON.parse(readFileSync(tagsPath, 'utf8')) : []).map(t => [t.id, t]));
const current = t => TAGS.get(t.id) || t;
let pages = 0, listed = 0, drafts = 0;
// CMS 里改了 slug 的文章，旧 slug 的目录不会被删（推送只写不删），同一个 id 只用最近更新的那份
const meta = slug => JSON.parse(readFileSync(join(root, slug, 'metadata.json'), 'utf8'));
const newest = new Map();
for (const slug of existsSync(root) ? readdirSync(root).sort() : []) {
  if (!existsSync(join(root, slug, 'metadata.json'))) continue;
  const { id, updatedAt = '' } = meta(slug);
  const prev = newest.get(id);
  if (!prev || updatedAt > prev.updatedAt) newest.set(id, { slug, updatedAt });
}
for (const slug of [...newest.values()].map(v => v.slug).sort()) {
  const dir = join(root, slug);
  const m = meta(slug);
  if (m.status !== 'published' && m.status !== 'drafted') continue;
  const draft = m.status === 'drafted';
  const en = legacyDocLinks(read(join(dir, 'index.md'))), cn = legacyDocLinks(read(join(dir, 'index.cn.md'))) || en;
  const ja = legacyDocLinks(read(join(dir, 'index.ja.md'))).trim();
  if (!en && !cn) continue;
  const date = day(m.publishedAt || m.createdAt || m.updatedAt);
  if (m.hideDetailPage) continue;
  // 只留旧官网博客上显示的标签（displayOnBlog），其余是 SEO 关键词
  const tags = (m.tags || []).map(current).filter(t => t.displayOnBlog);
  const image = (m.cover && m.cover.url) || '';
  const author = m.author || 'NocoBase';
  posts[m.slug || slug] = {
    source: 'cms',
    listed: !draft && !m.hideOnListPage,
    ...(draft && { draft: true }),
    onBlog: !m.hideOnBlog,
    en: { title: m.title || m.title_cn, desc: m.description || m.description_cn || '', date, author, tags: tags.map(t => t.title), image, body: marked.parse(en || cn).trim() },
    cn: { title: m.title_cn || m.title, desc: m.description_cn || m.description || '', date, author, tags: tags.map(t => t.title_cn || t.title), image, body: marked.parse(cn).trim() },
    ...(ja && { ja: { title: m.title_ja || m.title, desc: m.description_ja || m.description || '', date, author, tags: tags.map(t => t.title_ja || t.title), image, body: marked.parse(ja).trim() } }),
  };
  pages++;
  if (draft) drafts++;
  if (posts[m.slug || slug].listed) listed++;
}

// 指向旧官网（NocoBase 2 时代的 www.nocobase.com，已经整体搬到 nocode.nocobase.com）的地址换成新地址，规则见 lib/links.mjs 的 legacySiteLinks：旧博客文章新站有的换成 /blog/<slug>/、/customers/<slug>/（中文换成 zh-CN/ 下的），旧首页换成新首页，插件页换成 v2 文档站的插件列表，其余旧页面换成 nocode.nocobase.com 上的同一路径。
// 博客的全部文章（含手工抓取的）和客户案例（cs-posts.json）都换；构建生成页面时再按同样的规则换一次。
const site = articleSlugs(posts, cs);
for (const entry of [...Object.values(posts), ...Object.values(cs)]) {
  for (const l of ['en', 'cn', 'ja']) for (const f of ['desc', 'body']) if (entry[l] && entry[l][f]) entry[l][f] = legacySiteLinks(entry[l][f], site);
}

// 按 slug 排序写出，每次运行结果一样，diff 里只有真正改动的文章
const sorted = Object.fromEntries(Object.keys(posts).sort().map(k => [k, posts[k]]));
writeFileSync(postsPath, JSON.stringify(sorted, null, 1) + '\n');
writeFileSync(csPath, JSON.stringify(cs, null, 1) + '\n');
console.log(`cms: ${pages} pages (${drafts} drafts), ${listed} listed`);
