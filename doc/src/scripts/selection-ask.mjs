// Keep the selected text until activation: focusing a button can collapse a selection.
export function setupSelectionAsk(document, ui, submit) {
  const button = document.getElementById('docSelectionAsk');
  const article = document.querySelector('article.prose');
  if (!button || !article) return;
  const window = document.defaultView;
  let question = '';
  let busy = false;
  const hide = () => { button.hidden = true; question = ''; };
  const update = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return hide();
    const range = selection.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) return hide();
    const parent = range.commonAncestorContainer.nodeType === 1
      ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (parent.closest('input, textarea, button, [contenteditable]')) return hide();
    question = selection.toString().trim();
    if (!question) return hide();
    const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
    const rect = rects.at(-1);
    if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return hide();
    const tooLong = [...question].length > 500;
    button.disabled = busy || tooLong;
    button.title = tooLong ? ui.selectionTooLong : ui.selectionAsk;
    button.querySelector('span').textContent = tooLong ? ui.selectionTooLong : ui.selectionAsk;
    button.hidden = false;
    const { width, height } = button.getBoundingClientRect();
    button.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8))}px`;
    button.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - height - 8))}px`;
  };
  button.addEventListener('pointerdown', event => event.preventDefault());
  button.addEventListener('click', () => {
    if (button.disabled || !question) return;
    const selected = question;
    hide();
    window.getSelection()?.removeAllRanges();
    submit(selected);
  });
  document.addEventListener('selectionchange', () => {
    // Keyboard users can tab to the button without losing the captured selection.
    if (document.activeElement !== button && window.getSelection()?.toString().trim() !== question) hide();
  });
  document.addEventListener('pointerup', update);
  document.addEventListener('pointerdown', event => {
    if (!button.contains(event.target)) hide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide();
  });
  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  return { setBusy(value) { busy = value; if (value) hide(); } };
}
