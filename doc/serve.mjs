#!/usr/bin/env node
// 本地预览 dist/：按 CDN 回源规则的约定把地址映射到文件。不带扩展名的地址读 <路径>/index.html，以 / 结尾的读 index.html，
// 找不到时返回所在语言的 404.html。只用于本地预览，线上由 CDN 和 OSS 提供。
// 运行：node doc/serve.mjs（先 node doc/build.mjs），端口读 PORT，默认 4321。
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.DOCS_OUT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  const last = path.split('/').pop();
  const file = join(root, path.endsWith('/') ? `${path}index.html` : last.includes('.') ? path : `${path}/index.html`);
  if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  const notFound = join(root, path.startsWith('/zh-CN/') ? 'zh-CN' : '', '404.html');
  res.writeHead(404, { 'content-type': TYPES['.html'] });
  res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
}).listen(port, () => console.log(`文档站预览：http://localhost:${port}/`));
