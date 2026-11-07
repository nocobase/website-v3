import { expect, test, vi } from 'vitest';
import { setupSelectionAsk } from './selection-ask.mjs';
import { askUi } from '../lib/ask-ui.mjs';

function setup() {
  const target = () => ({ listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  const label = {};
  const button = Object.assign(target(), {
    hidden: true, style: {}, contains: node => node === button,
    querySelector: () => label, getBoundingClientRect: () => ({ width: 100, height: 36 }),
  });
  const node = { nodeType: 1, closest: () => null };
  const range = { commonAncestorContainer: node, getClientRects: () => [{ left: 150, top: 100, bottom: 120, width: 100, height: 20 }] };
  const selection = { isCollapsed: false, rangeCount: 1, toString: () => 'Selected question', getRangeAt: () => range, removeAllRanges: vi.fn() };
  const window = Object.assign(target(), { getSelection: () => selection, innerWidth: 800, innerHeight: 600 });
  const document = Object.assign(target(), {
    defaultView: window, getElementById: () => button,
    querySelector: () => ({ contains: n => n === node }),
  });
  const submit = vi.fn();
  const api = setupSelectionAsk(document, askUi.en, submit);
  const update = () => document.listeners.pointerup();
  return { button, document, selection, range, update, submit, api, label, window };
}

test('positions the action below selected text and submits it once on activation', () => {
  const { button, update, submit, selection } = setup();
  update();
  expect(button.hidden).toBe(false);
  expect(button.style).toEqual({ left: '150px', top: '128px' });
  const preventDefault = vi.fn();
  button.listeners.pointerdown({ preventDefault });
  expect(preventDefault).toHaveBeenCalled();
  button.listeners.click();
  button.listeners.click();
  expect(submit).toHaveBeenCalledExactlyOnceWith('Selected question');
  expect(selection.removeAllRanges).toHaveBeenCalled();
  expect(button.hidden).toBe(true);
});

test('ignores collapsed, blank and non-article selections', () => {
  const { button, selection, range, update } = setup();
  selection.isCollapsed = true;
  update();
  expect(button.hidden).toBe(true);
  selection.isCollapsed = false;
  selection.toString = () => '  ';
  update();
  expect(button.hidden).toBe(true);
  selection.toString = () => 'Navigation';
  range.commonAncestorContainer = {};
  update();
  expect(button.hidden).toBe(true);
});

test('blocks oversized selections and concurrent requests without truncating text', () => {
  const { button, selection, update, submit, api, label } = setup();
  selection.toString = () => '文'.repeat(501);
  update();
  expect(button.disabled).toBe(true);
  expect(label.textContent).toBe(askUi.en.selectionTooLong);
  button.listeners.click();
  expect(submit).not.toHaveBeenCalled();
  selection.toString = () => '文'.repeat(500);
  api.setBusy(true);
  update();
  expect(button.disabled).toBe(true);
  api.setBusy(false);
  update();
  expect(button.disabled).toBe(false);
  button.listeners.click();
  expect(submit).toHaveBeenCalledExactlyOnceWith('文'.repeat(500));
});

test('keeps the action inside the viewport and dismisses on scroll, resize and Escape', () => {
  const { button, document, range, update, window } = setup();
  range.getClientRects = () => [{ left: 780, top: 580, bottom: 598, width: 20, height: 18 }];
  update();
  expect(button.style).toEqual({ left: '692px', top: '556px' });
  document.listeners.scroll();
  expect(button.hidden).toBe(true);
  update();
  window.listeners.resize();
  expect(button.hidden).toBe(true);
  update();
  document.listeners.keydown({ key: 'Escape' });
  expect(button.hidden).toBe(true);
});


test('shows the action only on release, not while the selection changes', () => {
  const { button, document, selection, update } = setup();
  document.listeners.pointerdown({ target: {} });
  document.listeners.selectionchange();
  expect(button.hidden).toBe(true);
  selection.toString = () => 'A longer selection';
  document.listeners.selectionchange();
  expect(button.hidden).toBe(true);
  update();
  expect(button.hidden).toBe(false);
  // A queued selectionchange after release must not dismiss the action.
  document.listeners.selectionchange();
  expect(button.hidden).toBe(false);
  document.listeners.pointerdown({ target: {} });
  expect(button.hidden).toBe(true);
  selection.toString = () => 'Another selection';
  document.listeners.selectionchange();
  expect(button.hidden).toBe(true);
  update();
  expect(button.hidden).toBe(false);
  selection.toString = () => '';
  document.listeners.selectionchange();
  expect(button.hidden).toBe(true);
});
