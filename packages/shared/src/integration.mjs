// 官网和文档站共用的 Astro 集成：构建结束后往产物里写 robots.txt，文档站还要 llms.txt 和每页的 .md 副本。
//
//   import siteFiles from '@nocobase/site-shared/integration';
//   integrations: [siteFiles({ robots: { sitemap: 'sitemap-index.xml' } })]
//
// 选项（都可以不传，不传就不生成）：
// - robots：{ sitemap?: string, allow?: string, disallow?: string[] }。sitemap 是相对站点根目录的文件名，robots.txt 里写成 <site>/<sitemap>。
// - llms：每个元素生成一个 llms.txt，{ path, title, summary?, sections: [{ title, groups: [{ title?, pages: [{ title, description?, path }] }] }] }。path 是产物里的相对路径（如 'zh-CN/llms.txt'），页面的 path 是站内地址（如 '/core/quickstart.md'），写成 <site>/<path>。可以传数组，也可以传返回数组的函数（构建时才调用）。
// - markdownCopies：每个元素生成一个 .md 文件，{ path, title, description?, body }：去掉 front matter 的正文，前面加上标题和（引用格式的）描述。同样可以是数组或函数。官网不启用。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function robotsTxt({ site, sitemap = 'sitemap-index.xml', allow = '/', disallow = [] }) {
  const origin = String(site).replace(/\/+$/, '');
  return ['User-agent: *', `Allow: ${allow}`, ...disallow.map(d => `Disallow: ${d}`), '', `Sitemap: ${origin}/${sitemap.replace(/^\/+/, '')}`, ''].join('\n');
}

const origin = site => String(site).replace(/\/+$/, '');

/** llms.txt：标题、摘要，然后按板块和分组列出页面，链接指向页面的 .md 副本。 */
export function llmsTxt({ title, summary, sections }, site) {
  const lines = [`# ${title}`, '', `> ${summary || title}`, ''];
  for (const section of sections) {
    lines.push(`## ${section.title}`, '');
    for (const group of section.groups) {
      if (group.title) lines.push(`### ${group.title}`, '');
      for (const page of group.pages) lines.push(`- [${page.title}](${origin(site)}${page.path})${page.description ? `: ${page.description}` : ''}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

/** 页面的 .md 副本：# 标题，引用格式的描述，正文。 */
export function markdownCopy({ title, description, body }) {
  return `# ${title}\n\n${description ? `> ${description}\n\n` : ''}${body.trim()}\n`;
}

const list = v => (typeof v === 'function' ? v() : v) ?? [];

export default function siteFiles(options = {}) {
  let site;
  return {
    name: '@nocobase/site-shared/files',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': ({ dir, logger }) => {
        if (options.robots) {
          if (!site) throw new Error('site-shared integration：写 robots.txt 需要 astro.config 的 site');
          const file = join(fileURLToPath(dir), 'robots.txt');
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, robotsTxt({ site, ...options.robots }));
          logger.info('robots.txt written');
        }
        const root = fileURLToPath(dir);
        const write = (path, content) => {
          const file = join(root, path);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, content);
        };
        if (options.llms) {
          if (!site) throw new Error('site-shared integration：写 llms.txt 需要 astro.config 的 site');
          const files = list(options.llms);
          for (const f of files) write(f.path, llmsTxt(f, site));
          logger.info(`${files.length} llms.txt written`);
        }
        if (options.markdownCopies) {
          const copies = list(options.markdownCopies);
          for (const c of copies) write(c.path, markdownCopy(c));
          logger.info(`${copies.length} markdown copies written`);
        }
      },
    },
  };
}
