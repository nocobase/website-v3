// 构建结束后的检查（astro:build:done）：站内链接指向的页面和文件都存在、每种语言的页面数一致、产物根目录没有会被 CDN 规则误处理的名字。不通过就让构建失败。
// 译文格式的检查在生成页面时（lib/site.mjs 的 translations）和这里的 checkTranslations 做。
import { fileURLToPath } from 'node:url';
import { runChecks } from '../lib/checks.mjs';
import { getSite } from '../lib/site.mjs';

export default function checks() {
  return {
    name: 'homepage/checks',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const { errors, warnings, summary } = runChecks(fileURLToPath(dir), getSite().pages);
        for (const w of warnings) logger.warn(w);
        for (const line of summary) logger.info(line);
        if (errors.length) {
          for (const e of errors.slice(0, 200)) logger.error(e);
          throw new Error(`构建检查失败：${errors.length} 个错误`);
        }
      },
    },
  };
}
