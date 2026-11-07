import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
import { setupSelectionAsk } from './selection-ask.mjs';
import { askUi, progressMessage } from '../lib/ask-ui.mjs';
import { answerRequest, readAnswer, verifiedCitations } from '../lib/ask.mjs';

// Minimal DOM for exercising the real submit and retry event handlers.
class Element {
  children = [];
  listeners = {};
  value = '';
  dataset = {};
  nodes = {};
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute() {}
  removeAttribute() {}
  focus() {}
  scrollTo() {}
  show() { this.open = true; }
  close() { this.open = false; }
  querySelector(selector) { return this.nodes[selector] ||= new Element(); }
  addEventListener(event, handler) { this.listeners[event] = handler; }
}

test('retry preserves a new draft; submitting that draft clears only its form', async () => {
  const root = new Element();
  root.dataset = { lang: 'en', articles: '{}', endpoint: '/docs-ai', siteId: 'configured-site' };
  const dialog = new Element();
  const input = dialog.querySelector('textarea');
  const form = new Element();
  form.nodes.textarea = input;
  const requests = [];
  const document = new Element();
  document.nodes['[data-ask-root]'] = root;
  document.querySelectorAll = selector => selector === '[data-ask-form]' ? [form] : [];
  document.getElementById = id => id === 'docChat' ? dialog : null;
  document.createElement = tag => Object.assign(new Element(), { tag });
  const source = readFileSync(new URL('./ask.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  runInNewContext(source, {
    document, setupSelectionAsk, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/' },
    askUi, progressMessage,
    sessionId: () => 'test',
    answerRequest,
    fetch: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      throw new Error('offline');
    },
  });
  const submit = async () => {
    form.listeners.submit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
  };
  input.value = 'Old question';
  await submit();
  expect(input.value).toBe('');
  const messages = dialog.querySelector('.doc-chat-messages');
  const body = messages.children[1].children[0];
  const retry = body.children[1].children[0];
  input.value = 'New draft';
  await retry.listeners.click();
  expect(input.value).toBe('New draft');
  expect(requests.map(r => r.question)).toEqual(['Old question', 'Old question']);
  expect(requests).toEqual(Array(2).fill({ siteId: 'configured-site', question: 'Old question', language: 'en-US', currentPage: 'https://docs.nocobase.com/' }));
  await submit();
  expect(input.value).toBe('');
  expect(requests.at(-1).question).toBe('New draft');
  expect(messages.children).toHaveLength(2);
  expect(messages.children[0].children[0].textContent).toBe('New draft');
  expect(messages.children[1].children[0]).not.toBe(body);
});

