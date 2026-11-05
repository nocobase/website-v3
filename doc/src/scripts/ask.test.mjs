import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';

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
  root.dataset = { lang: 'en', articles: '{}', endpoint: '/docs-ai' };
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
    answerRequest: question => ({ question }),
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
  const body = messages.children[1].children[1];
  const retry = body.children[1].children[0];
  input.value = 'New draft';
  await retry.listeners.click();
  expect(input.value).toBe('New draft');
  expect(requests.map(r => r.question)).toEqual(['Old question', 'Old question']);
  await submit();
  expect(input.value).toBe('');
  expect(requests.at(-1).question).toBe('New draft');
});
