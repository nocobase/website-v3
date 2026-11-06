import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
import { answerRequest } from '../lib/ask.mjs';

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
  showModal() { this.open = true; }
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
    document, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/' },
    askUi: { en: { retry: 'Retry' } },
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
    document, AbortController, setTimeout, clearTimeout,
    location: { pathname: '/' },
    askUi: { en: { send: 'Ask', cancel: 'Stop generating', cancelled: 'Generation stopped.' } },
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
  const event = { preventDefault() { prevented = true; } };
  if (method === 'button') send.listeners.click(event);
  else dialog.listeners.cancel(event);
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
  expect(dialog.querySelector('[data-chat-clear]').hidden).toBe(true);
  send.listeners.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  expect(signals[1].aborted).toBe(true);
  expect(messages.children).toHaveLength(2);
  expect(send.type).toBe('submit');
  // Escape closes normally once no generation is active.
  let idlePrevented = false;
  dialog.listeners.cancel({ preventDefault() { idlePrevented = true; } });
  expect(idlePrevented).toBe(false);
});
