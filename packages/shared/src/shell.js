// 顶部导航的交互，官网和文档站共用：手机菜单的开关（点菜单里的链接后收起）、手机菜单里的语言下拉框。桌面上的菜单和语言列表是纯 CSS 悬停展开。
// 靠 Header.astro 里的 id：nav、menuBtn、mnav、langSelM。
const $ = id => document.getElementById(id);
const nav = $('nav'), btn = $('menuBtn'), mnav = $('mnav'), lang = $('langSelM');

function setOpen(open) {
  nav.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
}

if (nav && btn) btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
if (nav && mnav) mnav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
// 导航里指向当前页面的链接（logo、版本菜单里的当前版本、当前所在的产品页）不重新加载，而是回到页面顶部；不传 behavior 时跟随 CSS 的 scroll-behavior，减少动效时就直接跳转
if (nav) nav.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash) return;
  e.preventDefault();
  window.scrollTo({ top: 0 });
});
// 选中后打开该语言的地址（桌面的语言菜单是普通链接）
if (lang) lang.addEventListener('change', () => { window.location.href = lang.value; });
