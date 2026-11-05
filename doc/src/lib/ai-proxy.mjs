// Optional local-development proxy. The browser only needs the docs preview port.
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export function createAiProxy(target) {
  if (!target) return () => false;
  const base = new URL(target.endsWith('/') ? target : `${target}/`);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid DOCS_AI_PROXY_TARGET');
  const request = base.protocol === 'https:' ? httpsRequest : httpRequest;
  return (req, res) => {
    const path = (req.url || '').split('?')[0];
    if (!path.startsWith('/docs-ai/')) return false;
    const route = path.slice('/docs-ai/'.length).replace(/\/$/, '');
    const allowed = req.method === 'POST' ? ['v1/answers', 'v1/answers/stream'] : req.method === 'GET' ? ['health/live', 'health/ready'] : [];
    if (!allowed.includes(route)) { res.writeHead(404); res.end(); return true; }
    // Keep browser security/session headers. Credentials for the model never enter this proxy.
    const headers = {};
    for (const name of ['content-type', 'content-length', 'origin', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-site', 'x-docs-ai-session']) {
      if (req.headers[name]) headers[name] = req.headers[name];
    }
    const upstream = request(new URL(route, base), { method: req.method, headers }, response => {
      if (response.statusCode === 403) console.warn('Docs AI rejected preview origin: %s', req.headers.origin || '(missing)');
      res.writeHead(response.statusCode || 502, {
        'content-type': response.headers['content-type'] || 'application/json',
        'cache-control': 'no-store',
        'x-accel-buffering': 'no',
        ...(response.headers['x-request-id'] ? { 'x-request-id': response.headers['x-request-id'] } : {}),
      });
      res.flushHeaders();
      response.on('error', () => res.destroy());
      response.pipe(res);
    });
    upstream.setTimeout(320_000, () => upstream.destroy(new Error('Answer timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ code: 'local_ai_unavailable' }));
      } else res.destroy();
    });
    req.on('aborted', () => upstream.destroy());
    req.on('error', () => upstream.destroy());
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
    req.pipe(upstream);
    return true;
  };
}
