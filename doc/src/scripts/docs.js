// Small interactions of a docs page: icons, the table of contents highlight, code copy buttons, the Copy Markdown button, and the search shortcut label (the sidebar position is set by an inline script in Layout.astro, before the first paint). The header's mobile menu and language select are in the shared shell.js.
import { ArrowUpRight, Check, ChevronDown, Globe, Menu, MousePointerClick, Search, createIcons } from 'lucide';

createIcons({ icons: { ArrowUpRight, Check, ChevronDown, Globe, Menu, MousePointerClick, Search }, attrs: { 'aria-hidden': 'true' } });

// The shortcut shown on the search button: ⌘K on Apple devices, Ctrl K elsewhere
if (/Mac|iPhone|iPad/.test(navigator.platform)) for (const kbd of document.querySelectorAll('.search-btn kbd')) kbd.textContent = '⌘ K';

// Table of contents: highlight the section being read
const links = [...document.querySelectorAll('.doc-toc a')];
const targets = links.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
if (targets.length && 'IntersectionObserver' in window) {
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
    const first = targets.find(t => visible.has(t));
    if (first) for (const a of links) a.classList.toggle('active', decodeURIComponent(a.hash.slice(1)) === first.id);
  }, { rootMargin: '-70px 0px -65% 0px' });
  targets.forEach(t => observer.observe(t));
}

// Local HTTP previews also support copying, without the secure Clipboard API
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* try the selection-based fallback */ }
  }
  const previous = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.append(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('Copy failed');
  } finally {
    field.remove();
    previous?.focus({ preventScroll: true });
  }
}

// Page actions under the title. Copy Markdown fetches the page's .md copy on click; Safari only allows writing the clipboard within the click, so where ClipboardItem is supported the fetch is handed to it as a promise.
const flash = (label, text) => { const original = label.textContent; label.textContent = text; setTimeout(() => { label.textContent = original; }, 1600); };
for (const button of document.querySelectorAll('.page-copy')) {
  const label = button.querySelector('span');
  button.addEventListener('click', async () => {
    const markdown = fetch(button.dataset.src).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); });
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': markdown.then(t => new Blob([t], { type: 'text/plain' })) })]).catch(async () => copyText(await markdown));
      } else {
        await copyText(await markdown);
      }
      flash(label, button.dataset.copied);
    } catch {
      flash(label, button.dataset.failed);
    }
  });
}
for (const more of document.querySelectorAll('.page-more')) {
  const menu = document.getElementById(more.getAttribute('aria-controls'));
  const items = [...menu.children];
  const toggle = open => { menu.hidden = !open; more.setAttribute('aria-expanded', String(open)); };
  more.addEventListener('click', () => { toggle(menu.hidden); if (!menu.hidden) items[0].focus(); });
  document.addEventListener('click', e => { if (!menu.hidden && !more.parentElement.contains(e.target)) toggle(false); });
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') { toggle(false); more.focus(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(items.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
  });
  for (const a of menu.querySelectorAll('a')) a.addEventListener('click', () => toggle(false));
  const link = menu.querySelector('.page-copy-link');
  link?.addEventListener('click', async () => {
    const label = link.querySelector('span');
    try { await copyText(link.dataset.href); flash(label, link.dataset.copied); } catch { flash(label, link.dataset.failed); }
    setTimeout(() => toggle(false), 800);
  });
}

// Button labels are localized at build time
for (const button of document.querySelectorAll('.copy-button')) {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    const code = button.closest('.code-block')?.querySelector('pre code');
    if (!code) return;
    try {
      await copyText(code.textContent);
      button.textContent = button.dataset.copied;
    } catch {
      button.textContent = button.dataset.failed;
    }
    setTimeout(() => { button.textContent = label; }, 1600);
  });
}

// Images open full size: click or Enter on a figure's image; Esc, a click or the close button closes it
const zoomable = [...document.querySelectorAll('.doc-main .fig > img')];
if (zoomable.length) {
  const dialog = document.createElement('dialog');
  dialog.className = 'img-zoom';
  dialog.innerHTML = '<button type="button" class="img-zoom-close">×</button><img alt=""><p class="img-zoom-caption"></p>';
  dialog.firstChild.setAttribute('aria-label', document.documentElement.lang.startsWith('zh') ? '关闭' : 'Close');
  document.body.append(dialog);
  const [close, full, caption] = dialog.children;
  const open = img => {
    full.src = img.currentSrc || img.src;
    full.alt = img.alt;
    caption.textContent = img.alt;
    caption.hidden = !img.alt;
    dialog.showModal();
  };
  dialog.addEventListener('click', () => dialog.close());
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => full.removeAttribute('src'));
  for (const img of zoomable) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(img); }
    });
  }
}
