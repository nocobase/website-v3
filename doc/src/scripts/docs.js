// Small interactions of a docs page: icons, the table of contents highlight, code copy buttons, and the search shortcut label (the sidebar position is set by an inline script in Layout.astro, before the first paint). The header's mobile menu and language select are in the shared shell.js.
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
