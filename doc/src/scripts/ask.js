import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { answerRequest, readAnswer, sessionId, citationPath, verifiedCitations } from '../lib/ask.mjs';
import { askUi, progressMessage } from '../lib/ask-ui.mjs';

import { setupSelectionAsk } from './selection-ask.mjs';

const root = document.querySelector('[data-ask-root]');
const dialog = document.getElementById('docChat');
if (root && dialog) {
  const ui = askUi[root.dataset.lang] || askUi.en;
  const articles = JSON.parse(root.dataset.articles);
  const paths = new Set(Object.keys(articles));
  const messages = dialog.querySelector('.doc-chat-messages');
  const input = dialog.querySelector('textarea');
  const viewport = dialog.querySelector('.doc-chat-scroll');
  const welcome = dialog.querySelector('[data-chat-welcome]');
  const composer = dialog.querySelector('[data-ask-form]');
  const send = dialog.querySelector('[data-chat-send]');
  const launcher = document.querySelector('[data-chat-open]');
  const forms = [...document.querySelectorAll('[data-ask-form]')];
  const quoteCard = dialog.querySelector('[data-chat-quote]');
  const quoteText = dialog.querySelector('[data-quote-text]');
  const quoteError = dialog.querySelector('[data-quote-error]');
  let quote = '';
  const withQuote = question => quote ? `${ui.quote}:\n${quote}\n\n${question.trim()}` : question;
  const validateQuote = question => {
    const valid = [...withQuote(question).trim()].length <= 500;
    quoteError.hidden = valid;
    return valid;
  };
  const setQuote = text => {
    quote = text;
    quoteText.textContent = text;
    quoteCard.hidden = !text;
    quoteText.title = text;
    input.placeholder = text ? ui.quotePlaceholder : ui.placeholder;
    validateQuote(input.value);
  };
  let active;
  let selectionAsk;
  let opener;
  const element = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const scroll = () => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'instant' });
  const busy = value => {
    selectionAsk?.setBusy(value);
    forms.forEach(form => {
      if (form !== composer) form.querySelector('button[type="submit"]').disabled = value;
    });
    send.type = value ? 'button' : 'submit';
    send.setAttribute('aria-label', value ? ui.cancel : ui.send);
    send.title = value ? `${ui.cancel} (Esc)` : ui.send;
    send.querySelector('[data-send-icon]').hidden = value;
    send.querySelector('[data-stop-icon]').hidden = !value;
  };
  const open = () => {
    if (!dialog.open) { opener = document.activeElement; dialog.show(); }
    if (launcher) { launcher.setAttribute('aria-expanded', 'true'); }
    document.getElementById('docSearch')?.close();
    document.getElementById('nav')?.classList.remove('open');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
    input.focus();
  };
  // Construct DOM from Markdown, dropping raw HTML, images and unverified links.
  const markdown = (text, parent, citations) => {
    const allowed = new Set(citations.map(c => c.url));
    const render = (node, into) => {
      if (node.type === 'html' || node.type === 'image') return;
      if (node.type === 'text') { into.append(document.createTextNode(node.value)); return; }
      if (node.type === 'code') { const pre = element('pre'); pre.append(element('code', node.value)); into.append(pre); return; }
      if (node.type === 'inlineCode') { into.append(element('code', node.value)); return; }
      if (node.type === 'break') { into.append(element('br')); return; }
      let tag = { paragraph: 'p', strong: 'strong', emphasis: 'em', blockquote: 'blockquote', listItem: 'li', thematicBreak: 'hr' }[node.type];
      if (node.type === 'heading') tag = 'h4';
      if (node.type === 'list') tag = node.ordered ? 'ol' : 'ul';
      if (node.type === 'link' && allowed.has(node.url)) tag = 'a';
      const target = tag ? element(tag) : into;
      if (tag === 'a') target.href = citationPath(node.url, paths);
      if (tag === 'ol' && Number.isInteger(node.start)) target.start = node.start;
      for (const child of node.children || []) render(child, target);
      if (tag) into.append(target);
    };
    render(unified().use(remarkParse).parse(text), parent);
  };
  const appendMessage = (text, user = false) => {
    welcome.hidden = true;
    const wrapper = element('section', '', user ? 'doc-chat-message is-user' : 'doc-chat-message');
    wrapper.setAttribute('aria-label', user ? ui.you : ui.assistant);
    const body = element('div', text, user ? 'doc-chat-user' : 'doc-chat-answer');
    wrapper.append(body);
    messages.append(wrapper);
    scroll();
    return body;
  };
  const renderAnswer = (data, body) => {
    body.replaceChildren();
    const citations = verifiedCitations(data.citations, paths);
    if (data.status !== 'answered') body.append(element('p', ui[data.status], 'doc-chat-notice'));
    if (data.degraded || (data.status === 'answered' && !citations.length)) body.append(element('p', ui.degraded, 'doc-chat-notice'));
    // Do not present an ungrounded or legacy-corpus answer as a summary of this site's docs.
    if (data.status === 'answered' && !citations.length) return;
    if (data.status !== 'insufficient_evidence') markdown(data.answer, body, citations);
    for (const [key, title, tag] of [['steps', ui.steps, 'ol'], ['appliesWhen', ui.applies, 'ul'], ['missingInformation', ui.missing, 'ul']]) {
      const values = Array.isArray(data[key]) ? data[key].filter(v => typeof v === 'string') : [];
      if (!values.length) continue;
      body.append(element('h3', title));
      const list = element(tag);
      for (const value of values) { const li = element('li'); markdown(value, li, citations); list.append(li); }
      body.append(list);
    }
    if (typeof data.followUpQuestion === 'string') body.append(element('p', data.followUpQuestion));
    if (citations.length) {
      const sources = element('section', '', 'doc-chat-sources');
      sources.append(element('h3', ui.sources));
      for (const citation of citations) {
        const href = citationPath(citation.url, paths);
        const a = element('a', articles[href.split('#')[0]] || citation.title);
        a.href = href;
        sources.append(a);
      }
      body.append(sources);
    }
  };
  const submit = async (question, existingBody) => {
    if (active || !question.trim()) return;
    question = question.trim();
    open();
    if (!existingBody) {
      messages.replaceChildren();
      appendMessage(question, true);
    }
    const body = existingBody || appendMessage('');
    body.replaceChildren();
    const status = element('p', ui.submitting, 'doc-chat-status');
    status.setAttribute('role', 'status');
    body.append(status);
    scroll();
    body.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    active = controller;
    busy(true);
    const timeout = setTimeout(() => controller.abort('timeout'), 310_000);
    try {
      if (!root.dataset.endpoint) throw new Error('unconfigured');
      const response = await fetch(`${root.dataset.endpoint.replace(/\/$/, '')}/v1/answers/stream${root.dataset.endpoint.startsWith('/') ? '/' : ''}`, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'X-Docs-AI-Session': sessionId() },
        body: JSON.stringify(answerRequest(question, root.dataset.lang, `https://docs.nocobase.com${location.pathname}`, root.dataset.siteId)),
        signal: controller.signal,
      });
      const answer = await readAnswer(response, event => {
        status.textContent = progressMessage(event, ui);
      });
      if (!controller.signal.aborted) renderAnswer(answer, body);
    } catch (error) {
      const cancelled = controller.signal.aborted && controller.signal.reason !== 'timeout';
      body.replaceChildren(element('p', cancelled ? ui.cancelled : error.message === 'unconfigured' ? ui.unavailable : error.status === 403 ? ui.forbidden : error.status === 429 ? ui.rate : ui.error, 'doc-chat-status'));
      if (error.requestId) body.append(element('p', `${ui.request}: ${error.requestId}`, 'doc-chat-status'));
      const actions = element('div', '', 'doc-chat-actions');
      const retry = element('button', ui.retry);
      retry.type = 'button';
      retry.addEventListener('click', () => submit(question, body));
      const search = element('button', ui.search);
      search.type = 'button';
      search.setAttribute('data-search-open', '');
      actions.append(retry, search);
      body.append(actions);
    } finally {
      body.removeAttribute('aria-busy');
      clearTimeout(timeout);
      if (active === controller) { active = undefined; busy(false); }
      scroll();
    }
  };
  selectionAsk = setupSelectionAsk(document, ui, text => {
    setQuote(text);
    open();
  });
  dialog.querySelector('[data-quote-remove]').addEventListener('click', () => {
    setQuote('');
    input.focus();
  });
  input.addEventListener('input', () => validateQuote(input.value));
  forms.forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const textarea = form.querySelector('textarea');
      let question = textarea.value;
      if (active || !question.trim()) return;
      if (form === composer) {
        if (!validateQuote(question)) return;
        question = withQuote(question);
      }
      textarea.value = '';
      if (form === composer) setQuote('');
      submit(question);
    });
    form.querySelector('textarea').addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
    });
  });
  document.querySelectorAll('[data-ask-question]').forEach(button => button.addEventListener('click', () => submit(button.dataset.askQuestion)));
  send.addEventListener('click', event => {
    if (active) { event.preventDefault(); active.abort(); }
  });
  // Non-modal dialogs need explicit Escape handling, scoped to the sidebar.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    if (active) active.abort();
    else dialog.close();
  });
  dialog.querySelector('[data-chat-close]').addEventListener('click', () => dialog.close());
  if (launcher) { launcher.addEventListener('click', open); }
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      dialog.open ? dialog.close() : open();
    }
  });
  dialog.addEventListener('close', () => {
    // Closing hides the conversation; Stop or Escape during generation stops a request.
    if (launcher) { launcher.setAttribute('aria-expanded', 'false'); }
    if (!document.querySelector('dialog[open]')) opener?.focus();
  });
}
