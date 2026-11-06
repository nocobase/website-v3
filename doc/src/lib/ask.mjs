// Contract: nocobase/docs-ai-service src/model.rs (NDJSON, single question only).
export class AnswerError extends Error {
  constructor(requestId = '', status = 0) {
    super('Documentation answer request failed');
    this.requestId = requestId;
    this.status = status;
  }
}

export function answerRequest(question, language, currentPage, siteId) {
  question = question.trim();
  if (!question || [...question].length > 500) throw new Error('Invalid question');
  if (siteId !== undefined && !/^[A-Za-z0-9_-]{1,64}$/.test(siteId)) throw new Error('Invalid siteId');
  return { ...(siteId === undefined ? {} : { siteId }), question, language: language === 'en' ? 'en-US' : language, currentPage };
}

export async function readAnswer(response, onProgress = () => {}) {
  const requestId = response.headers.get('x-request-id') || '';
  if (!response.ok || !response.body) throw new AnswerError(requestId, response.status);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let size = 0;
  const parse = line => {
    if (!line.trim()) return;
    let event;
    try { event = JSON.parse(line); } catch { throw new AnswerError(requestId); }
    if (event.type === 'error') throw new AnswerError(event.request_id || requestId);
    if (event.type === 'progress' && typeof event.message === 'string') onProgress(event);
    if (event.type === 'answer') {
      const data = event.data;
      if (!data || typeof data.answer !== 'string' || !['answered', 'insufficient_evidence', 'clarification_required', 'refused'].includes(data.status) || !Array.isArray(data.citations)) throw new AnswerError(requestId);
      return data;
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      size += value?.byteLength || 0;
      if (size > 2_000_000) throw new AnswerError(requestId);
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      for (const line of lines) { const result = parse(line); if (result) return result; }
      if (done) { const result = parse(pending); if (result) return result; break; }
    }
    throw new AnswerError(requestId);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// Only cite published articles in this build, never legacy v2 routes or arbitrary model URLs.
export function citationPath(value, paths) {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://docs.nocobase.com' || url.username || url.password) return null;
    const path = url.pathname.replace(/\/$/, '') + '/';
    if (!paths.has(path)) return null;
    return path + url.hash;
  } catch { return null; }
}

export function verifiedCitations(citations, paths) {
  return citations.filter(c => c && typeof c.title === 'string' && ['live_verified', 'index_verified'].includes(c.verificationStatus) && citationPath(c.url, paths));
}

let memorySession;
export function sessionId() {
  if (memorySession) return memorySession;
  const key = 'nocobase-docs-ai-session';
  try {
    const saved = sessionStorage.getItem(key);
    if (/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(saved || '')) return (memorySession = saved);
  } catch { /* Storage is optional. */ }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  memorySession = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  try { sessionStorage.setItem(key, memorySession); } catch { /* Use the in-memory session. */ }
  return memorySession;
}
