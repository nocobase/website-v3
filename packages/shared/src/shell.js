// 顶部导航的交互，官网和文档站共用：手机菜单的开关（点菜单里的链接或菜单外面后收起，打开时锁住页面滚动）、手机上点开的语言菜单。桌面上的菜单和语言列表是纯 CSS 悬停展开。
// 靠 Header.astro 里的 id：nav、menuBtn、mnav、langMenu。
const $ = id => document.getElementById(id);
const nav = $('nav'), btn = $('menuBtn'), mnav = $('mnav'), lang = $('langMenu');
const langBtn = lang?.querySelector(':scope > button');

// 手机上语言列表靠 open 类展开（shell.css 只在窄屏用它），桌面上仍是悬停
function setLang(open) {
  if (!lang) return;
  lang.classList.toggle('open', open);
  langBtn.setAttribute('aria-expanded', String(open));
}

function setOpen(open) {
  if (open) setLang(false);
  nav.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
  // 菜单打开时锁住后面的页面，滑动只滚菜单
  document.documentElement.classList.toggle('nav-locked', open);
}

if (nav && btn) btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
if (nav && mnav) mnav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
if (langBtn) langBtn.addEventListener('click', () => {
  const open = !lang.classList.contains('open');
  if (open && nav?.classList.contains('open')) setOpen(false);
  setLang(open);
});
// 菜单打开时点菜单外面、或窗口变宽到桌面菜单出现时，收起；语言列表点外面或按 Esc 收起
document.addEventListener('click', e => {
  if (nav?.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
  if (lang?.classList.contains('open') && !lang.contains(e.target)) setLang(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lang?.classList.contains('open')) { setLang(false); langBtn.focus(); } });
matchMedia('(min-width: 1001px)').addEventListener('change', e => { if (e.matches && nav) { setOpen(false); setLang(false); } });
// 导航里指向当前页面的链接（logo、版本菜单里的当前版本、当前所在的产品页）不重新加载，而是回到页面顶部；不传 behavior 时跟随 CSS 的 scroll-behavior，减少动效时就直接跳转
if (nav) nav.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash) return;
  e.preventDefault();
  window.scrollTo({ top: 0 });
});
