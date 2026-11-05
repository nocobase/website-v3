import { createServer } from 'node:http';
import { once } from 'node:events';
import { afterEach, expect, it } from 'vitest';
import { createAiProxy } from './ai-proxy.mjs';

const servers = [];
async function listen(handler) {
  const server = createServer(handler);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }))); });

it('streams progress before completion and preserves request security headers and body', async () => {
  let seen, finish;
  const target = await listen(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    seen = { path: req.url, origin: req.headers.origin, session: req.headers['x-docs-ai-session'], cookie: req.headers.cookie, body };
    res.writeHead(200, { 'content-type': 'application/x-ndjson', 'x-request-id': 'request-1' });
    res.write('{"type":"progress"}\n');
    finish = () => res.end('{"type":"answer"}\n');
  });
  const proxy = createAiProxy(target);
  const local = await listen((req, res) => proxy(req, res));
  const response = await fetch(`${local}/docs-ai/v1/answers/stream/`, { method: 'POST', headers: { origin: 'http://localhost:4322', 'x-docs-ai-session': 'session-1', cookie: 'private=1' }, body: '{"question":"Core?"}' });
  expect(response.headers.get('x-request-id')).toBe('request-1');
  const reader = response.body.getReader();
  expect(new TextDecoder().decode((await reader.read()).value)).toBe('{"type":"progress"}\n');
  expect(seen).toEqual({ path: '/v1/answers/stream', origin: 'http://localhost:4322', session: 'session-1', cookie: undefined, body: '{"question":"Core?"}' });
  finish();
  expect(new TextDecoder().decode((await reader.read()).value)).toBe('{"type":"answer"}\n');
  await reader.cancel();
});

it('is opt-in and cannot proxy arbitrary paths', async () => {
  expect(createAiProxy('')({}, {})).toBe(false);
  const proxy = createAiProxy('http://127.0.0.1:1');
  const local = await listen((req, res) => { if (!proxy(req, res)) { res.writeHead(204); res.end(); } });
  expect((await fetch(`${local}/core/`)).status).toBe(204);
  expect((await fetch(`${local}/docs-ai/../../secret`)).status).toBe(204);
  expect((await fetch(`${local}/docs-ai/secret`)).status).toBe(404);
  expect((await fetch(`${local}/docs-ai/v1/answers/stream`)).status).toBe(404);
  expect((await fetch(`${local}/docs-ai/health/ready`)).status).toBe(502);
});
