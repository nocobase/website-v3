// 本地预览 homepage/dist/：按 CDN 回源规则（scripts/deploy-cdn/deploy-cdn.mjs 的 REWRITE_RULES）把地址映射到文件。
// 以 / 结尾的地址读 <路径>/index.html，不带扩展名的地址（最后一段没有点号）读 <路径>/index.html，其他读同名文件；/en/… 和线上一样当成根目录。
// 找不到时返回根目录的 404.html，状态码 404（线上 bucket 的 404 页面也是它）。只用于本地预览。
// 运行：pnpm preview（先 pnpm build），端口读 PORT，默认 4322。
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { DIST } from '../src/lib/paths.mjs';

const port = Number(process.env.PORT || 4322);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

// 和线上一样让浏览器缓存打包出来的资源（/_astro/ 下的文件名带内容哈希，线上 CDN 缓存 30 天）：不缓存的话每次切换页面都重新下载字体，文字会先用备用字体显示再换掉，看起来像抖了一下。页面本身不缓存，重新构建后刷新就能看到
const cacheOf = (path) => (path.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache');

createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  path = path.replace(/^\/en(\/|$)/, '/');
  const last = path.slice(path.lastIndexOf('/') + 1);
  const file = join(DIST, path.endsWith('/') ? path + 'index.html' : last.includes('.') ? path : path + '/index.html');
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': cacheOf(path) });
    return res.end(readFileSync(file));
  }
  const notFound = join(DIST, '404.html');
  res.writeHead(404, { 'content-type': TYPES['.html'] });
  res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
}).listen(port, () => console.log(`官网预览：http://localhost:${port}/`));
