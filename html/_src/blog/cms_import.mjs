#!/usr/bin/env node
// 把 CMS 推送的文章（cms/articles/<slug>/metadata.json、index.md、index.cn.md）合并进 posts.json，再由 gen_blog.py 生成页面。
// 推送由 CMS 工作流「Website_v3_github_sync」完成，格式和旧官网 nocobase/website 的 content/articles 相同。
// 显示规则沿用旧官网：status 为 published 且没有 hideDetailPage 的文章有详情页；再没有 hideOnListPage 的进博客列表。
// hideOnBlog 的文章旧官网不进 /blog 首页，但出现在标签页和侧栏；v3 只有一个带标签筛选的列表，所以也列出来。
// 运行：在 html/_src 下 node blog/cms_import.mjs（依赖 doc/ 的 marked@4.3.0，先 cd doc && npm ci）。
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const markedPath = join(here, '../../../doc/node_modules/marked/lib/marked.esm.js');
if (!existsSync(markedPath)) throw new Error('需要 marked@4.3.0：先运行 cd doc && npm ci');
const { marked } = await import(pathToFileURL(markedPath).href);
marked.setOptions({ gfm: true, headerIds: false, mangle: false });

const root = join(here, 'cms', 'articles');
const postsPath = join(here, 'posts.json');
const posts = JSON.parse(readFileSync(postsPath, 'utf8'));
const read = p => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// 日期取 UTC 的那一天，和 nocobase.com 现在显示的一致
const day = iso => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

// 上次从 CMS 导入的文章先去掉，CMS 里取消发布或隐藏的文章才会从官网消失；手工抓取的旧文章（没有 source）保持不变
for (const slug of Object.keys(posts)) if (posts[slug].source === 'cms') delete posts[slug];

let pages = 0, listed = 0;
for (const slug of existsSync(root) ? readdirSync(root).sort() : []) {
  const dir = join(root, slug);
  if (!existsSync(join(dir, 'metadata.json'))) continue;
  const m = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
  if (m.status !== 'published' || m.hideDetailPage) continue;
  const en = read(join(dir, 'index.md')), cn = read(join(dir, 'index.cn.md')) || en;
  if (!en && !cn) continue;
  const date = day(m.publishedAt || m.createdAt || m.updatedAt);
  // 只留旧官网博客上显示的标签（displayOnBlog），其余是 SEO 关键词
  const tags = (m.tags || []).filter(t => t.displayOnBlog);
  const image = (m.cover && m.cover.url) || '';
  const author = m.author || 'NocoBase';
  posts[m.slug || slug] = {
    source: 'cms',
    listed: !m.hideOnListPage,
    en: { title: m.title || m.title_cn, desc: m.description || m.description_cn || '', date, author, tags: tags.map(t => t.title), image, body: marked.parse(en || cn).trim() },
    cn: { title: m.title_cn || m.title, desc: m.description_cn || m.description || '', date, author, tags: tags.map(t => t.title_cn || t.title), image, body: marked.parse(cn).trim() },
  };
  pages++;
  if (posts[m.slug || slug].listed) listed++;
}

writeFileSync(postsPath, JSON.stringify(posts, null, 1) + '\n');
console.log(`cms: ${pages} pages, ${listed} listed`);
