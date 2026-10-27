// 官网的目录：homepage/content 是正文、译文和博客数据，homepage/dist 是生成的站点（不提交）。
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro 把页面代码打包到 dist/.prerender/ 里再运行，那时 import.meta.url 不再指向 src/lib：astro.config 加载这个文件时（位置是对的）把目录记在环境变量里，打包后的代码读它。
export const HOMEPAGE = process.env.NB_HOMEPAGE_DIR ?? (process.env.NB_HOMEPAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
export const CONTENT = join(HOMEPAGE, 'content');
export const STYLES = join(HOMEPAGE, 'src', 'styles');
export const REPO = resolve(HOMEPAGE, '..');
export const SHARED = join(REPO, 'packages', 'shared');
export const DIST = process.env.SITE_OUT_DIR ? resolve(process.env.SITE_OUT_DIR) : join(HOMEPAGE, 'dist');
