// 官网和文档站共用的 Astro 集成：构建结束后往产物根目录写 robots.txt，以后文档站要的 llms.txt 和每页的 .md 副本也在这里加。
//
//   import siteFiles from '@nocobase/site-shared/integration';
//   integrations: [siteFiles({ robots: { sitemap: 'sitemap-index.xml' } })]
//
// 选项：
// - robots：{ sitemap?: string, allow?: string, disallow?: string[] }。sitemap 是相对站点根目录的文件名，robots.txt 里写成 <site>/<sitemap>；不传 robots 就不生成。
// - llms：保留给文档站（PR 2）：{ title, summary, ... }，生成根目录和各语言目录的 llms.txt。官网不启用，现在传了会报错。
// - markdownCopies：保留给文档站（PR 2）：为每个页面再输出一份同名的 .md。官网不启用，现在传了会报错。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function robotsTxt({ site, sitemap = 'sitemap-index.xml', allow = '/', disallow = [] }) {
  const origin = String(site).replace(/\/+$/, '');
  return ['User-agent: *', `Allow: ${allow}`, ...disallow.map(d => `Disallow: ${d}`), '', `Sitemap: ${origin}/${sitemap.replace(/^\/+/, '')}`, ''].join('\n');
}

export default function siteFiles(options = {}) {
  for (const k of ['llms', 'markdownCopies']) {
    if (options[k]) throw new Error(`site-shared integration：选项 ${k} 还没有实现（留给文档站迁移到 Astro 时加）`);
  }
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
      },
    },
  };
}
