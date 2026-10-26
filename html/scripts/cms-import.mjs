#!/usr/bin/env node
// 把 CMS 推送的文章（src/blog/cms/articles/<slug>/metadata.json、index.md、index.cn.md）合并进 src/blog/posts.json，构建时由 lib/blog.mjs 生成页面。
// 推送由 CMS 工作流「Website_v3_github_sync」完成，格式和旧官网 nocobase/website 的 content/articles 相同。
// 显示规则沿用旧官网：status 为 published 且没有 hideDetailPage 的文章有详情页；再没有 hideOnListPage 的进博客列表。
// hideOnBlog 的文章旧官网不进 /blog 首页，但出现在标签页和侧栏；v3 照此处理：记为 onBlog: false，博客列表「全部」里不显示，按标签筛选时显示。
// 打了 Release Notes 标签、已发布的 v3 版本（slug 以 v3. 开头）另外写进 releases.json，给 lib/changelog.mjs 生成更新日志；含没有详情页的。
// v2 及更早的版本留在旧官网的 /blog/timeline，更新日志页上有链接。
// 正文里指向 v2 文档和旧官网的地址换成新地址（规则见 lib/links.mjs 的 legacyDocLinks、legacySiteLinks）；旧官网地址的替换也作用于手工抓取的文章和 cs-posts.json。
// 运行：在 html/ 下 pnpm cms:import（先 pnpm install）。
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { articleSlugs } from './lib/blog.mjs';
import { legacyDocLinks, legacySiteLinks } from './lib/links.mjs';
import { SRC } from './lib/paths.mjs';

const here = join(SRC, 'blog');
marked.setOptions({ gfm: true, headerIds: false, mangle: false });

// 指向 v2 文档的旧地址统一换成 v2 文档站 nocode.docs.nocobase.com（规则见 lib/links.mjs 的 legacyDocLinks）：docs.nocobase.com/en/… 去掉 en/，v2 的一级路径和语言前缀换主机、路径不变，docs-cn.nocobase.com/… 换成 /cn/…；指向 v3 文档的不变。构建生成博客页面时再按同样的规则换一次。
const root = join(here, 'cms', 'articles');
const postsPath = join(here, 'posts.json');
const releasesPath = join(here, 'releases.json');
const csPath = join(here, 'cs-posts.json');
const posts = JSON.parse(readFileSync(postsPath, 'utf8'));
const cs = JSON.parse(readFileSync(csPath, 'utf8'));
const read = p => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// 日期取 UTC 的那一天，和 nocobase.com 现在显示的一致
const day = iso => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

// 上次从 CMS 导入的文章先去掉，CMS 里取消发布或隐藏的文章才会从官网消失；手工抓取的旧文章（没有 source）保持不变
for (const slug of Object.keys(posts)) if (posts[slug].source === 'cms') delete posts[slug];

// 更新日志的分类：CMS 里 sub_tags 大小写、写法不统一，归成四类
// 没有 sub_tags 的按版本号判断：-alpha、-beta 之外的算正式版
const kindOf = (subs, slug) => {
  const names = (subs || []).map(t => String((t && t.title) || t).toLowerCase());
  for (const k of ['milestone', 'latest', 'beta', 'alpha']) if (names.some(n => n.startsWith(k))) return k;
  return /-alpha/.test(slug) ? 'alpha' : /-beta/.test(slug) ? 'beta' : 'latest';
};
const releases = {};
let pages = 0, listed = 0;
for (const slug of existsSync(root) ? readdirSync(root).sort() : []) {
  const dir = join(root, slug);
  if (!existsSync(join(dir, 'metadata.json'))) continue;
  const m = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
  if (m.status !== 'published') continue;
  const en = legacyDocLinks(read(join(dir, 'index.md'))), cn = legacyDocLinks(read(join(dir, 'index.cn.md'))) || en;
  if (!en && !cn) continue;
  const date = day(m.publishedAt || m.createdAt || m.updatedAt);
  if (/^v3\./.test(m.slug || slug) && (m.tags || []).some(t => t.slug === 'release-notes')) {
    releases[m.slug || slug] = {
      kind: kindOf(m.sub_tags, m.slug || slug), post: !m.hideDetailPage, image: (m.cover && m.cover.url) || '',
      en: { title: m.title || m.title_cn, desc: m.description || m.description_cn || '', date, body: marked.parse(en || cn).trim() },
      cn: { title: m.title_cn || m.title, desc: m.description_cn || m.description || '', date, body: marked.parse(cn).trim() },
    };
  }
  if (m.hideDetailPage) continue;
  // 只留旧官网博客上显示的标签（displayOnBlog），其余是 SEO 关键词
  const tags = (m.tags || []).filter(t => t.displayOnBlog);
  const image = (m.cover && m.cover.url) || '';
  const author = m.author || 'NocoBase';
  posts[m.slug || slug] = {
    source: 'cms',
    listed: !m.hideOnListPage,
    onBlog: !m.hideOnBlog,
    en: { title: m.title || m.title_cn, desc: m.description || m.description_cn || '', date, author, tags: tags.map(t => t.title), image, body: marked.parse(en || cn).trim() },
    cn: { title: m.title_cn || m.title, desc: m.description_cn || m.description || '', date, author, tags: tags.map(t => t.title_cn || t.title), image, body: marked.parse(cn).trim() },
  };
  pages++;
  if (posts[m.slug || slug].listed) listed++;
}

// 指向旧官网（NocoBase 2 时代的 www.nocobase.com，已经整体搬到 nocode.nocobase.com）的地址换成新地址，规则见 lib/links.mjs 的 legacySiteLinks：旧博客文章新站有的换成 /blog/<slug>/、/customers/<slug>/（中文换成 zh-CN/ 下的），旧首页换成新首页，插件页换成 v2 文档站的插件列表，其余旧页面换成 nocode.nocobase.com 上的同一路径。
// 博客的全部文章（含手工抓取的）、客户案例（cs-posts.json）和更新日志都换；构建生成页面时再按同样的规则换一次。
const site = articleSlugs(posts, cs);
for (const entry of [...Object.values(posts), ...Object.values(cs), ...Object.values(releases)]) {
  for (const l of ['en', 'cn']) for (const f of ['desc', 'body']) if (entry[l] && entry[l][f]) entry[l][f] = legacySiteLinks(entry[l][f], site);
}

// 按 slug 排序写出，每次运行结果一样，diff 里只有真正改动的文章
const sorted = Object.fromEntries(Object.keys(posts).sort().map(k => [k, posts[k]]));
writeFileSync(postsPath, JSON.stringify(sorted, null, 1) + '\n');
writeFileSync(csPath, JSON.stringify(cs, null, 1) + '\n');
writeFileSync(releasesPath, JSON.stringify(Object.fromEntries(Object.keys(releases).sort().map(k => [k, releases[k]])), null, 1) + '\n');
console.log(`cms: ${pages} pages, ${listed} listed, ${Object.keys(releases).length} releases`);
