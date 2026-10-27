// Previews doc/dist/ the way the CDN's back-to-origin rules map addresses (scripts/deploy-cdn/deploy-cdn.mjs, REWRITE_RULES): an address ending in / reads <path>/index.html, an address whose last segment has no dot reads <path>/index.html, others read the file. Anything not found returns the root 404.html with status 404.
// Run: pnpm preview (after pnpm build). PORT sets the port (default 4321).
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { DIST } from '../src/lib/paths.mjs';

const port = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.zip': 'application/zip' };

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  const last = path.slice(path.lastIndexOf('/') + 1);
  const file = join(DIST, path.endsWith('/') ? `${path}index.html` : last.includes('.') ? path : `${path}/index.html`);
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  const notFound = join(DIST, '404.html');
  res.writeHead(404, { 'content-type': TYPES['.html'] });
  res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
}).listen(port, () => console.log(`Docs preview: http://localhost:${port}/`));
