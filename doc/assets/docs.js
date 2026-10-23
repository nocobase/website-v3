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

  for (const button of document.querySelectorAll('.copy-button')) {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('pre code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = '已复制';
      } catch {
        button.textContent = '复制失败';
      }
      setTimeout(() => { button.textContent = '复制'; }, 1600);
    });
  }
})();
