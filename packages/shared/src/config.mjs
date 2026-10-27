// 官网和文档站共用的配置：v2 旧文档地址的一级路径名单、GitHub 星标数。
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro 把页面代码打包到 dist/.prerender/ 里再运行，相对 import.meta.url 的路径就不对了：找不到时按包名解析（从 dist 往上找 node_modules）。
const beside = join(dirname(fileURLToPath(import.meta.url)), '..', 'v2-redirect-prefixes.txt');
export const V2_REDIRECT_PREFIXES_FILE = existsSync(beside) ? beside : createRequire(import.meta.url).resolve('@nocobase/site-shared/v2-redirect-prefixes.txt');

// docs.nocobase.com 上 301 到 v2 文档 nocode.docs.nocobase.com 的一级路径（和 CDN 的 EdgeScript 规则 v2_paths_to_nocode_301 一致）
export function readV2RedirectPrefixes(file = V2_REDIRECT_PREFIXES_FILE) {
  return new Set(readFileSync(file, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')));
}

// 顶部导航里的 GitHub 星标数：默认值写死在这里；构建时环境变量 GITHUB_STARS（原始数字，如 24631）存在就换成它，格式化成 24.6K。
// 星标数只在构建时读，浏览器里不请求 GitHub。
export const GITHUB_REPO = 'nocobase/nocobase';
export const GITHUB_STARS_DEFAULT = '24.6K';

export function formatStars(n) {
  n = Number(n);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '.0') + 'K';
  return (Math.floor(n / 1e5) / 10).toFixed(1) + 'M';
}

export function githubStars(env = process.env) {
  const raw = (env.GITHUB_STARS || '').trim();
  return (/^\d+$/.test(raw) && formatStars(raw)) || GITHUB_STARS_DEFAULT;
}