test.each(['button', 'Escape'])('%s stops generation without closing the panel or losing a draft', async method => {
  const root = new Element();
  root.dataset = { lang: 'en', articles: '{}', endpoint: '/docs-ai', siteId: 'configured-site' };
  const dialog = new Element();
  const form = dialog.querySelector('[data-ask-form]');
  const input = dialog.querySelector('textarea');
  form.nodes.textarea = input;
  const send = dialog.querySelector('[data-chat-send]');
  const document = new Element();
  document.nodes['[data-ask-root]'] = root;
  document.querySelectorAll = selector => selector === '[data-ask-form]' ? [form] : [];
  document.getElementById = id => id === 'docChat' ? dialog : null;
  document.createElement = tag => Object.assign(new Element(), { tag });
  const signals = [];
  runInNewContext(readFileSync(new URL('./ask.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, ''), {
    document, setupSelectionAsk, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/' },
    askUi, progressMessage,
    sessionId: () => 'test', answerRequest,
    fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
      signals.push(signal);
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  });
  input.value = 'First question';
  form.listeners.submit({ preventDefault() {} });
  expect(send.type).toBe('button');
  expect(send.querySelector('[data-stop-icon]').hidden).toBe(false);
  input.value = 'Unsent draft';
  let prevented = false;
  const event = { key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() {} };
  if (method === 'button') send.listeners.click(event);
  else dialog.listeners.keydown(event);
  await new Promise(resolve => setImmediate(resolve));
  expect(prevented).toBe(true);
  expect(signals[0].aborted).toBe(true);
  expect(dialog.open).toBe(true);
  expect(input.value).toBe('Unsent draft');
  expect(send.type).toBe('submit');
  expect(send.querySelector('[data-stop-icon]').hidden).toBe(true);
  const messages = dialog.querySelector('.doc-chat-messages');
  expect(messages.children[1].children[0].children[0].textContent).toBe('Generation stopped.');
  form.listeners.submit({ preventDefault() {} });
  expect(signals).toHaveLength(2);
  send.listeners.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  expect(signals[1].aborted).toBe(true);
  expect(messages.children).toHaveLength(2);
  expect(send.type).toBe('submit');
  // Escape closes the non-modal sidebar once no generation is active.
  dialog.listeners.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
  expect(dialog.open).toBe(false);
});

test('progress messages use interface language and preserve unknown server stages', () => {
  expect(progressMessage({ stage: 'reading_docs', message: 'Reading' }, askUi['zh-CN'])).toBe('正在阅读相关文档…');
  expect(progressMessage({ stage: 'retrying' }, askUi['ja-JP'])).toContain('再試行');
  expect(progressMessage({ stage: 'future_stage', message: 'Server progress' }, askUi.en)).toBe('Server progress');
  expect(progressMessage({ stage: 'future_stage' }, askUi.en)).toBe(askUi.en.waiting);
});

test.each(['en', 'zh-CN', 'ja-JP'])('streamed stages update the visible status in %s until the answer arrives', async lang => {
  const root = new Element();
  root.dataset = { lang, articles: '{}', endpoint: '/docs-ai' };
  const dialog = new Element();
  const form = dialog.querySelector('[data-ask-form]');
  form.nodes.textarea = dialog.querySelector('textarea');
  const document = new Element();
  document.nodes['[data-ask-root]'] = root;
  document.querySelectorAll = selector => selector === '[data-ask-form]' ? [form] : [];
  document.getElementById = id => id === 'docChat' ? dialog : null;
  document.createElement = tag => Object.assign(new Element(), { tag });
  let stream;
  const response = new Response(new ReadableStream({ start(controller) { stream = controller; } }));
  runInNewContext(readFileSync(new URL('./ask.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, ''), {
    document, setupSelectionAsk, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/' },
    askUi, progressMessage, answerRequest, readAnswer, verifiedCitations,
    sessionId: () => 'test', fetch: async () => response,
  });
  form.nodes.textarea.value = 'How do I create an app?';
  form.listeners.submit({ preventDefault() {} });
  const body = dialog.querySelector('.doc-chat-messages').children[1].children[0];
  expect(body.children).toHaveLength(1);
  expect(body.children[0].textContent).toBe(askUi[lang].submitting);
  const emit = async event => {
    stream.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
    await new Promise(resolve => setImmediate(resolve));
  };
  try {
    for (const [stage, message] of Object.entries(askUi[lang].progress)) {
      await emit({ type: 'progress', stage, message: 'Server progress' });
      expect(body.children).toHaveLength(1);
      expect(body.children[0].textContent).toBe(message);
    }
    await emit({ type: 'progress', stage: 'future_stage', message: 'Additional progress' });
    expect(body.children[0].textContent).toBe('Additional progress');
    await emit({ type: 'answer', data: { status: 'insufficient_evidence', answer: '', citations: [] } });
    expect(body.children[0].textContent).toBe(askUi[lang].insufficient_evidence);
    expect(dialog.querySelector('[data-chat-send]').type).toBe('submit');
  } finally {
    dialog.querySelector('[data-chat-send]').listeners.click({ preventDefault() {} });
    try { stream.close(); } catch { /* readAnswer cancels the completed stream. */ }
    await new Promise(resolve => setImmediate(resolve));
  }
});

function quoteHarness() {
  const root = new Element();
  root.dataset = { lang: 'zh-CN', articles: '{}', endpoint: '/docs-ai' };
  const dialog = new Element();
  const form = dialog.querySelector('[data-ask-form]');
  const input = dialog.querySelector('textarea');
  form.nodes.textarea = input;
  const document = new Element();
  document.nodes['[data-ask-root]'] = root;
  document.querySelectorAll = selector => selector === '[data-ask-form]' ? [form] : [];
  document.getElementById = id => id === 'docChat' ? dialog : null;
  document.createElement = tag => Object.assign(new Element(), { tag });
  const requests = [];
  let select;
  runInNewContext(readFileSync(new URL('./ask.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, ''), {
    document, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/zh-CN/' }, askUi, progressMessage, answerRequest,
    sessionId: () => 'test',
    setupSelectionAsk: (_doc, _ui, callback) => { select = callback; return { setBusy() {} }; },
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); throw new Error('offline'); },
  });
  return { dialog, input, requests, select, submit: () => form.listeners.submit({ preventDefault() {} }) };
}

test('selection opens a quote draft without sending; submission includes quote and question', async () => {
  const { dialog, input, requests, select, submit } = quoteHarness();
  input.value = '已有草稿';
  select('选中的原文');
  expect(dialog.open).toBe(true);
  expect(requests).toHaveLength(0);
  expect(input.value).toBe('已有草稿');
  expect(input.placeholder).toBe(askUi['zh-CN'].quotePlaceholder);
  expect(dialog.querySelector('[data-quote-text]').textContent).toBe('选中的原文');
  expect(dialog.querySelector('[data-chat-quote]').hidden).toBe(false);
  input.value = '';
  submit();
  expect(requests).toHaveLength(0);
  input.value = '如何配置？';
  submit();
  await new Promise(resolve => setImmediate(resolve));
  expect(requests[0].question).toBe('引用原文:\n选中的原文\n\n如何配置？');
  expect(input.value).toBe('');
  expect(dialog.querySelector('[data-chat-quote]').hidden).toBe(true);
  const messages = dialog.querySelector('.doc-chat-messages');
  const retry = messages.children[1].children[0].children[1].children[0];
  select('新的引用');
  input.value = '新的草稿';
  await retry.listeners.click();
  expect(requests[1].question).toBe(requests[0].question);
  expect(input.value).toBe('新的草稿');
  expect(dialog.querySelector('[data-quote-text]').textContent).toBe('新的引用');
});

test('removing a quote preserves the draft; oversized combinations never send or discard it', async () => {
  const { dialog, input, requests, select, submit } = quoteHarness();
  select('文'.repeat(490));
  input.value = '问'.repeat(30);
  submit();
  expect(requests).toHaveLength(0);
  expect(input.value).toHaveLength(30);
  expect(dialog.querySelector('[data-quote-error]').hidden).toBe(false);
  expect(dialog.querySelector('[data-quote-text]').title).toBe('文'.repeat(490));
  dialog.querySelector('[data-quote-remove]').listeners.click();
  expect(dialog.querySelector('[data-chat-quote]').hidden).toBe(true);
  expect(dialog.querySelector('[data-quote-error]').hidden).toBe(true);
  expect(input.value).toHaveLength(30);
  submit();
  await new Promise(resolve => setImmediate(resolve));
  expect(requests[0].question).toBe('问'.repeat(30));
});
