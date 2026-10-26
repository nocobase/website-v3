// 文档页的小交互：图标、窄屏上收起目录、代码块复制。
(() => {
  if (window.lucide) window.lucide.createIcons();

  const menu = document.querySelector('.menu');
  if (menu && matchMedia('(max-width: 900px)').matches) menu.open = false;

  // 右侧目录：高亮当前读到的小节
  const links = [...document.querySelectorAll('.toc a')];
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
      const current = targets.find((t) => visible.has(t));
      if (current) for (const a of links) a.classList.toggle('active', decodeURIComponent(a.hash.slice(1)) === current.id);
    }, { rootMargin: '-70px 0px -65% 0px' });
    targets.forEach((t) => observer.observe(t));
  }

  // Local HTTP previews also support copying, without the secure Clipboard API.
  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return; } catch { /* Try the selection-based fallback. */ }
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

  // Button labels are localized by the build.
  for (const button of document.querySelectorAll('.copy-button')) {
    const label = button.textContent;
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('pre code');
      if (!code) return;
      try {
        await copyText(code.textContent);
        button.textContent = button.dataset.copied || '已复制';
      } catch {
        button.textContent = button.dataset.failed || '复制失败';
      }
      setTimeout(() => { button.textContent = label; }, 1600);
    });
  }
})();
