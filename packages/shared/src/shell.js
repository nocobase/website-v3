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
// 选中后打开该语言的地址（桌面的语言菜单是普通链接）
if (lang) lang.addEventListener('change', () => { window.location.href = lang.value; });
