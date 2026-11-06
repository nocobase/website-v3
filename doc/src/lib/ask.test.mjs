import { describe, it, expect } from 'vitest';
import { answerRequest, readAnswer, citationPath, verifiedCitations } from './ask.mjs';

const answer = { status: 'answered', answer: '可以创建应用。', citations: [], degraded: true };
const stream = chunks => new Response(new ReadableStream({ start(controller) { chunks.forEach(c => controller.enqueue(c)); controller.close(); } }), { headers: { 'x-request-id': 'request-1' } });
const encode = text => new TextEncoder().encode(text);

describe('docs-ai-service adapter', () => {
  it('sends the service language and optional site without a product version or conversation history', () => {
    expect(answerRequest('  Create an app?  ', 'en', 'https://docs.nocobase.com/')).toEqual({ question: 'Create an app?', language: 'en-US', currentPage: 'https://docs.nocobase.com/' });
    expect(answerRequest('权限？', 'zh-CN', '/zh-CN/', 'nocobase-v3')).toEqual({ siteId: 'nocobase-v3', question: '权限？', language: 'zh-CN', currentPage: '/zh-CN/' });
    for (const siteId of ['', 'a/b', 'a b', 'x'.repeat(65)]) expect(() => answerRequest('Question', 'en', '/', siteId)).toThrow('Invalid siteId');
    expect(() => answerRequest(' ', 'zh-CN', '/')).toThrow();
    expect(() => answerRequest('x'.repeat(501), 'en', '/')).toThrow();
    expect(answerRequest('😀'.repeat(500), 'ja-JP', '/').language).toBe('ja-JP');
  });
  it('handles split NDJSON records, UTF-8 boundaries and a final line without newline', async () => {
    const bytes = encode(JSON.stringify({ type: 'progress', message: '正在搜索' }) + '\r\n\n' + JSON.stringify({ type: 'answer', data: answer }));
    const progress = [];
    expect(await readAnswer(stream(Array.from(bytes, byte => new Uint8Array([byte]))), p => progress.push(p.message))).toEqual(answer);
    expect(progress).toEqual(['正在搜索']);
  });
  it('rejects service errors, invalid payloads and truncated streams with request IDs', async () => {
    await expect(readAnswer(new Response('', { status: 403, headers: { 'x-request-id': 'origin-denied' } }))).rejects.toMatchObject({ status: 403, requestId: 'origin-denied' });
    await expect(readAnswer(new Response('', { status: 429, headers: { 'x-request-id': 'limited' } }))).rejects.toMatchObject({ status: 429, requestId: 'limited' });
    await expect(readAnswer(stream([encode('{"type":"error","request_id":"failed"}\n')]))).rejects.toMatchObject({ requestId: 'failed' });
    for (const text of ['{broken}\n', '{"type":"progress","message":"Wait"}\n', '{"type":"answer","data":{}}\n']) {
      await expect(readAnswer(stream([encode(text)]))).rejects.toMatchObject({ requestId: 'request-1' });
    }
  });
  it('accepts only published current-site articles with safe official URLs and verification', () => {
    const paths = new Set(['/core/', '/zh-CN/core/']);
    expect(citationPath('https://docs.nocobase.com/core#setup', paths)).toBe('/core/#setup');
    for (const url of ['javascript:alert(1)', 'https://evil.test/core/', 'https://docs.nocobase.com.evil.test/core/', 'https://user@docs.nocobase.com/core/', 'https://docs.nocobase.com/guide/', 'https://nocode.docs.nocobase.com/core/']) expect(citationPath(url, paths)).toBeNull();
    const good = { title: 'Core', url: 'https://docs.nocobase.com/core/', verificationStatus: 'index_verified' };
    expect(verifiedCitations([good, { ...good, verificationStatus: 'unverified' }, { ...good, url: 'https://docs.nocobase.com/guide/' }], paths)).toEqual([good]);
  });
});
